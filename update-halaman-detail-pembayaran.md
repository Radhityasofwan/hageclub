Informasi Order (Hero Section)

Bagian paling atas setelah header berisi informasi pembayaran.

Urutan tampilannya:

Order Saya

ID #XXXXXXXX
(copy icon)

--------------------------------

Status
Belum Dibayar

Tanggal Pemesanan
06 Agustus 2026

Total Pembayaran
Rp xxx.xxx
(copy icon)

Sisa Waktu Pembayaran
09:59
Berlaku hingga
06 Agustus 2026
21:03 WIB

Ketentuan:

Status menggunakan warna sesuai design system.
Nomor order dapat disalin.
Total pembayaran dapat disalin.
Countdown harus realtime.
Countdown

VA maupun QRIS memiliki masa berlaku 10 menit.

Contoh:

09:59
09:58
09:57
...
00:01
00:00

Jika timer habis:

status otomatis berubah menjadi
Kadaluarsa
seluruh instruksi pembayaran dinonaktifkan
tombol pembayaran disembunyikan
tampil tombol
Buat Pembayaran Baru
3. Informasi Pembayaran

Di bawah countdown tampil kartu pembayaran.

Contoh layout:

[Logo Bank]

Ke:
Bank BRI

Virtual Account

13282476302946122
(copy)

Atas Nama:
Nama Customer

Jika menggunakan QRIS

Logo QRIS

QRIS Payment

Kode Pembayaran

QR Image

Expired:
09:59
4. Kotak Informasi

Di bawah informasi pembayaran tampil card informasi.

Contoh

ⓘ

Ikuti instruksi pembayaran di bawah.

Jangan membagikan
nomor Virtual Account,
QRIS,
atau kode pembayaran
kepada pihak lain.
5. Instruksi Pembayaran (Accordion)

Gunakan accordion seperti referensi.

Default:

ATM
▼

Ketika dibuka:

LANGKAH 1

....

LANGKAH 2

....

LANGKAH 3

....

Di bawahnya terdapat accordion lain.

Mobile Banking

▼
Internet Banking

▼

Hanya satu accordion terbuka dalam satu waktu.

Instruksi harus berasal dari payment gateway sesuai metode pembayaran yang dipilih.

Jangan hardcode.

6. Tombol Ubah Metode Pembayaran

Setelah accordion tampil:

Ubah Metode Pembayaran

Berupa text button.

Ketika ditekan:

Buka Bottom Sheet Full Screen yang sama seperti Checkout.

User dapat memilih:

Virtual Account
QRIS
E-Wallet (jika tersedia)

Semua metode pembayaran harus diambil secara dinamis dari integrasi RajaOngkir Payment Service/Komerce Payment API.

7. Ringkasan Pesanan

Di bawah tombol ubah pembayaran tampil Card Ringkasan Pesanan.

Isi:

Ringkasan Pesanan

Foto Produk

Nama Produk

Variasi

Qty

Harga

Lalu rincian:

Subtotal

Ongkir

Asuransi

Diskon Voucher

Biaya Admin (jika ada)

-----------------------

Total Pembayaran

Semua nilai berasal dari checkout.

Tidak boleh dihitung ulang secara manual.

8. Rincian Pesanan

Card berikutnya berisi informasi order.

Layout:

Rincian Pesanan

Email

Metode Pengiriman

Kurir

Layanan

Estimasi

Berat

Alamat Penerima

Nama

Nomor HP

Alamat Lengkap

Di kanan atas terdapat tombol:

Ubah Info

Jika order belum dibayar:

boleh kembali ke checkout.

Jika sudah dibayar:

button dinonaktifkan.

9. Footer Action

Bagian bawah halaman:

Butuh bantuan?

Hubungi Kami

mengarah ke WhatsApp Admin.

Di bawahnya tombol utama.

Jika status:

Belum Dibayar

Lanjutkan Belanja

atau

Kembali ke Beranda

(sesuai flow website).

Lalu tampil link:

Batalkan Pesanan

Jika order belum dibayar.

Jika sudah dibayar:

sembunyikan.

Paling bawah:

Syarat & Ketentuan
10. Sinkronisasi API

Seluruh halaman harus menggunakan data hasil integrasi RajaOngkir/Komerce Payment API, bukan data statis.

Data yang wajib berasal dari API:

Order ID
Status pembayaran
Countdown expired
Nomor Virtual Account
QRIS
Nama bank
Instruksi pembayaran
Payment Channel
Total pembayaran
Detail item
Ongkir
Voucher
Asuransi
Metode pengiriman
Status transaksi
Payment callback/webhook
Expired time (10 menit)

Setelah webhook pembayaran berhasil diterima:

countdown berhenti
status berubah menjadi Berhasil Dibayar
halaman otomatis memperbarui data tanpa perlu refresh manual
tombol Batalkan Pesanan disembunyikan
halaman menampilkan status pembayaran terbaru secara real-time.

Dengan struktur ini, halaman detail pembayaran akan konsisten dengan flow checkout yang telah Anda rancang, sekaligus selaras dengan dokumentasi integrasi RajaOngkir/Komerce Payment API.