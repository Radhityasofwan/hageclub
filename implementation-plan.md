# Implementation Plan
## HAGE CLUB E-Commerce Website

---

## Cara Membaca Dokumen Ini

Dokumen ini adalah **panduan prompting implementasi bertahap** menggunakan AI agent.

Setiap **Session** adalah satu sesi percakapan dengan AI agent. Setiap sesi dirancang untuk:
- Menghasilkan **5–15 file** yang koheren dan saling terkait
- Tidak mencampur concern yang berbeda (UI, logic, DB dalam satu sesi terpisah)
- Memberikan **konteks handoff** yang jelas ke sesi berikutnya
- Menjaga context window agent tetap fokus dan stabil

**Aturan prompting:**
- Selalu sertakan bagian `Konteks` di awal setiap prompt baru
- Lampirkan file output dari sesi sebelumnya yang relevan jika diminta
- Satu session = satu percakapan baru (jangan lanjut dari percakapan lama)
- Selesaikan dan verifikasi satu session sebelum lanjut ke session berikutnya

---

## Tech Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSG-first, kompatibel shared hosting via Passenger |
| Styling | Tailwind CSS | Utility-first, konsisten di seluruh codebase |
| Database | MySQL 8 | Standar cPanel shared hosting |
| ORM | Prisma | Type-safe, schema migration mudah |
| Auth | NextAuth.js (JWT strategy) | Stateless, tanpa session server |
| Payment & Shipping | RajaOngkir (full suite) | All-in-one: ongkir, AWB, pickup, tracking, VA, QRIS, E-wallet, notifikasi otomatis |
| QRIS Dinamis | QRISLY (via RajaOngkir) | Generate QRIS dinamis per transaksi dari QRIS statis |
| Email | Nodemailer + SMTP cPanel | Tanpa dependency external service |
| Image | Cloudinary (free tier) | CDN global, transformasi gambar tanpa server |
| State | Zustand | Lightweight, untuk cart & UI state |
| Validation | Zod | Runtime + type validation |
| Deployment | cPanel Node.js App (Passenger) | Shared hosting compatible |

### Constraint Utama (wajib dipatuhi setiap sesi)

```
- Next.js output: 'standalone' — entry point server.js untuk Phusion Passenger
- Build dilakukan di lokal, bukan di server (shared hosting tidak cukup resource)
- Tidak ada background worker / proses Node.js persisten (PM2 tidak tersedia)
- Scheduled task menggunakan cPanel Cron Job → memanggil HTTP endpoint internal
- Semua integrasi eksternal menggunakan webhook HTTP (RajaOngkir, dll)
- API routes berbasis Next.js Route Handler (App Router)
- Tidak ada edge runtime — gunakan nodejs runtime
- Prisma: binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
- DATABASE_URL harus mengandung ?connection_limit=3
- Semua env variable via .env.local (dev) / cPanel Environment Variables (prod)
- Production migration: prisma migrate deploy (bukan migrate dev)
```

---

## Struktur Direktori Target

```
hageclub/
├── app/
│   ├── (public)/              # Public website
│   │   ├── page.tsx           # Homepage
│   │   ├── shop/
│   │   ├── products/[slug]/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── blog/
│   │   ├── about/
│   │   ├── contact/
│   │   └── ...
│   ├── (auth)/                # Auth pages
│   │   ├── login/
│   │   ├── register/
│   │   └── ...
│   ├── account/               # Customer account
│   └── admin/                 # Admin CMS
│       ├── dashboard/
│       ├── products/
│       ├── orders/
│       └── ...
├── api/
│   ├── auth/
│   ├── products/
│   ├── orders/
│   ├── payments/
│   ├── shipping/
│   └── ...
├── components/
│   ├── ui/                    # Base UI components
│   ├── layout/                # Header, Footer, etc.
│   ├── product/               # Product-specific components
│   ├── cart/
│   ├── checkout/
│   ├── blog/
│   └── admin/
├── lib/
│   ├── db.ts                  # Prisma client
│   ├── auth.ts                # NextAuth config
│   ├── rajaongkir.ts          # Ongkir + AWB + Tracking + Payment + QRISLY
│   ├── cloudinary.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── hooks/                     # Custom React hooks
├── stores/                    # Zustand stores
├── types/                     # TypeScript types
└── public/
```

---

## Ringkasan Database Schema

```
User
  ├── Profile (1:1)
  ├── Address[] (1:N)
  ├── Order[] (1:N)
  └── Wishlist[] (1:N)

Product
  ├── Category (N:1)
  ├── ProductImage[] (1:N)
  ├── ProductVariant[] (1:N)
  └── Tag[] (N:N)

Order
  ├── User (N:1) / Guest
  ├── OrderItem[] (1:N)
  ├── Address (snapshot)
  └── Payment (1:1)

Blog
  ├── Author → User (N:1)
  ├── Category (N:1)
  └── Tag[] (N:N)

Coupon
  └── CouponUsage[] (1:N)
```

---

## Peta Phase & Session

| Phase | Nama | Sessions | Fokus |
|---|---|---|---|
| 0 | Foundation | 3 | Setup project, DB schema, env |
| 1 | Design System | 2 | Base UI, layout, typography |
| 2 | Product Catalog | 3 | PLP, PDP, navigasi |
| 3 | Cart & Checkout | 3 | Cart state, checkout form, ongkir |
| 4 | Payment & Order | 2 | RajaOngkir Payment, order creation, webhook |
| 5 | Customer Account | 2 | Auth, profile, order history |
| 6 | Admin Core | 4 | Login admin, dashboard, produk |
| 7 | Admin Extended | 3 | Orders, customers, coupons |
| 8 | Blog & Static | 3 | Blog, pages statis, FAQ |
| 9 | Admin Content | 2 | Blog CMS, media, SEO tools |
| 10 | SEO & Schema | 2 | Metadata, JSON-LD, sitemap |
| 11 | Analytics | 2 | GA4, Meta Pixel, event tracking |
| 12 | QA & Deploy | 2 | Testing, deployment cPanel |

**Total: 33 sessions**

---

---

# PHASE 0 — Foundation

> Membangun fondasi teknis yang stabil. Output phase ini menjadi acuan semua phase berikutnya.

---

## Session 0.1 — Project Initialization

**Tujuan:** Inisialisasi project Next.js dengan konfigurasi lengkap.

**Output yang diharapkan:**
```
package.json
next.config.ts          (wajib: output: 'standalone', images.remotePatterns Cloudinary)
tailwind.config.ts
tsconfig.json
.env.example
.eslintrc.json
.gitignore
app/layout.tsx          (root layout, font setup)
app/globals.css         (Tailwind directives, CSS variables)
lib/utils.ts            (cn() helper, formatter utils)
types/index.ts          (global type definitions)
```

**Template Prompt:**
```
Saya sedang membangun website e-commerce bernama HAGE CLUB menggunakan Next.js 14
(App Router), Tailwind CSS, TypeScript, Prisma, dan MySQL.

Website ini akan di-deploy di shared hosting cPanel via Phusion Passenger.
Constraint wajib:
- Tidak ada edge runtime, gunakan nodejs runtime
- Tidak ada background worker / proses Node.js yang berjalan terus-menerus
- API menggunakan Next.js Route Handler

Tugas session ini:
1. Inisialisasi project Next.js 14 dengan App Router dan TypeScript
2. Konfigurasi Tailwind CSS dengan warna brand HAGE CLUB:
   - Primary: #1C1C1E (hitam)
   - Background: #FFFFFF (putih)
   - Accent: #F5F5F5 (abu terang)
   - Font: Inter (sans-serif utama)
3. Setup tsconfig.json dengan path aliases (@/components, @/lib, dll)
4. Buat file .env.example dengan seluruh environment variable yang akan dibutuhkan
5. Buat lib/utils.ts dengan fungsi cn() (clsx + tailwind-merge), formatPrice(), formatDate()
6. Buat types/index.ts sebagai pusat definisi type global

Konfigurasi next.config.ts wajib menyertakan:
- output: 'standalone' — agar Next.js menghasilkan folder .next/standalone/
  yang bisa dijalankan via `node server.js`, kompatibel dengan Phusion Passenger
- images.remotePatterns untuk Cloudinary
- Tidak ada experimental.runtime atau edge config

Catatan deployment Phusion Passenger:
- Entry point aplikasi adalah .next/standalone/server.js
- Di cPanel Node.js Application, Application Startup File diisi: server.js
- Build dilakukan di lokal, kemudian folder .next/standalone/ + public/ diupload ke server
- Jangan build di server (shared hosting tidak cukup resource untuk build Next.js)

Jangan buat halaman atau komponen UI dulu. Fokus pada konfigurasi dan fondasi.
```

---

## Session 0.2 — Database Schema

**Tujuan:** Mendefinisikan seluruh schema Prisma dan menjalankan migrasi awal.

**Konteks dari session sebelumnya:** Project Next.js sudah terinisialisasi dengan Tailwind dan TypeScript.

**Output yang diharapkan:**
```
prisma/schema.prisma    (seluruh model)
prisma/seed.ts          (data seeder: kategori, admin user)
lib/db.ts               (Prisma client singleton)
```

**Model yang harus dibuat di schema.prisma:**

```
User, Profile, Address
Product, ProductImage, ProductVariant
Category, Tag, ProductTag
Order, OrderItem, OrderStatusHistory
Payment
Coupon, CouponUsage
Wishlist
BlogPost, BlogCategory, BlogTag
Media
SeoSetting
AdminLog
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB dengan Next.js 14 dan Prisma + MySQL.

Tugas session ini adalah membuat seluruh database schema di prisma/schema.prisma.

Berikut kebutuhan data berdasarkan PRD:

PRODUK:
- Product: id, name, slug, sku, shortDescription, fullDescription, price, salePrice,
  weight, width, height, length, status (DRAFT/PUBLISHED/ARCHIVED), stock, featured,
  categoryId, createdAt, updatedAt
- ProductImage: id, productId, url, alt, sortOrder, isCover
- ProductVariant: id, productId, name, sku, price, stock, attributes (JSON)
- Category: id, name, slug, parentId (self-relation), banner, description, seoTitle,
  seoDescription, sortOrder
- Tag: id, name, slug

PENGGUNA:
- User: id, email, passwordHash, role (CUSTOMER/ADMIN/EDITOR/CS), createdAt
- Profile: id, userId, firstName, lastName, phone
- Address: id, userId, label, recipientName, phone, street, city, province,
  postalCode, isDefault

ORDER:
- Order: id, orderNumber, userId (nullable untuk guest), guestEmail, guestPhone,
  guestName, status (PENDING/PAID/PROCESSING/PACKED/SHIPPED/DELIVERED/COMPLETED/
  CANCELLED/REFUNDED), subtotal, discount, shippingCost, total, note,
  shippingAddress (JSON snapshot), courier, courierService, trackingNumber,
  couponId, createdAt, updatedAt
- OrderItem: id, orderId, productId, variantId, name, sku, price, quantity, subtotal,
  imageUrl
- OrderStatusHistory: id, orderId, status, note, createdAt, createdBy

PEMBAYARAN:
- Payment: id, orderId, method, status, amount, transactionId, paymentToken,
  paymentUrl, vaNumber, paidAt, payload (JSON), createdAt
  (paymentToken menyimpan ID atau token dari RajaOngkir, vaNumber untuk pembayaran VA)

KUPON:
- Coupon: id, code, type (PERCENTAGE/FIXED/FREE_SHIPPING), value, minPurchase,
  maxDiscount, usageLimit, usedCount, startDate, endDate, isActive,
  applicableCategory (nullable), applicableProduct (nullable)
- CouponUsage: id, couponId, orderId, userId (nullable), usedAt

WISHLIST:
- Wishlist: id, userId, productId, createdAt

BLOG:
- BlogPost: id, title, slug, content, excerpt, featuredImage, authorId, categoryId,
  status (DRAFT/PUBLISHED/SCHEDULED), publishedAt, seoTitle, seoDescription,
  seoKeywords, readingTime, createdAt, updatedAt
- BlogCategory: id, name, slug, description
- BlogTag: id, name, slug

MEDIA:
- Media: id, url, filename, mimeType, size, alt, folder, uploadedBy, createdAt

SEO:
- SeoSetting: id, page, seoTitle, metaDescription, ogImage, canonicalUrl,
  robots, structuredData (JSON), createdAt, updatedAt

LOG:
- AdminLog: id, userId, action, target, targetId, payload (JSON), ip, createdAt

Constraint:
- Gunakan @id @default(cuid()) untuk semua id
- Gunakan @updatedAt untuk semua updatedAt
- Tambahkan index pada slug, email, orderNumber, status
- Buat relasi yang lengkap dan konsisten
- Semua field JSON → gunakan tipe Json di Prisma (MySQL: JSON column)
- Tidak ada tipe Json[] (array of JSON) — MySQL tidak mendukung, gunakan relasi terpisah

Konfigurasi Prisma wajib:
- Di blok generator client, tambahkan:
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
  (native untuk development lokal, linux-musl untuk server shared hosting Linux)
- Di blok datasource, gunakan:
  provider = "mysql"
  url = env("DATABASE_URL")
  relationMode = "prisma"  (jika MySQL versi lama tidak support foreign key enforcement)

Setelah schema, buat juga:
1. lib/db.ts — Prisma client singleton yang aman untuk Next.js
   Gunakan global singleton pattern untuk mencegah multiple connections di development.
   DATABASE_URL harus menyertakan ?connection_limit=3 untuk shared hosting:
   Contoh: mysql://user:pass@localhost:3306/dbname?connection_limit=3
2. prisma/seed.ts — seeder untuk: 1 super admin user, 4 kategori awal
   (Polo, Hoodie, Jacket, Accessories), 2 blog category (Otomotif, Lifestyle)
```

