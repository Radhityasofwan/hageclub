import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);

    const wishlist = await db.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            salePrice: true,
            stock: true,
            images: {
              where: { isCover: true },
              select: { url: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(wishlist);
  } catch (err) {
    console.error("[GET /api/account/wishlist]", err);
    return error("Failed to fetch wishlist", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);

    const { productId } = await request.json();
    if (!productId) return error("Product ID is required", 400);

    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });
    if (existing) return success(existing, "Already in wishlist");

    const item = await db.wishlist.create({
      data: { userId: session.user.id, productId },
    });

    return success(item, "Added to wishlist", 201);
  } catch (err) {
    console.error("[POST /api/account/wishlist]", err);
    return error("Failed to add to wishlist", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) return error("Product ID is required", 400);

    await db.wishlist.delete({
      where: { userId_productId: { userId: session.user.id, productId } },
    });

    return success(null, "Removed from wishlist");
  } catch (err) {
    console.error("[DELETE /api/account/wishlist]", err);
    return error("Failed to remove from wishlist", 500);
  }
}
