import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BrandForm } from "./brand-form";
import { FontPicker } from "@/components/admin/font-picker";

export const metadata: Metadata = { title: "Brand Settings" };

export const dynamic = "force-dynamic";

const SETTING_KEYS = [
  "brand_logo",
  "brand_favicon",
  "brand_font_display",
  "brand_font_body",
] as const;

export default async function BrandSettingsPage() {
  const settings = await db.systemSetting.findMany({
    where: { key: { in: SETTING_KEYS as unknown as string[] } },
  });

  const values: Record<string, string> = {};
  for (const key of SETTING_KEYS) {
    values[key] = settings.find((s) => s.key === key)?.value ?? "";
  }

  return (
    <div className="max-w-3xl space-y-12">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Brand Settings</h1>
        <p className="text-sm text-muted mt-1">
          Logo, favicon, dan font brand.
        </p>
      </div>

      <FontPicker
        initialDisplay={values.brand_font_display ?? ""}
        initialBody={values.brand_font_body ?? ""}
      />

      <div className="border-t border-border" />

      <BrandForm initialValues={values} />
    </div>
  );
}
