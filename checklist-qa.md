# QA Checklist — HAGE CLUB E-Commerce

> **Project:** HAGE CLUB — Premium Automotive Lifestyle Fashion Brand
> **Stack:** Next.js 14 (App Router), Prisma + MySQL, Tailwind CSS, NextAuth.js
> **Status:** Pre-Deployment QA

---

## 1. FUNCTIONAL TESTING — Public User Flows

### 1.1 Authentication
- [ ] **Register**: User dapat mendaftar dengan email, password, name, phone
- [ ] **Register validation**: Email format, password min 8 + uppercase + number, match confirm
- [ ] **Login**: User dapat login dengan email + password
- [ ] **Login error**: Wrong email/password menampilkan pesan error
- [ ] **Session**: User tetap login setelah refresh (NextAuth JWT)
- [ ] **Logout**: User dapat logout, session terhapus
- [ ] **Forgot password**: User dapat request reset password
- [ ] **Reset password**: User dapat reset password via token
- [ ] **Rate limiting**: Login/register tidak bisa brute force

### 1.2 Product Browsing
- [ ] **Homepage**: Menampilkan produk featured, kategori, branding
- [ ] **PLP (Product List Page)**: `/shop` menampilkan semua produk published
- [ ] **PLP filter**: Filter by category berfungsi
- [ ] **PLP search**: Search by nama produk berfungsi
- [ ] **PLP pagination**: Load more / pagination berfungsi
- [ ] **PLP empty state**: Kategori tanpa produk menampilkan pesan kosong
- [ ] **PDP**: `/products/[slug]` menampilkan detail produk
- [ ] **PDP gallery**: Image gallery dengan zoom/thumbnails
- [ ] **PDP variants**: User dapat memilih variant (size/warna)
- [ ] **PDP stock**: Out of stock ditampilkan, add-to-cart disabled
- [ ] **Related products**: Menampilkan produk terkait

### 1.3 Cart
- [ ] **Add to cart**: Produk masuk ke cart
- [ ] **Variant in cart**: Produk dengan variant berbeda dianggap item terpisah
- [ ] **Quantity**: User dapat menambah/mengurangi quantity
- [ ] **Cart limit**: Quantity tidak melebihi stock
- [ ] **Remove**: User dapat remove item dari cart
- [ ] **Persist**: Cart items tetap ada setelah refresh (localStorage via Zustand persist)
- [ ] **Empty cart**: Empty state dengan CTA ke shop
- [ ] **Mini cart**: Mini cart drawer menampilkan item dan total
- [ ] **Coupon input**: User dapat memasukkan kode kupon
- [ ] **Coupon feedback**: Kupon valid/invalid menampilkan pesan

### 1.4 Checkout
- [ ] **Cart → Checkout**: Redirect dari cart ke `/checkout`
- [ ] **Empty cart redirect**: Checkout dengan cart kosong redirect ke `/cart`
- [ ] **Customer form**: Nama, email, phone dengan validasi
- [ ] **Address form**: Recipient, phone, provinsi, kota, kecamatan, alamat, kodepos
- [ ] **Provinsi picker**: Provinsi dari API RajaOngkir
- [ ] **City picker**: Kota berubah sesuai provinsi yang dipilih
- [ ] **Shipping selector**: Ongkir dari RajaOngkir berdasarkan kota tujuan
- [ ] **Multiple couriers**: JNE, J&T, SiCepat, dsb
- [ ] **Payment method**: VA / E-Wallet / QRIS selector
- [ ] **Order notes**: Optional notes field
- [ ] **Applied coupon**: Coupon menampilkan detail diskon
- [ ] **Order summary**: Menampilkan subtotal, ongkir, diskon, total
- [ ] **Place order**: Submit order, loading state, success redirect

### 1.5 Checkout — Guest vs Login
- [ ] **Guest checkout**: Tanpa login, order dibuat dengan guestName/guestEmail
- [ ] **Logged-in checkout**: User yang login, order terhubung ke akun
- [ ] **Session restore**: Checkout form di-save ke sessionStorage (refresh aman)

### 1.6 Account (Logged-in User)
- [ ] **Order history**: `/account/orders` menampilkan daftar order
- [ ] **Order detail**: `/account/orders/[id]` menampilkan detail order
- [ ] **Address management**: CRUD alamat pengiriman
- [ ] **Profile**: Update nama, email, phone
- [ ] **Wishlist**: Tambah/hapus product dari wishlist

