import { db } from "@/lib/db";
import { apiResponse } from "@/lib/api-response";
import { getSettingValue } from "@/lib/settings";
import { parseAllowedRegions, addressMatchesAllowedRegions } from "@/lib/regions";
import { checkoutSchema } from "@/lib/validation";
import { createOrder, updatePaymentRecord } from "@/lib/queries/order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCost, getOriginCityId } from "@/lib/rajaongkir";
import { COURIER_LABELS, courierCodeFromLabel } from "@/lib/rajaongkir-constants";
import {
  createPaymentTransaction,
  getPaymentMethods,
  KomercePaymentError,
} from "@/lib/komerce-payment";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail, renderEmail } from "@/lib/email-templates";
import {
  KOMERCE_PAYMENT_MIN_AMOUNT,
} from "@/lib/komerce-payment-constants";
import {
  generateQris,
  getQrislySettings,
  QrislyError,
} from "@/lib/komerce-qrisly";
import { QRISLY_MIN_AMOUNT } from "@/lib/komerce-qrisly-constants";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // Validate input
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse.error(
        "Invalid input",
        400,
        parsed.error.flatten().fieldErrors
      );
    }

    const { customer, address, items, couponCode, courier, paymentMethod, notes } = parsed.data;

    // Kode kurir dipakai untuk verifikasi tarif (client kirim kode "jnt";
    // label "J&T Express" juga ditoleransi). Label dipakai untuk display
    // order — order.courier selalu menyimpan label, bukan kode.
    const courierCode = courierCodeFromLabel(courier.name) ?? courier.name.toLowerCase();
    const courierLabel = COURIER_LABELS[courierCode] ?? courier.name;

    // Re-fetch products from DB to get authoritative prices & stock
    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: { where: { isCover: true }, take: 1 },
        variants: items.some((i) => i.variantId) ? true : false,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Build order items with validated prices
    const orderItems: Array<{
      productId: string;
      variantId: string | null;
      name: string;
      sku: string;
      price: number;
      quantity: number;
      subtotal: number;
      imageUrl: string | null;
      weight: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return apiResponse.error(`Product not found: ${item.productId}`, 404);
      }

      let price = product.salePrice ?? product.price;
      let name = product.name;
      let sku = product.sku;
      const imageUrl = product.images[0]?.url ?? null;
      let weight = product.weight;
      let stock = product.stock;

      if (item.variantId) {
        const variant = product.variants?.find((v) => v.id === item.variantId);
        if (!variant) {
          return apiResponse.error(`Variant not found: ${item.variantId}`, 404);
        }
        if (!variant.isActive) {
          return apiResponse.error(`Variant "${variant.name}" is not available`, 400);
        }
        price = variant.price ?? price;
        name = `${product.name} — ${variant.name}`;
        sku = variant.sku;
        weight = product.weight;
        stock = variant.stock;
      }

      if (stock < item.quantity) {
        return apiResponse.error(`Stok tidak cukup untuk ${name}`, 409);
      }

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId ?? null,
        name,
        sku,
        price,
        quantity: item.quantity,
        subtotal: price * item.quantity,
        imageUrl,
        weight,
      });
    }

    // Calculate subtotal from DB (don't trust client)
    const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

    // Validate and apply coupon
    let discount = 0;
    let couponId: string | null = null;
    let isFreeShipping = false;

    // Threshold-based free shipping — checked server-side (never trust client)
    const [thresholdRaw, regionsRaw] = await Promise.all([
      getSettingValue("store_free_shipping_threshold"),
      getSettingValue("store_free_shipping_regions"),
    ]);
    const freeShippingThreshold = Number(thresholdRaw ?? "500000") || 500_000;
    if (subtotal >= freeShippingThreshold) {
      const allowedRegions = parseAllowedRegions(regionsRaw);
      if (allowedRegions.length === 0) {
        isFreeShipping = true;
      } else {
        const addrProvince = address.province ?? "";
        const addrCity = address.city ?? "";
        if (addressMatchesAllowedRegions({ province: addrProvince, city: addrCity }, allowedRegions)) {
          isFreeShipping = true;
        }
      }
    }

    if (couponCode) {
      const coupon = await db.coupon.findFirst({
        where: { code: couponCode.toUpperCase(), isActive: true },
      });

      if (!coupon) {
        return apiResponse.error("Kupon tidak ditemukan", 400);
      }

      const now = new Date();
      if (coupon.startDate && coupon.startDate > now) {
        return apiResponse.error("Kupon belum berlaku", 400);
      }
      if (coupon.endDate && coupon.endDate < now) {
        return apiResponse.error("Kupon sudah kedaluwarsa", 400);
      }
      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return apiResponse.error("Kupon sudah mencapai batas penggunaan", 400);
      }
      if (coupon.minPurchase !== null && subtotal < coupon.minPurchase) {
        return apiResponse.error(`Minimum pembelian Rp${coupon.minPurchase.toLocaleString("id-ID")}`, 400);
      }

      // Cek batasan wilayah untuk FREE_SHIPPING
      if (coupon.type === "FREE_SHIPPING" && coupon.allowedRegions) {
        const allowed = parseAllowedRegions(coupon.allowedRegions);
        if (allowed.length > 0) {
          const addrProvince = address.province ?? "";
          const addrCity = address.city ?? "";
          if (!addressMatchesAllowedRegions({ province: addrProvince, city: addrCity }, allowed)) {
            return apiResponse.error(
              "Kupon gratis ongkir ini tidak berlaku untuk wilayah pengiriman Anda",
              400
            );
          }
        }
      }

      couponId = coupon.id;

      // Determine qualifying subtotal based on applicable restriction
      let qualifyingSubtotal = subtotal;

      if (coupon.applicableProduct) {
        const qualifying = orderItems.filter((i) => i.productId === coupon.applicableProduct);
        if (qualifying.length === 0) {
          const prod = products.find((p) => p.id === coupon.applicableProduct);
          return apiResponse.error(
            `Kupon ini hanya berlaku untuk: ${prod?.name ?? "produk tertentu"}`,
            400
          );
        }
        qualifyingSubtotal = qualifying.reduce((s, i) => s + i.subtotal, 0);
      } else if (coupon.applicableCategory) {
        const qualifying = orderItems.filter((i) => {
          const prod = products.find((p) => p.id === i.productId);
          return prod?.categoryId === coupon.applicableCategory;
        });
        if (qualifying.length === 0) {
          const cat = await db.category.findUnique({
            where: { id: coupon.applicableCategory },
            select: { name: true },
          });
          return apiResponse.error(
            `Kupon hanya berlaku untuk kategori: ${cat?.name ?? "kategori tertentu"}`,
            400
          );
        }
        qualifyingSubtotal = qualifying.reduce((s, i) => s + i.subtotal, 0);
      }

      if (coupon.type === "PERCENTAGE") {
        discount = Math.floor((qualifyingSubtotal * coupon.value) / 100);
        if (coupon.maxDiscount !== null) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else if (coupon.type === "FIXED") {
        discount = Math.min(coupon.value, qualifyingSubtotal);
      } else if (coupon.type === "FREE_SHIPPING") {
        isFreeShipping = true;
      }
    }

    // Shipping — verifikasi ulang ke RajaOngkir agar biaya yang dicatat selalu
    // tarif resmi (tidak bergantung nilai dari client)
    const totalWeight = orderItems.reduce((sum, i) => sum + i.weight * i.quantity, 0);
    let shippingCost = isFreeShipping ? 0 : courier.cost;
    if (!isFreeShipping) {
      try {
        const origin = await getOriginCityId();
        if (origin && address.locationId) {
          const result = await getCost(
            origin,
            address.locationId,
            Math.max(totalWeight, 250),
            [courierCode]
          );
          const match = result.costs
            .flatMap((c) => c.services)
            .find((s) => s.service === courier.service);
          if (match) {
            shippingCost = match.cost;
          } else if (result.errors.length === 0) {
            return apiResponse.error(
              "Tarif pengiriman berubah — silakan pilih ulang metode pengiriman.",
              409
            );
          }
          // Jika kurir gagal dihitung (error upstream), pakai nilai dari client
        }
      } catch (err) {
        console.warn(
          "[POST /api/orders] shipping verification failed, using client value",
          err
        );
      }
    }

    // Create order in transaction
    const { order, payment } = await createOrder({
      customer,
      address,
      courier: { name: courierLabel, service: courier.service, cost: courier.cost },
      paymentMethod,
      notes,
      userId: session?.user?.id ?? null,
      items: orderItems,
      subtotal,
      discount,
      couponId,
    });

    const finalShippingCost = Math.round(shippingCost);
    const total = subtotal - discount + finalShippingCost;

    // Update order total and sync payment amount (shipping may differ after server re-verification)
    await db.order.update({
      where: { id: order.id },
      data: { shippingCost: finalShippingCost, total },
    });
    await db.payment.update({
      where: { orderId: order.id },
      data: { amount: total },
    });

    // Create payment — QRISLY dulu (bila API key + QRIS statis terpasang),
    // lalu fallback Komerce Payment API (VA / QRIS)
    try {
      if (paymentMethod === "EWALLET") {
        return apiResponse.error(
          "E-Wallet belum tersedia — pilih Virtual Account atau QRIS.",
          400
        );
      }

      const isQris = paymentMethod === "QRIS";
      const qrislyCfg = await getQrislySettings();
      const useQrisly = isQris && Boolean(qrislyCfg.apiKey && qrislyCfg.qrisId);

      if (useQrisly) {
        if (total < QRISLY_MIN_AMOUNT) {
          return apiResponse.error(
            `Total minimal pembayaran ${QRISLY_MIN_AMOUNT.toLocaleString("id-ID")} IDR.`,
            400
          );
        }
        const qris = await generateQris({
          qrisId: qrislyCfg.qrisId,
          amount: total,
        });
        const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
        const paymentUrl =
          origin && qris.qrisString
            ? `${origin}/api/payments/qr?data=${encodeURIComponent(qris.qrisString)}`
            : null;

        await updatePaymentRecord(payment.id, {
          paymentToken: qris.historyId,
          paymentUrl: paymentUrl ?? undefined,
          payload: {
            provider: "qrisly",
            historyId: qris.historyId,
            qrisString: qris.qrisString,
            originalAmount: qris.originalAmount,
            finalAmount: qris.finalAmount,
            expiryTime: qris.expiryTime,
            ...qris.raw,
          },
        });
      } else {
        if (total < KOMERCE_PAYMENT_MIN_AMOUNT) {
          return apiResponse.error(
            `Total minimal pembayaran ${KOMERCE_PAYMENT_MIN_AMOUNT.toLocaleString("id-ID")} IDR.`,
            400
          );
        }

        // channel_code bank VA — dari pemilihan user (/methods), fallback bank
        // pertama dari API /methods, terakhir setting lama (dokumen: channel_code
        // harus dari daftar bank yang tersedia)
        const channelCode = isQris
          ? undefined
          : (parsed.data.paymentBank || (await getDefaultVaBank()));

        const paymentResult = await createPaymentTransaction({
          orderId: order.orderNumber,
          paymentType: isQris ? "qris" : "bank_transfer",
          channelCode,
          amount: total,
          customer: {
            name: customer.name,
            email: customer.email,
            phone: toLocalPhone(customer.phone),
          },
          items: orderItems.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
          callbackUrl: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
            : undefined,
        });

        // QRIS: tampilkan QR dari qr_string (render di server). VA: simpan bank
        // yang benar-benar dipakai (channel_code), bukan bank default.
        let paymentUrl = paymentResult.paymentUrl;
        let bank: string | undefined;
        if (isQris && paymentResult.qrString) {
          const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
          paymentUrl = origin
            ? `${origin}/api/payments/qr?data=${encodeURIComponent(paymentResult.qrString)}`
            : paymentResult.paymentUrl;
        } else if (!isQris && paymentResult.vaNumber) {
          bank = channelCode;
        }

        // Update payment record
        await updatePaymentRecord(payment.id, {
          paymentToken: paymentResult.paymentId,
          paymentUrl: paymentUrl ?? undefined,
          vaNumber: paymentResult.vaNumber ?? undefined,
          payload: {
            ...paymentResult.raw,
            bank: bank ?? null,
            qrString: paymentResult.qrString ?? null,
            expiresAt: paymentResult.expiresAt,
            paymentType: isQris ? "qris" : "bank_transfer",
          },
        });
      }
    } catch (err) {
      if (
        err instanceof KomercePaymentError ||
        err instanceof QrislyError
      ) {
        console.warn(
          `[POST /api/orders] payment upstream error: ${err.message}`
        );
      } else {
        console.error("[POST /api/orders] payment creation failed", err);
      }
      // Payment creation failed — mark order as CANCELLED and restore stock
      await db.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
        const variantProductIds = new Set<string>();
        for (const item of orderItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            variantProductIds.add(item.productId);
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
        for (const productId of Array.from(variantProductIds)) {
          const agg = await tx.productVariant.aggregate({
            where: { productId, isActive: true },
            _sum: { stock: true },
          });
          await tx.product.update({
            where: { id: productId },
            data: { stock: agg._sum.stock ?? 0 },
          });
        }
      });
      return apiResponse.error("Pembayaran gagal diproses. Silakan coba lagi.", 500);
    }

    // Track coupon usage — fire-and-forget (non-critical, don't block response)
    if (couponId) {
      db.$transaction([
        db.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } }),
        db.couponUsage.create({ data: { couponId, orderId: order.id, userId: session?.user?.id ?? null } }),
      ]).catch((err) => console.error("[POST /api/orders] gagal update coupon usage:", err));
    }

    // Order confirmation email — fire-and-forget
    const confirmTemplate = orderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerName: customer.name,
      items: orderItems.map((i) => ({
        name: i.name,
        sku: i.sku,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      subtotal,
      discount,
      shippingCost: finalShippingCost,
      total,
      courier: courierLabel,
      courierService: courier.service,
      shippingAddress: {
        recipientName: address.recipientName,
        street: address.street,
        district: address.district,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
      },
      paymentMethod: paymentMethod === "VA" ? "Virtual Account" : paymentMethod,
    });
    const rendered = renderEmail(confirmTemplate);
    sendEmail(customer.email, `Order Confirmed — ${order.orderNumber}`, rendered.html, rendered.text)
      .catch((err) => console.error("[POST /api/orders] gagal kirim email konfirmasi:", err));

    return apiResponse.success(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total,
        paymentMethod,
      },
      "Order created successfully",
      201
    );
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return apiResponse.error(
      err instanceof Error ? err.message : "Failed to create order",
      500
    );
  }
}

// Komerce Payment API requires numeric-only phone (no +62 or country code prefix).
// Converts +62/62 prefix to local 0 prefix so Komerce accepts the number.
function toLocalPhone(phone: string): string {
  if (phone.startsWith("+62")) return "0" + phone.slice(3);
  if (phone.startsWith("62")) return "0" + phone.slice(2);
  return phone;
}

// Bank VA default — prioritas: bank pertama dari API /methods (source of truth,
// sesuai dokumen "channel_code must be from available banks list"), lalu setting
// payment_va_banks (pola lama), terakhir BCA.
async function getDefaultVaBank(): Promise<string> {
  try {
    const methods = await getPaymentMethods();
    const first = methods.find((m) => m.paymentType === "va")?.bankCode;
    if (first) return first;
  } catch {
    // lanjut ke fallback di bawah
  }
  try {
    const banks = (await getSettingValue("payment_va_banks")) ?? "";
    const first = banks.split(",").map((b) => b.trim()).find(Boolean);
    return first ?? "BCA";
  } catch {
    return "BCA";
  }
}
