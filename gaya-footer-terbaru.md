1. Tampilan Desktop (Web)

Pada desktop, footer menggunakan Multi Column Footer (footer dengan beberapa kolom).

Struktur
-------------------------------------------------------------
| Logo | Company | Payment | Terms & Conditions |
-------------------------------------------------------------

Terdiri dari 4 area utama.

Kolom 1 — Brand

Berisi

Logo
(Opsional)
deskripsi brand
social media

Pada gambar hanya menampilkan logo.

Kolom 2 — Navigasi

Berisi link internal website.

Contoh

Netaseec29Club.

- All Products
- Categories

Biasanya disebut

Footer Navigation

Kolom 3 — Payment & Shipping

Berisi informasi transaksi.

Metode Pembayaran

Logo-logo pembayaran

QRIS
OVO
ShopeePay
Akulaku
Alfamart
Mandiri
BRI
BNI
Permata
Danamon
BSI
CIMB
Visa
Mastercard
JCB

Lalu di bawahnya

Metode Pengiriman

Logo ekspedisi

Misalnya

J&T
JNE
SiCepat
Ninja
AnterAja
Kolom 4 — Legal

Berisi halaman legal.

Misalnya

Terms & Conditions

- Persyaratan Layanan
- Kebijakan Privasi
- Kebijakan Pengiriman
- Kebijakan Pengembalian
- Hak Kekayaan Intelektual

Ini disebut

Legal Links

Layout Desktop

Secara CSS biasanya seperti

display: grid;

grid-template-columns:

1. Logo
2. Navigation
3. Payment
4. Legal

Contoh

--------------------------------------------------------------
Logo      Company      Payment         Terms
           Products     QRIS            Privacy
           Category     OVO             Refund
                        Visa            Shipping
                        BRI
                        J&T
--------------------------------------------------------------

Karakteristiknya:

semua informasi langsung terlihat
tidak ada collapse
mudah dipindai
cocok untuk monitor lebar
2. Tampilan Mobile (HP)

Pada mobile konsepnya berubah total.

Bukan lagi multi-column.

Melainkan menjadi

Accordion Footer

atau

Collapsible Footer

Bentuk
▼ Netaseec29Club

▼ Metode Pembayaran

▼ Metode Pengiriman

▼ Terms & Conditions

Setiap section bisa dibuka dan ditutup.

Saat dibuka

Misalnya Payment

▲ Metode Pembayaran

QRIS
OVO
ShopeePay
Visa
Mastercard
...

Sedangkan section lain tetap tertutup.

Mengapa menggunakan Accordion?

Karena layar HP sempit.

Kalau semua isi ditampilkan akan menjadi:

Logo

Company

Products

Categories

Payment

QRIS

OVO

Visa

Mastercard

...

Shipping

J&T

...

Terms

Privacy

Refund

Shipping

....

Logo lagi

Panjangnya bisa mencapai 1000–1500 px.

Accordion membuat halaman jauh lebih ringkas.

3. Responsive Behavior

Desktop

Logo

Company

Payment

Terms

↓

Tablet

Logo

Company

Payment

Terms

tetapi jaraknya lebih rapat.

↓

Mobile

▼ Company

▼ Payment

▼ Shipping

▼ Terms

Logo

Layout berubah dari horizontal menjadi vertikal.

4. Pola Responsive yang Dipakai

Ini disebut

Progressive Disclosure

Artinya:

Desktop

Semua informasi langsung ditampilkan.

Mobile

Informasi disembunyikan terlebih dahulu.

User memilih bagian yang ingin dibuka.

5. Komponen UI yang Digunakan

Footer ini terdiri dari beberapa komponen UI standar:

Komponen	Nama UI/UX
Logo brand	Brand Identity
Link produk	Footer Navigation
Logo pembayaran	Payment Methods
Logo ekspedisi	Shipping Methods
Link kebijakan	Legal Navigation
Panah atas/bawah	Accordion Toggle
Section yang bisa dibuka	Accordion / Collapse
Footer keseluruhan	Responsive Footer