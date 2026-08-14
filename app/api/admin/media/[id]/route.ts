import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// PUT /api/admin/media/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await db.media.findUnique({ where: { id } });
    if (!existing) return error("Media not found", 404);

    const body = await request.json();
    const { alt, folder } = body;

    const updated = await db.media.update({
      where: { id },
      data: {
        ...(alt !== undefined && { alt: String(alt) || null }),
        ...(folder !== undefined && { folder: String(folder) }),
      },
    });

    return success(updated, "Media updated");
  } catch (err) {
    console.error("[PUT /api/admin/media/[id]]", err);
    return error("Failed to update media", 500);
  }
}

// DELETE /api/admin/media/[id]
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
    const existing = await db.media.findUnique({ where: { id } });
    if (!existing) return error("Media not found", 404);

    await db.media.delete({ where: { id } });

    return success(null, "Media deleted");
  } catch (err) {
    console.error("[DELETE /api/admin/media/[id]]", err);
    return error("Failed to delete media", 500);
  }
}
