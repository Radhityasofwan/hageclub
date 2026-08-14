import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// PUT /api/admin/coupons/popup-reorder
// Accepts { order: [id, id, id] } — indexes become popupPriority (1-based)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return error("Unauthorized", 401);
  }

  const body = await request.json();
  const { order } = body as { order: string[] };
  if (!Array.isArray(order) || order.length === 0) {
    return error("order must be a non-empty array of coupon IDs", 400);
  }

  await db.$transaction(
    order.map((id, i) =>
      db.coupon.update({ where: { id }, data: { popupPriority: i + 1 } })
    )
  );

  return success(null, "Popup order updated");
}
