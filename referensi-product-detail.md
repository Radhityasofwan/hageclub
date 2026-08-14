# Spec Layout — Halaman Product Detail (HAGE CLUB)

> Referensi visual: `netaseec29club.com/products/…/boxy-washed-hoodie`
> Direvisi sesuai: `list-revisi-update-web.md`
> Berlaku: 2026-08-03

---

## Ringkasan Perubahan vs Referensi Netaseec

| Elemen | Referensi (Netaseec) | HAGE CLUB (Final) |
|--------|----------------------|-------------------|
| Pilihan warna | Ada (color picker) | **Dihapus** |
| Preview gambar per varian | Ada (gallery berubah ikut warna) | **Dihapus** — gallery statis |
| Badge produk | Ada, di atas nama | Dipertahankan |
| Deskripsi pendek | Ada (terpisah dari deskripsi panjang) | **Dihapus** |
| Deskripsi panjang | Tampil penuh | **View more** (collapsed default) |
| Panduan ukuran | Link teks biasa | **Modal gambar** upload dari admin |
| Footer di halaman produk | Ada (payment logos, kebijakan, dll) | **Dihapus** — diganti accordion |
| Accordion (payment + pengiriman) | Tidak ada | **Ditambah** (di bawah deskripsi) |
| Tombol chat/pesan | WA ke CS eksternal | **Ke panel admin** (in-app) |
| Floating WA button | Lingkaran besar | **Diperkecil** |
| Wishlist notifikasi | Tidak ada feedback | **Ditambah** notif → link ke halaman Wishlist |
| Tambah ke keranjang feedback | Tidak ada feedback visible | **Modal panel keranjang** muncul |
| Warna font | Campuran | **Semua hitam** |
| Dark theme | Tidak ada | **Ditambah** |
| Spacing umum | Agak longgar | **Dipadatkan** (mobile-first) |

---

## Breakpoints CSS (Tailwind)

| Prefix | Min-width | Keterangan |
|--------|-----------|------------|
| (base) | 0px | Mobile — layout default |
| `sm` | 600px | Tablet kecil |
| `md` | 960px | Two-column aktif |
| `lg` | 1280px | Desktop besar |

---

## Layout Mobile — Flow Scrolling Atas ke Bawah

```
┌────────────────────────────────────┐
│  HEADER (sticky)                   │
│  [Logo] Home Shop ... [🔍] [👤]    │
├────────────────────────────────────┤
│  GALLERY — Swiper carousel         │  ← full width, swipe, foto statis
│  [thumbnail strip — centered]      │     (tidak ada preview varian warna)
├────────────────────────────────────┤
│  [Ada Stok]  [SWEATS]              │  ← badge di atas nama
│  NAMA PRODUK (bold, uppercase)     │
│  Rp xxx.000              ♡ (wish)  │  ← wishlist icon kanan
│                                    │
│  Ukuran          Panduan ukuran >  │  ← klik = modal gambar dari admin
│  ┌───┐ ┌───┐                       │
│  │ S │ │ M │  ← 2 per baris       │
│  └───┘ └───┘                       │
│  ┌───┐ ┌───┐                       │
│  │ L │ │XL │                       │
│  └───┘ └───┘                       │
│  S:58x56  M:60x58                  │  ← dimensi inline
│  L:63x62  XL:66x64                 │
│                                    │
│  − [  1  ] +                       │
│  ┌──────────────────────────────┐  │
│  │    Tambah Ke Keranjang       │  │  ← outlined → modal keranjang muncul
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │       Beli Sekarang          │  │  ← solid hitam → langsung checkout
│  └──────────────────────────────┘  │
├────────────────────────────────────┤
│  Deskripsi Produk                  │
│  [teks panjang... view more ↓]     │  ← collapsed, klik expand
├────────────────────────────────────┤
│  ▼ Metode Pembayaran               │  ← accordion
│  ▼ Metode Pengiriman               │  ← accordion (logo-logo)
├────────────────────────────────────┤
│  ┌─ Pengiriman ─────────────────┐  │
│  │ Dikirim ke:    Pilih Area ▼  │  │
│  │ Berat:         [berat produk]│  │
│  │ Estimasi: 48 jam             │  │
│  └──────────────────────────────┘  │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ 💬 Tanya soal produk ini     │  │  ← ke panel admin HAGE CLUB
│  └──────────────────────────────┘  │
├────────────────────────────────────┤
│  Rekomendasi lainnya               │
│  [card] [card] [card] →            │  ← horizontal scroll
└────────────────────────────────────┘
                         [WA kecil] ← floating fixed, lebih kecil dari referensi
```

