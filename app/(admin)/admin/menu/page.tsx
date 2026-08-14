import type { Metadata } from "next";
import { getSettingValues } from "@/lib/settings";
import { MenuForm } from "@/components/admin/menu-form";
import type { SocialLink } from "@/components/ui/social-icon";

export const metadata: Metadata = { title: "Menu Settings" };

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const s = await getSettingValues(["nav_menu_items", "nav_sidebar_logo", "brand_social_links"]);

  let initial: Record<string, boolean> = {};
  if (s.nav_menu_items) {
    try { initial = JSON.parse(s.nav_menu_items); } catch { /* noop */ }
  }

  let socialLinks: SocialLink[] = [];
  if (s.brand_social_links) {
    try { socialLinks = JSON.parse(s.brand_social_links) as SocialLink[]; } catch { /* noop */ }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Menu Sidebar</h1>
        <p className="text-sm text-muted mt-1">
          Kelola logo, item menu, dan tautan sosial media sidebar yang tampil di situs.
        </p>
      </div>

      <MenuForm initial={initial} logoUrl={s.nav_sidebar_logo ?? ""} socialLinks={socialLinks} />
    </div>
  );
}
