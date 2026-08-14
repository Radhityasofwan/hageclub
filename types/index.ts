// =============================================================================
// USER & AUTH
// =============================================================================

export type UserRole = "CUSTOMER" | "ADMIN" | "EDITOR" | "CS";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// =============================================================================
// PRODUCT
// =============================================================================

export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isCover: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number | null;
  stock: number;
  attributes: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner: string | null;
  parentId: string | null;
  sortOrder: number;
  children?: Category[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: ProductStatus;
  featured: boolean;
  category: Pick<Category, "id" | "name" | "slug">;
  images: Pick<ProductImage, "url" | "alt" | "isCover">[];
}

export interface Product extends ProductSummary {
  sku: string;
  shortDescription: string | null;
  fullDescription: string | null;
  weight: number;
  width: number | null;
  height: number | null;
  length: number | null;
  variants: ProductVariant[];
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string[];
  color?: string[];
  inStock?: boolean;
  sort?: "newest" | "best_selling" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

// =============================================================================
// ORDER
// =============================================================================

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMethod = "VA" | "QRIS" | "EWALLET";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED";

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  imageUrl: string | null;
}

export interface OrderStatusHistory {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: Date;
  createdBy: string | null;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionId: string | null;
  paymentToken: string | null;
  paymentUrl: string | null;
  vaNumber: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  guestName: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  note: string | null;
  shippingAddress: ShippingAddress;
  courier: string | null;
  courierService: string | null;
  trackingNumber: string | null;
  couponId: string | null;
  items: OrderItem[];
  payment: Payment | null;
  statusHistory: OrderStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// CART
// =============================================================================

export interface CartItem {
  productId: string;
  slug?: string;
  variantId: string | null;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  sku: string;
  weight: number;
  stock: number;
}

// =============================================================================
// COUPON
// =============================================================================

export type CouponType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
}

// =============================================================================
// BLOG
// =============================================================================

export type BlogStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  status: BlogStatus;
  publishedAt: Date | null;
  readingTime: number;
  category: BlogCategory;
  tags: BlogTag[];
  author: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SHIPPING (RajaOngkir V2 — rajaongkir.komerce.id/api/v1)
// =============================================================================

export interface V2Province {
  id: number;
  name: string;
}

export interface V2City {
  id: number;
  name: string;
  zip_code: string;
}

export interface V2District {
  id: number;
  name: string;
  zip_code: string;
}

export interface V2SubDistrict {
  id: number;
  name: string;
  zip_code: string;
}

export interface V2Destination {
  id: number;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
}

/** Pencarian negara (international) — GET /destination/international-destination */
export interface V2InternationalDestination {
  country_id: string;
  country_name: string;
}

/** Layanan internasional — POST /calculate/international-cost (ekstensi domestic + currency) */
export interface InternationalCourierService extends CourierService {
  currency: string;
  currency_updated_at: string;
  currency_value: number;
}

export interface InternationalCostResult {
  costs: Array<{ courier: string; services: InternationalCourierService[] }>;
  errors: ShippingErrorItem[];
}

export interface CourierService {
  service: string;
  description: string;
  cost: number;
  etd: string;
}

export interface CourierCost {
  courier: string;
  services: CourierService[];
}

export interface ShippingErrorItem {
  courier?: string;
  code: string;
  message: string;
}

export interface ShippingCostResult {
  costs: CourierCost[];
  errors: ShippingErrorItem[];
}

/** Konfigurasi ongkir yang diekspos ke client (tanpa secret) */
export interface ShippingConfig {
  configured: boolean;
  originCityId: string;
  originLabel: string;
  couriers: string[];
}

// =============================================================================
// KOMSHIP — SHIPPING DELIVERY (api.collaborator.komerce.id)
// =============================================================================

export interface KomshipDestination {
  id: number;
  label: string;
  subdistrict_name: string;
  district_name: string;
  city_name: string;
  zip_code: string;
}

