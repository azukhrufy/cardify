// lib/loadMonetag.js

import { hasAcceptedAdTerms } from "./adTerms";

// Throttle global: maksimal satu iklan per 5 menit, berlaku untuk semua zona
// dan semua halaman kalkulator. Disimpan di `sessionStorage` (bukan
// `localStorage`) supaya jendelanya reset di tab / sesi browser baru.
const THROTTLE_KEY = "monetag:lastShownAt";
const THROTTLE_MS = 5 * 60 * 1000;

// Direct link Monetag (zona 11933547).
//
// Dulu di sini ada tag skrip (`https://nap5k.com/tag.min.js`, zona 11931554)
// yang disuntik ke halaman. Sekarang yang dipakai cuma direct link-nya, jadi
// tidak ada skrip Monetag yang berjalan di origin ini sama sekali — iklannya
// hidup di tab lain, di luar jangkauan DOM kita.
//
// Zona push (`11930912`, `https://5gvci.com/act/files/tag.min.js`) sudah
// dilepas lebih dulu. Zona itu satu-satunya yang membutuhkan `public/sw.js` —
// service worker ber-scope "/" yang isinya `importScripts()` dari domain
// jaringan iklan, sehingga siapa pun yang menguasai domain itu memegang
// kendali penuh atas origin ini. Lihat catatan audit di
// `src/blueprints/integrateMonetag.md` sebelum menyalakannya lagi.
const MONETAG_DIRECT_LINK = "https://omg10.com/4/11933547";

// `sessionStorage` bisa melempar di private mode / iframe sandbox. Gagal baca
// = anggap "belum pernah tampil"; gagal tulis = jendela throttle tidak
// persist, tapi iklan tetap boleh tampil.
function readLastShownAt() {
  try {
    const value = Number(window.sessionStorage.getItem(THROTTLE_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeLastShownAt(value) {
  try {
    window.sessionStorage.setItem(THROTTLE_KEY, String(value));
  } catch {
    // diamkan — lihat komentar readLastShownAt
  }
}

export function shouldShowMonetagAd() {
  if (typeof window === "undefined") return false;
  return Date.now() - readLastShownAt() >= THROTTLE_MS;
}

/**
 * Satu-satunya entry point yang dipanggil dari handler klik: cek syarat
 * penggunaan, cek throttle, lalu buka direct link-nya.
 *
 * Urutan ceknya penting. Syaratnya diperiksa lebih dulu supaya user yang belum
 * menerima tidak pernah diarahkan ke halaman iklan — dan supaya penundaan itu
 * tidak ikut memajukan jendela throttle.
 *
 * Fungsi ini WAJIB dipanggil langsung dari handler klik, tanpa `await` di
 * antaranya: `window.open` hanya lolos popup blocker selama masih dihitung
 * sebagai user gesture. Handler PDF memanggilnya di baris pertama, sebelum
 * proses ekspor yang panjang.
 *
 * @returns {boolean} `true` kalau tab iklan benar-benar dibuka, `false` kalau
 *   belum diterima, di-throttle, atau diblokir popup blocker.
 */
export function showMonetagAd() {
  if (typeof window === "undefined") return false;
  if (!hasAcceptedAdTerms()) return false;
  if (!shouldShowMonetagAd()) return false;

  const adTab = window.open(MONETAG_DIRECT_LINK, "_blank");

  // `null` = popup blocker menolak. Jangan catat waktunya: tidak ada iklan
  // yang tampil, jadi klik berikutnya masih boleh mencoba.
  if (!adTab) return false;

  // Halaman iklan tidak boleh bisa mengintip `window.opener` kita.
  adTab.opener = null;

  // Popunder: tab kalkulatornya tetap di depan. User baru saja menekan tombol
  // dan masih menunggu hasil perhitungan / unduhan PDF — jangan ditarik ke tab
  // iklan sebelum kerjanya selesai.
  window.focus();

  writeLastShownAt(Date.now());

  return true;
}