---

## Detail Per Elemen

### 1. Header — Sticky Top

```
[ Logo ]   Home  Shop  ...   🔍  👤
```

- **Sticky** saat scroll
- Nav: Home, Shop tampil; sisanya collapse ke `...` pada viewport sempit
- Icon **Search** (🔍) + **Account** (👤) di kanan
- **Cart icon disembunyikan** di header — cart hanya muncul sebagai **modal panel** ketika produk ditambahkan
- Transisi warna background saat scroll (shadow muncul)

---

### 2. Gallery — Swiper Carousel (Statis)

- **Swiper.js** — swipe horizontal, satu foto per slide
- Full width mobile
- Foto adalah **foto produk saja** — tidak berubah mengikuti pilihan warna karena color picker dihapus
- Thumbnail strip di bawah — **centered** mobile, left-aligned `sm+`
- `swiper-autoheight` — tinggi menyesuaikan rasio foto
- Tidak ada auto-play, tidak ada lightbox

---

### 3. Badge, Nama Produk & Harga

- Badge **di atas** nama produk — dua pill horizontal: `Ada Stok` + kategori (misal `SWEATS`)
  - Badge = hitam, teks putih
- Nama produk: bold, uppercase, bisa multi-baris di mobile, warna **hitam**
- Harga di kiri, **ikon hati (wishlist)** di kanan — satu baris
  - Klik wishlist: **notifikasi muncul** ("Ditambahkan ke Wishlist — Lihat →") dengan link ke halaman Wishlist di dashboard customer
- Tidak ada harga coret / badge diskon di baris harga (kalau ada diskon: gunakan Coupon Banner)

> **Dihapus dari referensi:** Coupon Banner dan "Informasi Jumlah Maksimal" tidak diimplementasi di HAGE CLUB (sistem berbeda — tidak ada sistem kupon otomatis per customer).

---

### 4. Size Selector

- Label **"Ukuran"** di kiri, **"Panduan ukuran >"** di kanan — satu baris
- Klik "Panduan ukuran" → **modal/drawer** menampilkan gambar yang diupload admin dari panel (bukan tabel hardcoded)
- Size buttons: `flex flex-wrap` → **2 per baris** mobile (S M / L XL), 4 dalam satu baris desktop
- Tiap tombol: `min-w-[72px]`, tinggi 36px, border rounded
- Terpilih: highlight border tebal / background berbeda
- Di bawah size selector langsung: **dimensi per ukuran** (inline teks, contoh: `S: 58×56 cm | M: 60×58 cm`)
  - Data dimensi diambil dari admin panel (dinamis, bukan hardcoded)

> **Dihapus dari referensi:** Color picker / pilihan warna. HAGE CLUB menggunakan satu URL produk per colorway — tidak perlu selector warna di halaman.

---

### 5. Quantity Stepper

- Tombol **−** | angka | tombol **+** — inline, tidak full width
- Default: 1

---

### 6. CTA Buttons — Dua Tombol Full Width

| Tombol | Style | Aksi |
|--------|-------|------|
| Tambah Ke Keranjang | Outlined (border, bg putih) | **Modal panel keranjang** muncul dari sisi layar + alert floating bawah layar |
| Beli Sekarang | Solid hitam, teks putih | Langsung ke halaman checkout |

- Keduanya full width
- Setelah "Tambah Ke Keranjang": cart icon di header **tidak** berubah — gantinya modal panel yang muncul (ikuti pola Preface)

---

### 7. Deskripsi Produk

