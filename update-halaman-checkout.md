Refactor seluruh flow Checkout menjadi Single Page Checkout dengan layout mengikuti referensi di bawah ini. Gunakan hanya struktur layout dan pola interaksi (UI/UX) dari referensi, jangan menyalin warna, typography, maupun design system. Semua warna, font, border radius, spacing, shadow, icon, dan komponen tetap mengikuti design system website yang sudah ada.

1. Detail Alamat
Alamat tidak lagi diinput manual pada halaman checkout.
Ambil otomatis alamat utama customer dari Address Book.
Tampilkan dalam bentuk card seperti referensi.
Di pojok kanan card terdapat tombol Ubah untuk memilih alamat lain atau menambah alamat baru melalui modal/bottom sheet.
Di bawah card alamat terdapat checkbox:
Buat sebagai order dropship
2. Metode Pengiriman

Ubah menjadi select card yang ketika diklik membuka Bottom Sheet seperti referensi (gambar 3).

Bottom Sheet harus berisi:

Judul Metode Pengiriman
Daftar ekspedisi yang direkomendasikan.
Urutan rekomendasi mengikuti konfigurasi Admin:
J&T Express
SiCepat
JNE

Untuk setiap ekspedisi:

tampilkan maksimal 3 layanan termurah (jika tersedia dari API RajaOngkir)
contoh:
Regular
EZ
Cargo (jika termasuk 3 termurah)

Setiap item menampilkan:

logo ekspedisi
nama ekspedisi
nama layanan
estimasi hari
harga ongkir

Berikan badge apabila perlu:

Termurah
Rekomendasi
Paling Cepat

Hanya satu layanan dapat dipilih.

Ketika user menekan Konfirmasi, card Metode Pengiriman pada halaman checkout langsung terupdate.

3. Metode Pembayaran

Gunakan Bottom Sheet Full Screen seperti referensi (gambar 4).

Di dalam Bottom Sheet terdapat:

Tab Payment

Contoh:

Virtual Account
QRIS
E-Wallet
(opsional metode lain jika tersedia)

Data payment HARUS dinamis mengikuti hasil API Payment Gateway (Komerce Payment), bukan hardcode.

Contoh Virtual Account:

BCA VA
Mandiri VA
BNI VA
BRI VA
CIMB Niaga VA
Permata VA
Permata Syariah
Danamon VA
BSI VA
Bank Neo
dll sesuai API

Setiap metode menampilkan:

logo bank
nama bank
deskripsi singkat
radio indicator

Setelah klik Konfirmasi, halaman checkout langsung memperbarui metode pembayaran yang dipilih.

4. Pesan Permintaan Pengiriman

Pada Ringkasan Pesanan terdapat card:

Tinggalkan Pesan Pengiriman (Opsional)

Ketika diklik membuka Bottom Sheet seperti referensi (gambar 5).

Isi Bottom Sheet:

Pilihan cepat:

Tinggalkan paket di depan rumah
Tinggalkan paket di lobby/satpam
Sesuaikan pesan

Jika memilih Sesuaikan pesan, tampilkan textarea untuk mengetik pesan bebas.

Simpan hasil setelah klik Konfirmasi.

5. Voucher

Tambahkan card Voucher di Ringkasan Pesanan.

Ketika diklik membuka Bottom Sheet seperti referensi (gambar 6).

Isi Bottom Sheet:

Input kode voucher
Tombol Terapkan
Daftar voucher yang dimiliki customer (jika ada)
Jika tidak ada voucher, tampilkan empty state yang informatif.

Voucher dapat berasal dari:

voucher customer
voucher campaign
kode promo manual

Setelah voucher berhasil digunakan:

Bottom Sheet otomatis tertutup.
Ringkasan pembayaran langsung diperbarui.
6. Ringkasan Pesanan

Tetap berada dalam halaman checkout.

Menampilkan:

daftar produk
subtotal
total berat
ongkir
diskon voucher
biaya layanan (jika ada)
total pembayaran

Semua nominal harus berubah secara realtime ketika user mengganti:

alamat
kurir
layanan pengiriman
voucher
metode pembayaran (jika memiliki biaya admin)
7. Interaksi Bottom Sheet

