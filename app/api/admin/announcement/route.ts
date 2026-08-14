import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { db } from "@/lib/db";
import { invalidateSettingsCache } from "@/lib/settings";
import { z } from "zod";

export const dynamic = "force-dynamic";

const KEY_ACTIVE = "announcement_active";
const KEY_TEXT = "announcement_text";
const KEY_DURATION = "announcement_duration";

const DEFAULT_DURATION = 7;

async function fetchAnnouncement() {
  const rows = await db.systemSetting.findMany({
    where: { key: { in: [KEY_ACTIVE, KEY_TEXT, KEY_DURATION] } },
  });
  const active = rows.find((r) => r.key === KEY_ACTIVE)?.value ?? "true";
  const text =
    rows.find((r) => r.key === KEY_TEXT)?.value ??
    "Free shipping untuk pembelian di atas Rp500.000";
  const duration = Number(rows.find((r) => r.key === KEY_DURATION)?.value ?? DEFAULT_DURATION);
  return { active: active !== "false", text, duration };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }
  const data = await fetchAnnouncement();
  return success(data);
}

const updateSchema = z.object({
  active: z.boolean(),
  text: z.string().min(1).max(300),
  duration: z.number().int().min(2).max(60),
});

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error("Invalid payload", 400, parsed.error.flatten().fieldErrors);
  }

  const { active, text, duration } = parsed.data;
  const updatedBy = session.user.id;

  await db.$transaction([
    db.systemSetting.upsert({
      where: { key: KEY_ACTIVE },
      update: { value: String(active), updatedBy },
      create: {
        key: KEY_ACTIVE,
        value: String(active),
        group: "announcement",
        label: "Announcement Bar Active",
        hint: "Tampilkan/sembunyikan notification bar di atas navbar",
        isSecret: false,
        updatedBy,
      },
    }),
    db.systemSetting.upsert({
      where: { key: KEY_TEXT },
      update: { value: text, updatedBy },
      create: {
        key: KEY_TEXT,
        value: text,
        group: "announcement",
        label: "Announcement Bar Text",
        hint: "Teks yang ditampilkan di notification bar (maks 300 karakter)",
        isSecret: false,
        updatedBy,
      },
    }),
    db.systemSetting.upsert({
      where: { key: KEY_DURATION },
      update: { value: String(duration), updatedBy },
      create: {
        key: KEY_DURATION,
        value: String(duration),
        group: "announcement",
        label: "Announcement Bar Duration (detik)",
        hint: "Notifikasi otomatis hilang setelah durasi ini jika tidak ditutup (2-60 detik)",
        isSecret: false,
        updatedBy,
      },
    }),
  ]);

  invalidateSettingsCache([KEY_ACTIVE, KEY_TEXT, KEY_DURATION]);

  return success(null, "Announcement bar berhasil diperbarui");
}
