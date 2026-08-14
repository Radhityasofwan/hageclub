import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { invalidateSettingsCache } from "@/lib/settings";

export const dynamic = "force-dynamic";

const SETTING_KEY = "nav_menu_items";
const LOGO_KEY = "nav_sidebar_logo";
const SOCIAL_LINKS_KEY = "brand_social_links";
const MENU_KEYS = ["home", "categories", "blog", "about", "contact", "social", "account"] as const;

// GET /api/admin/menu
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const row = await db.systemSetting.findUnique({ where: { key: SETTING_KEY } });
  let flags: Record<string, boolean> = {};
  if (row?.value) {
    try {
      flags = JSON.parse(row.value);
    } catch {
      flags = {};
    }
  }
  return success({ flags });
}

// PUT /api/admin/menu
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const body = await request.json();
  const flags: Record<string, boolean> = {};
  for (const key of MENU_KEYS) {
    flags[key] = Boolean(body[key]);
  }

  const logoUrl: string | null =
    typeof body.logoUrl === "string" && body.logoUrl.trim() ? body.logoUrl.trim() : null;

  const socialLinks: string | null =
    typeof body.socialLinks === "string" && body.socialLinks.trim() ? body.socialLinks.trim() : null;

  await db.systemSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(flags), updatedBy: session.user.id },
    create: {
      key: SETTING_KEY,
      value: JSON.stringify(flags),
      group: "menu",
      label: "Menu Sidebar",
      isSecret: false,
      updatedBy: session.user.id,
    },
  });

  await db.systemSetting.upsert({
    where: { key: LOGO_KEY },
    update: { value: logoUrl ?? "", updatedBy: session.user.id },
    create: {
      key: LOGO_KEY,
      value: logoUrl ?? "",
      group: "menu",
      label: "Logo Sidebar",
      isSecret: false,
      updatedBy: session.user.id,
    },
  });

  await db.systemSetting.upsert({
    where: { key: SOCIAL_LINKS_KEY },
    update: { value: socialLinks ?? "", updatedBy: session.user.id },
    create: {
      key: SOCIAL_LINKS_KEY,
      value: socialLinks ?? "",
      group: "menu",
      label: "Tautan Sosial Media",
      isSecret: false,
      updatedBy: session.user.id,
    },
  });

  invalidateSettingsCache([SETTING_KEY, LOGO_KEY, SOCIAL_LINKS_KEY]);

  return success(null, "Menu settings updated");
}