Semua Bottom Sheet mengikuti pola interaksi referensi:

muncul dari bawah
animasi smooth
memiliki overlay
dapat ditutup melalui tombol close atau swipe down
posisi tetap di halaman checkout (tidak berpindah halaman)
data langsung diperbarui setelah tombol Konfirmasi atau Terapkan ditekan
8. Responsif

Pastikan seluruh halaman checkout dioptimalkan untuk perangkat mobile.

Layout mengikuti pola mobile-first.
Bottom Sheet responsif di seluruh ukuran layar HP.
Metode Pengiriman menggunakan Bottom Sheet standar.
Metode Pembayaran menggunakan Bottom Sheet Full Screen.
Voucher menggunakan Bottom Sheet sedang.
Pesan Pengiriman menggunakan Bottom Sheet sedang.
Hindari membuka halaman baru; seluruh proses checkout berlangsung dalam satu halaman agar alur lebih cepat dan minim perpindahan layar.



┌──────────────────────────────────────┐
│ ←          Logo / Checkout           │
├──────────────────────────────────────┤

  DETAIL ALAMAT
┌──────────────────────────────────────┐
│ Nama Penerima              Ubah >    │
│ 0812xxxxxxxx                         │
│ Alamat Lengkap                      │
│ Kota, Provinsi                      │
└──────────────────────────────────────┘

────────────────────────────────────────

METODE PENGIRIMAN

┌──────────────────────────────────────┐
│ 🚚 J&T Express                       │
│ Regular • Estimasi 1-2 Hari          │
│                              Rp18.000│
│                                   >  │
└──────────────────────────────────────┘

(Klik membuka Bottom Sheet)


────────────────────────────────────────

METODE PEMBAYARAN

┌──────────────────────────────────────┐
│ 🏦 Virtual Account                   │
│ BCA Virtual Account                  │
│                                   >  │
└──────────────────────────────────────┘

(Klik membuka Bottom Sheet Fullscreen)


────────────────────────────────────────

RINGKASAN PESANAN

┌──────────────────────────────────────┐
│ [IMG] Produk                         │
│ Nama Produk                          │
│ Qty x2                               │
│                           Rp189.000  │
└──────────────────────────────────────┘


────────────────────────────────────────

PESAN PENGIRIMAN

┌──────────────────────────────────────┐
│ Tinggalkan pesan (Opsional)       >  │
└──────────────────────────────────────┘

(Klik membuka Bottom Sheet)


────────────────────────────────────────

VOUCHER

┌──────────────────────────────────────┐
│ Voucher                           >  │
└──────────────────────────────────────┘

(Klik membuka Bottom Sheet)


────────────────────────────────────────

RINGKASAN PEMBAYARAN

Subtotal                    Rp189.000
Pengiriman                   Rp13.000
Diskon Voucher                    -Rp0
Biaya Admin                      Rp0
──────────────────────────────────────
TOTAL                     Rp202.000


🔒 Pembayaran Aman



┌──────────────────────────────────────┐
│        ORDER SEKARANG                │
└──────────────────────────────────────┘

Dengan melakukan pesanan berarti
setuju dengan Syarat & Ketentuan.

Checkout
│
├── Alamat
│      └── Modal / Bottom Sheet Address Book
│
├── Metode Pengiriman
│      └── Bottom Sheet (70% tinggi)
│              • J&T
│              • SiCepat
│              • JNE
│              • maksimal 3 layanan termurah
│
├── Metode Pembayaran
│      └── Full Screen Bottom Sheet
│              Tab
│              ├── Virtual Account
│              ├── QRIS
│              ├── E-Wallet
│              └── dst
│
├── Pesan Pengiriman
│      └── Bottom Sheet kecil
│
└── Voucher
       └── Bottom Sheet sedang


Masuk Checkout

      │

      ▼

Alamat otomatis tampil

      │

      ▼

Pilih Pengiriman
(Bottom Sheet)

      │

      ▼

Pilih Pembayaran
(Fullscreen Bottom Sheet)

      │

      ▼

(Optional)
Pesan Pengiriman

      │

      ▼

(Optional)
Voucher

      │

      ▼

Ringkasan otomatis update

      │

      ▼

ORDER SEKARANG