---

## Session 0.3 — API Layer Foundation

**Tujuan:** Membuat struktur API Route Handler dan helper yang akan digunakan semua modul.

**Konteks dari session sebelumnya:** Schema Prisma sudah selesai dan bisa di-query.

**Output yang diharapkan:**
```
lib/auth.ts             (NextAuth config, session type)
lib/api-response.ts     (standardized API response helper)
lib/validation.ts       (Zod schemas yang akan dipakai semua modul)
lib/cloudinary.ts       (upload helper)
lib/rajaongkir.ts       (RajaOngkir full-suite: ongkir, AWB, tracking, payment, QRISLY)
lib/email.ts            (Nodemailer wrapper, template dasar)
middleware.ts           (route protection: admin, auth)
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, App Router, Prisma, MySQL).
Project sudah memiliki schema database lengkap.

Tugas session ini adalah membangun API infrastructure layer.

1. lib/auth.ts
   Konfigurasi NextAuth.js dengan:
   - JWT strategy (bukan database sessions)
   - Credentials provider (email + password dengan bcrypt)
   - Session type extension untuk menyertakan: id, role, name
   - Callback untuk menyertakan role ke JWT token
   - Secret dari env NEXTAUTH_SECRET

2. lib/api-response.ts
   Helper untuk standarisasi response API:
   - success(data, message?, status?) → NextResponse JSON
   - error(message, status?, errors?) → NextResponse JSON
   Format: { success: boolean, data?, message?, errors? }

3. lib/validation.ts
   Zod schemas untuk:
   - registerSchema (name, email, password, phone)
   - loginSchema (email, password)
   - productSchema (semua field product)
   - orderSchema (alamat, kurir, coupon)
   - checkoutSchema (customer info + address)

4. lib/cloudinary.ts
   - uploadImage(file: Buffer, folder: string): Promise<{url, publicId}>
   - deleteImage(publicId: string): Promise<void>
   - Gunakan Cloudinary SDK v2

5. lib/rajaongkir.ts
   File ini mencakup SELURUH layanan RajaOngkir dalam satu wrapper.
   Gunakan RAJAONGKIR_API_KEY dari env untuk semua endpoint.

   -- SHIPPING (Cek Ongkir) --
   - getProvinces(): Promise<Province[]>
   - getCities(provinceId?): Promise<City[]>
   - getCost(origin, destination, weight, couriers[]): Promise<CourierCost[]>

   -- SHIPPING DELIVERY (AWB & Pickup) --
   - createAWB(orderData): Promise<{ awbNumber, label }>
     Buat AWB/resi pengiriman secara otomatis
   - requestPickup(awbNumber, pickupTime?): Promise<PickupResult>
     Request pickup ke kurir
   - printLabel(awbNumber): Promise<{ labelUrl }>
     Ambil URL label pengiriman untuk dicetak
   - trackPackage(awbNumber, courier): Promise<TrackingResult>
     Lacak status paket menggunakan AWB

   -- PAYMENT SERVICE (VA, E-wallet, QRIS) --
   - createPayment(order: PaymentRequest): Promise<PaymentResponse>
     Buat transaksi pembayaran, return { paymentId, paymentUrl, vaNumber?,
     qrisUrl?, expiresAt }
   - getPaymentStatus(paymentId): Promise<PaymentStatus>
     Cek status pembayaran
   - verifyWebhookSignature(payload, signature): boolean
     Verifikasi signature dari notifikasi webhook RajaOngkir

   -- QRISLY (QRIS Dinamis) --
   - generateDynamicQRIS(staticQrisId, amount, externalId): Promise<{ qrisData, qrisUrl }>
     Konversi QRIS statis menjadi QRIS dinamis per transaksi
     (embed nominal dan reference unik ke dalam QRIS)

   Type definitions yang perlu dibuat:
   - Province, City, CourierCost, CourierService
   - AWBData, PickupResult, TrackingResult, TrackingHistory
   - PaymentRequest, PaymentResponse, PaymentStatus, PaymentMethod
   - QRISResponse

6. lib/email.ts
   - sendEmail(to, subject, html): Promise<void>
   - Template: orderConfirmation(order), resetPassword(token),
     orderShipped(order, trackingNumber)
   - Gunakan SMTP dari env: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

8. middleware.ts
   Route protection:
   - /admin/* → hanya USER dengan role ADMIN, EDITOR, CS
   - /account/* → hanya USER yang sudah login
   - /api/admin/* → hanya role ADMIN
   Redirect ke /login jika tidak authorized

Semua env variable menggunakan process.env dengan validasi eksistensi.
Jangan buat halaman UI. Fokus pada infrastruktur dan layer library.

Catatan shared hosting untuk lib/db.ts:
- Gunakan pattern global singleton agar Prisma tidak membuka koneksi baru di setiap hot reload
- DATABASE_URL harus mengandung ?connection_limit=3 (shared hosting membatasi koneksi DB)
- Prisma tidak support connection pooling bawaan di shared hosting, jadi connection_limit
  sangat penting untuk mencegah "Too many connections" error
```

---

---

# PHASE 1 — Design System & Layout

> Membangun komponen UI dasar dan layout global yang menjadi "bahasa visual" konsisten di seluruh website.

---

## Session 1.1 — Base UI Components

**Tujuan:** Membuat komponen UI primitif yang akan dipakai semua halaman.

**Output yang diharapkan:**
```
components/ui/button.tsx
components/ui/input.tsx
components/ui/badge.tsx
components/ui/skeleton.tsx
components/ui/toast.tsx
components/ui/modal.tsx
components/ui/select.tsx
components/ui/textarea.tsx
components/ui/spinner.tsx
components/ui/image.tsx     (Next/Image wrapper dengan fallback)
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, Tailwind CSS).
Brand colors: primary #1C1C1E, background #FFFFFF, accent #F5F5F5.
Font: Inter. Visual: minimalis, premium, monokrom.

Tugas session ini: buat komponen UI dasar (design system primitives).

Panduan visual yang harus diikuti:
- Tidak ada border-radius besar (max rounded-sm atau rounded)
- Tombol: solid hitam (#1C1C1E) untuk primary, outline untuk secondary
- Tidak ada shadow berlebihan
- Spacing konsisten menggunakan Tailwind spacing scale
- Semua komponen harus mendukung dark mode via Tailwind dark: prefix

Komponen yang harus dibuat:

1. Button: variant (primary, secondary, ghost, danger), size (sm, md, lg),
   loading state, disabled state, icon support (leading/trailing)

2. Input: label, placeholder, error state, helper text, icon prefix/suffix,
   disabled state. Full width by default.

3. Select: options array, label, error state, disabled, placeholder

4. Textarea: label, error state, rows, maxLength indicator

5. Badge: variant (default, success, warning, danger, info), size (sm, md)

6. Skeleton: untuk loading state. Variants: text, block, circle

7. Spinner: size (sm, md, lg), color variants

8. Modal: title, body, footer actions, close button, backdrop click close,
   accessible (trap focus, esc to close)

9. Toast: variant (success, error, warning, info), auto-dismiss, position (top-right)
   Buat juga useToast hook untuk memanggil toast dari mana saja.

10. Image wrapper (components/ui/image.tsx):
    Wrapper Next/Image dengan: fallback ke placeholder, blur placeholder,
    aspect ratio support

Semua komponen harus:
- Menggunakan TypeScript dengan interface props yang lengkap
- Forward ref untuk komponen form
- Tidak ada dependency UI library eksternal (shadcn, headlessui boleh digunakan
  untuk accessibility primitives seperti Dialog)
```

---

## Session 1.2 — Layout Global

**Tujuan:** Membuat layout utama website: Header, Footer, dan struktur halaman.

**Output yang diharapkan:**
```
components/layout/header.tsx
components/layout/footer.tsx
components/layout/nav-menu.tsx
components/layout/mobile-drawer.tsx
components/layout/announcement-bar.tsx
components/layout/breadcrumb.tsx
app/(public)/layout.tsx
stores/cart-store.ts        (cart state dengan Zustand)
stores/ui-store.ts          (drawer, modal state)
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, Tailwind CSS).
Brand: premium automotive lifestyle, warna hitam #1C1C1E dan putih #FFFFFF.
Design system (Button, Input, dll) sudah tersedia di components/ui/.

Tugas session ini: buat layout global website.

1. components/layout/announcement-bar.tsx
   - Bar tipis di atas header
   - Konten: "Free shipping for orders above Rp500.000" (bisa diganti via CMS nanti)
   - Bisa di-dismiss
   - Background hitam, teks putih

2. components/layout/header.tsx
   - Sticky (fixed top-0, z-50)
   - Logo kiri: "HAGE CLUB" (text logo, bold)
   - Navigation tengah (desktop): Shop, Blog, About, Contact
   - Ikon kanan: Search, Wishlist, Cart (dengan badge count), Account
   - Transparent saat di top homepage, solid hitam saat scroll atau di halaman lain
   - Mobile: tampilkan hamburger icon → buka drawer

3. components/layout/nav-menu.tsx
   - Dropdown sederhana untuk kategori Shop:
     Polo, Hoodie, Jacket, Accessories, Sale
   - Muncul saat hover (desktop)

4. components/layout/mobile-drawer.tsx
   - Slide dari kiri
   - Menu lengkap: Shop (dengan sub-menu), Blog, About, Contact
   - Login/Account link di bawah
   - Close button

5. components/layout/footer.tsx
   - 4 kolom: Brand (logo + tagline), Shop (links), Info (links), Connect (sosmed)
   - Copyright
   - Background: #1C1C1E, teks putih

6. components/layout/breadcrumb.tsx
   - Terima array {label, href}[]
   - Separator dengan "/" atau ">"
   - Item terakhir tidak clickable

7. app/(public)/layout.tsx
   - Wrapper dengan Header + Footer
   - Sertakan AnnouncementBar

8. stores/cart-store.ts (Zustand)
   - State: items: CartItem[], isOpen: boolean
   - Actions: addItem, removeItem, updateQuantity, clearCart, toggleCart
   - CartItem: productId, variantId, name, price, quantity, imageUrl, sku
   - Persist ke localStorage
   - Computed: totalItems, totalPrice

9. stores/ui-store.ts (Zustand)
   - State: mobileMenuOpen, searchOpen
   - Actions: toggle masing-masing

Constraint:
- Header harus sticky dan selalu terlihat
- Cart icon selalu menampilkan jumlah item
- Semua link navigasi menggunakan next/link
```

---

---

# PHASE 2 — Product Catalog

> Membangun halaman catalog produk yang menjadi inti pengalaman belanja.

---

## Session 2.1 — Product API & Data Layer

**Tujuan:** Membuat semua API endpoint dan data fetching untuk produk.

**Output yang diharapkan:**
```
app/api/products/route.ts           (GET list, POST create)
app/api/products/[slug]/route.ts    (GET by slug)
app/api/categories/route.ts         (GET all categories)
app/api/search/route.ts             (GET search)
lib/queries/product.ts              (reusable Prisma queries)
types/product.ts                    (Product types)
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, App Router, Prisma, MySQL).
Schema database sudah selesai. Prisma client ada di lib/db.ts.
Standar API response ada di lib/api-response.ts (success(), error()).

Tugas session ini: buat API layer untuk modul produk.

1. lib/queries/product.ts
   Fungsi Prisma yang reusable:
   - getProducts(filters): ambil produk dengan filter kategori, harga, ukuran,
     warna, sort, pagination. Kembalikan {data, total, page, totalPages}
   - getProductBySlug(slug): ambil produk dengan semua relasi (images, variants,
     category)
   - getFeaturedProducts(): ambil produk featured, max 8
   - getBestSellers(): berdasarkan total sold, max 8
   - getNewArrivals(): berdasarkan createdAt DESC, max 8
   - getRelatedProducts(productId, categoryId): max 4, exclude product ini
   - searchProducts(query): full-text search di name, description

2. app/api/products/route.ts
   GET: endpoint public untuk list produk
   Query params: category, size, color, minPrice, maxPrice, sort, page, limit
   Response: { products, total, page, totalPages }

3. app/api/products/[slug]/route.ts
   GET: endpoint public untuk detail produk berdasarkan slug
   Include: images, variants, category
   Response: full product object

4. app/api/categories/route.ts
   GET: semua kategori aktif dengan nested children
   Response: tree structure kategori

5. app/api/search/route.ts
   GET ?q=keyword
   Cari di: product name, product description, product SKU
   Return max 10 hasil dengan image thumbnail

6. types/product.ts
   TypeScript types:
   - Product (full dengan relasi)
   - ProductSummary (untuk listing, tanpa content panjang)
   - ProductVariant
   - ProductImage
   - Category (dengan children)
   - ProductFilters (untuk query params)

Semua query harus menggunakan SELECT fields yang spesifik (jangan select(*)).
Tambahkan error handling yang proper.
```

