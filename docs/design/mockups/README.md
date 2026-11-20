# Mockup desain — Cardify

Artefak visual untuk issue desain. Dirender dari HTML dengan Chromium (bukan ilustrasi tangan), memakai font Inter.

Semua angka di mockup adalah **data dummy**, bukan hasil API.

## 01 — Hero kalkulator: sebelum vs sesudah

`01-hero-sebelum-sesudah.jpg`

Kiri: tangkapan layar live `cardify.my.id/calculator/youtube` — hero merah penuh, form mulai di bawah fold, judul masih huruf kecil ("Hitung Rate Card youtube").
Kanan: usulan — band gelap `#0A0A0A` dengan glow merah halus, judul berkapitalisasi benar, form terlihat di layar pertama.

## 02 — Form field: sebelum vs sesudah

`02-form-field-sebelum-sesudah.jpg`

Kiri: form live hari ini — Chakra default (tinggi 40px, radius 6px), placeholder `0`, tanpa satuan, tanpa pemisah ribuan.
Kanan: usulan — field 48px/radius 12px, satuan di dalam field, pemisah ribuan otomatis, chip state ("dari YouTube", "tidak tersedia"), segmented control untuk periode, nomor bagian 1–3.

## 03 — Blok hasil: dua opsi

`03-hasil-opsi-a-b.jpg`

Struktur mengikuti `#youtube-results` di kode (header identitas, 6 metrik, kartu per content type, watermark).

- **Opsi A — poster gelap**: band ink `#0A0A0A` + rail aksen platform, angka tarif utama dominan, kartu harga.
- **Opsi B — dokumen bersih**: tanpa band, harga disusun sebagai tabel, catatan metode di kaki dokumen.

Rekomendasi: **A sebagai struktur + catatan metode dari B**.

## Catatan

Blok hasil di produk adalah **sumber PDF** (`exportElementToPdf` mem-capture `#youtube-results` pada lebar 1366px, lalu menaruhnya di A4). Jadi setiap keputusan visual di blok itu ikut tercetak ke dokumen yang dikirim kreator ke brand.
