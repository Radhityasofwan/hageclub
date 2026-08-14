import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Super Admin
  const adminEmail = "admin@hageclub.com";
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("merdeka", 12);
    const admin = await db.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        profile: {
          create: {
            firstName: "Admin",
            lastName: "HAGE CLUB",
            phone: "+6281234567890",
          },
        },
      },
    });
    console.log(`✅ Admin user created: ${admin.email}`);
  } else {
    console.log(`⏭️  Admin user already exists: ${adminEmail}`);
  }

  // Editor
  const editorEmail = "editor@hageclub.com";
  const existingEditor = await db.user.findUnique({ where: { email: editorEmail } });

  if (!existingEditor) {
    const passwordHash = await bcrypt.hash("merdeka", 12);
    const editor = await db.user.create({
      data: {
        email: editorEmail,
        passwordHash,
        role: "EDITOR",
        profile: {
          create: {
            firstName: "Editor",
            lastName: "HAGE CLUB",
            phone: "+6281234567891",
          },
        },
      },
    });
    console.log(`✅ Editor user created: ${editor.email}`);
  } else {
    console.log(`⏭️  Editor user already exists: ${editorEmail}`);
  }

  // Customer Service
  const csEmail = "cs@hageclub.com";
  const existingCs = await db.user.findUnique({ where: { email: csEmail } });

  if (!existingCs) {
    const passwordHash = await bcrypt.hash("merdeka", 12);
    const cs = await db.user.create({
      data: {
        email: csEmail,
        passwordHash,
        role: "CS",
        profile: {
          create: {
            firstName: "Customer",
            lastName: "Service",
            phone: "+6281234567892",
          },
        },
      },
    });
    console.log(`✅ CS user created: ${cs.email}`);
  } else {
    console.log(`⏭️  CS user already exists: ${csEmail}`);
  }

  // Customer (for testing front-end account)
  const customerEmail = "customer@hageclub.com";
  const existingCustomer = await db.user.findUnique({ where: { email: customerEmail } });

  if (!existingCustomer) {
    const passwordHash = await bcrypt.hash("merdeka", 12);
    const customer = await db.user.create({
      data: {
        email: customerEmail,
        passwordHash,
        role: "CUSTOMER",
        emailVerified: true,
        profile: {
          create: {
            firstName: "Customer",
            lastName: "Demo",
            phone: "+6281234567893",
          },
        },
      },
    });
    console.log(`✅ Customer user created: ${customer.email}`);
  } else {
    // Ensure existing seed customer is verified
    await db.user.update({ where: { email: customerEmail }, data: { emailVerified: true } });
    console.log(`⏭️  Customer user already exists: ${customerEmail}`);
  }

  // Product Categories
  const categories = [
    {
      name: "Polo",
      slug: "polo",
      description: "Premium polo shirts from HAGE CLUB with refined comfort and style.",
      sortOrder: 1,
    },
    {
      name: "Hoodie",
      slug: "hoodie",
      description: "Comfortable and stylish hoodies for the automotive lifestyle.",
      sortOrder: 2,
    },
    {
      name: "Jacket",
      slug: "jacket",
      description: "Premium jackets crafted for quality and authenticity.",
      sortOrder: 3,
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Complete your look with HAGE CLUB accessories.",
      sortOrder: 4,
    },
  ];

  for (const cat of categories) {
    const existing = await db.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      await db.category.create({ data: cat });
      console.log(`✅ Category created: ${cat.name}`);
    } else {
      console.log(`⏭️  Category already exists: ${cat.name}`);
    }
  }

  // Blog Categories
  const blogCategories = [
    {
      name: "Otomotif",
      slug: "otomotif",
      description: "Artikel seputar dunia otomotif dan komunitas garage.",
    },
    {
      name: "Lifestyle",
      slug: "lifestyle",
      description: "Gaya hidup dan inspirasi dari komunitas HAGE CLUB.",
    },
  ];

  for (const cat of blogCategories) {
    const existing = await db.blogCategory.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      await db.blogCategory.create({ data: cat });
      console.log(`✅ Blog category created: ${cat.name}`);
    } else {
      console.log(`⏭️  Blog category already exists: ${cat.name}`);
    }
  }

  // System Settings
  const systemSettings = [
    // RajaOngkir — Cek Ongkir API V2 (rajaongkir.komerce.id/api/v1)
    {
      key: "rajaongkir_api_key",
      group: "rajaongkir",
      label: "API Key",
      hint: "API key dari dashboard RajaOngkir (produk Shipping Cost)",
      isSecret: true,
      value: null,
    },
    {
      key: "rajaongkir_base_url",
      group: "rajaongkir",
      label: "Base URL",
      hint: "URL endpoint API RajaOngkir V2. Default: https://rajaongkir.komerce.id/api/v1",
      isSecret: false,
      value: "https://rajaongkir.komerce.id/api/v1",
    },
    {
      key: "rajaongkir_origin_city_id",
      group: "rajaongkir",
      label: "ID Wilayah Asal Pengiriman",
      hint: "ID wilayah (district/subdistrict) dari RajaOngkir V2 untuk lokasi gudang/toko",
      isSecret: false,
      value: null,
    },
    {
      key: "rajaongkir_origin_label",
      group: "rajaongkir",
      label: "Wilayah Asal (label)",
      hint: "Label tampilan wilayah asal — diisi otomatis oleh form admin",
      isSecret: false,
      value: null,
    },
    {
      key: "rajaongkir_couriers",
      group: "rajaongkir",
      label: "Kurir Aktif",
      hint: "Daftar kurir dipisah koma (kode V2). Contoh: jnt,sicepat,jne,anteraja,pos",
      isSecret: false,
      value: "jnt,sicepat,jne",
    },
    // RajaOngkir — Shipping Delivery (AWB, Pickup, Tracking, Print Label)
    {
      key: "rajaongkir_webhook_secret",
      group: "rajaongkir",
      label: "Webhook Secret",
      hint: "Secret key untuk verifikasi tanda tangan (HMAC-SHA256) webhook notifikasi pengiriman",
      isSecret: true,
      value: null,
    },
    // Komerce Payment Service (VA & QRIS — api.collaborator.komerce.id/user)
    {
      key: "komerce_payment_api_key",
      group: "komerce_payment",
      label: "API Key",
      hint: "API key dari Merchant Dashboard Komerce (produk Payment Service)",
      isSecret: true,
      value: null,
    },
    {
      key: "komerce_payment_base_url",
      group: "komerce_payment",
      label: "Base URL / Environment",
      hint: "Sandbox (testing): https://api-sandbox.collaborator.komerce.id/user/ — Production: https://api.collaborator.komerce.id/user/",
      isSecret: false,
      value: "https://api-sandbox.collaborator.komerce.id/user/",
    },
    {
      key: "komerce_payment_callback_api_key",
      group: "komerce_payment",
      label: "Callback API Key",
      hint: "Secret untuk verifikasi webhook callback (HMAC-SHA256) — generate sendiri, wajib jika callback URL dipakai",
      isSecret: true,
      value: null,
    },
    {
      key: "komerce_payment_expiry_duration",
      group: "komerce_payment",
      label: "Expiry VA (detik)",
      hint: "Masa berlaku VA, minimal 3600 (1 jam). Default 86400 (24 jam). QRIS fixed 5 menit.",
      isSecret: false,
      value: "86400",
    },
    // Komerce Shared — satu toggle environment untuk semua layanan collaborator.komerce.id
    // (Payment, QRISLY, Komship semuanya berbagi domain yang sama dan satu toggle di dashboard)
    {
      key: "komerce_environment",
      group: "komerce_payment",
      label: "Environment Komerce (Bersama)",
      hint: "sandbox = testing (tidak ada transaksi nyata). production = live (VA/QRIS/pengiriman sungguhan). Mengubah ini menyinkronkan Payment, QRISLY, dan Komship sekaligus.",
      isSecret: false,
      value: "sandbox",
    },
    // Komship — Shipping Delivery (Store Order, Pickup, Label, Tracking)
    {
      key: "komship_api_key",
      group: "komship",
      label: "API Key",
      hint: "API key dari dashboard Komerce (produk Komship / Shipping Delivery)",
      isSecret: true,
      value: null,
    },
    {
      key: "komship_base_url",
      group: "komship",
      label: "Base URL / Environment",
      hint: "Sandbox (testing): https://api-sandbox.collaborator.komerce.id/ — Production: https://api.collaborator.komerce.id/",
      isSecret: false,
      value: "https://api-sandbox.collaborator.komerce.id/",
    },
    {
      key: "komship_brand_name",
      group: "komship",
      label: "Nama Brand",
      hint: "Nama brand yang tampil pada label pengiriman",
      isSecret: false,
      value: null,
    },
    {
      key: "komship_shipper_name",
      group: "komship",
      label: "Nama Pengirim",
      hint: "Nama pengirim paket (tampil di label)",
      isSecret: false,
      value: null,
    },
    {
      key: "komship_shipper_phone",
      group: "komship",
      label: "No. HP Pengirim",
      hint: "Harus diawali 0 atau 62 (contoh: 081234567890, bukan +62...)",
      isSecret: false,
      value: null,
    },
    {
      key: "komship_shipper_email",
      group: "komship",
      label: "Email Pengirim",
      hint: "Email pengirim (wajib)",
      isSecret: false,
      value: null,
    },
    {
      key: "komship_shipper_destination_id",
      group: "komship",
      label: "Wilayah Asal (ID destination)",
      hint: "ID wilayah asal dari pencarian lokasi Komship — diisi otomatis oleh form admin",
      isSecret: false,
      value: null,
    },
    {
      key: "komship_shipper_address",
      group: "komship",
      label: "Alamat Pengirim",
      hint: "Alamat lengkap pengirim untuk penjemputan",
      isSecret: false,
      value: null,
    },
    {
      key: "komship_origin_pin_point",
      group: "komship",
      label: "Pin Point Asal (opsional)",
      hint: "Geolokasi lat,lng asal — wajib hanya untuk kurir instant (GoSend)",
      isSecret: false,
      value: null,
    },
    {
      key: "komship_default_pickup_vehicle",
      group: "komship",
      label: "Kendaraan Pickup Default",
      hint: "Motor / Mobil / Truk — dipakai saat menjadwalkan pickup",
      isSecret: false,
      value: "Motor",
    },
    {
      key: "komship_commodity_code",
      group: "komship",
      label: "Commodity Code (opsional)",
      hint: "Kode klasifikasi barang — WAJIB untuk kurir LION",
      isSecret: false,
      value: null,
    },
    // Bank VA default — dikelola di halaman Settings → Pembayaran (Komerce Payment)
    {
      key: "payment_va_banks",
      group: "komerce_payment",
      label: "Bank VA Default",
      hint: "Bank yang dipakai saat checkout Virtual Account, pisahkan koma. Contoh: BCA,BNI,BRI,MANDIRI",
      isSecret: false,
      value: "BCA,BNI,BRI,MANDIRI",
    },
    // QRISLY — Generate QRIS Statis ke Dinamis
    {
      key: "qrisly_api_key",
      group: "qrisly",
      label: "QRISLY API Key",
      hint: "API key dari dashboard QRISLY untuk menggenerate QRIS dinamis dari QRIS statis",
      isSecret: true,
      value: null,
    },
    {
      key: "qrisly_base_url",
      group: "qrisly",
      label: "QRISLY Base URL",
      hint: "Base URL API QRISLY (sandbox/production)",
      isSecret: false,
      value: null,
    },
    {
      key: "qrisly_qris_id",
      group: "qrisly",
      label: "QRIS ID (hasil upload)",
      hint: "qris_id dari upload QRIS statis — dipakai sebagai basis semua QRIS dinamis",
      isSecret: false,
      value: null,
    },
    {
      key: "qrisly_merchant_name",
      group: "qrisly",
      label: "Merchant Name (hasil upload)",
      hint: "Nama merchant sesuai hasil upload QRIS statis",
      isSecret: false,
      value: null,
    },
    {
      key: "qrisly_provider",
      group: "qrisly",
      label: "Provider QRIS",
      hint: "Penyedia QRIS dari hasil upload (mis. DANA)",
      isSecret: false,
      value: null,
    },
    // Analytics & Tracking — GA4, Meta Pixel, Google Search Console
    {
      key: "analytics_ga4_id",
      group: "analytics",
      label: "GA4 Measurement ID",
      hint: "Google Analytics 4 Measurement ID (format: G-XXXXXXXXXX). Biarkan kosong jika tidak digunakan.",
      isSecret: false,
      value: null,
    },
    {
      key: "analytics_meta_pixel_id",
      group: "analytics",
      label: "Meta Pixel ID",
      hint: "Meta Pixel / Facebook Pixel ID (angka, contoh: 1234567890). Biarkan kosong jika tidak digunakan.",
      isSecret: false,
      value: null,
    },
    {
      key: "analytics_gsc_verification",
      group: "analytics",
      label: "Google Search Console Verification",
      hint: "Kode verifikasi Google Search Console (hanya konten dari meta tag). Atur juga NEXT_PUBLIC_GSC_VERIFICATION di .env.local untuk meta tag di root layout.",
      isSecret: false,
      value: null,
    },
    // WhatsApp Integration
    {
      key: "whatsapp_number",
      group: "whatsapp",
      label: "Nomor WhatsApp Bisnis",
      hint: "Nomor WhatsApp dengan kode negara, tanpa + atau spasi. Contoh: 6281234567890",
      isSecret: false,
      value: null,
    },
    {
      key: "whatsapp_default_message",
      group: "whatsapp",
      label: "Pesan Default WhatsApp",
      hint: "Pesan default yang muncul di chat WhatsApp (URL-encoded). Contoh: Halo%20HAGE%20CLUB%2C%20saya%20ingin%20bertanya",
      isSecret: false,
      value: "Halo%20HAGE%20CLUB%2C%20saya%20ingin%20bertanya",
    },
    {
      key: "whatsapp_button_position",
      group: "whatsapp",
      label: "Posisi Tombol WhatsApp",
      hint: "Posisi floating button WhatsApp di halaman publik. Opsi: right, left",
      isSecret: false,
      value: "right",
    },
    {
      key: "whatsapp_group_url",
      group: "whatsapp",
      label: "Link Grup WhatsApp",
      hint: "Link undangan grup WhatsApp (opsional). Ditampilkan sebagai tombol 'Gabung Grup WhatsApp' di panel chat.",
      isSecret: false,
      value: null,
    },
    // Brand — Social Media & Contact
    {
      key: "brand_logo",
      group: "brand",
      label: "Logo URL",
      hint: "URL gambar logo brand yang tampil di navbar. Upload logo putih untuk background gelap.",
      isSecret: false,
      value: null,
    },
    {
      key: "brand_favicon",
      group: "brand",
      label: "Favicon URL",
      hint: "URL gambar favicon (ikon tab browser). Rasio 1:1, ideal 512x512 px. Format PNG/SVG.",
      isSecret: false,
      value: null,
    },
    {
      key: "nav_menu_items",
      group: "menu",
      label: "Menu Sidebar",
      hint: "Visibilitas item menu sidebar: home, categories, blog, about, contact, social, account (JSON boolean).",
      isSecret: false,
      value: null,
    },
    {
      key: "brand_instagram_url",
      group: "brand",
      label: "Instagram URL",
      hint: "Link lengkap profil Instagram",
      isSecret: false,
      value: "https://instagram.com/hageclub",
    },
    {
      key: "brand_instagram_handle",
      group: "brand",
      label: "Instagram Handle",
      hint: "Nama pengguna Instagram",
      isSecret: false,
      value: "@hageclub",
    },
    {
      key: "brand_tiktok_url",
      group: "brand",
      label: "TikTok URL",
      hint: "Link lengkap profil TikTok",
      isSecret: false,
      value: "https://tiktok.com/@hageclub",
    },
    {
      key: "brand_tiktok_handle",
      group: "brand",
      label: "TikTok Handle",
      hint: "Nama pengguna TikTok",
      isSecret: false,
      value: "@hageclub",
    },
    {
      key: "brand_whatsapp_number",
      group: "brand",
      label: "WhatsApp Number",
      hint: "Nomor WhatsApp brand tanpa tanda +",
      isSecret: false,
      value: "6281234567890",
    },
    {
      key: "brand_email",
      group: "brand",
      label: "Brand Email",
      hint: "Email kontak utama brand",
      isSecret: false,
      value: "hello@hageclub.com",
    },
    // Email SMTP
    {
      key: "email_host",
      group: "email",
      label: "SMTP Host",
      hint: "Server SMTP untuk kirim email. Contoh: mail.domain.com atau smtp.gmail.com",
      isSecret: false,
      value: null,
    },
    {
      key: "email_port",
      group: "email",
      label: "SMTP Port",
      hint: "Port SMTP. Gunakan 465 untuk SSL, 587 untuk TLS/STARTTLS, atau 25 (tidak direkomendasikan)",
      isSecret: false,
      value: "465",
    },
    {
      key: "email_secure",
      group: "email",
      label: "Gunakan SSL/TLS",
      hint: "true = koneksi SSL langsung (port 465). false = STARTTLS atau plain (port 587/25)",
      isSecret: false,
      value: "true",
    },
    {
      key: "email_user",
      group: "email",
      label: "Username / Email Pengirim",
      hint: "Email akun SMTP yang digunakan untuk autentikasi, biasanya sama dengan alamat pengirim",
      isSecret: false,
      value: null,
    },
    {
      key: "email_pass",
      group: "email",
      label: "Password / App Password",
      hint: "Password akun SMTP. Untuk Gmail gunakan App Password (bukan password akun Google)",
      isSecret: true,
      value: null,
    },
    {
      key: "email_from_name",
      group: "email",
      label: "Nama Pengirim",
      hint: "Nama yang tampil di inbox penerima. Contoh: HAGE CLUB",
      isSecret: false,
      value: "HAGE CLUB",
    },
    {
      key: "email_from_address",
      group: "email",
      label: "Alamat Email Pengirim",
      hint: "Alamat email yang tampil sebagai pengirim (From). Harus sama atau alias dari email_user",
      isSecret: false,
      value: null,
    },
  ];

  for (const setting of systemSettings) {
    const existing = await db.systemSetting.findUnique({ where: { key: setting.key } });
    if (!existing) {
      await db.systemSetting.create({ data: setting });
      console.log(`✅ System setting created: ${setting.key}`);
    } else {
      // Update metadata (label/hint/group/isSecret) but never overwrite user-set values
      await db.systemSetting.update({
        where: { key: setting.key },
        data: {
          group: setting.group,
          label: setting.label,
          hint: setting.hint,
          isSecret: setting.isSecret,
        },
      });
      console.log(`⏭️  System setting already exists: ${setting.key}`);
    }
  }

  // =============================================================================
  // PRODUCTS
  // =============================================================================

  const poloCat = await db.category.findUnique({ where: { slug: "polo" } });
  const hoodieCat = await db.category.findUnique({ where: { slug: "hoodie" } });
  const jacketCat = await db.category.findUnique({ where: { slug: "jacket" } });
  const accCat = await db.category.findUnique({ where: { slug: "accessories" } });
  const placeholder = "https://placehold.co/600x800/1C1C1E/FFFFFF?text=";

  const products = [
    {
      name: "Classic Polo HAGE",
      slug: "classic-polo-hage",
      sku: "PLO-001",
      shortDescription: "Polo classic dengan logo embroidered HAGE CLUB di dada.",
      fullDescription:
        "Material pique cotton combed 24s premium. Kancing mutiara original. Jahitan rapi double stitch pada bagian kerah dan lengan. Nyaman dipakai daily dan cocok untuk hangout bersama komunitas.",
      price: 189000,
      salePrice: null,
      weight: 250,
      categoryId: poloCat!.id,
      featured: true,
      stock: 50,
      images: [
        { url: placeholder + "Polo+Hitam", alt: "Classic Polo HAGE - Hitam", isCover: true, sortOrder: 1 },
        { url: placeholder + "Polo+Putih", alt: "Classic Polo HAGE - Putih", isCover: false, sortOrder: 2 },
      ],
      variants: [
        { name: "Hitam / S", sku: "PLO-001-BLK-S", price: null, stock: 10, attributes: { Color: "Black", Size: "S" } },
        { name: "Hitam / M", sku: "PLO-001-BLK-M", price: null, stock: 10, attributes: { Color: "Black", Size: "M" } },
        { name: "Hitam / L", sku: "PLO-001-BLK-L", price: null, stock: 10, attributes: { Color: "Black", Size: "L" } },
        { name: "Hitam / XL", sku: "PLO-001-BLK-XL", price: null, stock: 10, attributes: { Color: "Black", Size: "XL" } },
        { name: "Putih / M", sku: "PLO-001-WHT-M", price: null, stock: 10, attributes: { Color: "White", Size: "M" } }
      ],
    },
    {
      name: "Stripe Polo HAGE",
      slug: "stripe-polo-hage",
      sku: "PLO-002",
      shortDescription: "Polo stripe dengan desain retro modern.",
      fullDescription:
        "Polo stripe motif garis-garis halus dengan kombinasi warna navy dan putih. Bahan cotton pique premium yang adem dan tidak mudah melar. Cocok untuk gaya casual yang tetap rapi.",
      price: 199000,
      salePrice: 169000,
      weight: 250,
      categoryId: poloCat!.id,
      featured: false,
      stock: 35,
      images: [
        { url: placeholder + "Stripe+Polo", alt: "Stripe Polo HAGE", isCover: true, sortOrder: 1 },
      ],
      variants: [
        { name: "Navy / M", sku: "PLO-002-NVY-M", price: null, stock: 10, attributes: { Color: "Navy", Size: "M" } },
        { name: "Navy / L", sku: "PLO-002-NVY-L", price: null, stock: 10, attributes: { Color: "Navy", Size: "L" } },
        { name: "Navy / XL", sku: "PLO-002-NVY-XL", price: null, stock: 10, attributes: { Color: "Navy", Size: "XL" } }
      ],
    },
    {
      name: "Oversized Hoodie HAGE",
      slug: "oversized-hoodie-hage",
      sku: "HOD-001",
      shortDescription: "Hoodie oversized dengan sablon premium di depan.",
      fullDescription:
        "Hoodie cotton fleece 280gsm premium. Potongan oversized dengan dropped shoulder. Hoodie ini menggunakan drawstring metal custom HAGE CLUB. Kantong depan besar dengan ribbing elastis yang nyaman.",
      price: 289000,
      salePrice: null,
      weight: 500,
      categoryId: hoodieCat!.id,
      featured: true,
      stock: 40,
      images: [
        { url: placeholder + "Hoodie+Hitam", alt: "Oversized Hoodie HAGE - Hitam", isCover: true, sortOrder: 1 },
        { url: placeholder + "Hoodie+Abu", alt: "Oversized Hoodie HAGE - Abu-abu", isCover: false, sortOrder: 2 },
        { url: placeholder + "Hoodie+Coklat", alt: "Oversized Hoodie HAGE - Coklat", isCover: false, sortOrder: 3 },
      ],
      variants: [
        { name: "Hitam / M", sku: "HOD-001-BLK-M", price: null, stock: 10, attributes: { Color: "Black", Size: "M" } },
        { name: "Hitam / L", sku: "HOD-001-BLK-L", price: null, stock: 10, attributes: { Color: "Black", Size: "L" } },
        { name: "Hitam / XL", sku: "HOD-001-BLK-XL", price: null, stock: 10, attributes: { Color: "Black", Size: "XL" } },
        { name: "Abu / M", sku: "HOD-001-GRY-M", price: null, stock: 10, attributes: { Color: "Gray", Size: "M" } },
        { name: "Abu / L", sku: "HOD-001-GRY-L", price: null, stock: 10, attributes: { Color: "Gray", Size: "L" } }
      ],
    },
    {
      name: "Bomber Jacket HAGE",
      slug: "bomber-jacket-hage",
      sku: "JCK-001",
      shortDescription: "Bomber jacket premium dengan patch embroidered.",
      fullDescription:
        "Bomber jacket bahan parasut anti air. Lapisan dalam satin halus. Ribbing elastis di kerah, manset, dan hem. Resleting YKK original dengan puller custom HAGE CLUB. Patch embroidered besar di punggung.",
      price: 359000,
      salePrice: 299000,
      weight: 600,
      categoryId: jacketCat!.id,
      featured: true,
      stock: 25,
      images: [
        { url: placeholder + "Bomber+Jacket", alt: "Bomber Jacket HAGE", isCover: true, sortOrder: 1 },
      ],
      variants: [
        { name: "Hitam / M", sku: "JCK-001-BLK-M", price: null, stock: 10, attributes: { Color: "Black", Size: "M" } },
        { name: "Hitam / L", sku: "JCK-001-BLK-L", price: null, stock: 10, attributes: { Color: "Black", Size: "L" } },
        { name: "Hitam / XL", sku: "JCK-001-BLK-XL", price: null, stock: 10, attributes: { Color: "Black", Size: "XL" } },
        { name: "Army / M", sku: "JCK-001-ARM-M", price: null, stock: 10, attributes: { Color: "Olive", Size: "M" } }
      ],
    },
    {
      name: "Keychain HAGE Club",
      slug: "keychain-hage-club",
      sku: "ACC-001",
      shortDescription: "Keychain metal dengan logo HAGE CLUB timbul.",
      fullDescription:
        "Gantungan kunci metal alloy dengan logo HAGE CLUB 3D embossed. Finishing gold/chrome. Packing dus premium — cocok untuk koleksi atau oleh-oleh.",
      price: 59000,
      salePrice: 45000,
      weight: 50,
      categoryId: accCat!.id,
      featured: false,
      stock: 100,
      images: [
        { url: placeholder + "Keychain", alt: "Keychain HAGE Club", isCover: true, sortOrder: 1 },
      ],
      variants: [],
    },
    {
      name: "Tote Bag HAGE",
      slug: "tote-bag-hage",
      sku: "ACC-002",
      shortDescription: "Tote bag kanvas premium sablon besar.",
      fullDescription:
        "Tote bag kanvas 300gsm tebal dan kuat. Sablon besar logo HAGE CLUB di bagian depan. Kantong dalam untuk HP dan dompet. Muat laptop 14 inch.",
      price: 89000,
      salePrice: null,
      weight: 200,
      categoryId: accCat!.id,
      featured: true,
      stock: 60,
      images: [
        { url: placeholder + "Tote+Bag", alt: "Tote Bag HAGE", isCover: true, sortOrder: 1 },
      ],
      variants: [
        { name: "Hitam", sku: "ACC-002-BLK", price: null, stock: 10, attributes: { Color: "Black" } },
        { name: "Cream", sku: "ACC-002-CRM", price: null, stock: 10, attributes: { Color: "Cream" } }
      ],
    },
  ];

  for (const product of products) {
    const existing = await db.product.findUnique({ where: { slug: product.slug } });
    if (existing) {
      console.log(`⏭️  Product already exists: ${product.name}`);
      continue;
    }

    const created = await db.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        shortDescription: product.shortDescription,
        fullDescription: product.fullDescription,
        price: product.price,
        salePrice: product.salePrice,
        weight: product.weight,
        status: "PUBLISHED",
        stock: product.stock,
        featured: product.featured,
        categoryId: product.categoryId,
        images: { create: product.images },
        variants: product.variants.length > 0 ? { create: product.variants } : undefined,
      },
    });
    console.log(`✅ Product created: ${created.name} (${created.sku})`);
  }

  // =============================================================================
  // BLOG POSTS
  // =============================================================================

  const otomotifCat = await db.blogCategory.findUnique({ where: { slug: "otomotif" } });
  const lifestyleCat = await db.blogCategory.findUnique({ where: { slug: "lifestyle" } });
  const editorUser = await db.user.findUnique({ where: { email: "editor@hageclub.com" } });
  const adminUser = await db.user.findUnique({ where: { email: "admin@hageclub.com" } });

  const blogPosts = [
    {
      title: "Tips Memilih Polo Shirt Berkualitas untuk Komunitas",
      slug: "tips-memilih-polo-shirt-berkualitas",
      excerpt:
        "Polo shirt adalah item wajib di lemari para pecinta otomotif. Simak tips memilih polo berkualitas dari HAGE CLUB.",
      content: `<p>Polo shirt已经成为 komunitas otomotif的经典服装。以下是一些选择高质量polo的技巧：</p>
<p><strong>1. Bahan Kain</strong><br/>Pilih bahan cotton pique yang adem dan tidak mudah melar. Kain berkualitas akan terlihat rapi meski dipakai seharian.</p>
<p><strong>2. Jahitan</strong><br/>Periksa jahitan di bagian kerah dan lengan. Double stitch lebih awet dan tidak mudah sobek.</p>
<p><strong>3. Kancing</strong><br/>Kancing mutiara original memberikan kesan premium dan lebih tahan lama.</p>
<p><strong>4. Logo</strong><br/>Embroidery logo lebih awet dibanding sablon biasa. Tidak luntur setelah dicuci berkali-kali.</p>
<p>HAGE CLUB menghadirkan polo shirt yang memenuhi semua kriteria di atas. Cocok untuk daily wear maupun acara kopdar komunitas!</p>`,
      status: "PUBLISHED" as const,
      categoryId: lifestyleCat!.id,
      authorId: editorUser!.id,
      readingTime: 3,
    },
    {
      title: "Kumpul Bareng HAGE CLUB: Kopdar Perdana di Jakarta",
      slug: "kopdar-perdana-hage-club-jakarta",
      excerpt: "Momen seru kopdar perdana komunitas HAGE CLUB di Jakarta. Penuh cerita, modif, dan merchandise baru!",
      content: `<p>Hari Minggu lalu HAGE CLUB mengadakan kopdar perdana di Jakarta. Acara berlangsung meriah dengan kehadiran lebih dari 50 anggota komunitas.</p>
<p>Acara dimulai dengan sarapan bareng di kawasan Kemang, dilanjutkan konvoi keliling kota, dan ditutup dengan sesi foto bersama di area parkir terbuka.</p>
<p>Beberapa anggota juga membawa motor modifikasi keren mereka. Ada yang baru selesai restorasi, ada juga yang baru ganti cat.</p>
<p>Yang paling seru adalah sesi bagi-bagi merchandise limited edition! Hoodie HAGE CLUB edisi khusus kopdar ludes dalam 15 menit.</p>
<p>Ikuti terus IG @hageclub untuk info kopdar selanjutnya!</p>`,
      status: "PUBLISHED" as const,
      categoryId: otomotifCat!.id,
      authorId: adminUser!.id,
      readingTime: 4,
    },
    {
      title: "Cara Merawat Hoodie Agar Awet dan Tidak Melar",
      slug: "cara-merawat-hoodie-awet",
      excerpt: "Hoodie kesayangan harus dirawat dengan benar. Ini dia tips merawat hoodie agar awet sampai bertahun-tahun.",
      content: `<p>Hoodie adalah investasi fashion yang sayang kalau cuma dipakai beberapa bulan lalu rusak. Yuk simak cara merawatnya:</p>
<p><strong>1. Cuci dengan Air Dingin</strong><br/>Air panas bisa membuat serat kain menyusut dan melar. Selalu gunakan air dingin saat mencuci hoodie.</p>
<p><strong>2. Balik Sebelum Dicuci</strong><br/>Membalik hoodie sebelum dicuci akan melindungi sablon/embroidery di bagian luar.</p>
<p><strong>3. Jemur di Tempat Teduh</strong><br/>Sinar matahari langsung bisa memudarkan warna hoodie. Jemur di tempat yang teduh dan angin cukup.</p>
<p><strong>4. Jangan Pakai Pemutih</strong><br/>Pemutih merusak serat kain dan membuat warna cepat pudar. Gunakan deterjen yang lembut.</p>
<p>Dengan perawatan yang tepat, hoodie HAGE CLUB bisa awet hingga 5 tahun lebih!</p>`,
      status: "PUBLISHED" as const,
      categoryId: lifestyleCat!.id,
      authorId: editorUser!.id,
      readingTime: 3,
    },
  ];

  for (const post of blogPosts) {
    const existing = await db.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log(`⏭️  Blog post already exists: ${post.title}`);
      continue;
    }
    await db.blogPost.create({ data: { ...post, publishedAt: new Date() } });
    console.log(`✅ Blog post created: ${post.title}`);
  }

  // =============================================================================
  // COUPONS
  // =============================================================================

  const coupons = [
    {
      code: "HAGE10",
      type: "PERCENTAGE" as const,
      value: 10,
      minPurchase: 100000,
      maxDiscount: 50000,
      usageLimit: 100,
      isActive: true,
    },
    {
      code: "HAGEFREE",
      type: "FREE_SHIPPING" as const,
      value: 0,
      minPurchase: 200000,
      usageLimit: 50,
      isActive: true,
    },
  ];

  for (const coupon of coupons) {
    const existing = await db.coupon.findUnique({ where: { code: coupon.code } });
    if (existing) {
      console.log(`⏭️  Coupon already exists: ${coupon.code}`);
      continue;
    }
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    await db.coupon.create({ data: { ...coupon, startDate, endDate } });
    console.log(`✅ Coupon created: ${coupon.code}`);
  }

  // =============================================================================
  // CONTACT MESSAGES
  // =============================================================================

  const contactMessages = [
    {
      name: "Budi Santoso",
      email: "budi@example.com",
      phone: "08123456789",
      subject: "Ukuran Hoodie",
      message: "Halo, saya mau tanya untuk hoodie size L muat untuk bb 75kg? Makasih.",
      isRead: true,
    },
    {
      name: "Sari Dewi",
      email: "sari@example.com",
      phone: null,
      subject: "Ketersediaan Warna",
      message: "Min, untuk classic polo warna putih size M masih ada stok? Saya cari di web kok tidak muncul.",
      isRead: false,
    },
  ];

  for (const msg of contactMessages) {
    const name = msg.name;
    const existing = await db.contactMessage.findFirst({ where: { name, subject: msg.subject } });
    if (existing) {
      console.log(`⏭️  Contact message already exists from: ${name}`);
      continue;
    }
    await db.contactMessage.create({ data: msg });
    console.log(`✅ Contact message created from: ${name}`);
  }

  // =============================================================================
  // NEWSLETTER SUBSCRIBERS
  // =============================================================================

  const subscribers = [
    { email: "budi@example.com" },
    { email: "sari@example.com" },
    { email: "doni@example.com" },
  ];

  for (const sub of subscribers) {
    const existing = await db.newsletterSubscriber.findUnique({ where: { email: sub.email } });
    if (existing) {
      console.log(`⏭️  Subscriber already exists: ${sub.email}`);
      continue;
    }
    await db.newsletterSubscriber.create({ data: sub });
    console.log(`✅ Subscriber added: ${sub.email}`);
  }

  // =============================================================================
  // SEO SETTINGS
  // =============================================================================

  const seoPages = [
    { page: "/", seoTitle: "HAGE CLUB — Premium Automotive Lifestyle Brand" },
    { page: "/shop", seoTitle: "Shop — HAGE CLUB" },
  ];

  for (const seo of seoPages) {
    const existing = await db.seoSetting.findUnique({ where: { page: seo.page } });
    if (existing) continue;
    await db.seoSetting.create({ data: seo });
    console.log(`✅ SEO setting created: ${seo.page}`);
  }

  // =============================================================================
  // HOMEPAGE SECTIONS
  // =============================================================================

  const defaultSections = [
    {
      type: "hero",
      title: "Premium Automotive Lifestyle",
      subtitle: "HAGE CLUB",
      content: {
        showCtaPrimary: true,
        ctaText: "Explore Collection",
        ctaLink: "/shop",
        showCtaSecondary: false,
        ctaSecondaryText: "Our Story",
        ctaSecondaryLink: "/about",
        showCountdown: false,
      },
      sortOrder: 0,
      active: true,
    },
    {
      type: "catalog",
      title: "All Products",
      subtitle: null,
      content: {
        productCount: 8,
        sortBy: "newest",
        showSortDropdown: true,
        showViewAll: true,
        viewAllLinkText: "View Full Collection",
        viewAllLink: "/shop",
      },
      sortOrder: 1,
      active: true,
    },
    {
      type: "features",
      title: "Mengapa HAGE CLUB?",
      subtitle: "Kualitas dan kenyamanan terbaik untuk gaya hidup otomotif Anda",
      content: {
        columns: [
          { icon: "truck", title: "Gratis Ongkir", description: "Gratis ongkir untuk pembelian minimal Rp500.000 di seluruh Indonesia." },
          { icon: "shield", title: "Premium Quality", description: "Material premium pilihan dengan jahitan rapi dan kontrol kualitas ketat." },
          { icon: "refresh", title: "Mudah Ditukar", description: "Garansi kepuasan 14 hari. Barang bisa ditukar jika tidak sesuai." },
          { icon: "heart", title: "Cinta Komunitas", description: "Setiap pembelian mendukung perkembangan komunitas otomotif Indonesia." },
        ],
      },
      sortOrder: 2,
      active: true,
    },
    {
      type: "brand_story",
      title: "Cerita Kami",
      subtitle: "THE PINNACLE OF REFINED COMFORT",
      content: {
        image: null,
        body: "HAGE CLUB lahir dari kecintaan terhadap dunia otomotif dan gaya hidup berkualitas. Kami percaya bahwa kenyamanan dan gaya bukanlah dua hal yang terpisah — keduanya bisa berjalan beriringan.\n\nSetiap produk HAGE CLUB dirancang dengan detail, menggunakan material terbaik, dan dikerjakan oleh tangan-tangan terampil. Bukan sekadar pakaian, tapi pernyataan identitas bagi mereka yang menghargai kualitas dan autentisitas.\n\nDari kopdar komunitas hingga daily wear, temani perjalanan Anda dengan HAGE CLUB.",
        ctaText: "Tentang Kami",
        ctaLink: "/about",
        imagePosition: "right",
      },
      sortOrder: 3,
      active: true,
    },
    {
      type: "testimonials",
      title: "Apa Kata Mereka",
      subtitle: "Testimoni dari komunitas HAGE CLUB",
      content: {
        items: [
          { name: "Budi Santoso", role: "Komunitas Jakarta", quote: "Material polonya premium banget. Udah 3 kali cuci masih kelihatan baru. Recommended buat yang suka kumpul kopdar.", avatar: null },
          { name: "Sari Dewi", role: "Komunitas Bandung", quote: "Hoodie oversized-nya nyaman dipakai daily. Size L muat buat bb 75kg. Desainnya simple tapi tetap keren.", avatar: null },
          { name: "Dimas Ardian", role: "Komunitas Surabaya", quote: "Bomber jacket-nya worth it banget. Bahan tebal dan anti air. Cocok buat touring.", avatar: null },
        ],
      },
      sortOrder: 4,
      active: true,
    },
    {
      type: "stats",
      title: null,
      subtitle: null,
      content: {
        items: [
          { value: "500+", label: "Products Sold" },
          { value: "1.200+", label: "Happy Customers" },
          { value: "15+", label: "Cities" },
          { value: "4.9/5", label: "Rating" },
        ],
        columns: 4,
      },
      sortOrder: 5,
      active: true,
    },
    {
      type: "banner",
      title: "Gabung Dengan Komunitas",
      subtitle: "Jadi bagian dari perjalanan HAGE CLUB",
      content: {
        bgImage: null,
        bgColor: "bg-primary",
        text: "Dapatkan info koleksi terbaru, event kopdar, dan diskon eksklusif khusus anggota komunitas.",
        ctaText: "Ikuti Instagram",
        ctaLink: "https://instagram.com/hageclub",
        textDark: false,
      },
      sortOrder: 6,
      active: true,
    },
  ];

  for (const section of defaultSections) {
    const existing = await db.homepageSection.findFirst({
      where: { type: section.type, sortOrder: section.sortOrder },
    });
    if (!existing) {
      await db.homepageSection.create({ data: section });
      console.log(`✅ Homepage section created: ${section.type}`);
    } else {
      console.log(`⏭️  Homepage section already exists: ${section.type}`);
    }
  }

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