---

## Session 2.2 — Product Listing Page

**Tujuan:** Membangun halaman daftar produk (PLP) lengkap dengan filter dan sorting.

**Output yang diharapkan:**
```
app/(public)/shop/page.tsx
app/(public)/shop/[category]/page.tsx
components/product/product-card.tsx
components/product/product-grid.tsx
components/product/product-filter.tsx
components/product/product-sort.tsx
components/product/pagination.tsx
components/product/filter-drawer.tsx   (mobile)
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, App Router, Tailwind CSS).
API produk tersedia di /api/products dan /api/categories.
Design system ada di components/ui/ (Button, Badge, Skeleton, dll).
Layout global (Header, Footer) ada di components/layout/.

Tugas session ini: buat Product Listing Page (PLP).

1. components/product/product-card.tsx
   - Gambar produk (rasio 3:4 portrait)
   - Hover: tampilkan gambar kedua (smooth transition)
   - Product name, price, sale price (dengan strikethrough)
   - Badge: NEW, SALE, OUT OF STOCK
   - Wishlist toggle icon di pojok kanan atas
   - Quick Add button muncul saat hover (jika produk tidak punya variant)
   - Link ke halaman product detail
   - Skeleton loading state

2. components/product/product-grid.tsx
   - Grid responsive: 2 kolom mobile, 3 kolom tablet, 4 kolom desktop
   - Terima products array
   - Loading skeleton saat fetching

3. components/product/product-filter.tsx (desktop sidebar)
   - Filter kategori (checkbox)
   - Filter ukuran: XS, S, M, L, XL, XXL (checkbox)
   - Filter warna (visual swatch)
   - Filter harga (range slider atau min-max input)
   - Availability (in stock only)
   - Clear filters button
   - Active filter count badge

4. components/product/filter-drawer.tsx (mobile)
   - Semua filter yang sama tapi dalam drawer slide-up
   - Apply dan Reset button

5. components/product/product-sort.tsx
   - Select dropdown: Newest, Best Selling, Price: Low to High, Price: High to Low

6. components/product/pagination.tsx
   - Prev, number pages, Next
   - Hanya tampilkan 5 nomor halaman (dengan ellipsis)

7. app/(public)/shop/page.tsx
   - Header: "Shop" + product count
   - Layout: filter sidebar kiri + product grid kanan (desktop)
   - Mobile: filter drawer toggle
   - Filter dan sort berjalan client-side (bukan page reload)
   - URL search params update saat filter berubah (untuk shareable URL)

8. app/(public)/shop/[category]/page.tsx
   - Sama dengan shop/page.tsx tapi pre-filter berdasarkan kategori
   - Category banner di atas (jika ada)
   - Breadcrumb: Home > Shop > [Category Name]
   - generateStaticParams untuk semua kategori (SSG)

Semua data fetching menggunakan fetch() di server component.
Filter dan sort state di client component menggunakan useSearchParams.
```

---

## Session 2.3 — Product Detail Page

**Tujuan:** Membangun halaman detail produk (PDP) — halaman konversi utama.

**Output yang diharapkan:**
```
app/(public)/products/[slug]/page.tsx
components/product/product-gallery.tsx
components/product/product-info.tsx
components/product/variant-selector.tsx
components/product/shipping-estimator.tsx
components/product/size-guide.tsx
components/product/related-products.tsx
components/product/recently-viewed.tsx
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, App Router, Tailwind CSS).
Cart state ada di stores/cart-store.ts (Zustand, dengan addItem action).
API produk ada di /api/products/[slug].
Design system dan layout sudah tersedia.

Tugas session ini: buat Product Detail Page (PDP).

1. components/product/product-gallery.tsx
   - Main image besar di atas
   - Thumbnail strip di bawah (horizontal scroll mobile)
   - Click thumbnail → update main image
   - Zoom on hover (desktop): cursor zoom-in, magnified view
   - Swipe gesture support (mobile)

2. components/product/variant-selector.tsx
   - Grouping by attribute name (Size, Color, dll)
   - Size: tombol grid (XS S M L XL XXL)
   - Color: visual swatch (kotak warna)
   - State: selected variant
   - Disabled style untuk variant yang out of stock
   - Emit onChange(variant) ke parent

3. components/product/shipping-estimator.tsx
   - Input kota tujuan (province → city cascade)
   - Pilih kurir: JNE, TIKI, POS, Sicepat, Anteraja
   - Tampilkan daftar layanan + estimasi + harga setelah submit
   - Gunakan /api/shipping/cost

4. components/product/size-guide.tsx
   - Modal/dialog berisi tabel ukuran
   - Kolom: ukuran, chest, length, shoulder
   - Trigger button "Size Guide"

5. components/product/related-products.tsx
   - Judul "You May Also Like"
   - Horizontal scroll di mobile, grid di desktop
   - Gunakan ProductCard yang sudah ada

6. components/product/recently-viewed.tsx
   - Simpan di localStorage (max 8 item)
   - Tampilkan di bawah related products
   - Judul "Recently Viewed"

7. app/(public)/products/[slug]/page.tsx
   Layout:
   - Desktop: Gallery (kiri 55%) | Info (kanan 45%)
   - Mobile: Gallery atas, Info bawah

   Info section berisi:
   - Category badge (link ke PLP)
   - Product name (H1)
   - Price (dan sale price jika ada)
   - Short description
   - VariantSelector
   - Stock status (In Stock / Out of Stock / X remaining)
   - Quantity input (1–10)
   - Tombol "Add to Cart" (primary) dan "Buy Now" (secondary)
   - Shipping Estimator
   - Size Guide trigger

   Section bawah (tab atau accordion):
   - Description (full HTML)
   - Specification
   - Shipping Policy

   - RelatedProducts
   - RecentlyViewed

   UX Rules (wajib):
   - Variant harus dipilih sebelum Add to Cart; tampilkan error jika belum
   - Add to Cart disabled jika out of stock
   - Perubahan variant update stok & harga secara real-time
   - Setelah Add to Cart berhasil: tampilkan toast "Added to cart" + open mini cart

   SEO:
   - generateMetadata() dengan title, description, og:image dari product
   - generateStaticParams() untuk semua slug produk (SSG)
   - Product JSON-LD schema

Constraint:
- Halaman ini adalah priority tertinggi untuk performa
- Gambar menggunakan Next/Image dengan priority={true} untuk main image
```

---

---

# PHASE 3 — Cart & Checkout

---

## Session 3.1 — Cart

**Tujuan:** Membangun halaman cart dan mini cart.

**Output yang diharapkan:**
```
app/(public)/cart/page.tsx
components/cart/cart-item.tsx
components/cart/cart-summary.tsx
components/cart/mini-cart.tsx
components/cart/coupon-input.tsx
app/api/coupons/validate/route.ts
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, Tailwind CSS).
Cart state ada di stores/cart-store.ts (Zustand):
- items: CartItem[] dengan field: productId, variantId, name, price, quantity,
  imageUrl, sku, weight
- actions: addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice
Design system ada di components/ui/.

Tugas session ini: buat Cart page dan Mini Cart.

1. components/cart/cart-item.tsx
   - Gambar produk thumbnail (kiri)
   - Info: name, variant, SKU, harga satuan
   - Quantity control: minus, input, plus (dengan validasi min 1, max stok)
   - Subtotal kanan
   - Remove button (icon trash)
   - Loading state saat update quantity

2. components/cart/coupon-input.tsx
   - Input kode kupon
   - Apply button
   - Tampilkan diskon jika valid
   - Error message jika invalid
   - Remove coupon button
   - Panggil /api/coupons/validate

3. components/cart/cart-summary.tsx
   - Subtotal
   - Diskon (jika ada kupon)
   - Estimasi ongkir (teks "calculated at checkout")
   - Total
   - Tombol "Proceed to Checkout" (primary, full width)
   - Note: "Free shipping for orders above Rp500.000"

4. app/(public)/cart/page.tsx
   - Dua kolom: Cart Items kiri (2/3), Summary kanan (1/3)
   - Mobile: single column (items atas, summary bawah)
   - Empty cart state: ilustrasi + "Your cart is empty" + CTA Shop Now
   - CouponInput
   - CartItem list
   - CartSummary

5. components/cart/mini-cart.tsx
   - Slide dari kanan (drawer)
   - Daftar CartItem compact (gambar + nama + harga + quantity control)
   - Total di bawah
   - "View Cart" dan "Checkout" button
   - Trigger dari cart icon di header

6. app/api/coupons/validate/route.ts
   POST { code, subtotal }
   - Cek apakah kupon exists, aktif, belum expired
   - Cek minimum purchase
   - Cek usage limit
   - Hitung nilai diskon berdasarkan tipe (PERCENTAGE/FIXED/FREE_SHIPPING)
   - Response: { valid, discount, type, message }

UX Rules:
- Jangan paksa login untuk lihat cart
- Quantity update dengan debounce 500ms
- Hapus item dengan konfirmasi singkat
```

---

## Session 3.2 — Checkout Form

**Tujuan:** Membangun halaman checkout dengan form dan integrasi RajaOngkir.

**Output yang diharapkan:**
```
app/(public)/checkout/page.tsx
components/checkout/customer-form.tsx
components/checkout/address-form.tsx
components/checkout/shipping-selector.tsx
components/checkout/order-summary.tsx
app/api/shipping/provinces/route.ts
app/api/shipping/cities/route.ts
app/api/shipping/cost/route.ts
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, Tailwind CSS).
Cart state ada di stores/cart-store.ts.
RajaOngkir wrapper ada di lib/rajaongkir.ts (getCities, getProvinces, getCost).
Design system ada di components/ui/.

Tugas session ini: buat halaman Checkout.

Design principle: ONE PAGE CHECKOUT — semua section dalam satu halaman,
bukan multi-step. Layout: form kiri, summary kanan.

1. components/checkout/customer-form.tsx
   Fields:
   - Nama lengkap (required)
   - Email (required, validasi format)
   - Nomor HP (required, validasi format Indonesia)
   Jika user sudah login: pre-fill dari profile
   Jika guest: tampilkan form kosong

2. components/checkout/address-form.tsx
   Fields:
   - Provinsi (Select — dari /api/shipping/provinces)
   - Kota/Kabupaten (Select — dari /api/shipping/cities?province={id})
   - Kecamatan (text input)
   - Alamat lengkap (textarea)
   - Kode pos (input, 5 digit)
   Jika user login dan punya saved address: tampilkan pilihan address tersimpan
   dengan opsi "Use this address" atau "+ Add new address"

3. components/checkout/shipping-selector.tsx
   - Kurir yang tersedia: JNE, TIKI, SICEPAT, ANTERAJA
   - Setelah alamat lengkap diisi → otomatis load opsi kurir
   - Tampilkan: nama layanan, estimasi hari, harga
   - Loading skeleton saat fetch
   - Panggil /api/shipping/cost dengan berat total cart

4. components/checkout/order-summary.tsx
   - List produk (compact: image, name, qty, subtotal)
   - Subtotal
   - Diskon kupon (jika ada)
   - Ongkir (setelah kurir dipilih)
   - Total

5. app/(public)/checkout/page.tsx
   Layout sections (dari atas ke bawah):
   - CustomerForm
   - AddressForm
   - ShippingSelector (enabled setelah address lengkap)
   - Payment methods: Virtual Account, QRIS, E-Wallet (radio buttons)
   - OrderSummary (sticky di kanan pada desktop)
   - Tombol "Place Order" di bawah
   - Notes optional textarea
   Validasi keseluruhan form dengan Zod sebelum submit

6. API Routes:
   GET /api/shipping/provinces → getCached provinces dari RajaOngkir
   GET /api/shipping/cities?province={id} → cities berdasarkan province
   POST /api/shipping/cost { origin, destination, weight, couriers[] }
     → getCost dari RajaOngkir untuk semua kurir sekaligus

   Note: Cache provinces dan cities (revalidate setiap 24 jam) karena data
   ini jarang berubah.

UX Rules:
- Shipping selector hanya aktif setelah provinsi dan kota diisi
- Total update real-time saat kurir dipilih
- Tombol Place Order disabled jika ada field yang belum valid
- Simpan checkout state di sessionStorage untuk recovery jika page refresh
```

---

## Session 3.3 — Order Creation