### 1.7 Track Order
- [ ] **Public tracking**: `/track-order` dengan input order number
- [ ] **Order status**: Menampilkan status order + timeline

---

## 2. CHECKOUT FLOW — Detailed

### 2.1 Stock Validation
- [ ] **Stok cukup → checkout sukses**
- [ ] **Stok tidak cukup → error 409**, order not created
- [ ] **Stok berkurang setelah checkout sukses** (product.stock decrement)
- [ ] **Race condition**: 2 user checkout produk sama di waktu bersamaan → stock tidak negatif
- [ ] **Variant stock**: Checkout dengan variant mengurangi variant.stock saja (tidak double decrement)

### 2.2 Coupon
- [ ] **Kupon valid → diskon diterapkan**
- [ ] **Kupon percentage**: Discount = subtotal * value / 100
- [ ] **Kupon fixed**: Discount = min(value, subtotal)
- [ ] **Free shipping**: Shipping cost = 0
- [ ] **Max discount**: Percentage discount capped
- [ ] **Min purchase**: Subtotal < minPurchase → error
- [ ] **Kadaluwarsa**: Kupon expired → error
- [ ] **Usage limit**: Kupon sudah limit → error
- [ ] **Used count increment**: Hanya sekali total (saat payment confirmed, bukan saat order dibuat)
- [ ] **Kupon tidak double-count**: Order + webhook → usedCount +1, bukan +2

### 2.3 RajaOngkir Shipping
- [ ] **Provinsi list**: Load dari API RajaOngkir → success
- [ ] **Kota list**: Load sesuai provinsi
- [ ] **Ongkir**: Biaya sesuai berat, kota asal, kota tujuan
- [ ] **Weight**: Menggunakan weight total dari cart item
- [ ] **API error handling**: RajaOngkir down → tampilkan pesan error user-friendly

### 2.4 Order Creation
- [ ] **Harga dari DB**: Harga diambil dari database, bukan dari client
- [ ] **Total kalkulasi**: subtotal - discount + shippingCost = total
- [ ] **Order number**: Generate unique order number
- [ ] **Status history**: OrderStatusHistory terisi (PENDING → ...)
- [ ] **Payment record**: Payment record created dengan status PENDING
- [ ] **Input validation**: Zod schema validate all inputs
- [ ] **Transaction**: Order + items + payment dalam 1 transaction → rollback jika gagal

---

## 3. PAYMENT TESTING (Sandbox)

### 3.1 Virtual Account
- [ ] **VA number**: PaymentResult berisi vaNumber
- [ ] **VA display**: VA number ditampilkan dengan copy button
- [ ] **VA countdown**: Expiry time countdown visible
- [ ] **VA payment flow**: User bayar via mobile/internet banking
- [ ] **VA webhook**: Webhook diterima, status jadi PAID

### 3.2 QRIS
- [ ] **QRIS image**: QRIS URL ditampilkan sebagai gambar QR
- [ ] **QRIS dynamic**: Amount sesuai total order
- [ ] **QRIS expiry**: QRIS memiliki masa berlaku
- [ ] **QRIS webhook**: Webhook diterima, status jadi PAID

### 3.3 E-Wallet
- [ ] **Payment URL**: User diarahkan ke URL pembayaran
- [ ] **Webhook**: Notifikasi otomatis dari RajaOngkir

### 3.4 Webhook
- [ ] **Signature verification**: HMAC-SHA256 signature diverifikasi
- [ ] **Idempotent**: Webhook duplikat tidak mengubah status
- [ ] **Order lookup**: Cari by orderId → fallback ke orderNumber
- [ ] **PAID →** order status = PAID, payment status = PAID, paidAt terisi
- [ ] **FAILED →** order status = CANCELLED, stock restored
- [ ] **EXPIRED →** order status = CANCELLED, stock restored
- [ ] **REFUND →** order status = REFUNDED, stock restored
- [ ] **Email notification**: Email terkirim ke customer saat PAID
- [ ] **Return 200**: Always return 200 (RajaOngkir retry policy)

### 3.5 Payment Failures
- [ ] **Payment creation failed**: Order CANCELLED, stock dikembalikan
- [ ] **User tidak bayar**: Order tetap PENDING, bisa dibatalkan admin
- [ ] **User bayar kurang**: Harusnya tidak mungkin (RajaOngkir handles)
- [ ] **Gagal bayar**: Product stock dikembalikan (webhook CANCELLED → restore)

