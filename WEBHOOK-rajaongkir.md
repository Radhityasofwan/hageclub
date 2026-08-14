# Webhook RajaOngkir — Penjelasan Semua Layanan

Dokumen ini menjelaskan webhook pada layanan-layanan RajaOngkir yang sudah terpasang di proyek ini

---

## 1. Apa itu webhook? (analogi sederhana)

Bayangkan kamu menunggu paket datang. Ada dua cara tahu paket sudah sampai:

1. **Cek terus-menerus (polling)** — kamu tiap 10 menit menelepon kurir: "Paket saya sudah sampai belum?" Capek, boros, dan kalau telat tanya ya telat tahu.
2. **Ditunggu teleponnya (webhook)** — kamu kasih nomor HP ke kurir, dan kurir *menelponmu sendiri* begitu ada kabar. Kamu tidak perlu menanyakan apa-apa; info datang sendiri.

Dalam dunia aplikasi: **polling** = aplikasi kita berulang kali bertanya ke server "ada kabar baru?", sedangkan **webhook** = server yang mengirim kabar ke aplikasi kita tanpa diminta, setiap kali ada kejadian (event). Aplikasi kita cukup menyediakan "nomor HP" berupa **URL** yang bisa menerima panggilan — disebut *webhook URL* / *callback URL*.

---

## 2. Peta layanan RajaOngkir di proyek ini

Di arsitektur pengiriman toko ini ada **dua layanan** yang bersumber dari ekosistem RajaOngkir/Komerce:

| Layanan | File utama | Punya webhook? |
|---|---|---|
| **RajaOngkir V2** (cek tarif & daftar lokasi) | `lib/rajaongkir.ts` | ❌ Tidak — murni tanya-jawab (pull) |
| **Komship Delivery** (pengiriman order & status) | `lib/komship.ts` + `app/api/shipping/webhook/route.ts` | ✅ Ya — lengkap (daftar + terima notifikasi) |

Webhook yang dipakai pengiriman **ada di layanan Komship Delivery**. RajaOngkir V2 tidak punya webhook, tapi form pengaturannya menyimpan satu kunci rahasia yang dipakai untuk *memverifikasi* webhook Komship — dijelaskan di bawah.

---

## 3. Layanan 1: RajaOngkir V2 (tarif & lokasi) — tanpa webhook

### Apa yang dilayaninya
RajaOngkir V2 adalah "penghitung tarif". Aplikasi ini bertanya ke dia:

- "Daftar provinsi / kota / kecamatan apa saja yang ada?" → untuk form alamat checkout.
- "Ongkir dari kota A ke kota B, berat 1 kg, pakai kurir JNE berapa?" → untuk menampilkan pilihan ongkir ke pelanggan.

### Cara kerjanya (pull, bukan webhook)
Alurnya selalu **kita bertanya → dia menjawab**:

```
Aplikasi → tanya: "ongkir A→B 1kg JNE?"   →  RajaOngkir jawab: "Rp 15.000, 2 hari"
Aplikasi → tanya: "daftar kota di Jawa Barat?" →  RajaOngkir jawab: [kota-kota]
```

Tidak ada event yang perlu dinotifikasi — tarif dan lokasi berubah jarang, dan memang hanya perlu diketahui *saat* ditanya (pas checkout). Jadi webhook tidak diperlukan, dan dokumen resminya (`API-shipping-cost.md`) memang tidak menyediakan fitur itu.

### Lalu kenapa form RajaOngkir ada kolom "Webhook Secret"?
Ini **kunci rahasia bersama** (shared secret) yang dipakai untuk memverifikasi notifikasi dari layanan **Komship Delivery** dan layanan pembayaran. Letaknya di halaman Settings → RajaOngkir, tapi fungsinya untuk pengiriman:

- Setting ini tersimpan sebagai `rajaongkir_webhook_secret` (fallback dari env `RAJAONGKIR_WEBHOOK_SECRET`).
- Saat Komship mengirim notifikasi ke aplikasi kita, kita bisa memintanya membawa tanda tangan berupa secret ini (header `x-webhook-secret`). Kalau cocok → pasti dari Komerce, bukan orang iseng.
- Sifatnya **opsional** (lihat bagian verifikasi di bawah) — kalau dikosongkan, notifikasi tetap diterima.