**Tujuan:** Membangun logic pembuatan order saat checkout di-submit.

**Output yang diharapkan:**
```
app/api/orders/route.ts             (POST create order)
app/api/orders/[id]/route.ts        (GET order detail)
app/api/orders/[id]/status/route.ts (GET order status + tracking)
lib/queries/order.ts                (Prisma queries untuk order)
types/order.ts                      (Order types)
app/(public)/checkout/success/page.tsx
app/(public)/track-order/page.tsx
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, App Router, Prisma).
Schema Order, OrderItem, OrderStatusHistory sudah ada di Prisma.
RajaOngkir wrapper ada di lib/rajaongkir.ts (createPayment, generateDynamicQRIS).
Email wrapper ada di lib/email.ts.

Tugas session ini: buat order creation flow.

1. lib/queries/order.ts
   - createOrder(data): buat Order + OrderItems atomik dalam satu transaction
   - getOrderById(id): dengan semua relasi
   - getOrderByNumber(orderNumber): untuk tracking public
   - getUserOrders(userId, page): untuk order history customer
   - generateOrderNumber(): format HC-YYYYMMDD-XXXXX (random suffix)

2. app/api/orders/route.ts
   POST {
     customer: { name, email, phone },
     address: { province, city, district, street, postalCode },
     items: [{ productId, variantId, quantity }],
     couponCode?,
     courier: { name, service, cost },
     paymentMethod: 'VA' | 'QRIS' | 'EWALLET',
     notes?
   }

   Logic:
   a. Validasi semua input dengan Zod
   b. Lock dan validasi stok untuk setiap item (cek dalam satu transaction)
   c. Re-kalkulasi harga dari DB (jangan percaya harga dari client)
   d. Validasi dan apply kupon jika ada
   e. Buat Order + OrderItems dalam Prisma transaction
   f. Dekrement stok (reserved stock)
   g. Buat payment via RajaOngkir:
      - Jika VA atau EWALLET → rajaongkir.createPayment(order)
        return { paymentId, paymentUrl, vaNumber?, expiresAt }
      - Jika QRIS → rajaongkir.createPayment(order) lalu
        rajaongkir.generateDynamicQRIS(staticQrisId, total, orderNumber)
        return { paymentId, qrisUrl, qrisData, expiresAt }
      Simpan semua ke Payment record
   h. Kirim email konfirmasi order
   i. Response: { orderId, orderNumber, paymentMethod, paymentUrl?, vaNumber?,
      qrisUrl?, expiresAt }

3. app/api/orders/[id]/route.ts
   GET: ambil order detail (hanya milik user yang login atau guest dengan email match)

4. app/api/orders/[id]/status/route.ts
   GET: status order + tracking number

5. app/(public)/checkout/success/page.tsx
   Tampilkan berdasarkan paymentMethod:

   VA:
   - Nomor Virtual Account dan bank tujuan
   - Nominal yang harus dibayar
   - Batas waktu pembayaran
   - Instruksi singkat cara transfer

   QRIS:
   - Tampilkan QR Code (dari qrisUrl)
   - Nominal
   - Batas waktu
   - Tombol "Sudah Bayar? Cek Status"

   EWALLET:
   - Tombol "Bayar Sekarang" (redirect ke paymentUrl)

   Semua metode tampilkan:
   - Order number
   - Ringkasan order singkat
   - CTA: Track Order, Continue Shopping
   - Clear cart setelah halaman ini dimuat

6. app/(public)/track-order/page.tsx
   - Form: input order number + email
   - Submit → cari order yang cocok
   - Tampilkan: status timeline, item, estimasi
   - Tidak perlu login untuk track

Error handling:
- Stok habis saat checkout → response 409 dengan item yang conflict
- Kupon expired saat checkout → response 400 dengan pesan jelas
- RajaOngkir payment error → rollback order (atau set status FAILED), return error ke client
```

---

---

# PHASE 4 — Payment & Webhook

---

## Session 4.1 — RajaOngkir Payment Integration

**Tujuan:** Implementasi payment via RajaOngkir Payment Service (VA, E-wallet, QRIS) dan webhook notification handler.

**Output yang diharapkan:**
```
app/api/payments/webhook/route.ts           (RajaOngkir notifikasi otomatis)
app/api/payments/[orderId]/status/route.ts  (cek status pembayaran)
app/api/payments/[orderId]/refresh/route.ts (refresh payment jika expired)
components/checkout/payment-display.tsx     (tampilan instruksi bayar per metode)
components/checkout/qris-display.tsx        (tampilan QR Code + countdown)
components/checkout/va-display.tsx          (tampilan nomor VA + instruksi)
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14).
RajaOngkir wrapper ada di lib/rajaongkir.ts dengan fungsi:
- createPayment(order): Promise<PaymentResponse>
- getPaymentStatus(paymentId): Promise<PaymentStatus>
- verifyWebhookSignature(payload, signature): boolean
- generateDynamicQRIS(staticQrisId, amount, externalId): Promise<QRISResponse>
Order queries ada di lib/queries/order.ts.
Email wrapper ada di lib/email.ts.
Env: RAJAONGKIR_API_KEY, RAJAONGKIR_WEBHOOK_SECRET, RAJAONGKIR_STATIC_QRIS_ID

Tugas session ini: implementasi RajaOngkir payment integration.

1. app/api/payments/webhook/route.ts
   POST — endpoint untuk menerima notifikasi otomatis dari RajaOngkir

   Logic (ikuti urutan ini):
   a. Verifikasi signature dari header request menggunakan
      rajaongkir.verifyWebhookSignature(payload, signature)
      Tolak (return 400) jika signature tidak valid
   b. Extract dari payload: orderId/externalId, status, paymentMethod,
      paidAmount, paidAt, transactionId
   c. Mapping status RajaOngkir → status Order dan Payment:
      - 'SUCCESS' / 'SETTLEMENT' → PAID
      - 'PENDING' → PENDING (no state change)
      - 'FAILED' / 'CANCELLED' / 'EXPIRED' → CANCELLED (kembalikan stok)
      - 'REFUND' → REFUNDED
   d. Update Payment record: status, paidAt, transactionId, payload (JSON raw)
   e. Update Order status sesuai mapping
   f. Tambahkan OrderStatusHistory entry dengan note otomatis
   g. Jika PAID: kirim email konfirmasi pembayaran ke customer
   h. Jika CANCELLED/EXPIRED: kembalikan stok ke setiap item

   Endpoint ini harus SELALU return 200 OK (RajaOngkir akan retry jika tidak 200).
   Tangkap semua error internal dengan try/catch dan log ke console.
   Idempotent: cek apakah status sudah di-update sebelumnya, skip jika duplikat.

2. app/api/payments/[orderId]/status/route.ts
   GET — polling status pembayaran dari client
   - Ambil Payment record dari DB
   - Jika status masih PENDING dan belum expired: panggil
     rajaongkir.getPaymentStatus(paymentId) untuk sync status terbaru
   - Response: { status, paymentMethod, vaNumber?, qrisUrl?, expiresAt, paidAt? }

3. app/api/payments/[orderId]/refresh/route.ts
   POST — buat ulang payment jika sudah expired
   - Cek order masih PENDING dan payment sudah EXPIRED
   - Buat payment baru via rajaongkir.createPayment(order)
   - Update Payment record dengan data baru
   - Response: { paymentUrl?, vaNumber?, qrisUrl?, expiresAt }

4. components/checkout/va-display.tsx
   Tampilkan instruksi Virtual Account:
   - Bank dan logo bank (BCA, BNI, BRI, Mandiri, dll)
   - Nomor Virtual Account (dengan tombol copy)
   - Total yang harus dibayar
   - Countdown timer hingga expired
   - Accordion "Cara Bayar" per bank (ATM, Mobile Banking, Internet Banking)
   - Tombol "Cek Status Pembayaran" (polling /api/payments/[orderId]/status)
   - Auto-redirect ke /account/orders/[id] setelah polling confirm PAID

5. components/checkout/qris-display.tsx
   Tampilkan QRIS dinamis:
   - QR Code image dari qrisUrl (gunakan next/image atau img)
   - Nominal yang di-embed dalam QR
   - Countdown timer hingga expired (QRIS biasanya 15–30 menit)
   - Tombol "Download QR" dan "Salin Kode QRIS"
   - Catatan: gunakan aplikasi apapun yang support QRIS (GoPay, OVO, Dana,
     Shopee Pay, mobile banking, dll)
   - Polling status setiap 10 detik, auto-redirect jika PAID

6. components/checkout/payment-display.tsx
   Orchestrator component yang:
   - Terima { orderId, paymentMethod, paymentData } sebagai props
   - Render VA Display atau QRIS Display atau redirect ke paymentUrl (E-wallet)
   - Shared: order summary singkat di atas, tombol "Hubungi CS" di bawah

Constraint:
- Webhook endpoint dikecualikan dari auth middleware
- Selalu verifikasi signature, jangan proses payload tanpa verifikasi
- Idempotent: cek status sebelum update untuk mencegah double-update
- Polling dari client harus ada rate limit (minimal 5 detik antar request)
```

---

## Session 4.2 — Order Tracking & Email

**Tujuan:** Tracking otomatis dan sistem notifikasi email transaksional.

**Output yang diharapkan:**
```
app/api/orders/[id]/tracking/route.ts
components/order/order-timeline.tsx
components/order/order-status-badge.tsx
lib/email-templates.ts          (HTML email templates)
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14).
Email wrapper ada di lib/email.ts (sendEmail(to, subject, html)).
Order queries ada di lib/queries/order.ts.

Tugas session ini: order tracking dan email notifications.

1. components/order/order-status-badge.tsx
   Badge dengan warna per status:
   - PENDING: gray
   - PAID: blue
   - PROCESSING: yellow
   - PACKED: orange
   - SHIPPED: purple
   - DELIVERED: green
   - COMPLETED: green (dark)
   - CANCELLED: red
   - REFUNDED: red (light)

2. components/order/order-timeline.tsx
   Tampilkan OrderStatusHistory sebagai timeline vertikal:
   - Ikon bulat per status (filled jika sudah terlewati)
   - Label status
   - Timestamp
   - Note (jika ada)
   - Connecting line antar status

3. app/api/orders/[id]/tracking/route.ts
   GET:
   - Ambil order dengan status history
   - Jika ada AWB/tracking number: panggil rajaongkir.trackPackage(awbNumber, courier)
     untuk mendapatkan riwayat pengiriman real-time dari kurir
   - Response: { order, statusHistory, trackingHistory[], estimatedDelivery }

4. lib/email-templates.ts
   Fungsi yang return HTML string untuk:

   a. orderConfirmationEmail(order):
      - Header: Logo HAGE CLUB
      - "Thank you for your order"
      - Order number
      - Tabel item pesanan
      - Subtotal, ongkir, total
      - Alamat pengiriman
      - Info pembayaran
      - Footer dengan link track order

   b. paymentConfirmedEmail(order):
      - "Payment confirmed"
      - Order number dan total
      - Info estimasi pengiriman

   c. orderShippedEmail(order, trackingNumber):
      - "Your order is on the way"
      - Tracking number
      - Link tracking URL berdasarkan kurir
      - Estimated delivery

   d. passwordResetEmail(token, name):
      - Link reset password (expire 1 jam)

   Semua email harus:
   - Inline CSS (kompatibel semua email client)
   - Responsive (max-width 600px)
   - Warna HAGE CLUB (#1C1C1E)
   - Plain text fallback

Update lib/email.ts untuk menggunakan template dari lib/email-templates.ts.
```

---

---

# PHASE 5 — Customer Account

---

## Session 5.1 — Authentication

**Tujuan:** Implementasi lengkap auth customer: register, login, forgot password.

