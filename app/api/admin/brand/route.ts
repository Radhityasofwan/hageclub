import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { invalidateSettingsCache } from "@/lib/settings";

export const dynamic = "force-dynamic";

const BRAND_KEYS = [
  "brand_logo",
  "brand_favicon",
  "brand_instagram_url",
  "brand_instagram_handle",
  "brand_tiktok_url",
  "brand_tiktok_handle",
  "brand_social_links",
  "brand_font_display",
  "brand_font_body",
] as const;

// GET /api/admin/brand
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const settings = await db.systemSetting.findMany({
    where: { key: { in: BRAND_KEYS as unknown as string[] } },
  });

  const result: Record<string, string | null> = {};
  for (const key of BRAND_KEYS) {
    result[key] = settings.find((s) => s.key === key)?.value ?? null;
  }

  return success(result);
}

// PUT /api/admin/brand
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const body = await request.json();

  // Upsert each provided brand setting
  const entries = Object.entries(body).filter(
    ([key]) => (BRAND_KEYS as unknown as string[]).includes(key)
  );

  if (entries.length === 0) {
    return error("No valid brand settings provided", 400);
  }

  await db.$transaction(
    entries.map(([key, value]) =>
      db.systemSetting.upsert({
        where: { key },
        update: { value: value ? String(value) : null, updatedBy: session.user.id },
        create: {
          key,
          value: value ? String(value) : null,
          group: "brand",
          label: key.replace("campaign_", "").replace("brand_", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          isSecret: false,
          updatedBy: session.user.id,
        },
      })
    )
  );

  invalidateSettingsCache(entries.map(([k]) => k));

  return success(null, "Brand settings updated");
}
