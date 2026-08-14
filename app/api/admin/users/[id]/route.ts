import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "EDITOR", "CS"]).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
});

// GET /api/admin/users/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    if (!user || !["ADMIN", "EDITOR", "CS"].includes(user.role)) {
      return error("User not found", 404);
    }

    return success(user);
  } catch (err) {
    console.error("[GET /api/admin/users/[id]]", err);
    return error("Failed to fetch user", 500);
  }
}

// PUT /api/admin/users/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing || !["ADMIN", "EDITOR", "CS"].includes(existing.role)) {
      return error("User not found", 404);
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { email, password, role, firstName, lastName, phone } = parsed.data;

    if (email && email !== existing.email) {
      const emailExists = await db.user.findUnique({ where: { email } });
      if (emailExists) return error("Email already in use", 409);
    }

    const updateData: Record<string, unknown> = {};
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    const profileData: Record<string, string | undefined> = {};
    if (firstName !== undefined) profileData.firstName = firstName;
    if (lastName !== undefined) profileData.lastName = lastName;
    if (phone !== undefined) profileData.phone = phone || undefined;

    const user = await db.user.update({
      where: { id },
      data: {
        ...updateData,
        ...(Object.keys(profileData).length > 0 && {
          profile: {
            upsert: {
              create: {
                firstName: profileData.firstName ?? existing.email,
                lastName: profileData.lastName ?? "",
                phone: profileData.phone ?? null,
              },
              update: profileData,
            },
          },
        }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    return success(user, "User updated");
  } catch (err) {
    console.error("[PUT /api/admin/users/[id]]", err);
    return error("Failed to update user", 500);
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing || !["ADMIN", "EDITOR", "CS"].includes(existing.role)) {
      return error("User not found", 404);
    }

    if (id === session.user.id) {
      return error("Cannot delete yourself", 400);
    }

    await db.user.delete({ where: { id } });

    return success(null, "User deleted");
  } catch (err) {
    console.error("[DELETE /api/admin/users/[id]]", err);
    return error("Failed to delete user", 500);
  }
}