**Output yang diharapkan:**
```
app/(auth)/login/page.tsx
app/(auth)/register/page.tsx
app/(auth)/forgot-password/page.tsx
app/(auth)/reset-password/[token]/page.tsx
app/api/auth/[...nextauth]/route.ts
app/api/auth/register/route.ts
app/api/auth/forgot-password/route.ts
app/api/auth/reset-password/route.ts
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14).
NextAuth config ada di lib/auth.ts.
Email templates ada di lib/email-templates.ts.
Design system ada di components/ui/.
Validasi Zod ada di lib/validation.ts.

Tugas session ini: implementasi auth customer.

1. app/api/auth/[...nextauth]/route.ts
   — Standard NextAuth handler

2. app/api/auth/register/route.ts
   POST { name, email, password, phone }
   - Validasi dengan registerSchema
   - Cek email belum terdaftar
   - Hash password dengan bcrypt (12 rounds)
   - Buat User + Profile dalam transaction
   - Response: { message: 'Account created successfully' }

3. app/api/auth/forgot-password/route.ts
   POST { email }
   - Cek email terdaftar
   - Generate secure token (crypto.randomBytes(32).toString('hex'))
   - Simpan di DB: PasswordResetToken { token, userId, expiresAt (1 jam) }
   - Kirim email reset password
   - Response: selalu { message: 'If email exists, you will receive a link' }
   (jangan expose apakah email terdaftar atau tidak)

   Tambahkan model PasswordResetToken ke schema Prisma:
   id, token, userId, expiresAt, usedAt, createdAt

4. app/api/auth/reset-password/route.ts
   POST { token, password }
   - Cek token valid dan belum expired
   - Hash password baru
   - Update passwordHash di User
   - Mark token sebagai used
   - Response: { message: 'Password reset successful' }

5. Halaman Auth:

   app/(auth)/login/page.tsx
   - Form: email + password
   - Remember me checkbox
   - "Forgot password?" link
   - Submit → signIn('credentials', ...)
   - Error handling dari NextAuth
   - "Don't have account? Register" link
   - Redirect ke /account setelah login (atau ke ?callbackUrl)

   app/(auth)/register/page.tsx
   - Form: nama, email, phone, password, confirm password
   - Validasi real-time
   - Submit → POST /api/auth/register, lalu auto-login
   - "Already have account? Login" link

   app/(auth)/forgot-password/page.tsx
   - Form: email
   - Submit → POST /api/auth/forgot-password
   - Sukses: tampilkan pesan cek email

   app/(auth)/reset-password/[token]/page.tsx
   - Form: password baru + konfirmasi
   - Validasi: min 8 karakter
   - Submit → POST /api/auth/reset-password
   - Sukses: redirect ke login

Layout untuk halaman auth:
- Halaman centered (tidak pakai public layout header/footer penuh)
- Hanya logo HAGE CLUB di atas
- Card/box di tengah layar
```

---

## Session 5.2 — Customer Account Pages

**Tujuan:** Semua halaman di area /account customer.

**Output yang diharapkan:**
```
app/account/layout.tsx
app/account/page.tsx                    (dashboard)
app/account/orders/page.tsx
app/account/orders/[id]/page.tsx
app/account/wishlist/page.tsx
app/account/address/page.tsx
app/account/profile/page.tsx
components/account/account-nav.tsx
components/account/address-card.tsx
components/account/order-card.tsx
app/api/account/profile/route.ts
app/api/account/addresses/route.ts
app/api/account/wishlist/route.ts
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, Tailwind CSS).
Auth dengan NextAuth. Session berisi { id, name, email, role }.
Design system ada di components/ui/.
Order types ada di types/order.ts.
Product card ada di components/product/product-card.tsx.

Tugas session ini: buat area account customer.

1. app/account/layout.tsx
   - Sidebar navigasi kiri: Dashboard, Orders, Wishlist, Address, Profile, Logout
   - Mobile: tab horizontal di atas
   - Nama user dan email di atas sidebar
   - Auth guard: redirect ke /login jika tidak ada session

2. components/account/account-nav.tsx
   - Navigation links dengan active state
   - Logout dengan signOut()

3. app/account/page.tsx (Dashboard)
   - Greeting: "Welcome back, [name]"
   - Summary cards: Total Orders, Pending Orders, Wishlist count
   - Recent Orders (3 terakhir)
   - Quick links: View all orders, Edit profile

4. app/account/orders/page.tsx
   - List semua order user dengan pagination
   - Setiap order: OrderCard komponen
   - Filter by status (tab)

5. components/account/order-card.tsx
   - Order number, tanggal, status badge
   - Item pertama + jumlah item lainnya
   - Total harga
   - Tombol: Detail, Track Order
   - Tombol "Buy Again" (add semua item ke cart)

6. app/account/orders/[id]/page.tsx
   - Detail lengkap order
   - OrderTimeline (dari Phase 4)
   - Item list
   - Shipping info
   - Payment info
   - Tombol Cancel (hanya jika status PENDING)

7. app/account/address/page.tsx
   - List alamat tersimpan
   - Set as default button
   - Edit / Delete
   - Add new address form (modal)

8. components/account/address-card.tsx
   - Label, nama penerima, alamat, kota, kode pos
   - Badge "Default" jika default
   - Edit dan Delete button

9. app/account/wishlist/page.tsx
   - Grid produk dari wishlist
   - Remove from wishlist
   - Add to cart dari wishlist
   - Empty state dengan CTA Shop Now

10. app/account/profile/page.tsx
    - Form edit: nama depan, nama belakang, nomor HP
    - Ubah password (form terpisah: current password, new, confirm)

API Routes:
- GET/PATCH /api/account/profile
- GET/POST/PUT/DELETE /api/account/addresses
- GET/POST/DELETE /api/account/wishlist
```

---

---

# PHASE 6 — Admin CMS Core

---

## Session 6.1 — Admin Layout & Dashboard

**Tujuan:** Struktur admin panel dan dashboard dengan analytics ringkasan.

**Output yang diharapkan:**
```
app/admin/layout.tsx
app/admin/login/page.tsx
app/admin/dashboard/page.tsx
components/admin/admin-sidebar.tsx
components/admin/admin-header.tsx
components/admin/stat-card.tsx
components/admin/recent-orders-table.tsx
app/api/admin/dashboard/route.ts
```

**Template Prompt:**
```
Saya sedang membangun admin CMS untuk e-commerce HAGE CLUB (Next.js 14, Tailwind CSS).
NextAuth auth ada di lib/auth.ts. Admin role: ADMIN, EDITOR, CS.
Design system ada di components/ui/.
Middleware sudah protect /admin/* untuk role admin.

Tugas session ini: buat admin layout dan dashboard.

1. app/admin/login/page.tsx
   - Form email + password sederhana
   - Tidak ada register link
   - Redirect ke /admin/dashboard setelah login
   - Jika sudah login sebagai non-admin: tampilkan "Access denied"
   - URL: /admin/login (tidak bisa diindeks Google — tambahkan di robots.txt)

2. app/admin/layout.tsx
   - Sidebar kiri (collapsible)
   - Header atas: breadcrumb, user info, logout
   - Warna: background putih, sidebar abu gelap atau hitam
   - Responsive: sidebar collapse di mobile jadi drawer

3. components/admin/admin-sidebar.tsx
   Menu navigasi:
   - Dashboard
   - Products (sub: All Products, Add Product, Categories)
   - Orders (sub: All Orders, Pending)
   - Customers
   - Coupons
   - Blog (sub: Posts, Categories)
   - Media
   - SEO
   - Settings

   Role-based visibility:
   - CS: hanya lihat Orders, Customers
   - EDITOR: lihat Products (read), Blog, Media, SEO
   - ADMIN: semua

4. components/admin/stat-card.tsx
   Komponen kartu statistik:
   - Label, value, ikon, trend (naik/turun dengan persentase)
   - Loading skeleton

5. app/api/admin/dashboard/route.ts
   GET — aggregasi data untuk dashboard:
   - Total revenue (bulan ini vs bulan lalu)
   - Total orders (bulan ini)
   - Pending orders
   - Total products
   - Low stock products (stok < 5)
   - New customers (bulan ini)
   - Recent orders (10 terakhir)
   - Best selling products (5 terakhir berdasarkan OrderItem)

6. app/admin/dashboard/page.tsx
   - Row stat cards: Revenue, Orders, Pending, Products
   - Row 2: Low Stock Alert, New Customers
   - Recent Orders table (order number, customer, total, status, tanggal)
   - Best Sellers list

7. components/admin/recent-orders-table.tsx
   - Tabel dengan kolom: Order#, Customer, Items, Total, Status, Date, Actions
   - Status badge
   - Link ke detail order
   - Sortable kolom
```

---

## Session 6.2 — Product Management

**Tujuan:** CRUD produk di admin panel, termasuk gallery dan variant.

**Output yang diharapkan:**
```
app/admin/products/page.tsx
app/admin/products/new/page.tsx
app/admin/products/[id]/page.tsx
components/admin/product-form.tsx
components/admin/image-uploader.tsx
components/admin/variant-manager.tsx
app/api/admin/products/route.ts
app/api/admin/products/[id]/route.ts
app/api/admin/media/upload/route.ts
```

**Template Prompt:**
```
Saya sedang membangun admin CMS untuk e-commerce HAGE CLUB (Next.js 14).
Cloudinary wrapper ada di lib/cloudinary.ts.
Prisma queries untuk produk ada di lib/queries/product.ts.
Design system ada di components/ui/.
Semua /api/admin/* sudah diprotect middleware (role ADMIN).

Tugas session ini: buat product management di admin.

1. app/admin/products/page.tsx
   - Tabel produk dengan kolom: Image, Name, SKU, Category, Price, Stock, Status, Actions
   - Search input (live search)
   - Filter: status (DRAFT/PUBLISHED/ARCHIVED), category
   - Bulk actions: Delete, Archive, Publish
   - Pagination
   - Tombol "Add Product" (primary)

2. components/admin/image-uploader.tsx
   - Drag & Drop area
   - Preview gambar yang diupload
   - Multiple upload support
   - Reorder dengan drag (untuk gallery)
   - Set cover image
   - Delete gambar
   - Upload ke /api/admin/media/upload → Cloudinary

3. components/admin/variant-manager.tsx
   - Tombol "Add Variant"
   - Form per variant: SKU, attributes (name-value pairs, contoh: Size=L, Color=Black),
     price override (opsional), stock, isActive
   - Tambah attribute pair dinamis
   - List semua variant dalam tabel
   - Edit inline
   - Delete variant

4. components/admin/product-form.tsx
   Form lengkap dengan section:
   - Basic Info: name, slug (auto-generate dari name), SKU, status
   - Pricing: price, sale price
   - Physical: weight (gram), width, height, length (cm)
   - Description: shortDescription (textarea), fullDescription (rich text editor
     — gunakan @uiw/react-md-editor atau react-quill)
   - Category & Tags: select category, tag input (comma separated)
   - Gallery: ImageUploader
   - Variants: VariantManager
   - SEO: seoTitle, seoDescription, seoKeywords

   Slug harus auto-generate dari name (lowercase, dasherize) tapi bisa diedit manual.
   Preview SEO di bawah SEO fields.

5. app/admin/products/new/page.tsx
   — Gunakan ProductForm dengan initial values kosong

6. app/admin/products/[id]/page.tsx
   — Gunakan ProductForm dengan data existing produk

7. API Routes:
   GET    /api/admin/products?search&category&status&page
   POST   /api/admin/products
   GET    /api/admin/products/[id]
   PUT    /api/admin/products/[id]
   DELETE /api/admin/products/[id]
   POST   /api/admin/products/[id]/duplicate

   POST   /api/admin/media/upload
   - Terima form-data dengan file
   - Upload ke Cloudinary di folder 'hageclub/products'
   - Simpan record di Media table
   - Return: { url, publicId }
```

---

## Session 6.3 — Category & Inventory Management

**Output yang diharapkan:**
```
app/admin/products/categories/page.tsx
app/admin/inventory/page.tsx
components/admin/category-tree.tsx
components/admin/stock-adjustment-modal.tsx
app/api/admin/categories/route.ts
app/api/admin/categories/[id]/route.ts
app/api/admin/inventory/route.ts
app/api/admin/inventory/[id]/adjust/route.ts
```

**Template Prompt:**
```
Saya sedang membangun admin CMS untuk e-commerce HAGE CLUB (Next.js 14).
Design system ada di components/ui/.

Tugas session ini: buat Category dan Inventory management.

CATEGORY MANAGEMENT:

1. components/admin/category-tree.tsx
   - Tree view untuk nested categories (parent → children)
   - Expand/collapse
   - Edit inline (nama)
   - Drag untuk reorder (opsional, P3)
   - Add child category button per node
   - Delete category (dengan warning jika ada produk)

2. app/admin/products/categories/page.tsx
   - CategoryTree di kiri
   - Form edit category di kanan (ketika category dipilih):
     name, slug, parentId, description, banner upload, seoTitle, seoDescription
   - Tombol "Add Root Category"

3. API Routes Category:
   GET    /api/admin/categories → nested tree
   POST   /api/admin/categories → buat baru
   PUT    /api/admin/categories/[id]
   DELETE /api/admin/categories/[id] → error jika ada produk

INVENTORY MANAGEMENT:

4. app/admin/inventory/page.tsx
   - Tabel semua produk + variant dengan kolom:
     Product Name, SKU, Category, Stock, Low Stock Alert threshold, Status
   - Filter: low stock (stok < 5), out of stock
   - Search by name atau SKU
   - Klik baris → buka StockAdjustmentModal

5. components/admin/stock-adjustment-modal.tsx
   - Product info di atas
   - Stock saat ini
   - Input: jenis adjustment (ADD/SUBTRACT/SET), jumlah, alasan (notes)
   - Submit → update stok + catat ke StockHistory
   - Riwayat adjustment terbaru (5 terakhir untuk produk ini)

6. API Routes Inventory:
   GET  /api/admin/inventory?filter=low_stock&search=
   POST /api/admin/inventory/[id]/adjust { type, amount, reason }
        → update Product/Variant stock + log ke StockHistory

   Tambahkan model StockHistory ke Prisma:
   id, productId, variantId (nullable), type, amount, before, after,
   reason, createdBy, createdAt
```

