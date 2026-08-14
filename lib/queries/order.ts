import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import type { CreateOrderPayload } from "@/types/order";
import type { OrderStatus, Prisma } from "@prisma/client";

// =============================================================================
// SELECT SHAPES
// =============================================================================

const orderDetailSelect = {
  id: true,
  orderNumber: true,
  status: true,
  subtotal: true,
  discount: true,
  shippingCost: true,
  total: true,
  courier: true,
  courierService: true,
  trackingNumber: true,
  note: true,
  shippingAddress: true,
  guestEmail: true,
  guestPhone: true,
  guestName: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      quantity: true,
      subtotal: true,
      imageUrl: true,
      productId: true,
      variantId: true,
    },
  },
  payment: {
    select: {
      id: true,
      method: true,
      status: true,
      amount: true,
      transactionId: true,
      paymentToken: true,
      paymentUrl: true,
      vaNumber: true,
      paidAt: true,
      payload: true,
    },
  },
  statusHistory: {
    select: { status: true, note: true, createdAt: true },
    orderBy: { createdAt: "asc" as const },
  },
  coupon: {
    select: { code: true },
  },
  user: {
    select: { email: true },
  },
} as const;

// =============================================================================
// CREATE ORDER (called from API route after price validation)
// =============================================================================

export interface CreateOrderData {
  customer: CreateOrderPayload["customer"];
  address: CreateOrderPayload["address"];
  courier: CreateOrderPayload["courier"];
  paymentMethod: "VA" | "QRIS" | "EWALLET";
  notes?: string;
  userId?: string | null;
  items: Array<{
    productId: string;
    variantId: string | null;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    subtotal: number;
    imageUrl: string | null;
    weight: number;
  }>;
  subtotal: number;
  discount: number;
  couponId?: string | null;
}

export async function createOrder(data: CreateOrderData) {
  const orderNumber = generateOrderNumber();

  return db.$transaction(async (tx) => {
    // Validate stock for each item within the transaction to prevent race conditions
    for (const item of data.items) {
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true },
        });
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Stok tidak cukup untuk item: ${item.name}`);
        }
      } else {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Stok tidak cukup untuk item: ${item.name}`);
        }
      }
    }

    const shippingCost = data.courier.cost;
    const total = data.subtotal - data.discount + shippingCost;

    // Create order
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: data.userId ?? null,
        guestName: data.userId ? null : data.customer.name,
        guestEmail: data.userId ? null : data.customer.email,
        guestPhone: data.userId ? null : data.customer.phone,
        status: "PENDING",
        subtotal: data.subtotal,
        discount: data.discount,
        shippingCost,
        total,
        note: data.notes ?? null,
        shippingAddress: {
          recipientName: data.address.recipientName,
          phone: data.address.phone,
          street: data.address.street,
          district: data.address.district,
          city: data.address.city,
          province: data.address.province,
          postalCode: data.address.postalCode,
          locationId: data.address.locationId ?? null,
          locationLabel: data.address.locationLabel ?? null,
        },
        courier: data.courier.name,
        courierService: data.courier.service,
        couponId: data.couponId ?? null,
      },
    });

    // Create order items
    await tx.orderItem.createMany({
      data: data.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        imageUrl: item.imageUrl,
      })),
    });

    // Decrement stock (variant if present, otherwise product)
    const variantProductIds = new Set<string>();
    for (const item of data.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
        // Verify variant stock didn't go negative
        const v = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true },
        });
        if (v && v.stock < 0) {
          throw new Error(`Stok variant tidak mencukupi: ${item.name}`);
        }
        variantProductIds.add(item.productId);
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        // Verify product stock didn't go negative
        const p = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });
        if (p && p.stock < 0) {
          throw new Error(`Stok tidak mencukupi: ${item.name}`);
        }
      }
    }
    // Sync product.stock for variant products (sum of active variant stocks)
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

    // Create pending payment record
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        method: data.paymentMethod,
        status: "PENDING",
        amount: total,
      },
    });

    // Initial status history
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: "PENDING", note: "Order dibuat" },
    });

    return { order, payment };
  });
}

// =============================================================================
// QUERIES
// =============================================================================

// =============================================================================
// SERIALIZE (payload → vaBank/expiresAt, sembunyikan payload internal)
// =============================================================================

type OrderRow = Prisma.OrderGetPayload<{
  select: typeof orderDetailSelect;
}>;

export function serializeOrderDetail(order: OrderRow) {
  const payment = order.payment;
  const payload = payment ? ((payment.payload ?? {}) as Record<string, unknown>) : {};
  const expiresAt = payment
    ? ((typeof payload.expiresAt === "string" ? payload.expiresAt : null) ??
       (typeof payload.expiryTime === "string" ? payload.expiryTime : null) ??
       (typeof payload.expired_at === "string" ? payload.expired_at : null))
    : null;

  return {
    ...order,
    coupon: undefined,
    user: undefined,
    couponCode: order.coupon?.code ?? null,
    userEmail: order.user?.email ?? null,
    payment: payment
      ? {
          ...payment,
          payload: undefined,
          vaBank: typeof payload.bank === "string" ? payload.bank : null,
          expiresAt,
          // QRISLY: jumlah yang benar-benar harus dibayar (final_amount sudah
          // termasuk biaya layanan QRIS) — bisa berbeda dari amount pesanan
          finalAmount:
            typeof payload.finalAmount === "number" ? payload.finalAmount : null,
        }
      : null,
  };
}

export async function getOrderById(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    select: orderDetailSelect,
  });
  return order ? serializeOrderDetail(order) : null;
}

export async function getOrderByNumber(orderNumber: string) {
  const order = await db.order.findUnique({
    where: { orderNumber },
    select: orderDetailSelect,
  });
  return order ? serializeOrderDetail(order) : null;
}

export async function getUserOrders(userId: string, page = 1, limit = 10, statuses?: string[]) {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(statuses?.length ? { status: { in: statuses as OrderStatus[] } } : {}),
  };
  const [orders, total] = await db.$transaction([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        courier: true,
        courierService: true,
        createdAt: true,
        items: {
          select: { id: true, name: true, quantity: true, price: true, imageUrl: true },
          take: 3,
        },
        payment: { select: { method: true, status: true, vaNumber: true } },
      },
    }),
    db.order.count({ where }),
  ]);
  return { orders, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updatePaymentRecord(
  paymentId: string,
  data: {
    paymentToken?: string;
    paymentUrl?: string;
    vaNumber?: string;
    payload?: Prisma.InputJsonValue;
  }
) {
  return db.payment.update({
    where: { id: paymentId },
    data: data as Prisma.PaymentUpdateInput,
  });
}
