// lib/adTerms.js
//
// Syarat penggunaan versi gratis: Cardify dibiayai iklan dari jaringan pihak
// ketiga — banner Adsterra di halaman kalkulator, dan tautan langsung Monetag
// yang dibuka di tab baru saat tombol hitung / unduh PDF ditekan.
//
// Ini BUKAN persetujuan dalam arti GDPR / UU 27/2022. Tidak ada opsi menolak
// sambil tetap memakai situs, jadi tidak ada pilihan bebas yang bisa
// disetujui. Yang disimpan di sini adalah catatan bahwa user sudah membaca dan
// menerima syaratnya. Jangan sebut ini "consent" di dokumen mana pun — klaim
// persetujuan atas sesuatu yang tidak bisa ditolak justru sumber masalahnya,
// bukan bannernya.
//
// Konsekuensi teknisnya tetap sama untuk bannernya: skrip Adsterra berjalan
// same-origin di halaman ini dan secara teknis bisa membaca seluruh isi DOM —
// termasuk nama, handle, metrik, dan foto profil yang di-upload di halaman
// kalkulator. Karena itu skripnya tidak dimuat sebelum user menekan tombol di
// bannernya. Iklan Monetag sekarang cuma tautan keluar, tidak ada skripnya yang
// berjalan di sini.
//
// Disimpan di `localStorage` supaya catatannya bertahan antar tab dan antar
// sesi — kalau tidak, bannernya muncul terus di setiap kunjungan.

export const AD_TERMS_KEY = "ads:acceptedAt";

// Kalau `localStorage` tidak bisa dibaca/ditulis (private mode, iframe
// sandbox), penerimaannya disimpan di memori saja. Bannernya tetap bisa
// ditutup di sesi ini — banner yang tombolnya tidak berefek lebih buruk
// daripada pertanyaan yang terpaksa diulang setelah reload.
let inMemoryAcceptedAt = null;

// Pendengar untuk `useSyncExternalStore` di banner. `localStorage` tidak
// mengirim event di tab yang sama, jadi perubahan dari `acceptAdTerms()`
// diberitakan manual lewat sini.
const listeners = new Set();

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Waktu penerimaan syarat, epoch ms. `null` = belum menerima.
 *
 * Menyimpan waktunya, bukan sekadar flag, supaya ada catatan *kapan* user
 * menerima — itu yang membedakan "kami punya bukti" dari "kami punya boolean".
 *
 * Gagal baca diperlakukan sebagai "belum menerima": default-nya tidak memuat
 * skrip pihak ketiga, bukan memuatnya.
 */
export function readAdTermsAcceptedAt() {
  if (typeof window === "undefined") return null;
  try {
    const value = Number(window.localStorage.getItem(AD_TERMS_KEY));
    if (Number.isFinite(value) && value > 0) return value;
  } catch {
    // jatuh ke nilai memori di bawah
  }
  return inMemoryAcceptedAt;
}

export function acceptAdTerms() {
  const acceptedAt = Date.now();
  try {
    window.localStorage.setItem(AD_TERMS_KEY, String(acceptedAt));
  } catch {
    // diamkan — lihat komentar inMemoryAcceptedAt
  }
  inMemoryAcceptedAt = acceptedAt;
  emit();
}

export function hasAcceptedAdTerms() {
  return readAdTermsAcceptedAt() !== null;
}

// Dua fungsi di bawah dipakai banner lewat `useSyncExternalStore`. Itu jalur
// yang benar untuk membaca nilai milik browser: `getServerSnapshot` dipakai
// React saat SSR *dan* saat hydration pertama, jadi markup server dan klien
// tidak pernah berbeda dan bannernya tidak perlu `setState` di dalam effect.

export function subscribeToAdTerms(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAdTermsSnapshot() {
  return readAdTermsAcceptedAt();
}

export function getAdTermsServerSnapshot() {
  // Di server tidak ada `localStorage`, jadi "belum menerima" adalah
  // satu-satunya jawaban yang jujur.
  return null;
}
