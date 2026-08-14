import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { validateCouponSchema } from "@/lib/validation";
import { parseAllowedRegions, addressMatchesAllowedRegions } from "@/lib/regions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = validateCouponSchema.safeParse(body);
  if (!parsed.success) {
    return error("Invalid request", 400, parsed.error.flatten().fieldErrors);
  }

  const { code, subtotal, province, city } = parsed.data;
  const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : [];

  const coupon = await db.coupon.findFirst({
    where: { code: code.toUpperCase(), isActive: true },
  });

  if (!coupon) {
    return success({ valid: false, code, discount: 0, message: "Kode kupon tidak ditemukan atau tidak aktif" });
  }

  const now = new Date();
  if (coupon.startDate && coupon.startDate > now) {
    return success({ valid: false, code, discount: 0, message: "Kupon belum berlaku" });
  }
  if (coupon.endDate && coupon.endDate < now) {
    return success({ valid: false, code, discount: 0, message: "Kupon sudah kedaluwarsa" });
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return success({ valid: false, code, discount: 0, message: "Kupon sudah mencapai batas penggunaan" });
  }
  if (coupon.minPurchase !== null && subtotal < coupon.minPurchase) {
    const { formatPrice } = await import("@/lib/utils");
    return success({
      valid: false,
      code,
      discount: 0,
      message: `Minimum pembelian ${formatPrice(coupon.minPurchase)} untuk menggunakan kupon ini`,
    });
  }

  // Cek batasan wilayah untuk FREE_SHIPPING — hanya jika province/city dikirim
  if (coupon.type === "FREE_SHIPPING" && coupon.allowedRegions && province && city) {
    const allowed = parseAllowedRegions(coupon.allowedRegions);
    if (allowed.length > 0 && !addressMatchesAllowedRegions({ province, city }, allowed)) {
      return success({
        valid: false,
        code,
        discount: 0,
        message: "Kupon gratis ongkir ini tidak berlaku untuk wilayah pengiriman Anda",
      });
    }
  }

  // Check applicable restriction when productIds are available
  const qualifyingSubtotal = subtotal;
  if (productIds.length > 0) {
    if (coupon.applicableProduct) {
      if (!productIds.includes(coupon.applicableProduct)) {
        const prod = await db.product.findUnique({
          where: { id: coupon.applicableProduct },
          select: { name: true },
        });
        return success({
          valid: false,
          code,
          discount: 0,
          message: `Kupon ini hanya berlaku untuk: ${prod?.name ?? "produk tertentu"}`,
        });
      }
      // Qualifying subtotal: only that product (approximate, full calc at order time)
    } else if (coupon.applicableCategory) {
      const matchingProducts = await db.product.findMany({
        where: { id: { in: productIds }, categoryId: coupon.applicableCategory },
        select: { id: true },
      });
      if (matchingProducts.length === 0) {
        const cat = await db.category.findUnique({
          where: { id: coupon.applicableCategory },
          select: { name: true },
        });
        return success({
          valid: false,
          code,
          discount: 0,
          message: `Kupon hanya berlaku untuk kategori: ${cat?.name ?? "kategori tertentu"}`,
        });
      }
    }
  }

  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = Math.floor((qualifyingSubtotal * coupon.value) / 100);
    if (coupon.maxDiscount !== null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else if (coupon.type === "FIXED") {
    discount = Math.min(coupon.value, qualifyingSubtotal);
  } else {
    // FREE_SHIPPING — discount handled at checkout (set shipping cost = 0 or mark)
    discount = 0;
  }

  return success({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    discount,
    message:
      coupon.type === "FREE_SHIPPING"
        ? "Kupon gratis ongkir berhasil diterapkan"
        : `Kupon berhasil diterapkan, hemat ${discount > 0 ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(discount) : coupon.value + "%"}`,
  });
}
