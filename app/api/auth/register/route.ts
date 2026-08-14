import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { error, success } from "@/lib/api-response";
import { sendEmail, buildVerificationEmailHtml } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return error("Validasi gagal", 400, parsed.error.flatten().fieldErrors);
    }

    const { name, email, password, city, birthDate } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return error("Email sudah terdaftar", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email, passwordHash, role: "CUSTOMER", emailVerified: false },
      });
      await tx.profile.create({
        data: {
          userId: u.id,
          firstName,
          lastName,
          city: city || null,
          birthDate: birthDate ? new Date(birthDate) : null,
        },
      });
      await tx.emailVerificationToken.create({
        data: { token, userId: u.id, expiresAt },
      });
      return u;
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;
    const displayName = `${firstName} ${lastName}`.trim();

    sendEmail(email, "Verifikasi Email Kamu — HAGE CLUB", buildVerificationEmailHtml(displayName, verifyUrl)).catch(
      (err) => console.error("[register] Failed to send verification email:", err)
    );

    return success({ email: user.email }, "Akun berhasil dibuat. Cek email kamu untuk verifikasi.", 201);
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return error("Terjadi kesalahan", 500);
  }
}
