import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// Cari order guest (userId null) yang guestEmail-nya cocok dengan email akun.
// Order seperti ini dibuat saat checkout tanpa login (device/browser lain)
// sehingga tidak muncul di daftar order akun.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);

    const email = (session.user.email ?? "").toLowerCase();
    if (!email) return success([]);

    const hidden = await db.order.findMany({
      where: { userId: null, guestEmail: { not: null } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        guestEmail: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const matched = hidden.filter((o) => (o.guestEmail ?? "").toLowerCase() === email);
    return success(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      matched.map(({ guestEmail: _guestEmail, ...o }) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("[GET /api/account/hidden-orders]", err);
    return error("Gagal memuat order tersembunyi", 500);
  }
}