### 3.6 Email Notifications
- [ ] **Order confirmation email**: Terkirim via admin panel (manual trigger)
- [ ] **Payment confirmed email**: Otomatis dari webhook PAID
- [ ] **Shipped email**: Manual trigger dari admin
- [ ] **Email content**: Correct order number, items, total, payment info

---

## 4. ADMIN CMS TESTING

### 4.1 Dashboard
- [ ] **Stats**: Total orders, revenue, products, customers
- [ ] **Recent orders**: Table order terbaru
- [ ] **Quick actions**: Shortcut ke fungsi umum

### 4.2 Products
- [ ] **Create**: Create product dengan semua field
- [ ] **Edit**: Edit product, variant, images
- [ ] **Delete**: Delete product (soft? nonaktifkan status?)
- [ ] **Status toggle**: DRAFT → PUBLISHED → ARCHIVED
- [ ] **Variants**: CRUD variants (name, SKU, price, stock)
- [ ] **Images**: Upload via Cloudinary / URL
- [ ] **SEO fields**: SEO title, description, keywords
- [ ] **Validation**: Nama, SKU, price, stock wajib diisi
- [ ] **Categories**: Assign kategori ke produk

### 4.3 Orders
- [ ] **List**: Semua orders dengan filter status
- [ ] **Detail**: Order items, payment info, shipping, timeline
- [ ] **Status update**: Validasi transisi status (PENDING→PAID→PROCESSING→...)
- [ ] **Invalid transition**: Error jika status lompat
- [ ] **Tracking number**: Input tracking number
- [ ] **Stock restore**: CANCELLED/REFUNDED → stock dikembalikan
- [ ] **Notify customer**: Kirim email notification manual

### 4.4 Customers
- [ ] **List**: Semua customers dengan search
- [ ] **Detail**: Order history, profile, addresses
- [ ] **Segment badges**: VIP/REGULAR/NEW

### 4.5 Coupons
- [ ] **Create**: All coupon types (PERCENTAGE, FIXED, FREE_SHIPPING)
- [ ] **Edit**: Edit coupon fields
- [ ] **Delete**: Delete coupon
- [ ] **Usage tracking**: usedCount terupdate
- [ ] **Date validation**: Start/end date honored

### 4.6 Blog
- [ ] **CRUD**: Create, read, update, delete blog posts
- [ ] **Rich text editor**: Markdown editor berfungsi
- [ ] **Categories**: CRUD blog categories
- [ ] **Tags**: Input tags
- [ ] **Status**: DRAFT → PUBLISHED → SCHEDULED
- [ ] **Author**: Author terisi dari admin yang login
- [ ] **Featured image**: Pilih dari media library
- [ ] **Reading time**: Auto-calculated

### 4.7 Media Library
- [ ] **Upload**: Upload image via form
- [ ] **Grid view**: Thumbnail grid dengan pagination
- [ ] **Edit**: Update alt text, folder
- [ ] **Delete**: Hapus media
- [ ] **Folder filter**: Filter by folder

### 4.8 SEO Settings
- [ ] **Page selector**: Select page dari sidebar
- [ ] **SEO title**: Input with 70 char limit
- [ ] **Meta description**: Textarea with 160 char limit
- [ ] **OG image**: URL input
- [ ] **Canonical URL**: Custom canonical
- [ ] **Structured data**: JSON-LD editor
- [ ] **Saved indicator**: Dot indicator untuk page yang sudah ada settings

### 4.9 Admin Users
- [ ] **CRUD**: Create, edit, delete admin users
- [ ] **Roles**: ADMIN, EDITOR, CS
- [ ] **Self-delete protection**: Cannot delete own account
- [ ] **Password**: Hash with bcrypt 12 rounds

### 4.10 Settings (Integrations)
- [ ] **RajaOngkir**: API key, base URL, origin city, couriers
- [ ] **Payment**: VA banks, e-wallet, QRIS, free shipping threshold
- [ ] **QRISLY**: API key, merchant ID, static QRIS ID, expiry
- [ ] **Analytics**: GA4 ID, Meta Pixel ID, GSC verification
- [ ] **WhatsApp**: Number, default message, button position
- [ ] **Reveal/Hide**: Secret field toggle
- [ ] **Save flow**: Per-group save button
- [ ] **Webhook URL**: Display + copy button