---

## 4. Layanan 2: Komship Delivery — webhook status pengiriman

Ini layanan yang benar-benar memakai webhook. Fungsinya satu: **memberi tahu aplikasi kita bahwa status pengiriman sebuah order berubah**, supaya data di toko selalu sinkron tanpa perlu menanyakan terus-menerus.

### 4.1 Alur lengkap (cara kerja)

Ada dua arah komunikasi: **mendaftar** (kita ke Komerce) dan **menerima kabar** (Komerce ke kita).

```
[LANGKAH 1 — Daftar]
  Admin klik tombol "Daftarkan Webhook" di Settings → Pengiriman
  Aplikasi → PUT {base}/webhook  body: { "webhook_url": "https://tokoku.com/api/shipping/webhook" }
  Komerce menyimpan URL ini sebagai "nomor HP" kita. ✅

[LANGKAH 2 — Event terjadi]
  Kurir menjemput paket, paket dikirim, diterima, atau dibatalkan.
  Komerce melihat ada perubahan status → memanggil URL yang tadi didaftarkan.

[LANGKAH 3 — Komerce kirim kabar]
  Komerce → POST/PUT https://tokoku.com/api/shipping/webhook
  Body JSON: { "order_no": "HAG-123", "cnote": "JNE123456789", "status": "Dikirim" }

[LANGKAH 4 — Aplikasi memproses]
  Handler webhook membaca pesan, mencari order dengan nomor order itu di database,
  lalu memperbarui status pengiriman & nomor resi (AWB).

[LANGKAH 5 — Balas]
  Aplikasi membalas "200 OK" supaya Komerce tahu kabarnya sudah diterima.
```

### 4.2 Format pesan yang dikirim Komerce

| Key | Arti | Contoh |
|---|---|---|
| `order_no` | Nomor order di toko kita | `HAG-123` |
| `cnote` | Nomor resi / AWB dari kurir | `JNE123456789` |
| `status` | Status pengiriman terbaru | `Dikirim` |

Status yang diakui (VALID_STATUSES di kode): **Diajukan, Dijemput, Dikirim, Dibatalkan, Selesai**. Status lain diabaikan (tidak merusak apa pun).

### 4.3 Manfaat webhook ini (kenapa penting)

- **Tidak perlu polling** — tanpa webhook, kita harus bertanya ke Komerce setiap beberapa menit untuk tiap order yang sedang dikirim. Boros dan lambat.
- **Status selalu segar** — begitu kurir menjemput/mengirim/mengantarkan, database toko langsung berubah. Admin dan pelanggan melihat status terkini tanpa menekan tombol refresh manual.
- **Nomor resi otomatis** — `cnote` dari Komerce otomatis jadi nomor resi di order (kolom `trackingNumber`), jadi admin tidak perlu mengetik ulang.
- **Basis untuk fitur lanjutan** — karena datanya selalu sinkron, nanti bisa dipakai untuk notifikasi WhatsApp ke pelanggan ("Paketmu sudah dikirim 🚚"), tanpa kerja tambahan.

### 4.4 Implementasi di kode (untuk yang penasaran)

**A. Mendaftarkan URL** — dua lapis:

- `lib/komship.ts` → fungsi `registerWebhook(webhookUrl)` — mengirim `PUT /webhook` ke server Komerce dengan body `{ webhook_url }`. Server Komerce mewajibkan URL **HTTPS**; kalau URL-nya `http://` (misalnya lagi jalan di komputer lokal), pendaftaran ditolak dengan pesan jelas.
- `app/api/admin/komship/register-webhook/route.ts` — jembatan dari tombol admin ke fungsi di atas. URL webhook diracik otomatis dari `NEXT_PUBLIC_APP_URL` (alamat domain toko kita) + `/api/shipping/webhook`. Jadi kita tinggal klik tombol, tidak perlu hafal URL.

