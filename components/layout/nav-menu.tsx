import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

interface NavMenuProps {
  className?: string;
  linkClassName?: string;
}

export async function NavMenu({ className, linkClassName }: NavMenuProps) {
  const { t } = await getI18n();

  // Brand-style category names (Polo, Hoodie, Jacket, Aksesoris) stay as-is
  const shopCategories = [
    { label: "Polo", href: "/shop/polo" },
    { label: "Hoodie", href: "/shop/hoodie" },
    { label: "Jacket", href: "/shop/jacket" },
    { label: "Aksesoris", href: "/shop/accessories" },
    { label: t("product.onSale"), href: "/shop" },
  ];

  const navLinks = [
    { label: t("nav.shop"), href: "/shop", hasDropdown: true },
    { label: "Blog", href: "/blog" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {navLinks.map((link) =>
        link.hasDropdown ? (
          <div key={link.href} className="relative group">
            <Link
              href={link.href}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-2 text-sm font-medium tracking-wide hover:opacity-70 transition-opacity",
                linkClassName
              )}
            >
              {link.label}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="transition-transform group-hover:rotate-180"
              >
                <path
                  d="M2 4L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            {/* Dropdown — shown on hover via group-hover */}
            <div
              className={cn(
                "absolute top-full left-0 mt-1 w-44 bg-white border border-border shadow-lg rounded transition-all duration-150",
                "opacity-0 pointer-events-none -translate-y-1",
                "group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0"
              )}
            >
              <ul className="py-1">
                {shopCategories.map((cat) => (
                  <li key={cat.href}>
                    <Link
                      href={cat.href}
                      className="block px-4 py-2.5 text-sm text-primary hover:bg-accent transition-colors"
                    >
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-2 text-sm font-medium tracking-wide hover:opacity-70 transition-opacity",
              linkClassName
            )}
          >
            {link.label}
          </Link>
        )
      )}
    </nav>
  );
}
