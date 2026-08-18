import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n/config";

function applySecurityHeaders(response: NextResponse): void {
  if (process.env.NODE_ENV === "development") {
    response.headers.set("Content-Security-Policy", "frame-ancestors *");
  } else {
    response.headers.set("X-Frame-Options", "DENY");
  }
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // ── Locale detection ──
    const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value ?? "";
    const locale = isValidLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

    // ── Admin area: ADMIN, EDITOR, CS only ──
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      const adminRoles = ["ADMIN", "EDITOR", "CS"];
      if (!token || !adminRoles.includes(token.role as string)) {
        const redirect = NextResponse.redirect(new URL("/admin/login", req.url));
        applySecurityHeaders(redirect);
        return redirect;
      }
    }

    // ── Attach headers to the forwarded request ──
    const response = NextResponse.next();
    applySecurityHeaders(response);
    response.headers.set("x-locale", locale);
    response.headers.set("x-pathname", pathname);

    return response;
  },
  {
    pages: { signIn: "/account" },
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname;

        // Public webhook endpoints — always allow
        if (pathname === "/api/payments/webhook") return true;
        if (pathname === "/api/payments/qrisly/webhook") return true;

        // Admin login page — allow unauthenticated
        if (pathname === "/admin/login") return true;

        // Auth pages — allow unauthenticated
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/forgot-password") ||
          pathname.startsWith("/reset-password")
        ) {
          return true;
        }

        // Protected routes require a token
        if (
          pathname.startsWith("/admin") ||
          pathname.startsWith("/api/admin")
        ) {
          return !!token;
        }

        // /account routes: always let through — layout handles pre-login vs dashboard display

        // Everything else is public
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files — handled by Next.js, no middleware needed)
     * - _next/image (image optimization — handled by Next.js)
     * - favicon, sitemap, robots (public static assets)
     * - Public read-only API routes that need no auth or locale (avoids JWT decode overhead)
     */
    "/((?!_next/static|_next/image|favicon\\.svg|sitemap\\.xml|robots\\.txt|api/products|api/categories|api/search|api/blog).*)",
  ],
};
