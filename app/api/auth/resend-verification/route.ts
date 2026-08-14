import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { sendEmail, buildVerificationEmailHtml } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return error("Email diperlukan", 400);
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || user.role !== "CUSTOMER") {
      return success(null, "Jika email terdaftar, link verifikasi telah dikirim.");
    }

    if (user.emailVerified) {
      return success(null, "Email sudah terverifikasi.");
    }

    const recent = await db.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
        usedAt: null,
      },
    });
    if (recent) {
      return error("Tunggu 2 menit sebelum mengirim ulang.", 429);
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.emailVerificationToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;
    const name = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
      : user.email.split("@")[0];

    sendEmail(email, "Verifikasi Email Kamu — HAGE CLUB", buildVerificationEmailHtml(name, verifyUrl)).catch(
      (err) => console.error("[resend-verification] email error:", err)
    );

    return success(null, "Link verifikasi telah dikirim ke email kamu.");
  } catch (err) {
    console.error("[POST /api/auth/resend-verification]", err);
    return error("Terjadi kesalahan", 500);
  }
}
