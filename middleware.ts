import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n/config";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // ── Locale detection ──
    const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value ?? "";
    const locale = isValidLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

    // ── Security headers ──
    const response = NextResponse.next();
    // Dev: izinkan iframe (mobile preview dari ekstension browser);
    // prod: tetap blokir framing (anti-clickjacking).
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

    // ── Pass locale to Server Components via request header ──
    response.headers.set("x-locale", locale);

    // ── Pass pathname to Server Components (dipakai admin layout utk deteksi /admin/login) ──
    response.headers.set("x-pathname", pathname);

    // ── Admin area: ADMIN, EDITOR, CS only ──
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      const adminRoles = ["ADMIN", "EDITOR", "CS"];
      if (!token || !adminRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    }

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
    "/((?!_next/static|_next/image|favicon\\.svg|sitemap\\.xml|robots\\.txt).*)",
  ],
};
