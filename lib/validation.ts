import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  city: z.string().optional(),
  birthDate: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  sku: z.string().min(1, "SKU is required"),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  sizeGuideImageUrl: z.string().optional().nullable(),
  price: z.number().int().positive("Price must be positive"),
  salePrice: z.number().int().positive().optional().nullable(),
  weight: z.number().int().min(1, "Berat produk wajib diisi (minimum 1 gram)"),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  length: z.number().int().positive().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  stock: z.number().int().nonnegative().default(0),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  categoryId: z.string().min(1, "Category is required"),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        alt: z.string().optional().nullable(),
        isCover: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .optional()
    .default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

export const productVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().min(1, "Variant SKU is required"),
  price: z.number().int().positive().optional().nullable(),
  stock: z.number().int().nonnegative().default(0),
  attributes: z.record(z.string()),
  isActive: z.boolean().default(true),
});

export const addressSchema = z.object({
  label: z.string().min(1, "Address label is required"),
  recipientName: z.string().min(2, "Recipient name is required"),
  phone: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{8,13}$/, "Invalid Indonesian phone number"),
  street: z.string().min(5, "Street address is required"),
  district: z.string().min(2, "District is required"),
  city: z.string().min(2, "City is required"),
  province: z.string().min(2, "Province is required"),
  postalCode: z.string().length(5, "Postal code must be 5 digits"),
  cityId: z.string().optional(),
  provinceId: z.string().optional(),
  locationId: z.string().optional(),
  locationLabel: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const checkoutCustomerSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{8,13}$/, "Invalid Indonesian phone number"),
});

export const checkoutAddressSchema = z.object({
  recipientName: z.string().min(2, "Recipient name is required"),
  phone: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{8,13}$/, "Invalid Indonesian phone number"),
  street: z.string().min(5, "Street address is required"),
  district: z.string().min(2, "District is required"),
  city: z.string().min(2, "City is required"),
  cityId: z.string().optional(),
  province: z.string().min(2, "Province is required"),
  provinceId: z.string().optional(),
  postalCode: z.string().length(5, "Postal code must be 5 digits"),
  // ID wilayah tujuan RajaOngkir V2 — wajib untuk perhitungan ongkir server-side
  locationId: z.string().min(1, "Location ID is required"),
  locationLabel: z.string().optional(),
});

export const checkoutSchema = z.object({
  customer: checkoutCustomerSchema,
  address: checkoutAddressSchema,
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional().nullable(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Cart is empty"),
  couponCode: z.string().optional(),
  courier: z.object({
    name: z.string().min(1, "Courier is required"),
    service: z.string().min(1, "Courier service is required"),
    cost: z.number().int().nonnegative(),
  }),
  paymentMethod: z.enum(["VA", "QRIS", "EWALLET"]),
  paymentBank: z.string().optional(),
  paymentWallet: z.string().optional(),
  notes: z.string().optional(),
});

export const couponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters").toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().int().nonnegative("Value must be 0 or greater"),
  minPurchase: z.number().int().nonnegative().optional().nullable(),
  maxDiscount: z.number().int().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
  applicableCategory: z.string().optional().nullable(),
  applicableProduct: z.string().optional().nullable(),
  showAsPopup: z.boolean().default(false),
  popupTitle: z.string().max(80).optional().nullable(),
  allowedRegions: z.array(z.string()).optional().nullable(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  subtotal: z.number().int().positive("Subtotal must be positive"),
  province: z.string().optional(),
  city: z.string().optional(),
});

export const shippingCostSchema = z.object({
  origin: z.string().min(1, "Origin ID is required"),
  destination: z.string().min(1, "Destination ID is required"),
  weight: z.number().int().positive("Weight must be positive").max(100000, "Weight exceeds limit"),
  couriers: z.array(z.string()).min(1, "At least one courier is required"),
});

export const internationalCostSchema = z.object({
  origin: z.string().min(1, "Origin ID is required"),
  destination: z.string().min(1, "Destination country ID is required"),
  weight: z.number().int().positive("Weight must be positive").max(100000, "Weight exceeds limit"),
  couriers: z.array(z.string()).min(1, "At least one courier is required"),
});

export const blogPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().min(5, "Slug must be at least 5 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).default("DRAFT"),
  publishedAt: z.string().datetime().optional().nullable(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  tags: z.array(z.string()).default([]),
});
