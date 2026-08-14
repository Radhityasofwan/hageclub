import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { order } = body;

    if (!Array.isArray(order)) {
      return NextResponse.json({ message: "order must be an array of { id, sortOrder }" }, { status: 400 });
    }

    // Update sort orders in a transaction
    await db.$transaction(
      order.map((item: { id: string; sortOrder: number }) =>
        db.homepageSection.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ message: "Order updated" });
  } catch (error) {
    console.error("Error reordering homepage sections:", error);
    return NextResponse.json({ message: "Failed to reorder" }, { status: 500 });
  }
}
