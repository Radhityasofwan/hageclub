import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation";
import { error, success } from "@/lib/api-response";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail, renderEmail } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return error("Invalid email", 400);
    }

    const { email } = parsed.data;
    const user = await db.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    // Always return same message regardless of whether email exists
    if (!user) {
      return success(null, "If the email exists, you will receive a password reset link");
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete existing tokens for this user
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Create new token
    await db.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    // Send email
    try {
      const name = user.profile?.firstName ?? user.email.split("@")[0];
      const template = passwordResetEmail({ name, token });
      const rendered = renderEmail(template);
      await sendEmail(
        user.email,
        "Reset Your HAGE CLUB Password",
        rendered.html,
        rendered.text
      );
    } catch (emailErr) {
      console.error("[FORGOT-PASSWORD] Failed to send email:", emailErr);
    }

    return success(null, "If the email exists, you will receive a password reset link");
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return error("Something went wrong", 500);
  }
}