---

## Session 6.4 — Order Management

**Output yang diharapkan:**
```
app/admin/orders/page.tsx
app/admin/orders/[id]/page.tsx
components/admin/order-detail-view.tsx
components/admin/order-status-updater.tsx
components/admin/order-filters.tsx
app/api/admin/orders/route.ts
app/api/admin/orders/[id]/route.ts
app/api/admin/orders/[id]/status/route.ts
app/api/admin/orders/[id]/invoice/route.ts
```

**Template Prompt:**
```
Saya sedang membangun admin CMS untuk e-commerce HAGE CLUB (Next.js 14).
Order types ada di types/order.ts.
Order queries ada di lib/queries/order.ts.
OrderTimeline component ada di components/order/order-timeline.tsx.

Tugas session ini: buat Order Management di admin.

1. components/admin/order-filters.tsx
   - Search: order number atau nama customer
   - Filter status: dropdown multi-select
   - Filter tanggal: date range picker (date input min-max)
   - Filter kurir
   - Tombol Reset Filters

2. app/admin/orders/page.tsx
   - OrderFilters di atas
   - Tabel dengan kolom:
     Order#, Customer, Items, Total, Payment, Kurir, Status, Tanggal, Actions
   - Actions: View, Update Status
   - Pagination
   - Export CSV/Excel button (download semua filtered orders)

3. components/admin/order-status-updater.tsx
   - Select status baru (dari status yang valid berdasarkan current status)
   - Input tracking number (muncul saat status → SHIPPED)
   - Textarea catatan internal (opsional)
   - Submit → update status + log history

   Valid transitions:
   - PENDING → CANCELLED
   - PAID → PROCESSING
   - PROCESSING → PACKED
   - PACKED → SHIPPED
     Saat PACKED → SHIPPED: admin bisa pilih antara:
     a. Generate AWB otomatis via rajaongkir.createAWB(order) → simpan awbNumber
     b. Input tracking number manual (untuk kurir di luar integrasi)
     Setelah AWB tersedia: tampilkan tombol "Request Pickup" dan "Print Label"
   - SHIPPED → DELIVERED
   - DELIVERED → COMPLETED
   - PAID/PROCESSING → CANCELLED (dengan konfirmasi, kembalikan stok)

4. components/admin/order-detail-view.tsx
   Full view order untuk admin:
   - Header: order number, tanggal, badge status
   - Customer info
   - Shipping address
   - Items table dengan gambar
   - Pricing breakdown
   - Payment info (method, status, transaction ID)
   - Kurir + tracking number
   - OrderTimeline
   - OrderStatusUpdater
   - Internal notes (list + add note form)
   - Customer notes

5. app/admin/orders/[id]/page.tsx
   — Gunakan OrderDetailView

6. API Routes:
   GET  /api/admin/orders?search&status&startDate&endDate&courier&page
   GET  /api/admin/orders/[id]
   PUT  /api/admin/orders/[id]/status { status, trackingNumber?, note? }
   POST /api/admin/orders/[id]/awb → generate AWB via rajaongkir.createAWB()
   POST /api/admin/orders/[id]/pickup → request pickup via rajaongkir.requestPickup()
   GET  /api/admin/orders/[id]/label → ambil URL label via rajaongkir.printLabel()
   GET  /api/admin/orders/[id]/invoice → generate PDF atau redirect ke print view

   Invoice: buat halaman HTML print-friendly di app/admin/orders/[id]/invoice/page.tsx
   dengan layout invoice (logo, order detail, items table, total)
   gunakan @media print CSS
```

---

---

# PHASE 7 — Admin Extended

---

## Session 7.1 — Customer Management & Coupon

**Output yang diharapkan:**
```
app/admin/customers/page.tsx
app/admin/customers/[id]/page.tsx
app/admin/coupons/page.tsx
app/admin/coupons/new/page.tsx
components/admin/coupon-form.tsx
app/api/admin/customers/route.ts
app/api/admin/customers/[id]/route.ts
app/api/admin/coupons/route.ts
app/api/admin/coupons/[id]/route.ts
```

**Template Prompt:**
```
Saya sedang membangun admin CMS untuk e-commerce HAGE CLUB (Next.js 14).
Design system ada di components/ui/.

Tugas session ini: buat Customer Management dan Coupon Engine.

CUSTOMER MANAGEMENT:

1. app/admin/customers/page.tsx
   - Tabel: nama, email, phone, total orders, total spent, join date, status
   - Search by name/email
   - Filter: new (30 hari), active, VIP (total > Rp5jt)
   - Export CSV

2. app/admin/customers/[id]/page.tsx
   - Profile info + edit catatan internal
   - Order history (list dengan link)
   - Total orders, total spent
   - Saved addresses (read only)
   - Internal segment tag (manual: NEW, REGULAR, VIP)

COUPON ENGINE:

3. components/admin/coupon-form.tsx
   Fields:
   - Code (uppercase, auto atau manual)
   - Type: PERCENTAGE, FIXED, FREE_SHIPPING
   - Value: (persen atau nominal)
   - Min purchase amount
   - Max discount (untuk tipe PERCENTAGE)
   - Usage limit (total, per user)
   - Start date, end date
   - Applicable to: ALL, CATEGORY, PRODUCT
   - isActive toggle

4. app/admin/coupons/page.tsx
   - Tabel: code, type, value, usage (used/limit), period, status, actions
   - Filter: active, expired
   - Tombol Add Coupon

5. app/admin/coupons/new/page.tsx → CouponForm

6. app/admin/coupons/[id]/page.tsx → CouponForm + usage history

API Routes:
GET    /api/admin/customers?search&segment&page
GET    /api/admin/customers/[id] (dengan order history)
PATCH  /api/admin/customers/[id] (hanya notes + segment)

GET    /api/admin/coupons
POST   /api/admin/coupons
GET    /api/admin/coupons/[id]
PUT    /api/admin/coupons/[id]
DELETE /api/admin/coupons/[id]
GET    /api/admin/coupons/[id]/usage → list penggunaan kupon per order
```

---

## Session 7.2 — Media Library & SEO Management

**Output yang diharapkan:**
```
app/admin/media/page.tsx
app/admin/seo/page.tsx
app/admin/seo/[page]/page.tsx
components/admin/media-grid.tsx
components/admin/media-picker.tsx
components/admin/seo-editor.tsx
app/api/admin/media/route.ts
app/api/admin/media/[id]/route.ts
app/api/admin/seo/route.ts
app/api/admin/seo/[page]/route.ts
```

**Template Prompt:**
```
Saya sedang membangun admin CMS untuk e-commerce HAGE CLUB (Next.js 14).
Cloudinary wrapper ada di lib/cloudinary.ts.
Design system ada di components/ui/.

Tugas session ini: buat Media Library dan SEO Management.

MEDIA LIBRARY:

1. components/admin/media-grid.tsx
   - Grid gambar dari Media table
   - Setiap item: thumbnail, filename, ukuran, tanggal upload
   - Klik → tampilkan detail (url, alt, dimensi) di sidebar kanan
   - Edit alt text
   - Copy URL
   - Delete (dengan konfirmasi)
   - Upload button → drag & drop atau file picker

2. components/admin/media-picker.tsx
   - Modal/dialog untuk memilih gambar dari library
   - Digunakan oleh: Product Form, Blog Form, SEO Form
   - Search by filename
   - Filter by folder
   - Single atau multiple select

3. app/admin/media/page.tsx
   - MediaGrid
   - Search dan filter folder
   - Bulk delete
   - Upload button (multiple files)

SEO MANAGEMENT:

4. components/admin/seo-editor.tsx
   Fields:
   - SEO Title (dengan karakter counter, max 60)
   - Meta Description (dengan karakter counter, max 160)
   - Canonical URL
   - OG Title
   - OG Description
   - OG Image (dengan MediaPicker)
   - Robots directive (index/noindex, follow/nofollow)
   - Structured Data JSON (textarea dengan syntax highlight opsional)
   - Live preview (simulasi SERP snippet)

5. app/admin/seo/page.tsx
   - List halaman yang punya SEO setting:
     Homepage, Shop, Blog, About, Contact, FAQ, Privacy, T&C
   - Status: configured / not configured
   - Link edit

6. app/admin/seo/[page]/page.tsx
   — SeoEditor untuk halaman tertentu

API Routes:
GET    /api/admin/media?folder&search&page
DELETE /api/admin/media/[id]
PATCH  /api/admin/media/[id] (update alt text)

GET    /api/admin/seo → list semua SEO settings
GET    /api/admin/seo/[page]
PUT    /api/admin/seo/[page]
```

---

## Session 7.3 — Role Management & Admin Settings

**Output yang diharapkan:**
```
app/admin/settings/page.tsx
app/admin/settings/users/page.tsx
components/admin/admin-user-form.tsx
app/api/admin/settings/users/route.ts
app/api/admin/settings/users/[id]/route.ts
app/api/admin/settings/general/route.ts
```

**Template Prompt:**
```
Saya sedang membangun admin CMS untuk e-commerce HAGE CLUB (Next.js 14).
Role: ADMIN, EDITOR, CS. Hanya SUPER ADMIN (flag di DB) yang bisa manage users.

Tugas session ini: Admin Settings dan User Management.

1. app/admin/settings/page.tsx (General Settings)
   Sections (data disimpan di tabel SiteSetting yang perlu dibuat):
   - Store Info: nama toko, email, phone, alamat, WhatsApp
   - Announcement Bar: text, aktif/nonaktif
   - Shipping Origin: provinsi, kota (untuk kalkulasi ongkir)
   - Free Shipping Threshold (minimum order untuk gratis ongkir)
   - Maintenance Mode toggle

   Tambahkan model SiteSetting ke Prisma:
   id, key, value (JSON), updatedAt

2. app/admin/settings/users/page.tsx
   - Tabel admin users: nama, email, role, last login, status
   - Hanya ADMIN yang bisa akses
   - Tombol "Add User"

3. components/admin/admin-user-form.tsx
   - nama, email, password (baru), role (ADMIN/EDITOR/CS)
   - isActive toggle
   - Untuk edit: password field opsional (kosong = tidak ganti)

4. API Routes:
   GET    /api/admin/settings/general → seluruh SiteSettings
   PUT    /api/admin/settings/general { key, value }

   GET    /api/admin/settings/users
   POST   /api/admin/settings/users
   PUT    /api/admin/settings/users/[id]
   DELETE /api/admin/settings/users/[id]
   PATCH  /api/admin/settings/users/[id]/toggle-status

   Semua /settings/users route hanya untuk role ADMIN.
```

---

---

# PHASE 8 — Blog & Static Pages

---

## Session 8.1 — Blog CMS (Admin)

**Output yang diharapkan:**
```
app/admin/blog/page.tsx
app/admin/blog/new/page.tsx
app/admin/blog/[id]/page.tsx
app/admin/blog/categories/page.tsx
components/admin/blog-form.tsx
components/admin/rich-text-editor.tsx
app/api/admin/blog/route.ts
app/api/admin/blog/[id]/route.ts
app/api/admin/blog/categories/route.ts
```

**Template Prompt:**
```
Saya sedang membangun admin CMS untuk e-commerce HAGE CLUB (Next.js 14).
Media picker ada di components/admin/media-picker.tsx.
SEO editor ada di components/admin/seo-editor.tsx.

Tugas session ini: buat Blog CMS di admin.

1. components/admin/rich-text-editor.tsx
   - Gunakan @uiw/react-md-editor (Markdown editor dengan preview)
   - Atau react-quill jika user lebih suka WYSIWYG
   - Support: heading, bold, italic, link, gambar (insert dari media picker),
     code block, ordered/unordered list, blockquote
   - Tampilkan estimasi reading time (based on word count / 200)

2. components/admin/blog-form.tsx
   Fields:
   - Title
   - Slug (auto-generate dari title, bisa edit manual)
   - Featured Image (MediaPicker)
   - Excerpt (textarea, max 160 karakter)
   - Content (RichTextEditor)
   - Category (select)
   - Tags (tag input)
   - Status: DRAFT, PUBLISHED, SCHEDULED
   - Publish date (datetime picker, muncul saat SCHEDULED)
   - Author (default: user saat ini)
   - SEO section (SeoEditor)

3. app/admin/blog/page.tsx
   - Tabel artikel: Title, Author, Category, Status, Published Date, Actions
   - Filter: status (DRAFT/PUBLISHED/SCHEDULED)
   - Search by title
   - Tombol "New Article"

4. app/admin/blog/new/page.tsx → BlogForm kosong
5. app/admin/blog/[id]/page.tsx → BlogForm dengan data existing

6. app/admin/blog/categories/page.tsx
   - CRUD kategori blog
   - Tabel: nama, slug, jumlah artikel

7. API Routes:
   GET    /api/admin/blog?status&search&page
   POST   /api/admin/blog
   GET    /api/admin/blog/[id]
   PUT    /api/admin/blog/[id]
   DELETE /api/admin/blog/[id]
   PATCH  /api/admin/blog/[id]/publish → toggle published/draft

   GET    /api/admin/blog/categories
   POST   /api/admin/blog/categories
   PUT    /api/admin/blog/categories/[id]
   DELETE /api/admin/blog/categories/[id]

8. Auto-publish SCHEDULED blog posts via cPanel Cron Job:

   Buat API endpoint internal:
   GET /api/cron/publish-scheduled
   - Query semua BlogPost dengan status=SCHEDULED dan publishedAt <= now()
   - Update status ke PUBLISHED
   - Lindungi dengan secret header: Authorization: Bearer CRON_SECRET
   - Tambahkan CRON_SECRET ke env

   Di cPanel → Cron Jobs, tambahkan cron job:
   Interval: setiap 15 menit (*/15 * * * *)
   Command: curl -s -H "Authorization: Bearer [CRON_SECRET]" https://[domain]/api/cron/publish-scheduled

   Catatan: ini adalah cron job di level cPanel shell (bukan internal Node.js),
   sehingga kompatibel penuh dengan shared hosting. Tidak perlu background worker.
```

