import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountDashboardClient } from "@/components/account/account-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AccountDashboardPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const now = new Date();

  const couponSelect = {
    id: true, code: true, type: true, value: true,
    endDate: true, minPurchase: true, maxDiscount: true,
    usageLimit: true, usedCount: true,
  } as const;

  const [profile, orders, wishlistItems, voucherClaims, usedCouponIds] = await Promise.all([
    db.profile.findUnique({
      where: { userId },
      select: { firstName: true, lastName: true },
    }),
    db.order.findMany({
      where: { userId },
      select: {
        id: true, orderNumber: true, status: true, total: true, createdAt: true,
        items: { select: { name: true, imageUrl: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.wishlist.findMany({
      where: { userId },
      select: {
        id: true,
        product: {
          select: {
            id: true, name: true, slug: true, price: true, salePrice: true,
            images: { select: { url: true }, take: 1, orderBy: { sortOrder: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Active voucher claims (not expired, coupon still active)
    db.voucherClaim.findMany({
      where: {
        userId,
        coupon: {
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
      },
      orderBy: { claimedAt: "desc" },
      select: { id: true, couponId: true, coupon: { select: couponSelect } },
    }),
    // Coupon IDs already used in orders
    db.couponUsage.findMany({
      where: { userId },
      select: { couponId: true },
    }),
  ]);

  const usedSet = new Set(usedCouponIds.map((u) => u.couponId));
  const activeVouchers = voucherClaims
    .filter(
      (c) =>
        !usedSet.has(c.couponId) &&
        (c.coupon.usageLimit == null || c.coupon.usedCount < c.coupon.usageLimit)
    )
    .map((c) => ({
      id: c.id,
      code: c.coupon.code,
      type: c.coupon.type as "PERCENTAGE" | "FIXED" | "FREE_SHIPPING",
      value: c.coupon.value,
      endDate: c.coupon.endDate?.toISOString() ?? null,
      minPurchase: c.coupon.minPurchase,
      maxDiscount: c.coupon.maxDiscount,
    }));

  const initials =
    [profile?.firstName?.[0], profile?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    session.user.name?.slice(0, 2).toUpperCase() ||
    "HC";

  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    session.user.name ||
    "Member";

  return (
    <AccountDashboardClient
      initials={initials}
      name={name}
      email={session.user.email ?? ""}
      orders={orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((i) => ({ name: i.name, imageUrl: i.imageUrl })),
      }))}
      wishlistItems={wishlistItems.map((w) => ({
        id: w.id,
        product: {
          id: w.product.id,
          name: w.product.name,
          slug: w.product.slug,
          price: w.product.price,
          salePrice: w.product.salePrice,
          images: w.product.images,
        },
      }))}
      activeVouchers={activeVouchers}
      initialTab={searchParams.tab === "wishlist" ? "wishlist" : "orders"}
    />
  );
}
