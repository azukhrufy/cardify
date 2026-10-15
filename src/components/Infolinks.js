// components/Infolinks.js

import { useEffect, useSyncExternalStore } from "react";

import {
  getAdTermsServerSnapshot,
  getAdTermsSnapshot,
  subscribeToAdTerms,
} from "@/lib/adTerms";

// ID akun dari dashboard Infolinks. `wsid` 0 artinya workspace default. Keduanya
// dibaca skrip utamanya saat dieksekusi, jadi harus sudah terpasang di `window`
// sebelum script-nya di-append — bukan sesudah.
const INOLINKS_PID = 3448690;
const INOLINKS_WSID = 0;
const INOLINKS_SRC = "https://resources.infolinks.com/js/infolinks_main.js";

// Snippet resminya memakai URL protocol-relative (`//resources.infolinks.com/...`).
// Ditulis `https://` eksplisit karena origin ini di-HSTS dan tidak punya jalur
// HTTP yang perlu dipertahankan.
//
// Perbedaan dari snippet resmi yang lain, sengaja: dua baris
// `var infolinks_pid = ...` di sana digantikan penugasan `window` langsung di
// dalam effect di bawah. Efeknya sama persis, tapi tidak perlu `<script>` inline
// yang isinya cuma mengisi dua variabel.
//
// Skrip ini ditulis untuk situs MPA: ia memindai dokumen sekali saat dimuat, dan
// tidak ada API resmi untuk memaksa pemindaian ulang setelah navigasi klien.
// Artinya tautan InText muncul di halaman tempat skripnya pertama jalan, dan
// halaman berikutnya yang dicapai lewat navigasi klien belum tentu ikut terisi.
// Memuat ulang halamannya selalu aman — lihat dedupe di bawah.
//
// Pilihan lain yang ada dan sengaja TIDAK dipakai: menyuntik ulang skripnya di
// setiap perubahan route. Infolinks tidak mendokumentasikan apa yang terjadi
// kalau `infolinks_main.js` dieksekusi dua kali dalam satu sesi (observer ganda,
// popup dua kali?), jadi menebaknya dengan uang orang lain bukan pilihan.

/**
 * Iklan InText / InFold Infolinks.
 *
 * Gerbang syarat penggunaan sama dengan Adsterra dan Monetag: skrip pihak
 * ketiga baru dimuat setelah user menekan tombol di `AdTermsBanner`. Halaman
 * privacy menyebut itu sebagai janji, jadi tidak boleh dimuat lebih awal.
 *
 * Beda dari `AdsterraBanner`, komponen ini tidak merender container apa pun:
 * skripnya memindai teks di seluruh dokumen dan menyisipkan tautan ke dalam
 * teks itu sendiri. Karena itu ia dipasang di `_app` — cakupannya seluruh situs,
 * bukan satu halaman kalkulator — dan karena tidak ada container, tidak ada
 * markup yang berbeda antara server dan klien.
 */
export default function Infolinks() {
  // Snapshot server selalu `null` ("belum menerima"), sama seperti banner
  // syaratnya — jadi HTML statis tidak memuat apa pun dari komponen ini.
  const acceptedAt = useSyncExternalStore(
    subscribeToAdTerms,
    getAdTermsSnapshot,
    getAdTermsServerSnapshot,
  );
  const accepted = acceptedAt !== null;

  useEffect(() => {
    if (!accepted) return;
    // Skripnya mengubah teks di seluruh dokumen, jadi menjalankannya dua kali
    // berarti dua lapis tautan di teks yang sama. Node yang sudah ada cukup —
    // itu juga yang menahan dobel-invoke StrictMode di mode dev.
    if (document.querySelector(`script[src="${INOLINKS_SRC}"]`)) return;

    window.infolinks_pid = INOLINKS_PID;
    window.infolinks_wsid = INOLINKS_WSID;

    const script = document.createElement("script");
    // `src` di-assign terakhir supaya request-nya tidak jalan sebelum siap.
    script.src = INOLINKS_SRC;

    document.body.appendChild(script);

    // Tidak ada cleanup yang membuang node-nya, dan itu disengaja: membuang
    // script-nya tidak mencabut tautan yang sudah disisipkan ke teks, jadi
    // cleanup yang ada di AdsterraBanner tidak ada gunanya di sini.
  }, [accepted]);

  return null;
}
