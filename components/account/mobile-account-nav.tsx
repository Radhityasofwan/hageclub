"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";

export function MobileAccountNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  const items = [
    { label: t("account.dashboard"), href: "/account" },
    { label: t("account.orders"),    href: "/account/orders"   },
    { label: t("account.statWishlist"), href: "/account?tab=wishlist" },
    { label: t("account.myVouchers"), href: "/account/vouchers" },
    { label: t("account.addresses"), href: "/account/address"  },
    { label: t("account.profile"),   href: "/account/profile"  },
  ];

  function isActive(href: string) {
    if (href === "/account") return pathname === "/account";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex gap-1.5 min-w-max pb-0.5">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              active
                ? "bg-primary text-white"
                : "bg-white border border-border text-muted hover:text-primary hover:border-primary/40"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
