import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation";
import { error, success } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { token, password } = parsed.data;

    // Find valid token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return error("Invalid or expired reset token", 400);
    }

    if (resetToken.usedAt) {
      return error("This reset link has already been used", 400);
    }

    if (new Date() > resetToken.expiresAt) {
      return error("Reset link has expired", 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
    });

    return success(null, "Password reset successful");
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", err);
    return error("Something went wrong", 500);
  }
}
