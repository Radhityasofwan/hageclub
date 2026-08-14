import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// Tautkan order guest (userId null) dengan guestEmail = email akun ke akun user,
// sehingga order tersebut kembali tampil di daftar order.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);

    const email = (session.user.email ?? "").toLowerCase();
    if (!email) return success({ restored: 0 });

    const hidden = await db.order.findMany({
      where: { userId: null, guestEmail: { not: null } },
      select: { id: true, guestEmail: true },
    });

    const ids = hidden
      .filter((o) => (o.guestEmail ?? "").toLowerCase() === email)
      .map((o) => o.id);

    if (ids.length === 0) return success({ restored: 0 });

    const updated = await db.order.updateMany({
      where: { id: { in: ids } },
      data: { userId: session.user.id },
    });

    return success({ restored: updated.count });
  } catch (err) {
    console.error("[POST /api/account/restore-orders]", err);
    return error("Gagal mengembalikan order", 500);
  }
}
