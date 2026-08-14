import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{8,13}$/).optional(),
  birthDate: z.string().nullable().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);

    const profile = await db.profile.findUnique({
      where: { userId: session.user.id },
    });
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, role: true, createdAt: true },
    });

    return success({ ...profile, email: user?.email, role: user?.role, joinedAt: user?.createdAt });
  } catch (err) {
    console.error("[GET /api/account/profile]", err);
    return error("Failed to fetch profile", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);

    const body = await request.json();

    // Check if it's a password change
    if (body.currentPassword) {
      const parsed = changePasswordSchema.safeParse(body);
      if (!parsed.success) return error("Validation failed", 400);

      const user = await db.user.findUnique({ where: { id: session.user.id } });
      if (!user) return error("User not found", 404);

      const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
      if (!isValid) return error("Current password is incorrect", 400);

      const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
      await db.user.update({
        where: { id: session.user.id },
        data: { passwordHash },
      });

      return success(null, "Password updated");
    }

    // Profile update
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400);

    const birthDate =
      parsed.data.birthDate ? new Date(parsed.data.birthDate) : undefined;

    const profile = await db.profile.upsert({
      where: { userId: session.user.id },
      update: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        ...(parsed.data.birthDate !== undefined && { birthDate }),
      },
      create: {
        userId: session.user.id,
        firstName: parsed.data.firstName ?? "",
        lastName: parsed.data.lastName ?? "",
        phone: parsed.data.phone ?? "",
        birthDate,
      },
    });

    return success(profile, "Profile updated");
  } catch (err) {
    console.error("[PATCH /api/account/profile]", err);
    return error("Failed to update profile", 500);
  }
}
