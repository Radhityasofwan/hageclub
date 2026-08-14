import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { deleteSettings, getAllSettings, updateSettings } from "@/lib/settings";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/admin/settings
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const settings = await getAllSettings();

  // Mask secret values in response — client shows placeholder, not actual value
  const masked = settings.map((s) => ({
    ...s,
    value: s.isSecret && s.value ? "••••••••" : s.value,
    hasValue: s.isSecret ? Boolean(s.value) : undefined,
  }));

  return success(masked);
}

const updateSchema = z.object({
  updates: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string().nullable(),
    })
  ).min(1),
  deleteKeys: z.array(z.string().min(1)).optional(),
});

// PUT /api/admin/settings
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error("Invalid payload", 400, parsed.error.flatten().fieldErrors);
  }

  // Empty string → null (clear the value)
  const entries = parsed.data.updates.map(({ key, value }) => ({
    key,
    value: value === "" ? null : value,
  }));

  // Skip placeholder values for secret fields (client sends "••••••••" when unchanged)
  const filtered = entries.filter((e) => e.value !== "••••••••");

  await updateSettings(filtered, session.user.id);
  if (parsed.data.deleteKeys?.length) {
    await deleteSettings(parsed.data.deleteKeys);
  }

  return success(null, `${filtered.length} setting(s) updated`);
}
