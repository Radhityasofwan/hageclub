import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return error("Unauthorized", 401);
    }

    const body = await request.json();
    const { order } = body as { order: { id: string; sortOrder: number }[] };

    if (!Array.isArray(order)) {
      return error("order must be an array of { id, sortOrder }", 400);
    }

    await db.$transaction(
      order.map(({ id, sortOrder }) =>
        db.category.update({ where: { id }, data: { sortOrder } })
      )
    );

    return success(null, "Order updated");
  } catch (err) {
    console.error("[PUT /api/admin/categories/reorder]", err);
    return error("Failed to reorder categories", 500);
  }
}
