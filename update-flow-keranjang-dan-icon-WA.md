Update UI/UX Keranjang (Web & Mobile)
1. Navbar
Sembunyikan ikon Keranjang pada Navbar di seluruh halaman.
Pengguna mengakses keranjang melalui Floating Cart Alert yang muncul setelah produk ditambahkan ke keranjang.
2. Add to Cart (Mobile)
Saat pengguna menambahkan produk ke keranjang, tampilkan Bottom Sheet / Bottom Modal (slide-up dari bawah) seperti pola aplikasi mobile.
Modal berisi:
Informasi produk yang berhasil ditambahkan.
Thumbnail produk.
Nama produk.
Harga.
Varian & jumlah.
Tombol Lihat Keranjang.
Tombol Beli Sekarang.
Modal dapat ditutup dengan tombol Close (×) atau gesture swipe ke bawah.
3. Floating Cart Alert (Home)

Setelah produk berhasil ditambahkan ke keranjang, tampilkan Floating Cart Alert yang tetap berada di bagian bawah layar.

Contoh:

1 Barang di Keranjang Saya
Rp 449.000

Behavior:

Floating Alert tetap tampil selama masih terdapat item di keranjang.
Posisi fixed di bagian bawah layar.
Saat diklik, Floating Alert akan membuka Cart Sidebar / Cart Drawer.
4. Cart Sidebar / Cart Drawer

Saat Floating Cart Alert diklik:

Tampilkan Sidebar (Desktop) atau Side Drawer (Mobile) yang muncul dari sisi kanan layar.
Tampilan mengikuti referensi pada gambar ketiga.
Sidebar menampilkan:
Daftar produk di keranjang.
Thumbnail produk.
Harga.
Informasi stok.
Pengaturan jumlah (+ / -).
Tombol Hapus.
Pindahkan ke Wishlist.
Ringkasan total belanja.
Tombol Checkout.
Sidebar dapat ditutup dengan tombol Close (×) atau klik area di luar panel.
5. WhatsApp Floating Button
Tambahkan Floating WhatsApp Button di sebelah kanan Floating Cart Alert.
Ukuran tombol WhatsApp dibuat lebih kecil agar proporsional dan sejajar dengan tinggi Floating Cart Alert.
Jarak antar tombol sekitar 12–16 px.
Tombol WhatsApp tetap berada pada posisi fixed di bagian bawah layar dan selalu mengikuti Floating Cart Alert.
Behavior Flow
Pengguna klik Tambah ke Keranjang.
Muncul Bottom Sheet konfirmasi produk berhasil ditambahkan.
Setelah Bottom Sheet ditutup, muncul Floating Cart Alert di bagian bawah layar.
Pengguna dapat menekan Floating Cart Alert untuk membuka Cart Sidebar / Cart Drawer.
Tombol WhatsApp tetap tampil di samping Floating Cart Alert sebagai akses cepat ke layanan pelanggan.
UX Goal

Mengadopsi pola interaksi yang lebih modern dan menyerupai aplikasi mobile, sehingga proses Add to Cart → Review Cart → Checkout menjadi lebih cepat, intuitif, dan tidak mengganggu pengalaman pengguna saat menjelajahi katalog produk.