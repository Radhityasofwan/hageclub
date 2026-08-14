import type { PaymentMethod } from "@/types";

// Order creation payload (client → POST /api/orders)
export interface CreateOrderPayload {
  customer: { name: string; email: string; phone: string };
  address: {
    recipientName: string;
    phone: string;
    street: string;
    district: string;
    city: string;
    cityId?: string;
    province: string;
    provinceId?: string;
    postalCode: string;
    locationId?: string;
    locationLabel?: string;
  };
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>;
  couponCode?: string;
  courier: { name: string; service: string; cost: number };
  paymentMethod: PaymentMethod;
  paymentBank?: string;
  paymentWallet?: string;
  notes?: string;
}

// Order creation response
export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentMethod: PaymentMethod;
  payment: {
    paymentId: string;
    status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
    vaNumber?: string;
    bank?: string;
    qrisUrl?: string;
    qrisData?: string;
    paymentUrl?: string;
    expiresAt?: string;
  } | null;
}

// Public order detail (for success page + tracking)
export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  courier: string | null;
  courierService: string | null;
  trackingNumber: string | null;
  note: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  userId: string | null;
  userEmail: string | null;
  shippingAddress: {
    recipientName: string;
    phone: string;
    street: string;
    district: string;
    city: string;
    province: string;
    postalCode: string;
  };
  items: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    subtotal: number;
    imageUrl: string | null;
  }>;
  payment: {
    id: string;
    method: PaymentMethod;
    status: string;
    amount: number;
    paymentToken: string | null;
    vaNumber: string | null;
    paymentUrl: string | null;
    paidAt: string | null;
    vaBank: string | null;
    expiresAt: string | null;
    /** QRISLY: jumlah bayar final (termasuk biaya layanan QRIS), null jika tidak berlaku */
    finalAmount: number | null;
  } | null;
  statusHistory: Array<{
    status: string;
    note: string | null;
    createdAt: string;
  }>;
  createdAt: string;
  couponCode: string | null;
}

// Coupon validation response
export interface CouponValidation {
  valid: boolean;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  discount: number;
  message: string;
}