---

## Session 8.2 — Blog Public Pages

**Output yang diharapkan:**
```
app/(public)/blog/page.tsx
app/(public)/blog/[slug]/page.tsx
app/(public)/blog/category/[slug]/page.tsx
components/blog/article-card.tsx
components/blog/article-hero.tsx
components/blog/related-articles.tsx
components/blog/newsletter-section.tsx
app/api/blog/route.ts
app/api/blog/[slug]/route.ts
```

**Template Prompt:**
```
Saya sedang membangun blog untuk e-commerce HAGE CLUB (Next.js 14, Tailwind CSS).
Design system ada di components/ui/.
Layout publik ada di app/(public)/layout.tsx.

Tugas session ini: buat halaman blog publik.

1. components/blog/article-card.tsx
   - Cover image (rasio 16:9)
   - Category badge
   - Title (max 2 baris dengan line-clamp)
   - Excerpt (max 3 baris)
   - Author avatar + nama
   - Published date (format: "15 Juli 2025")
   - Reading time
   - Hover: subtle scale pada gambar

2. components/blog/article-hero.tsx
   - Featured article besar di atas listing
   - Full-width image dengan overlay gelap
   - Category, title, excerpt, meta di atas overlay

3. components/blog/related-articles.tsx
   - Grid 3 kolom (ArticleCard)
   - Judul "Related Articles"

4. components/blog/newsletter-section.tsx
   - Email input + subscribe button
   - Submit → POST /api/newsletter/subscribe
   - Simpan ke NewsletterSubscriber table (tambah ke Prisma)
   - Success message setelah subscribe

5. app/(public)/blog/page.tsx
   - ArticleHero (featured/terbaru)
   - Grid ArticleCard semua artikel published
   - Filter kategori (tabs/links horizontal)
   - Pagination
   - NewsletterSection di bawah

6. app/(public)/blog/[slug]/page.tsx
   Layout:
   - Full-width cover image
   - Content area max-width 720px centered
   - Author info di atas artikel
   - Published date + reading time
   - Article content (render Markdown ke HTML)
   - Tags di bawah artikel
   - Share buttons (Twitter, WhatsApp, copy link)
   - RelatedArticles
   - Link balik ke Blog

   SEO:
   - generateMetadata() dari BlogPost
   - Article JSON-LD schema
   - generateStaticParams() untuk semua slug

7. app/(public)/blog/category/[slug]/page.tsx
   - Judul kategori
   - Grid artikel per kategori
   - Breadcrumb: Home > Blog > [Category]

API Routes (public):
GET /api/blog?category&page → published articles only
GET /api/blog/[slug] → single article
```

---

## Session 8.3 — Static Pages

**Output yang diharapkan:**
```
app/(public)/about/page.tsx
app/(public)/contact/page.tsx
app/(public)/faq/page.tsx
app/(public)/privacy-policy/page.tsx
app/(public)/terms-conditions/page.tsx
app/(public)/shipping-info/page.tsx
components/contact/contact-form.tsx
app/api/contact/route.ts
app/api/newsletter/subscribe/route.ts
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, Tailwind CSS).
Brand: premium automotive lifestyle, warna #1C1C1E dan #FFFFFF.
Design system ada di components/ui/.

Tugas session ini: buat semua static pages.

1. app/(public)/about/page.tsx
   Sections:
   - Hero: tagline "The Pinnacle of Refined Comfort" dengan foto full-width
   - Brand Story: paragraf tentang HAGE CLUB dan kultur garage
   - Core Values: 4 kartu (Quality, Comfort, Authenticity, Timelessness)
   - Behind the Brand: foto editorial + teks
   - CTA: "Shop the Collection"

   Semua konten untuk sementara adalah placeholder text yang realistis.

2. components/contact/contact-form.tsx
   Fields: Nama, Email, Subject (select: Order Issue / Product Question /
   General / Other), Pesan
   Submit → POST /api/contact → kirim email ke EMAIL_ADMIN

3. app/(public)/contact/page.tsx
   - Judul + subtitle
   - 2 kolom: ContactForm kiri, Info kanan
   - Info: Email, WhatsApp CTA (link wa.me), Jam operasional
   - Google Maps embed (opsional, gunakan iframe placeholder)

4. app/(public)/faq/page.tsx
   - Accordion FAQ
   - Kelompok: Pemesanan, Pembayaran, Pengiriman, Produk, Return
   - Setiap item: pertanyaan (trigger) + jawaban (content)
   - Isi dengan FAQ yang relevan untuk e-commerce apparel Indonesia

5. app/(public)/privacy-policy/page.tsx
   - Prose layout (max-width, centered)
   - Konten: Privacy Policy standar untuk e-commerce Indonesia
   - Last updated date

6. app/(public)/terms-conditions/page.tsx
   - Sama seperti privacy policy layout
   - Konten: T&C standar

7. app/(public)/shipping-info/page.tsx
   - Tabel biaya ongkir per wilayah (ilustratif)
   - Info estimasi pengiriman per kurir
   - Kebijakan pengiriman
   - FAQ pengiriman

API Routes:
POST /api/contact { name, email, subject, message }
  → validasi → kirim email ke admin → response OK

POST /api/newsletter/subscribe { email }
  → simpan ke NewsletterSubscriber (upsert)
  → response OK
```

---

---

# PHASE 9 — SEO & Schema

---

## Session 9.1 — SEO Infrastructure

**Output yang diharapkan:**
```
app/sitemap.ts
app/robots.ts
app/(public)/layout.tsx    (update dengan global metadata)
lib/seo.ts                 (metadata helpers)
lib/schema.ts              (JSON-LD schema builders)
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14, App Router).
Semua halaman sudah dibuat. Sekarang perlu menambahkan SEO infrastructure.

Tugas session ini: implementasi SEO lengkap.

1. lib/seo.ts
   Helper functions untuk metadata Next.js:
   - buildMetadata(options): return Metadata object
   - buildProductMetadata(product): return Metadata dengan OG image
   - buildBlogMetadata(article): return Metadata
   - buildCategoryMetadata(category): return Metadata
   Default metadata: title template "| HAGE CLUB", 
   description default brand

2. lib/schema.ts
   JSON-LD builders:
   - buildOrganizationSchema(): HAGE CLUB info
   - buildWebsiteSchema(): dengan SearchAction
   - buildProductSchema(product): Product schema dengan offers, images
   - buildBreadcrumbSchema(items): BreadcrumbList
   - buildArticleSchema(article): Article schema
   - buildFAQSchema(faqs): FAQPage schema

   Return format: string (JSON.stringify) untuk dimasukkan ke <script>

3. Update halaman yang perlu JSON-LD:
   - app/(public)/page.tsx: Organization + Website schema
   - app/(public)/products/[slug]/page.tsx: Product + Breadcrumb schema
   - app/(public)/blog/[slug]/page.tsx: Article schema
   - app/(public)/faq/page.tsx: FAQ schema

4. app/sitemap.ts
   Next.js sitemap generator:
   - Static pages: /, /shop, /blog, /about, /contact, /faq, /privacy-policy, /terms
   - Dynamic: semua product slug (dari DB)
   - Dynamic: semua blog slug (dari DB)
   - Dynamic: semua category slug (dari DB)
   Return: MetadataRoute.Sitemap[]
   Update frequency dan priority sesuai konten

5. app/robots.ts
   - Allow semua public pages
   - Disallow: /admin, /admin/*, /api/*
   - Sitemap URL

6. Update app/(public)/layout.tsx:
   - Global metadata: title template, default description, OG defaults
   - Tambahkan Organization + Website JSON-LD
   - viewport meta

7. Pastikan semua halaman publik punya:
   - generateMetadata() yang proper
   - canonical URL
   - OG image (default jika tidak ada gambar spesifik)
```

---

## Session 9.2 — Performance Optimization

**Output yang diharapkan:**
```
next.config.ts              (update dengan optimasi)
components/ui/image.tsx     (update dengan optimasi)
app/(public)/page.tsx       (update: critical CSS, lazy load)
lib/cache.ts                (caching helpers)
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14).
Website sudah lengkap. Sekarang perlu optimasi untuk Lighthouse ≥ 90.

Tugas session ini: performance optimization.

1. next.config.ts — update dengan:
   - Image domains: cloudinary.com + rajaongkir domains
   - Bundle analyzer (opsional, hanya dev)
   - Compress: true
   - Proper cache headers untuk static assets
   - Experimental: optimizePackageImports untuk library yang besar

2. lib/cache.ts
   Helpers untuk Next.js caching:
   - unstable_cache wrapper dengan tag-based revalidation
   - Tags yang digunakan: 'products', 'categories', 'blog', 'orders'
   - Fungsi revalidateProducts(), revalidateBlog(), dll

   Update API routes yang sudah ada untuk menggunakan cache ini:
   - /api/products → cache 1 jam, tag 'products'
   - /api/categories → cache 24 jam, tag 'categories'
   - /api/blog → cache 1 jam, tag 'blog'
   - /api/shipping/provinces → cache 24 jam

   Update admin mutation routes untuk trigger revalidateTag() setelah
   create/update/delete.

3. Image optimization audit:
   - Pastikan semua Next/Image pakai width + height atau fill
   - Priority={true} untuk LCP image (hero banner, product main image)
   - Lazy loading untuk gambar di bawah fold
   - WebP format via Cloudinary URL transformations

4. Font optimization:
   - Pastikan Inter dimuat via next/font/google dengan subsets minimal
   - preload: true untuk font yang digunakan di atas fold
   - display: 'swap'

5. Homepage optimization:
   - Review komponen yang di-render server vs client
   - Minimal client components di atas fold
   - Suspense boundaries yang tepat untuk bagian yang tidak perlu di-SSR

6. Buat checklist verifikasi Lighthouse:
   Di file /checklist-performance.md tuliskan:
   - Item yang sudah dioptimasi
   - Cara verifikasi masing-masing
   - Target score per kategori
```

---

---

# PHASE 10 — Analytics & Integrations

---

## Session 10.1 — Google Analytics & Meta Pixel

**Output yang diharapkan:**
```
components/analytics/ga4.tsx
components/analytics/meta-pixel.tsx
components/analytics/analytics-provider.tsx
lib/analytics.ts            (event tracking helpers)
app/(public)/layout.tsx     (update: tambah analytics)
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14).
GA4 Measurement ID ada di env: NEXT_PUBLIC_GA4_ID
Meta Pixel ID ada di env: NEXT_PUBLIC_META_PIXEL_ID

Tugas session ini: implementasi analytics tracking.

1. components/analytics/ga4.tsx
   - Load gtag.js script dengan next/script (strategy="afterInteractive")
   - pageview tracking otomatis via usePathname
   - Client component

2. components/analytics/meta-pixel.tsx
   - Load Meta Pixel script
   - PageView tracking otomatis
   - Client component

3. lib/analytics.ts
   Event tracking functions (semua menggunakan window.gtag + window.fbq):

   trackEvent(name, params): base function

   E-commerce events:
   - trackViewProduct(product): view_item
   - trackAddToCart(item): add_to_cart
   - trackBeginCheckout(items, total): begin_checkout
   - trackPurchase(order): purchase
   - trackViewProductList(items, listName): view_item_list
   - trackSearch(query): search
   - trackViewCart(items, total): view_cart
   - trackRemoveFromCart(item): remove_from_cart

   Setiap event dikirim ke: GA4 (gtag) + Meta Pixel (fbq) secara bersamaan

4. Integrasi ke komponen yang sudah ada:
   - ProductCard: tambahkan trackViewProduct saat mounted
   - add-to-cart action di cart-store: tambahkan trackAddToCart
   - checkout page: tambahkan trackBeginCheckout saat page load
   - checkout/success page: tambahkan trackPurchase dengan order data
   - search results: trackSearch

5. app/(public)/layout.tsx — update:
   - Tambahkan GA4 dan MetaPixel component
   - Hanya render jika ID tersedia (tidak crash di development)

6. Google Search Console verification:
   - Tambahkan verification meta tag dari env: NEXT_PUBLIC_GSC_VERIFICATION
   - Di root layout metadata

Catatan: Semua tracking harus comply dengan basic privacy — tidak mengirim
data pribadi (email, phone) ke analytics.
```