**B. Menerima notifikasi** — `app/api/shipping/webhook/route.ts`:

- Menerima metode **POST maupun PUT** (Komerce bisa pakai salah satunya).
- Membaca body `{ order_no, cnote, status }`.
- Mencari order di database lewat kolom `deliveryOrderNo`. Tidak ketemu → dicatat di log, tetap dibalas 200 (kabar sudah diterima, tidak perlu dikirim ulang).
- Update dua kolom: `deliveryStatus` (status terbaru) dan `trackingNumber` (resi, kalau ada yang baru).
- **Selalu balas 200** kecuali verifikasi gagal — karena kalau Komerce tidak menerima 200, dia akan *mengirim ulang* terus, berulang kali (retry).

### 4.5 Verifikasi keamanan (3 lapis, semuanya opsional)

Komerce tidak mewajibkan tanda tangan (dokumen resmi section 15), jadi aplikasi kita menerapkan **defense-in-depth**: kalau pengirimnya membawa bukti, kita periksa; kalau tidak membawa, kita tetap terima sesuai aturan resmi.

| Kondisi request | Yang diperiksa | Cocok? |
|---|---|---|
| Ada header `x-webhook-secret` | dibandingkan dengan `rajaongkir_webhook_secret` (setting/ env) | ❌ salah → ditolak 401 |
| Ada header `x-api-key` atau `x-callback-api-key` | dibandingkan dengan `komship_api_key` | ❌ salah → ditolak 401 |
| Tidak ada header auth sama sekali | — | ✅ diterima (sesuai dokumen resmi), tercatat di log |

Kenapa ditolak kalau salah tapi diterima kalau tidak bawa apa-apa? Karena menolak semua request tanpa header justru akan membuat notifikasi resmi gagal kalau ternyata Komerce tidak mengirim header (sesuai dokumen). Jadi: *buktinya kalau ada, harus benar*.

---

## 5. Ringkasan siapa melakukan apa

| Peran | Lokasi di kode | Kerjaannya |
|---|---|---|
| Tombol "Daftarkan Webhook" | `komship-settings-form.tsx` | Memanggil API admin → mendaftarkan URL ke Komerce |
| Pendaftaran | `lib/komship.ts` (`registerWebhook`) | `PUT /webhook` dengan `{ webhook_url }` |
| Alamat tujuan notifikasi | `/api/shipping/webhook` | Menerima kabar status dari Komerce |
| Kunci verifikasi | setting `rajaongkir_webhook_secret` | Dicocokkan dengan header `x-webhook-secret` |
| Database yang di-update | kolom `deliveryStatus` & `trackingNumber` di tabel Order | Status pengiriman & resi |

---

## 6. Catatan & troubleshooting umum

- **Webhook tidak masuk?** Cek dulu log server (`[webhook komship] ...`). Semua kedatangan, penolakan, dan error dicatat di sana.
- **Tombol daftar gagal?** Pastikan `NEXT_PUBLIC_APP_URL` di `.env.local` diisi alamat **HTTPS**. Di development lokal (`http://localhost`), Komerce menolak — itu wajar; di server produksi dengan HTTPS baru jalan.
- **Status berubah tapi tidak muncul di admin?** Refresh halaman — perubahan status disimpan di database, dan halaman admin membaca dari database.
- **Ada status aneh di log?** Status di luar daftar (Diajukan/Dijemput/Dikirim/Dibatalkan/Selesai) sengaja diabaikan — tidak salah, memang dirancang begitu.
- **Aplikasi menerima webhook tapi order tidak ketemu?** Kemungkinan besar `order_no` di Komerce berbeda dengan `deliveryOrderNo` di database kita (misal order dibuat manual di dashboard Komerce, bukan dari toko ini).
- **Webhook pembayaran?** Layanan pembayaran (QRIS / payment service) juga punya webhook sendiri, dijelaskan di dokumen `API-Qrisly.md` dan `API-payment-service.md`. Dokumen ini khusus untuk pengiriman (RajaOngkir).
