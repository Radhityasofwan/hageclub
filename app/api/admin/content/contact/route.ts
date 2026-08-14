import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { invalidateSettingsCache } from "@/lib/settings";
import { z } from "zod";

export const dynamic = "force-dynamic";

const contactInfoSchema = z.object({
  whatsapp: z.object({
    label: z.string(),
    url: z.string(),
    note: z.string(),
  }),
  email: z.object({ label: z.string(), note: z.string() }),
  phone: z.object({ label: z.string(), note: z.string() }),
  address: z.object({ lines: z.array(z.string()) }),
  hours: z.array(z.object({ days: z.string(), time: z.string() })),
  social: z.array(z.object({ platform: z.string(), handle: z.string() })),
  responseTime: z.string(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const row = await db.systemSetting.findUnique({ where: { key: "contact_info" } });
  let data = null;
  if (row?.value) {
    try {
      data = JSON.parse(row.value);
    } catch {
      data = null;
    }
  }
  return success(data);
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const body = await request.json();
  const parsed = contactInfoSchema.safeParse(body);
  if (!parsed.success) {
    return error("Invalid payload", 400, parsed.error.flatten().fieldErrors);
  }

  await db.systemSetting.upsert({
    where: { key: "contact_info" },
    update: { value: JSON.stringify(parsed.data), updatedBy: session.user.id },
    create: {
      key: "contact_info",
      value: JSON.stringify(parsed.data),
      group: "content",
      label: "Contact Info",
      updatedBy: session.user.id,
    },
  });
  invalidateSettingsCache(["contact_info"]);

  return success(null, "Info kontak diperbarui");
}
