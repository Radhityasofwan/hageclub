import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { uploadQrisImage, QrislyError } from "@/lib/komerce-qrisly";
import { updateSettings } from "@/lib/settings";
import {
  QRISLY_ALLOWED_MIME,
  QRISLY_MAX_FILE_SIZE,
  QRISLY_NAME_MAX_LENGTH,
} from "@/lib/komerce-qrisly-constants";

export const dynamic = "force-dynamic";

// POST /api/admin/qrisly/upload — upload QRIS statis (PNG/JPG ≤5MB) → simpan
// qris_id + info merchant ke SystemSetting. Sekali upload, dipakai semua transaksi.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("Payload harus multipart/form-data", 400);
  }

  // Override opsional — pakai nilai form admin yang belum disimpan
  const apiKey = String(form.get("apiKey") ?? "").trim() || undefined;
  const baseUrl = String(form.get("baseUrl") ?? "").trim() || undefined;

  const name = String(form.get("name") ?? "").trim();
  if (!name) {
    return error("Nama QRIS wajib diisi", 400);
  }
  if (name.length > QRISLY_NAME_MAX_LENGTH) {
    return error(`Nama QRIS maksimal ${QRISLY_NAME_MAX_LENGTH} karakter`, 400);
  }

  const file = form.get("qris_image");
  if (!(file instanceof File)) {
    return error("File QRIS wajib diunggah (PNG/JPG)", 400);
  }
  if (!QRISLY_ALLOWED_MIME.has(file.type)) {
    return error("Format file harus PNG atau JPG", 400);
  }
  if (file.size > QRISLY_MAX_FILE_SIZE) {
    return error("Ukuran file maksimal 5MB", 400);
  }
  if (file.size === 0) {
    return error("File QRIS kosong", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await uploadQrisImage(
      {
        name,
        image: buffer,
        mimeType: file.type,
        filename: file.name || undefined,
      },
      { ...(apiKey ? { apiKey } : {}), ...(baseUrl ? { baseUrl } : {}) }
    );

    // Simpan hasil upload — otomatis jadi basis semua QRIS dinamis
    await updateSettings(
      [
        { key: "qrisly_qris_id", value: result.qrisId },
        { key: "qrisly_merchant_name", value: result.merchantName },
        { key: "qrisly_provider", value: result.provider },
      ],
      session.user.id
    );

    return success({
      qrisId: result.qrisId,
      provider: result.provider,
      name: result.name,
      merchantName: result.merchantName,
      createdAt: result.createdAt,
    });
  } catch (err) {
    if (err instanceof QrislyError) {
      console.warn("[POST /api/admin/qrisly/upload]", err.message);
      return error(err.message, err.code === "NOT_CONFIGURED" ? 503 : 502);
    }
    console.error("[POST /api/admin/qrisly/upload]", err);
    return error("Upload QRIS gagal — coba lagi.", 500);
  }
}
