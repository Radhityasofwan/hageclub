import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return error("Unauthorized", 401);
    }

    const userId = session.user.id;

    // Cek apakah ada order aktif (PENDING/PROCESSING)
    const activeOrder = await db.order.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "PROCESSING", "PACKED", "SHIPPED"] },
      },
      select: { id: true },
    });

    if (activeOrder) {
      return error(
        "Akun tidak dapat dihapus karena masih ada pesanan aktif. Selesaikan atau batalkan pesananmu terlebih dahulu.",
        400
      );
    }

    // Hapus data user — cascade via Prisma relations
    await db.$transaction([
      db.wishlist.deleteMany({ where: { userId } }),
      db.passwordResetToken.deleteMany({ where: { userId } }),
      db.emailVerificationToken.deleteMany({ where: { userId } }),
      db.profile.deleteMany({ where: { userId } }),
      db.user.delete({ where: { id: userId } }),
    ]);

    return success({ message: "Akun berhasil dihapus" });
  } catch (err) {
    console.error("[DELETE /api/account/delete]", err);
    return error("Gagal menghapus akun", 500);
  }
}
