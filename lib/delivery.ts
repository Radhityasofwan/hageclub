import { db } from "@/lib/db";
import { komshipCourierName } from "@/lib/komship-constants";

// =============================================================================
// HELPERS SHARED — alur delivery (prepare → store → pickup → label → track)
// =============================================================================

export interface DeliveryOrderData {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  note: string | null;
  courier: string | null;
  courierService: string | null;
  trackingNumber: string | null;
  deliveryOrderNo: string | null;
  deliveryStatus: string | null;
  deliveryLabelPath: string | null;
  shippingAddress: {
    recipientName: string;
    phone: string;
    street: string;
    district: string;
    city: string;
    province: string;
    postalCode: string;
    locationLabel?: string;
  };
  weightKg: number;
  itemValue: number;
  preferredCourier: string | null;
  items: Array<{
    name: string;
    variantName: string;
    price: number;
    weight: number;
    width: number;
    height: number;
    length: number;
    quantity: number;
    subtotal: number;
  }>;
}

export async function loadOrderForDelivery(
  orderId: string
): Promise<DeliveryOrderData | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { name: true, weight: true, width: true, height: true, length: true } },
          variant: { select: { name: true } },
        },
      },
    },
  });
  if (!order) return null;

  const shippingAddress =
    typeof order.shippingAddress === "string"
      ? JSON.parse(order.shippingAddress)
      : (order.shippingAddress ?? {});

  const items = order.items.map((it) => ({
    name: it.name,
    variantName: it.variant?.name ?? "",
    price: it.price,
    weight: it.product.weight ?? 0,
    width: it.product.width ?? 0,
    height: it.product.height ?? 0,
    length: it.product.length ?? 0,
    quantity: it.quantity,
    subtotal: it.subtotal,
  }));

  const totalGrams = items.reduce((acc, it) => acc + it.weight * it.quantity, 0);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingCost: order.shippingCost,
    total: order.total,
    note: order.note,
    courier: order.courier,
    courierService: order.courierService,
    trackingNumber: order.trackingNumber,
    deliveryOrderNo: order.deliveryOrderNo,
    deliveryStatus: order.deliveryStatus,
    deliveryLabelPath: order.deliveryLabelPath,
    shippingAddress: {
      recipientName: shippingAddress.recipientName ?? "",
      phone: shippingAddress.phone ?? "",
      street: shippingAddress.street ?? "",
      district: shippingAddress.district ?? "",
      city: shippingAddress.city ?? "",
      province: shippingAddress.province ?? "",
      postalCode: shippingAddress.postalCode ?? "",
      locationLabel: shippingAddress.locationLabel ?? "",
    },
    weightKg: Math.max(250, totalGrams) / 1000,
    itemValue: order.subtotal,
    preferredCourier: order.courier ? komshipCourierName(order.courier) : null,
    items,
  };
}