- **Deskripsi pendek dihapus**
- Hanya **deskripsi panjang**, ditampilkan collapsed: ~3 baris terlihat + tombol **"Lihat selengkapnya"** / **"View more"**
- Klik expand → full teks terbuka, tombol berubah jadi **"Sembunyikan"**
- Konten deskripsi: plaintext atau HTML sederhana dari admin panel (tidak parsing Markdown)
- Warna teks: **hitam**

---

### 8. Accordion — Metode Pembayaran & Pengiriman

Menggantikan footer di halaman product detail. Dua item accordion:

**▼ Metode Pembayaran**
- Logo-logo: QRIS, OVO, Akulaku, Alfamart, Mandiri, BRI, BNI
- Layout: grid logo dalam collapsed panel

**▼ Metode Pengiriman**
- Logo-logo: J&T Express, SiCepat, JNE (urutan sesuai rekomendasi)
- Default collapsed

> Referensi: ikuti gaya accordion dari Netaseec dan Preface (tidak expand keduanya sekaligus).

---

### 9. Pengiriman Card

- Card dengan border `rounded`
- **"Dikirim ke:"** + dropdown **"Pilih Area ▼"** (pilih kota/kecamatan)
- **"Berat:"** — diambil dinamis dari data produk di DB
- **"Estimasi pengiriman: 48 jam"** atau sesuai data dari integrasi shipping

---

### 10. Tombol Chat Soal Produk

- Tombol outlined, full width
- Icon chat 💬 + teks **"Tanya soal produk ini"**
- Mengarah ke **panel admin HAGE CLUB** (in-app messaging / form pesan ke CS)
- Bukan WA button (WA ada di floating button terpisah)

---

### 11. Rekomendasi Lainnya

- Heading "Rekomendasi lainnya" — full width
- Product cards: **horizontal scroll** (swipe ke kanan), tidak grid
- Setiap card: foto + nama produk + harga

---

### 12. Footer di Halaman Product Detail

**Dihapus.** Tidak ada footer brand/kebijakan/payment logos di halaman product detail.
Digantikan oleh **Accordion** (poin 8 di atas).

---

### 13. Floating WA Button — Fixed

- `fixed bottom-right` — selalu visible
- **Ukuran lebih kecil** dari referensi netaseec (diperkecil sesuai revisi)
- Dua fungsi: CS HAGE CLUB via WA + join grup
- Tetap ada `pb` di elemen terakhir agar konten tidak tertutup button

---

## Desktop vs Mobile — Perbedaan Layout

| Elemen | Mobile (<960px) | Desktop (≥960px) |
|--------|-----------------|------------------|
| Layout utama | 1 kolom — gallery atas, info bawah | 2 kolom — gallery kiri, info kanan |
| Gallery | Swiper full width | Swiper, max-width 640px |
| Thumbnail | Centered | Left-aligned |
| Nav links | Home, Shop, `...` | Semua tampil (Home, Shop, dst) |
| Size buttons | 2 per baris (wrap) | 4 dalam satu baris |
| Accordion | Default collapsed | Bisa collapsed/expanded |
| Floating WA | Visible | Visible (lebih kecil dari versi lama) |

---

## Behavior Tambahan

### Wishlist
- Klik ikon hati → item masuk wishlist
- Notifikasi floating muncul: "Ditambahkan ke Wishlist — **Lihat**" → anchor ke halaman Wishlist di dashboard customer

### Tambah Ke Keranjang
- Klik → **modal panel keranjang** slide dari sisi (ikuti pola Preface)
- Bersamaan: **alert floating di bawah layar** (bukan toast atas) — ikuti pola Netaseec di homepage
- Cart icon di header **tetap tersembunyi** hingga modal terbuka

### Dark Theme
- Semua elemen halaman product detail mendukung dark mode
- Badge, tombol, card, accordion — semua ada varian dark
- Foto produk tidak diubah (native transparency/bg foto)

---

## Yang Belum / Menunggu

| Item | Status | Keterangan |
|------|--------|------------|
| Integrasi QRIS statis | Menunggu | Merchant belum kirim QR statis — belum bisa diimplementasi |
| Gambar panduan ukuran | Menunggu upload | Admin perlu upload via panel sebelum fitur aktif |
| In-app chat ke admin | Perlu spec tersendiri | Flow pesan ke admin belum didefinisikan |