---

## Session 10.2 — WhatsApp & Email Notifications

**Output yang diharapkan:**
```
lib/whatsapp.ts             (WhatsApp Business API atau wa.me links)
components/common/whatsapp-button.tsx
app/api/admin/orders/[id]/notify/route.ts
app/api/webhooks/payment/route.ts   (update: tambah notifikasi)
```

**Template Prompt:**
```
Saya sedang membangun e-commerce HAGE CLUB (Next.js 14).
Email templates ada di lib/email-templates.ts.
Email sender ada di lib/email.ts.

Tugas session ini: WhatsApp CTA dan notifikasi pelanggan.

1. lib/whatsapp.ts
   - buildOrderConfirmationWA(order): string → pesan WA berformat teks
   - buildOrderShippedWA(order, trackingNumber): string
   - buildWhatsAppURL(phone, message): string → wa.me URL dengan encode
   Gunakan nomor WA dari env: WHATSAPP_BUSINESS_NUMBER

2. components/common/whatsapp-button.tsx
   - Floating button kanan bawah
   - Ikon WhatsApp hijau
   - Tooltip: "Chat with us"
   - Link ke wa.me dengan pesan template: "Hi HAGE CLUB, saya ingin bertanya..."
   - Tampilkan di semua halaman public (kecuali checkout dan admin)
   - Sembunyikan di mobile saat keyboard muncul (opsional)

3. app/api/admin/orders/[id]/notify/route.ts
   POST { type: 'payment_confirmed' | 'order_shipped' | 'custom', message? }
   - Kirim email ke customer berdasarkan type
   - Untuk type 'order_shipped': wajib ada trackingNumber di order
   - Log ke AdminLog: siapa yang kirim notifikasi

4. Update admin order detail page (app/admin/orders/[id]/page.tsx):
   - Tambahkan tombol "Notify Customer" dengan dropdown type
   - Konfirmasi modal sebelum kirim

5. Update webhook payment (app/api/webhooks/payment/route.ts) jika belum:
   - Setelah status PAID: kirim email + link WhatsApp notifikasi
   - Setelah status SHIPPED: kirim email tracking

6. app/(public)/contact/page.tsx — update:
   - Pastikan WhatsApp CTA link sudah benar dengan nomor dan pesan template
```

---

---

# PHASE 11 — QA & Deployment

---

## Session 11.1 — Testing & Bug Fixes

**Output yang diharapkan:**
```
checklist-qa.md             (testing checklist lengkap)
```

**Template Prompt:**
```
Saya sudah selesai membangun e-commerce HAGE CLUB (Next.js 14).
Sekarang saya perlu melakukan QA sebelum deployment.

Tugas session ini: bantu saya membuat checklist QA yang komprehensif dan
periksa potensi bug pada kode yang sudah ada.

Review kode berikut untuk potensi masalah:
[lampirkan file yang dianggap kritis: order creation, payment webhook,
checkout form, cart store]

1. Buat checklist-qa.md yang mencakup:

   FUNCTIONAL TESTING:
   - [ ] User dapat register dan login
   - [ ] User dapat browse produk dan filter
   - [dst... — buat lengkap semua user flow dari PRD]

   CHECKOUT FLOW TESTING:
   - [ ] Guest checkout berhasil
   - [ ] Login checkout berhasil
   - [ ] Validasi stok saat checkout
   - [ ] Kupon valid dan invalid
   - [ ] RajaOngkir menampilkan ongkir
   - [dst...]

   PAYMENT TESTING (sandbox):
   - [ ] VA berhasil dibayar
   - [ ] QRIS berhasil
   - [ ] Webhook diterima dan order status berubah
   - [ ] Stok berkurang setelah payment success
   - [ ] Email konfirmasi terkirim
   - [ ] Gagal bayar → order tidak dibuat
   - [dst...]

   ADMIN TESTING:
   - [ ] CRUD produk berfungsi
   - [dst...]

   SEO & PERFORMANCE:
   - [ ] Lighthouse run di homepage, PLP, PDP
   - [ ] Semua halaman punya meta title dan description
   - [ ] Product schema valid (test dengan Google Rich Results Test)
   - [ ] Sitemap accessible di /sitemap.xml
   - [ ] Robots.txt correct

   SECURITY:
   - [ ] Admin route tidak bisa diakses tanpa login
   - [ ] API /api/admin/* return 401 tanpa auth
   - [ ] Webhook memverifikasi signature
   - [ ] Input validation di semua form
   - [ ] Harga diambil dari DB, bukan client

   MOBILE:
   - [ ] Homepage mobile
   - [ ] PLP filter drawer
   - [ ] PDP mobile layout
   - [ ] Cart mobile
   - [ ] Checkout mobile
   - [ ] Header mobile drawer

2. Dari review kode yang dilampirkan, identifikasi dan perbaiki:
   - Race condition di stok saat checkout bersamaan
   - Missing error handling
   - Potensi XSS di user-generated content
   - Missing loading states
```

---

## Session 11.2 — Deployment (cPanel)

**Output yang diharapkan:**
```
deploy.sh                   (script deployment: build lokal + upload + migrate)
checklist-deployment.md
```

**Template Prompt:**
```
Saya siap deploy e-commerce HAGE CLUB (Next.js 14, App Router) ke shared hosting
cPanel dengan Phusion Passenger (Node.js Application).

Tugas session ini: bantu saya deploy dengan aman.

Informasi hosting:
- Provider: [isi provider hosting]
- Node.js version yang tersedia: [cek di cPanel]
- MySQL tersedia via cPanel
- Domain: [isi domain]

1. Buat panduan deployment step-by-step untuk cPanel Node.js Application:

   PERSIAPAN HOSTING:
   a. Setup MySQL database di cPanel
   b. Setup Node.js Application di cPanel
   c. Set environment variables di cPanel

   ENVIRONMENT VARIABLES yang perlu diset:
   DATABASE_URL=mysql://user:pass@localhost:3306/dbname?connection_limit=3
   (connection_limit=3 wajib untuk shared hosting — mencegah error "Too many connections")
   NEXTAUTH_SECRET=[generate random 32 char]
   NEXTAUTH_URL=https://domain.com

   # RajaOngkir — digunakan untuk SEMUA layanan (ongkir, AWB, payment, QRISLY)
   RAJAONGKIR_API_KEY=...
   RAJAONGKIR_WEBHOOK_SECRET=...        # untuk verifikasi notifikasi payment
   RAJAONGKIR_STATIC_QRIS_ID=...        # ID QRIS statis yang didapat dari dashboard RajaOngkir
   RAJAONGKIR_ORIGIN_CITY_ID=...        # kota asal pengiriman (untuk cek ongkir)

   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   EMAIL_HOST=...
   EMAIL_PORT=465
   EMAIL_USER=...
   EMAIL_PASS=...
   EMAIL_ADMIN=...
   WHATSAPP_BUSINESS_NUMBER=...
   CRON_SECRET=[random string panjang untuk mengamankan endpoint /api/cron/*]
   NEXT_PUBLIC_GA4_ID=...
   NEXT_PUBLIC_META_PIXEL_ID=...

   BUILD & DEPLOY (build selalu dilakukan di lokal, bukan di server):
   a. Di lokal: npm run build
      → menghasilkan .next/standalone/ (karena output: 'standalone' di next.config.ts)
   b. Upload ke server via FTP/rsync/SCP:
      - Folder: .next/standalone/ → ke root aplikasi di server
      - Folder: public/ → ke root aplikasi di server
      - File: package.json → ke root aplikasi di server
      JANGAN upload node_modules (terlalu besar, install ulang di server)
   c. Di server (via SSH atau cPanel Terminal):
      npm install --production
      npx prisma migrate deploy  ← WAJIB "migrate deploy", BUKAN "migrate dev"
      (migrate dev untuk development lokal, migrate deploy untuk production)
   d. Restart Node.js Application di cPanel

   Konfigurasi cPanel Node.js Application:
   - Application Root: /home/[user]/[folder_aplikasi]
   - Application URL: https://domain.com
   - Application Startup File: server.js
     (file ini ada di dalam .next/standalone/server.js setelah build)
   - Node.js Version: pilih versi ≥ 18

2. Buat deploy.sh script untuk deployment update selanjutnya:
   # Script dijalankan di LOKAL, bukan di server
   npm run build
   rsync -avz --delete .next/standalone/ user@server:/path/to/app/
   rsync -avz public/ user@server:/path/to/app/public/
   ssh user@server "cd /path/to/app && npm install --production && npx prisma migrate deploy"
   # Restart via cPanel API atau manual di cPanel

   Catatan: PM2 tidak tersedia di shared hosting cPanel. Proses Node.js dikelola
   sepenuhnya oleh Phusion Passenger — tidak perlu (dan tidak bisa) menggunakan PM2.

3. Buat checklist-deployment.md:
   Pre-deployment:
   - [ ] Build berhasil tanpa error
   - [ ] Semua env variables sudah diset
   - [ ] Database sudah dibuat
   - [ ] DNS sudah pointed ke server

   Post-deployment:
   - [ ] Homepage dapat diakses
   - [ ] Login admin berhasil
   - [ ] Buat 1 produk test
   - [ ] Lakukan test order dengan payment sandbox RajaOngkir
   - [ ] Verifikasi webhook URL di dashboard RajaOngkir → [domain]/api/payments/webhook
   - [ ] Test notifikasi webhook diterima dan order status berubah
   - [ ] Test generate AWB dan print label
   - [ ] Test QRIS dinamis terbuat dengan nominal yang benar
   - [ ] Cek email konfirmasi terkirim
   - [ ] Setup cPanel Cron Job: */15 * * * * curl -s -H "Authorization: Bearer [CRON_SECRET]" https://[domain]/api/cron/publish-scheduled
   - [ ] Test auto-publish: buat blog post SCHEDULED dengan waktu lampau, tunggu cron run
   - [ ] Verifikasi Google Search Console
   - [ ] Submit sitemap ke GSC
   - [ ] Test Lighthouse score

4. Konfigurasi RajaOngkir untuk production:
   - Aktifkan akun di dashboard rajaongkir.com
   - Daftarkan QRIS statis dan salin ID ke env RAJAONGKIR_STATIC_QRIS_ID
   - Set webhook URL: https://[domain]/api/payments/webhook
   - Salin Webhook Secret ke env RAJAONGKIR_WEBHOOK_SECRET
   - Set origin kota pengiriman ke env RAJAONGKIR_ORIGIN_CITY_ID

5. Tambahkan robots.txt rule untuk admin:
   Disallow: /admin
   Disallow: /api/
   Sitemap: https://domain.com/sitemap.xml
```

---

---

## Panduan Penggunaan Dokumen Ini

### Cara Memulai Session Baru

Setiap kali memulai percakapan baru dengan AI agent:

```
1. Buka session baru (percakapan baru)
2. Paste "Template Prompt" dari session yang akan dikerjakan
3. Lampirkan file yang relevan dari "Konteks" jika diminta
4. Selesaikan dan verifikasi output
5. Tandai session sebagai done di dokumen ini
6. Lanjut ke session berikutnya
```

### Aturan Konteks Handoff

Saat melanjutkan ke session berikutnya yang bergantung pada session sebelumnya:

```
Tambahkan di awal prompt:
"Saya sedang melanjutkan pembangunan [nama fitur].
Yang sudah selesai dibangun:
- [Session X]: [hasil session sebelumnya]
- [Session Y]: [hasil session sebelumnya]

File yang relevan untuk session ini:
- [path/file.tsx]: [deskripsi singkat]
- [lib/something.ts]: [deskripsi singkat]

Sekarang saya ingin membangun: [nama session ini]"
```

### Tracking Progress

Centang setiap session yang sudah selesai:

```
Phase 0:  [_] 0.1  [_] 0.2  [_] 0.3
Phase 1:  [_] 1.1  [_] 1.2
Phase 2:  [_] 2.1  [_] 2.2  [_] 2.3
Phase 3:  [_] 3.1  [_] 3.2  [_] 3.3
Phase 4:  [_] 4.1  [_] 4.2
Phase 5:  [_] 5.1  [_] 5.2
Phase 6:  [_] 6.1  [_] 6.2  [_] 6.3  [_] 6.4
Phase 7:  [_] 7.1  [_] 7.2  [_] 7.3
Phase 8:  [_] 8.1  [_] 8.2  [_] 8.3
Phase 9:  [_] 9.1  [_] 9.2
Phase 10: [_] 10.1 [_] 10.2
Phase 11: [_] 11.1 [_] 11.2
```

---

*Dokumen ini adalah living document. Update tracking progress dan catatan per session sesuai perkembangan implementasi.*