export interface KomshipService {
  shippingName: string;
  serviceName: string;
  weight: number;
  isCod: boolean;
  shippingCost: number;
  shippingCashback: number;
  shippingCostNet: number;
  grandtotal: number;
  serviceFee: number;
  netIncome: number;
  etd: string;
}

export interface KomshipCalculateResult {
  reguler: KomshipService[];
  cargo: KomshipService[];
  instant: KomshipService[];
}

export interface KomshipOrderRef {
  orderId: number;
  orderNo: string;
}

export interface KomshipPickupResult {
  status: string;
  orderNo: string;
  awb: string;
}

export interface KomshipLabelResult {
  path: string;
  base64: string;
}

export interface KomshipHistoryEntry {
  desc: string;
  date: string;
  code: string;
  status: string;
}

export interface KomshipHistoryResult {
  airwayBill: string;
  lastStatus: string;
  history: KomshipHistoryEntry[];
}

/** Field penting dari Detail Order (sisa field diakses via detail[k] bila perlu) */
export interface KomshipOrderDetail {
  orderNo: string;
  awb: string | null;
  orderStatus: string;
  orderDate: string;
  brandName: string;
  shipperName: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  shipping: string;
  shippingType: string;
  paymentMethod: string;
  shippingCost: number;
  shippingCashback: number;
  serviceFee: number;
  additionalCost: number;
  grandTotal: number;
  codValue: number;
  insuranceValue: number;
  driverName: string | null;
  driverPhone: string | null;
  liveTrackingUrl: string | null;
  cancelationReason: string | null;
  notes: string | null;
  raw: Record<string, unknown>;
}

export interface KomshipTestResult {
  ok: boolean;
  message: string;
  searchCount: number;
  calculate: KomshipCalculateResult | null;
}

// =============================================================================
// KOMERCE PAYMENT — VA & QRIS (api.collaborator.komerce.id/user)
// =============================================================================

export interface KomercePaymentMethod {
  paymentType: "va" | "qris" | "ewallet";
  displayName: string;
  bankCode: string;
  logoUrl: string;
  minAmount: number;
  maxAmount: number;
  currency: string;
}

export interface KomercePaymentCreateResult {
  paymentId: string;
  status: string | null;
  vaNumber: string | null;
  qrString: string | null;
  paymentUrl: string | null;
  expiresAt: string | null;
  raw: Record<string, unknown>;
}

export type KomercePaymentStatusValue =
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "CANCELED";

export interface KomercePaymentStatusResult {
  paymentId: string;
  status: KomercePaymentStatusValue;
  paidAt: string | null;
  paidAmount: number | null;
  method: string | null;
  raw: Record<string, unknown>;
}

export interface KomercePaymentTestResult {
  ok: boolean;
  message: string;
  methodsCount: number;
  vaCount: number;
  hasQris: boolean;
  methods: KomercePaymentMethod[];
}

// =============================================================================
// QRISLY — dynamic QRIS (api.collaborator.komerce.id/user/api/v1/qrisly)
// =============================================================================

export interface KomerceQrislyUploadResult {
  qrisId: string;
  provider: string | null;
  name: string;
  merchantName: string | null;
  createdAt: string | null;
  raw: Record<string, unknown>;
}

export interface KomerceQrislyGenerateResult {
  historyId: string;
  qrisString: string;
  originalAmount: number | null;
  finalAmount: number | null;
  paymentStatus: string | null;
  expiryTime: string | null;
  raw: Record<string, unknown>;
}

export type KomerceQrislyStatusValue = "unpaid" | "paid" | "expired" | "cancelled";

export interface KomerceQrislyStatusResult {
  historyId: string;
  status: KomerceQrislyStatusValue;
  amount: number | null;
  name: string | null;
  paidAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  raw: Record<string, unknown>;
}

export interface KomerceQrislyTestResult {
  ok: boolean;
  message: string;
  hasQrisId: boolean;
  qrisId: string | null;
  merchantName: string | null;
  provider: string | null;
}


// =============================================================================
// API RESPONSE
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
