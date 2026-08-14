// Konten default untuk halaman CMS — sumber tunggal yang dipakai oleh
// prisma/seed-cms.ts (isian awal DB) dan halaman publik sebagai fallback
// saat data di DB belum ada.

export interface DefaultCmsPage {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  showInFooter: boolean;
  sortOrder: number;
}

export const DEFAULT_CMS_PAGES: DefaultCmsPage[] = [
  {
    slug: "about",
    title: "Puncak Kenyamanan yang Elegan",
    excerpt: "Tempat gairah otomotif bertemu gaya tanpa kompromi.",
    showInFooter: true,
    sortOrder: 1,
    content: `## Kisah Kami

HAGE CLUB lahir di dalam garasi — bukan karena terpaksa, tapi karena di sanalah ide-ide terbaik terbentuk. Di mana tangan yang penuh gemuk menyatu dengan sketsa arang di atas serbet, di mana dengung mesin menjadi soundtrack kreativitas.

Kami percaya bahwa gaya tidak terpisah dari fungsi, dan orang yang menghargai lekukan bodi mobil juga menghargai jatuhnya kemeja yang dipotong dengan baik. Koleksi kami menjembatani kesenjangan antara garasi dan kehidupan sehari-hari — pakaian yang terasa nyaman di balik kemudi, di acara kopdar, atau di mana pun jalan membawamu.

Setiap jahitan, setiap potongan, setiap pilihan kain adalah keputusan yang disengaja. Kami tidak mengikuti tren — kami membangun sesuatu yang bertahan. Karena gaya sejati, seperti mobil klasik, hanya akan semakin baik seiring waktu.

## Nilai Kami

**Kualitas** — Setiap produk dibuat dengan presisi, menggunakan bahan premium yang tahan uji waktu — layaknya mesin yang dibangun dengan baik.

**Kenyamanan** — Dirancang untuk perjalanan dan keseharian. Pakaian kami mengutamakan fit, feel, dan fungsi tanpa mengorbankan gaya.

**Autentisitas** — Berakar dari budaya otomotif sejati. HAGE CLUB berbicara kepada mereka yang menjalani gaya hidup, bukan sekadar memakai label.

**Keabadian** — Melampaui tren. Setiap koleksi dibangun untuk tetap relevan musim demi musim — siluet klasik, desain abadi.

## Di Balik Brand

HAGE CLUB dibuat oleh para enthusiast, untuk para enthusiast. Filosofi desain kami terinspirasi dari energi mentah motorsport, presisi teknik, dan elegansi sederhana dari modern minimalism.

Setiap koleksi terinspirasi dari detail-detail yang berarti — butiran kulit pada setir vintage, anyaman carbon fiber, cahaya analog gauge di tengah malam. Kami menerjemahkan elemen-elemen ini menjadi pakaian yang berbicara tanpa berteriak.`,
  },
  {
    slug: "privacy-policy",
    title: "Kebijakan Privasi",
    excerpt:
      "Kebijakan privasi HAGE CLUB — bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.",
    showInFooter: true,
    sortOrder: 2,
    content: `## Informasi yang Kami Kumpulkan

Kami mengumpulkan informasi berikut saat kamu menggunakan website kami:

- Informasi akun: nama, email, nomor telepon, alamat pengiriman
- Informasi pesanan: produk yang dibeli, jumlah, harga, metode pembayaran
- Data penggunaan: halaman yang dikunjungi, durasi kunjungan, perangkat yang digunakan

## Penggunaan Informasi

Informasi kamu digunakan untuk:

- Memproses dan mengirimkan pesanan
- Mengirimkan konfirmasi pesanan dan update pengiriman
- Menyediakan layanan pelanggan
- Meningkatkan pengalaman berbelanja kamu
- Mengirimkan promo dan penawaran (dengan persetujuan kamu)

## Perlindungan Data

Kami menerapkan langkah-langkah keamanan teknis dan organisasi untuk melindungi data pribadi kamu dari akses tidak sah, perubahan, pengungkapan, atau penghancuran. Data pembayaran ditangani langsung oleh penyedia layanan pembayaran terpercaya.

## Cookies

Website kami menggunakan cookies untuk meningkatkan pengalaman browsing. Kamu dapat mengatur preferensi cookies melalui pengaturan browser. Cookies membantu kami mengingat preferensi kamu dan memahami bagaimana kamu menggunakan website.

## Berbagi Data dengan Pihak Ketiga

Kami tidak menjual data pribadi kamu. Informasi hanya dibagikan dengan pihak ketiga yang diperlukan untuk pemrosesan pesanan (jasa kurir, penyedia pembayaran) dan compliance hukum.

## Hak Kamu

Kamu memiliki hak untuk:

- Mengakses data pribadi yang kami simpan
- Memperbaiki data yang tidak akurat
- Menghapus akun dan data terkait
- Menolak penerimaan komunikasi pemasaran

## Hubungi Kami

Jika ada pertanyaan tentang kebijakan privasi ini, hubungi kami di support@hageclub.com.`,
  },
  {
    slug: "terms-conditions",
    title: "Syarat & Ketentuan",
    excerpt: "Syarat dan ketentuan penggunaan website dan layanan HAGE CLUB.",
    showInFooter: true,
    sortOrder: 3,
    content: `## 1. Umum

Dengan mengakses dan menggunakan website HAGE CLUB, kamu menyetujui untuk mematuhi syarat dan ketentuan ini. Jika tidak setuju, mohon jangan gunakan website kami.

## 2. Pendaftaran Akun

Saat membuat akun, kamu harus memberikan informasi yang akurat dan lengkap. Kamu bertanggung jawab menjaga kerahasiaan kredensial akun dan semua aktivitas di bawah akun kamu.

## 3. Pesanan & Pembayaran

- Semua harga dalam Rupiah Indonesia (IDR) dan sudah termasuk pajak yang berlaku
- Pembayaran harus diterima lunas sebelum pesanan diproses
- Kami berhak membatalkan pesanan karena ketidaktersediaan stok atau kesalahan harga
- Konfirmasi pesanan tidak menjamin ketersediaan produk

## 4. Pengiriman

- Estimasi waktu pengiriman diberikan oleh kurir dan tidak dijamin
- Risiko kehilangan beralih ke kamu setelah barang diserahkan ke kurir
- Biaya pengiriman dihitung saat checkout berdasarkan berat dan tujuan

## 5. Pengembalian & Refund

- Pengembalian diterima dalam 14 hari setelah diterima
- Barang harus tidak dipakai, tidak dicuci, dan dalam kondisi original dengan tag
- Refund diproses dalam 7 hari kerja setelah kami menerima barang yang dikembalikan
- Biaya pengiriman pengembalian ditanggung pelanggan kecuali barang cacat

## 6. Kekayaan Intelektual

Semua konten di website ini — termasuk logo, desain, teks, gambar, dan deskripsi produk — adalah milik HAGE CLUB dan dilindungi oleh hukum kekayaan intelektual yang berlaku.

## 7. Batasan Tanggung Jawab

HAGE CLUB tidak bertanggung jawab atas kerusakan tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan website atau produk kami, sejauh yang diizinkan oleh hukum.

## 8. Perubahan Ketentuan

Kami berhak memperbarui ketentuan ini kapan saja. Perubahan akan berlaku segera setelah dipublikasikan. Penggunaan website secara berkelanjutan merupakan penerimaan terhadap ketentuan yang diperbarui.`,
  },
  {
    slug: "shipping-info",
    title: "Informasi Pengiriman",
    excerpt: "Informasi pengiriman, pilihan kurir, dan estimasi pengiriman untuk pesanan HAGE CLUB.",
    showInFooter: true,
    sortOrder: 4,
    content: `## Waktu Pemrosesan

Semua pesanan diproses dalam 1-2 hari kerja setelah konfirmasi pembayaran. Pesanan yang dibuat pada akhir pekan atau hari libur akan diproses pada hari kerja berikutnya.

## Mitra Kurir

Kami bekerja sama dengan kurir berikut untuk pengiriman:

- **JNE** — REG (3-5 hari), YES (1-2 hari)
- **J&T** — Reguler (2-4 hari)
- **SiCepat** — REG (2-4 hari), BEST (1-2 hari)

## Tarif Pengiriman

Biaya pengiriman dihitung secara otomatis saat checkout berdasarkan lokasi dan berat barang di keranjang. Kamu dapat melihat biaya pengiriman tepat sebelum menyelesaikan pembelian.

## Gratis Ongkir

Nikmati gratis ongkir untuk pesanan dengan minimal pembelian IDR 500.000. Promo ini berlaku untuk semua layanan kurir di Indonesia.

## Estimasi Pengiriman

- **Jabodetabek** — 1-2 hari
- **Jawa** — 2-3 hari
- **Sumatra** — 3-5 hari
- **Kalimantan, Sulawesi, Bali, Nusa Tenggara** — 4-7 hari
- **Maluku, Papua** — 5-10 hari

## Lacak Pesanan

Setelah pesanan dikirim, kamu akan menerima email konfirmasi dengan nomor resi. Kamu bisa melacak pesanan secara real-time menggunakan website kurir atau halaman Lacak Pesanan kami.`,
  },
  {
    slug: "return-policy",
    title: "Kebijakan Pengembalian & Refund",
    excerpt: "Kebijakan pengembalian dan refund HAGE CLUB untuk semua pembelian online.",
    showInFooter: true,
    sortOrder: 5,
    content: `## Syarat Pengembalian

- Pengembalian diterima dalam waktu 14 hari setelah barang diterima
- Barang harus dalam kondisi tidak dipakai, tidak dicuci, dan masih memiliki tag original
- Produk diskon atau flash sale tidak dapat dikembalikan
- Biaya pengiriman pengembalian ditanggung oleh pelanggan, kecuali untuk barang cacat

## Inspeksi & Cacat

Harap periksa barang segera setelah diterima. Jika menemukan cacat produksi atau kesalahan pengiriman, hubungi kami dalam waktu 2x24 jam melalui email atau WhatsApp dengan menyertakan foto barang sebagai bukti.

## Cara Mengajukan Pengembalian

- **1.** Hubungi kami melalui email atau WhatsApp dengan nomor pesanan dan alasan pengembalian
- **2.** Tim kami akan memberikan instruksi dan alamat pengiriman pengembalian
- **3.** Kirim barang dengan packing yang aman dan sertakan nomor pesanan di dalam paket
- **4.** Setelah barang diterima dan diperiksa, refund akan diproses dalam 7 hari kerja

## Pemrosesan Refund

- Refund akan dikembalikan ke metode pembayaran awal
- Waktu pemrosesan refund adalah 7 hari kerja setelah barang diterima
- Biaya admin mungkin berlaku untuk metode pembayaran tertentu

## Kebijakan Tukar

Penukaran ukuran dapat dilakukan dalam 14 hari setelah barang diterima, tergantung ketersediaan stok. Biaya pengiriman untuk penukaran ditanggung oleh pelanggan.

## Pembatalan Pesanan

Pesanan dapat dibatalkan jika belum diproses. Hubungi kami segera jika ingin membatalkan pesanan. Pesanan yang sudah diproses atau dikirim tidak dapat dibatalkan.

## Hubungi Kami

Untuk pertanyaan tentang pengembalian, hubungi kami di:

- Email: support@hageclub.com
- WhatsApp: +62 8xx-xxxx-xxxx
- Jam operasional: Senin - Jumat, 09:00 - 17:00 WIB`,
  },
];

