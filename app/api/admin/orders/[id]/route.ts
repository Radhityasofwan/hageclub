import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { sendEmail } from "@/lib/email";
import {
  orderConfirmationEmail,
  paymentConfirmedEmail,
  orderShippedEmail,
  renderEmail,
} from "@/lib/email-templates";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/admin/orders/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR", "CS"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { name: true, slug: true } },
          },
        },
        payment: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });

    if (!order) {
      return error("Order not found", 404);
    }

    return success({
      ...order,
      customer:
        order.guestName ??
        (order.user?.profile
          ? `${order.user.profile.firstName} ${order.user.profile.lastName}`.trim()
          : order.user?.email ?? "Guest"),
    });
  } catch (err) {
    console.error("[GET /api/admin/orders/[id]]", err);
    return error("Failed to fetch order", 500);
  }
}

const updateStatusSchema = z.object({
  status: z.enum([
    "PENDING", "PAID", "PROCESSING", "PACKED",
    "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED",
  ]),
  note: z.string().optional(),
  trackingNumber: z.string().optional(),
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

// PUT /api/admin/orders/[id] — update status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR", "CS"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await db.order.findUnique({
      where: { id },
      select: { id: true, status: true, couponId: true, userId: true },
    });
    if (!existing) {
      return error("Order not found", 404);
    }

    const body = await request.json();

    // Check if updating status or just tracking number
    if (body.trackingNumber && !body.status) {
      await db.order.update({
        where: { id },
        data: { trackingNumber: body.trackingNumber },
      });
      return success(null, "Tracking number updated");
    }

    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return error("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const { status: newStatus, note, trackingNumber } = parsed.data;

    // CS role restrictions: no financial operations
    if (session.user.role === "CS" && ["PAID", "CANCELLED", "REFUNDED"].includes(newStatus)) {
      return error("CS cannot perform financial status transitions (PAID, CANCELLED, REFUNDED)", 403);
    }

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return error(
        `Cannot transition from ${existing.status} to ${newStatus}. Allowed: ${allowed.join(", ") || "none"}`,
        400
      );
    }

    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: newStatus,
          ...(trackingNumber ? { trackingNumber } : {}),
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: newStatus,
          note: note ?? null,
          createdBy: session.user.id,
        },
      });

      // If status is CANCELLED or REFUNDED, restore stock (variant if present, otherwise product)
      if (newStatus === "CANCELLED" || newStatus === "REFUNDED") {
        const items = await tx.orderItem.findMany({
          where: { orderId: id },
          select: { productId: true, quantity: true, variantId: true },
        });
        const variantProductIds = new Set<string>();
        for (const item of items) {
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
      }

      // If status is PAID, update payment status and record coupon usage
      if (newStatus === "PAID") {
        await tx.payment.update({
          where: { orderId: id },
          data: { status: "PAID", paidAt: new Date() },
        });
        if (existing.couponId) {
          await tx.coupon.update({
            where: { id: existing.couponId },
            data: { usedCount: { increment: 1 } },
          });
          await tx.couponUsage.create({
            data: {
              couponId: existing.couponId,
              orderId: id,
              userId: existing.userId ?? undefined,
            },
          });
        }
      }
    });

    return success(null, `Order status updated to ${newStatus}`);
  } catch (err) {
    console.error("[PUT /api/admin/orders/[id]]", err);
    return error("Failed to update order", 500);
  }
}

const notifySchema = z.object({
  type: z.enum(["order_confirmed", "payment_confirmed", "shipped"]),
});

// POST /api/admin/orders/[id]/notify — send notification email to customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR", "CS"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = notifySchema.safeParse(body);
    if (!parsed.success) {
      return error("Invalid notification type", 400);
    }

    const { type } = parsed.data;

    const order = await db.order.findUnique({
      where: { id },
      select: {
        orderNumber: true,
        guestEmail: true,
        guestName: true,
        subtotal: true,
        discount: true,
        shippingCost: true,
        total: true,
        courier: true,
        courierService: true,
        trackingNumber: true,
        shippingAddress: true,
        payment: { select: { method: true } },
        items: {
          select: { name: true, sku: true, price: true, quantity: true, subtotal: true },
        },
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!order) {
      return error("Order not found", 404);
    }

    const customerEmail = order.guestEmail ?? order.user?.email;
    if (!customerEmail) {
      return error("Customer email not available", 400);
    }

    const customerName =
      order.guestName ??
      (order.user?.profile
        ? `${order.user.profile.firstName} ${order.user.profile.lastName}`.trim()
        : "Customer");

    let template: { html: string; text: string } | null = null;

    switch (type) {
      case "order_confirmed":
        template = orderConfirmationEmail({
          orderNumber: order.orderNumber,
          customerName,
          items: order.items.map((i) => ({
            name: i.name,
            sku: i.sku,
            price: i.price,
            quantity: i.quantity,
            subtotal: i.subtotal,
          })),
          subtotal: order.subtotal,
          discount: order.discount,
          shippingCost: order.shippingCost,
          total: order.total,
          courier: order.courier,
          courierService: order.courierService,
          shippingAddress: order.shippingAddress as {
            recipientName: string;
            street: string;
            district: string;
            city: string;
            province: string;
            postalCode: string;
          },
          paymentMethod: order.payment?.method ?? "N/A",
        });
        break;
      case "payment_confirmed":
        template = paymentConfirmedEmail({
          orderNumber: order.orderNumber,
          customerName,
          total: order.total,
        });
        break;
      case "shipped":
        template = orderShippedEmail({
          orderNumber: order.orderNumber,
          customerName,
          courier: order.courier ?? "Courier",
          courierService: order.courierService ?? "Standard",
          trackingNumber: order.trackingNumber ?? "N/A",
        });
        break;
    }

    if (!template) {
      return error("Failed to generate email template", 500);
    }

    const rendered = renderEmail(template);
    await sendEmail(customerEmail, `HAGE CLUB — ${type === "order_confirmed" ? "Order Confirmed" : type === "payment_confirmed" ? "Payment Confirmed" : "Order Shipped"}`, rendered.html, rendered.text);

    return success(null, `Notification "${type}" sent to ${customerEmail}`);
  } catch (err) {
    console.error("[POST /api/admin/orders/[id]/notify]", err);
    return error("Failed to send notification", 500);
  }
}