### 4.11 Admin Roles & Permissions
- [ ] **ADMIN**: Full access to all features
- [ ] **EDITOR**: Can manage products, blog, orders, media
- [ ] **CS**: Can view orders, update order status, manage customers
- [ ] **Middleware**: Block non-admin roles from `/api/admin/*` destructive endpoints
- [ ] **API guards**: Each route checks session role

---

## 5. BLOG & STATIC PAGES

### 5.1 Blog Public
- [ ] **Blog listing**: `/blog` menampilkan published posts
- [ ] **Category filter**: Filter posts by category
- [ ] **Hero article**: First article ditampilkan hero layout
- [ ] **Pagination**: Load more / pagination
- [ ] **Article detail**: `/blog/[slug]` menampilkan full article
- [ ] **Markdown rendering**: Headers, bold, italic, links, images, code, blockquote
- [ ] **Related articles**: Same category, exclude current
- [ ] **Share buttons**: Twitter, WhatsApp, Copy link
- [ ] **Newsletter signup**: Email subscribe
- [ ] **Breadcrumb**: Blog > Category > Article
- [ ] **SSG + ISR**: Static generation dengan revalidate 300s
- [ ] **Category page**: `/blog/category/[slug]`

### 5.2 Static Pages
- [ ] **About**: `/about` — brand story, values, CTA
- [ ] **Contact**: `/contact` — form + info + response time
- [ ] **FAQ**: `/faq` — 10 accordion FAQ items
- [ ] **Privacy Policy**: `/privacy-policy`
- [ ] **Terms**: `/terms-conditions`
- [ ] **Shipping Info**: `/shipping-info` — rates, delivery estimates

---

## 6. SEO & PERFORMANCE

### 6.1 Metadata
- [ ] **Global metadata**: Default title, description, OG, Twitter card
- [ ] **Homepage**: WebPage schema, metadata
- [ ] **PLP/PDP**: Dynamic title, description, product schema
- [ ] **Blog**: Article schema, breadcrumb, OG tags
- [ ] **FAQ**: FAQPage schema
- [ ] **404**: Not found page metadata

### 6.2 Structured Data (JSON-LD)
- [ ] **Organization schema**: On all pages
- [ ] **Website schema**: With SearchAction
- [ ] **Product schema**: On each PDP — valid Brand + Offer
- [ ] **Breadcrumb schema**: On PDP, blog detail
- [ ] **Article schema**: On blog detail — valid Person author + Organization publisher
- [ ] **FAQPage schema**: On /faq
- [ ] **WebPage schema**: On homepage
- [ ] **Validate**: All schemas pass Google Rich Results Test

### 6.3 Technical SEO
- [ ] **Sitemap**: `/sitemap.xml` accessible, includes all pages
- [ ] **Robots.txt**: `/robots.txt` correct — allow public, disallow admin/api
- [ ] **Canonical**: All pages have canonical URL
- [ ] **Meta robots**: index, follow on public pages
- [ ] **GSC verification**: Meta tag terpasang (via settings)
- [ ] **Open Graph**: OG title, description, image, locale, type
- [ ] **Twitter card**: Summary large image

### 6.4 Performance
- [ ] **Lighthouse mobile**: Score > 70 untuk homepage, PLP, PDP
- [ ] **Lighthouse desktop**: Score > 90
- [ ] **Image optimization**: next/image with proper sizes
- [ ] **Bundle size**: No excessive JS bundles
- [ ] **SSG/ISR**: Blog, static pages statically generated
- [ ] **API routes**: Dynamic only — no static optimization

---

## 7. SECURITY

### 7.1 Authentication & Authorization
- [ ] **Admin routes**: `/admin/*` blocked for non-authenticated
- [ ] **Admin API**: `/api/admin/*` returns 401/403 without ADMIN role
- [ ] **Account routes**: `/account/*` redirects to login for non-authenticated
- [ ] **Webhook**: Excluded from middleware auth
- [ ] **API token check**: Each route checks session.user.role

### 7.2 Input Validation
- [ ] **API validation**: Zod schemas on all POST/PUT endpoints
- [ ] **XSS**: User-generated content rendered safely (no dangerouslySetInnerHTML on user input)
- [ ] **SQL injection**: Prisma prepared statements (safe by design)
- [ ] **Price manipulation**: Harga diambil dari DB setiap checkout, bukan dari client
- [ ] **Quantity manipulation**: Quantity validated against DB stock

### 7.3 Payment Security
- [ ] **Webhook signature**: HMAC-SHA256 verification
- [ ] **Idempotent webhook**: Status tidak berubah untuk event duplikat
- [ ] **Payment amount**: Amount from DB, not from webhook payload
- [ ] **Order lookup**: Webhook validates order exists before update

