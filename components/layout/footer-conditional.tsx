"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * Hides children on /account and /checkout pages.
 * Client-side pathname check so the parent layout doesn't need headers() → stays static.
 * Children (Footer) remain server-rendered; this only controls their visibility.
 */
export function FooterConditional({ children }: Props) {
  const pathname = usePathname();
  if (pathname.startsWith("/account") || pathname.startsWith("/checkout")) {
    return null;
  }
  return <>{children}</>;
}
