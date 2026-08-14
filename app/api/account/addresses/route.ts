import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { addressSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);

    const addresses = await db.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return success(addresses);
  } catch (err) {
    console.error("[GET /api/account/addresses]", err);
    return error("Failed to fetch addresses", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400, parsed.error.flatten().fieldErrors);

    const data = parsed.data;

    // If setting as default, unset others first
    if (data.isDefault) {
      await db.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const address = await db.address.create({
      data: { ...data, userId: session.user.id },
    });

    return success(address, "Address added", 201);
  } catch (err) {
    console.error("[POST /api/account/addresses]", err);
    return error("Failed to create address", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);

    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) return error("Address ID is required", 400);

    const parsed = addressSchema.safeParse(rest);
    if (!parsed.success) return error("Validation failed", 400);

    // Verify ownership
    const existing = await db.address.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return error("Address not found", 404);

    if (parsed.data.isDefault) {
      await db.address.updateMany({
        where: { userId: session.user.id, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await db.address.update({
      where: { id },
      data: parsed.data,
    });

    return success(updated, "Address updated");
  } catch (err) {
    console.error("[PUT /api/account/addresses]", err);
    return error("Failed to update address", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return error("Address ID is required", 400);

    const existing = await db.address.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return error("Address not found", 404);

    await db.address.delete({ where: { id } });

    return success(null, "Address deleted");
  } catch (err) {
    console.error("[DELETE /api/account/addresses]", err);
    return error("Failed to delete address", 500);
  }
}
