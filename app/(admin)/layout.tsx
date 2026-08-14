import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { AdminShell, type NavItemData, type NavGroupData } from "@/components/admin/admin-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s — Admin HAGE CLUB", default: "Admin HAGE CLUB" },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const pathname =
    (await headers()).get("x-pathname") ??
    (await headers()).get("next-url") ??
    "";

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!session) redirect("/admin/login?callbackUrl=/admin");
  if (!["ADMIN", "EDITOR", "CS"].includes(session.user.role)) {
    redirect("/");
  }

  const locale = await getLocale();
  const role = session.user.role;
  const email = session.user.email ?? "";

  const ALL_MAIN: (NavItemData & { roles: string[] })[] = [
    { label: "Dashboard",  href: "/admin",             icon: "dashboard", roles: ["ADMIN", "EDITOR", "CS"] },
    { label: "Produk",     href: "/admin/products",    icon: "product",   roles: ["ADMIN", "EDITOR"] },
    { label: "Kategori",   href: "/admin/categories",  icon: "category",  roles: ["ADMIN", "EDITOR"] },
    { label: "Pesanan",    href: "/admin/orders",       icon: "order",     roles: ["ADMIN", "EDITOR", "CS"] },
    { label: "Pelanggan",  href: "/admin/customers",    icon: "customer",  roles: ["ADMIN", "EDITOR", "CS"] },
    { label: "Kupon",      href: "/admin/coupons",      icon: "coupon",    roles: ["ADMIN", "EDITOR"] },
    { label: "Inventori",  href: "/admin/inventory",    icon: "inventory", roles: ["ADMIN", "EDITOR"] },
    { label: "Blog",       href: "/admin/blog",         icon: "blog",      roles: ["ADMIN", "EDITOR"] },
    { label: "Konten",     href: "/admin/content/pages", icon: "content",  roles: ["ADMIN", "EDITOR"] },
    { label: "Media",      href: "/admin/media",        icon: "media",     roles: ["ADMIN", "EDITOR"] },
  ];

  const SYSTEM_GROUPS: NavGroupData[] = [
    {
      label: "Tampilan",
      items: [
        { label: "Homepage",  href: "/admin/homepage",         icon: "homepage" },
        { label: "Menu",      href: "/admin/menu",             icon: "menu"     },
        { label: "Brand",     href: "/admin/brand",            icon: "brand"    },
        { label: "Footer",    href: "/admin/settings/footer",  icon: "footer"   },
      ],
    },
    {
      label: "Pengaturan",
      items: [
        { label: "Toko",         href: "/admin/settings/store",           icon: "store"    },
        { label: "Tarif Ongkir", href: "/admin/settings/rajaongkir",      icon: "truck"    },
        { label: "Layanan Kirim",href: "/admin/settings/komship",         icon: "delivery" },
        { label: "Pembayaran",   href: "/admin/settings/komerce-payment", icon: "payment"  },
        { label: "QRIS",         href: "/admin/settings/qrisly",          icon: "qrisly"   },
        { label: "Email",        href: "/admin/settings/email",           icon: "email"    },
      ],
    },
    {
      label: "Tools",
      items: [
        { label: "Integrasi", href: "/admin/settings", icon: "analytics" },
        { label: "SEO",       href: "/admin/seo",      icon: "seo"       },
        { label: "Users",     href: "/admin/users",    icon: "users"     },
      ],
    },
  ];

  const mainItems = ALL_MAIN.filter((item) => item.roles.includes(role)).map(
    ({ label, href, icon }) => ({ label, href, icon })
  );

  const systemGroups = role === "ADMIN" ? SYSTEM_GROUPS : [];

  return (
    <I18nProvider locale={locale}>
      <AdminShell
        email={email}
        role={role}
        mainItems={mainItems}
        systemGroups={systemGroups}
      >
        {children}
      </AdminShell>
    </I18nProvider>
  );
}