### 7.4 Data Protection
- [ ] **Secrets masked**: API keys, secrets ditampilkan sebagai `••••••••`
- [ ] **Password hashing**: bcrypt 12 rounds
- [ ] **Email disclosure**: No email enumeration on login
- [ ] **Session security**: JWT with secure httpOnly cookies
- [ ] **CORS**: API tidak bisa diakses dari domain lain

---

## 8. MOBILE RESPONSIVENESS

### 8.1 Public Pages
- [ ] **Homepage**: Full-width on mobile, correct spacing
- [ ] **PLP**: Grid responsive (2 columns mobile, 3-4 desktop)
- [ ] **PDP**: Single column mobile, 2 columns desktop
- [ ] **Blog**: Card grid responsive
- [ ] **Blog detail**: Readable text size, no horizontal scroll

### 8.2 Cart & Checkout
- [ ] **Cart**: Responsive table/list, quantity controls touch-friendly
- [ ] **Checkout**: Single column mobile, 2 columns desktop
- [ ] **Payment display**: Copy VA number, QRIS image fits screen
- [ ] **Success page**: Centered content, touch-friendly buttons

### 8.3 Navigation
- [ ] **Header**: Hamburger menu on mobile
- [ ] **Mobile drawer**: Menu items correct, scrollable
- [ ] **Mini cart**: Drawer overlay on mobile
- [ ] **Search**: Search bar/overlay on mobile

### 8.4 Admin (Desktop only — warn)
- [ ] **Tables**: Horizontal scroll on small screens
- [ ] **Forms**: Stack layout on narrow viewport
- [ ] **Media grid**: 2 columns mobile, 4-5 columns desktop
- [ ] **Sidebar**: Collapsible/menu toggle

---

## 9. ANALYTICS & INTEGRATIONS

- [ ] **GA4**: Script terpasang di public layout (from settings)
- [ ] **Meta Pixel**: Pixel terpasang + PageView event (from settings)
- [ ] **GA4 events**: page_view, view_item, add_to_cart, purchase, search
- [ ] **Meta events**: PageView, ViewContent, AddToCart, Purchase, Search
- [ ] **GSC verification**: Meta tag terpasang (from settings)
- [ ] **WhatsApp button**: Floating button di public pages
- [ ] **WhatsApp click**: Opens `wa.me` with default message
- [ ] **Button position**: Configurable left/right (from settings)

---

## 10. EDGE CASES & ERROR HANDLING

- [ ] **Product not found**: 404 page
- [ ] **Blog not found**: Not found message
- [ ] **Empty cart**: Empty state
- [ ] **Empty orders**: Empty state for account orders
- [ ] **Empty blog**: Empty state for blog listing
- [ ] **RajaOngkir API down**: Graceful error, no white screen
- [ ] **Payment creation fails**: Order cancelled, user informed
- [ ] **Email sending fails**: Order still goes through, logged
- [ ] **Server error**: Generic error message, logged server-side
- [ ] **Invalid slug**: Redirect or 404
- [ ] **Direct URL access**: No broken pages
- [ ] **Session expired**: Redirect to login, not error
- [ ] **Invalid coupon code**: User-friendly message
- [ ] **Out of stock during checkout**: Error message on submit

---

## 11. BUILD & DEPLOYMENT

- [ ] **`next build`**: Passes without errors
- [ ] **ESLint**: No errors (warnings OK but review)
- [ ] **TypeScript**: No type errors
- [ ] **Prisma generate**: Schema up to date
- [ ] **Environment variables**: All required vars documented in .env.example
- [ ] **Database migration**: `prisma db push` or migrate works
- [ ] **Seed data**: `prisma seed` runs successfully
- [ ] **Static pages**: Generate correct HTML (check output sizes)
- [ ] **API routes**: Dynamic, not statically optimized
- [ ] **Cron endpoint**: `/api/cron/publish-scheduled` accessible with CRON_SECRET

---

## 12. REGRESSION TESTING (Post-Fix)

- [ ] **Checkout flow**: Full flow after each critical fix
- [ ] **Stock consistency**: Check product.stock + variant.stock after multiple checkouts
- [ ] **Coupon usage**: usedCount exactly matches successful payments
- [ ] **Webhook processing**: Payment flow end-to-end
- [ ] **Admin permissions**: EDITOR can access non-destructive admin APIs
