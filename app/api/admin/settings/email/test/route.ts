import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { verifyEmailConnection, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const { action, to } = await request.json();

  if (action === "verify") {
    const connected = await verifyEmailConnection();
    if (connected) {
      return success({ connected: true }, "Koneksi SMTP berhasil!");
    } else {
      return error("Gagal terhubung ke server SMTP. Periksa konfigurasi host, port, dan kredensial.", 400);
    }
  }

  if (action === "send") {
    if (!to || typeof to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return error("Alamat email tujuan tidak valid", 400);
    }
    try {
      await sendEmail(
        to,
        "Test Email — HAGE CLUB Admin",
        `<div style="font-family:sans-serif;padding:32px;max-width:480px;">
          <h2 style="color:#1C1C1E;margin:0 0 12px;">Test Email Berhasil!</h2>
          <p style="color:#6B6B6B;margin:0 0 8px;">Ini adalah email percobaan dari panel admin HAGE CLUB.</p>
          <p style="color:#6B6B6B;margin:0;">Konfigurasi SMTP kamu sudah benar dan berfungsi dengan baik.</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #E5E5EA;" />
          <p style="color:#9B9B9B;font-size:12px;margin:0;">Dikirim dari: HAGE CLUB Admin Panel</p>
        </div>`
      );
      return success(null, `Test email berhasil dikirim ke ${to}`);
    } catch (err) {
      console.error("[email-test] send error:", err);
      return error("Gagal mengirim email. " + (err instanceof Error ? err.message : ""), 500);
    }
  }

  return error("Action tidak valid. Gunakan 'verify' atau 'send'", 400);
}
