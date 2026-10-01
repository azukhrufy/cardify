// lib/loadMonetag.js

import { hasAcceptedAdTerms } from "./adTerms";

// Throttle global: maksimal satu iklan per 5 menit, berlaku untuk semua zona
// dan semua halaman kalkulator. Disimpan di `sessionStorage` (bukan
// `localStorage`) supaya jendelanya reset di tab / sesi browser baru.
const THROTTLE_KEY = "monetag:lastShownAt";
const THROTTLE_MS = 5 * 60 * 1000;

// Tag utama — menggantikan vignette zona 11930901.
const MONETAG_TAG_SRC = "https://nap5k.com/tag.min.js";
const MONETAG_TAG_ZONE = "11931554";

// Zona push (`11930912`, `https://5gvci.com/act/files/tag.min.js`) sudah
// dilepas. Zona itu satu-satunya yang membutuhkan `public/sw.js` — service
// worker ber-scope "/" yang isinya `importScripts()` dari domain jaringan
// iklan, sehingga siapa pun yang menguasai domain itu memegang kendali penuh
// atas origin ini. Lihat catatan audit di
// `src/blueprints/integrateMonetag.md` sebelum menyalakannya lagi.

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

// `dataset.zone` wajib diset sebelum `src`: begitu src di-assign, request bisa
// langsung jalan. Dedupe lewat zona atau src supaya klik berulang tidak
// menumpuk <script> di DOM.
function appendScript({ zone, src }) {
  if (
    document.querySelector(`script[data-zone="${zone}"]`) ||
    document.querySelector(`script[src="${src}"]`)
  ) {
    return;
  }

  const script = document.createElement("script");
  script.dataset.zone = zone;
  script.src = src;
  script.async = true;

  document.body.appendChild(script);
}

export function loadMonetagTag() {
  if (typeof window === "undefined") return;
  appendScript({ zone: MONETAG_TAG_ZONE, src: MONETAG_TAG_SRC });
}

/**
 * Satu-satunya entry point yang dipanggil dari handler klik: cek syarat
 * penggunaan, cek throttle, muat tag, lalu catat waktunya kalau iklan
 * benar-benar dimuat.
 *
 * Urutan ceknya penting. Syaratnya diperiksa lebih dulu supaya user yang belum
 * menerima tidak pernah memuat skrip pihak ketiga sama sekali — dan supaya
 * penundaan itu tidak ikut memajukan jendela throttle.
 *
 * @returns {boolean} `true` kalau iklan dimuat, `false` kalau belum diterima
 *   atau di-throttle.
 */
export function showMonetagAd() {
  if (typeof window === "undefined") return false;
  if (!hasAcceptedAdTerms()) return false;
  if (!shouldShowMonetagAd()) return false;

  loadMonetagTag();
  writeLastShownAt(Date.now());

  return true;
}