export interface DefaultFaqItem {
  question: string;
  answer: string;
}

export const DEFAULT_FAQ_ITEMS: DefaultFaqItem[] = [
  {
    question: "Apa itu HAGE CLUB?",
    answer:
      "HAGE CLUB adalah brand lifestyle otomotif premium berbasis di Indonesia. Kami menciptakan pakaian dan aksesori yang memadukan budaya otomotif dengan gaya kontemporer — dirancang untuk para enthusiast yang menjalani gaya hidup ini.",
  },
  {
    question: "Di mana lokasi kalian?",
    answer: "Kami berbasis di Jakarta, Indonesia. Semua pesanan dikirim dari gudang kami di Jakarta Selatan.",
  },
  {
    question: "Apakah kalian mengirim ke luar negeri?",
    answer:
      "Saat ini kami mengirim ke seluruh provinsi di Indonesia. Pengiriman internasional akan segera hadir — ikuti Instagram kami untuk info terbaru.",
  },
  {
    question: "Metode pembayaran apa yang diterima?",
    answer: "Kami menerima Transfer Bank (BCA, BNI, BRI, Mandiri), E-Wallet (OVO, GoPay, DANA), dan QRIS.",
  },
  {
    question: "Berapa lama pengiriman?",
    answer:
      "Pemrosesan 1-2 hari kerja. Pengiriman dalam Jawa biasanya 2-3 hari, dan 3-7 hari untuk wilayah lain tergantung kurir.",
  },
  {
    question: "Bagaimana kebijakan pengembalian?",
    answer:
      "Kami menerima pengembalian dalam 14 hari setelah diterima untuk barang yang tidak dipakai dengan kondisi original dan tag masih terpasang. Barang harus tidak dicuci, tidak dipakai, dan bebas dari bau atau noda.",
  },
  {
    question: "Bagaimana cara melacak pesanan?",
    answer:
      "Setelah pesanan dikirim, kamu akan menerima nomor resi via email. Kamu juga bisa melacak pesanan di halaman Lacak Pesanan.",
  },
  {
    question: "Apakah kalian punya toko fisik?",
    answer:
      "Saat ini kami online-only. Namun kami kadang mengikuti acara pop-up dan kopdar otomotif — cek Instagram kami untuk pengumuman.",
  },
  {
    question: "Bagaimana cara merawat pakaian HAGE CLUB?",
    answer:
      "Untuk menjaga kualitas pakaian, kami merekomendasikan mencuci dengan sisi dalam di luar, air dingin, hindari pemutih, dan jemur di tempat teduh. Petunjuk perawatan detail ada di setiap halaman produk.",
  },
  {
    question: "Bisakah saya membatalkan atau mengubah pesanan?",
    answer:
      "Pesanan dapat dibatalkan dalam 1 jam setelah dibuat. Setelah itu, pesanan masuk proses dan tidak dapat diubah lagi. Hubungi kami segera jika perlu perubahan.",
  },
];

export interface ContactInfo {
  whatsapp: { label: string; url: string; note: string };
  email: { label: string; note: string };
  phone: { label: string; note: string };
  address: { lines: string[] };
  hours: Array<{ days: string; time: string }>;
  social: Array<{ platform: string; handle: string }>;
  responseTime: string;
}

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  whatsapp: {
    label: "+62 812-3456-7890",
    url: "https://wa.me/6281234567890",
    note: "Respon cepat via chat",
  },
  email: { label: "hello@hageclub.com", note: "" },
  phone: { label: "(021) 123-4567", note: "Tersedia saat jam kerja" },
  address: {
    lines: ["HAGE CLUB Headquarters", "Jl. Sudirman No. 123", "Jakarta Pusat, 10220", "Indonesia"],
  },
  hours: [
    { days: "Senin – Jumat", time: "09:00 – 18:00" },
    { days: "Sabtu", time: "09:00 – 15:00" },
    { days: "Minggu & Hari Libur", time: "Tutup" },
  ],
  social: [
    { platform: "Instagram", handle: "@hageclub" },
    { platform: "TikTok", handle: "@hageclub" },
  ],
  responseTime: "Kami biasanya merespon dalam 24 jam pada hari kerja.",
};
