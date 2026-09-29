/**
 * Semua fungsi di file ini menerima input apa pun (number atau string dari form)
 * dan mengoersi lewat Number() sebelum berhitung. Jangan andalkan pemanggil
 * untuk sudah mengirim number — pernah kejadian `"12" + "3"` jadi `"123"`.
 */

/**
 * ER benchmark default untuk TikTok (%).
 * Acuan pasar 2025: rata-rata ER TikTok 2.5%–5.0% (Socialinsider / Dash Social).
 * Dipakai kalau niche tidak punya benchmark sendiri.
 */
export const DEFAULT_ER_BENCHMARK = 5.0;

/**
 * Tarif minimum per deliverable (IDR), berlaku untuk format acuan (video).
 * Mencegah output tidak realistis untuk akun kecil, karena base rate murni
 * linear terhadap views.
 * Rentang pasar nano creator: Rp100.000–500.000 per video; Rp250.000 titik tengah.
 *
 * Format lain memakai floor yang diskalakan dari CPM-nya lewat `formatFloor()`,
 * supaya di volume rendah harga antar format tidak menempel jadi satu angka.
 */
export const MINIMUM_RATE = 250000;

/**
 * Tarif dibulatkan ke kelipatan ini supaya angka rate card enak dibaca.
 */
export const RATE_ROUNDING = 10000;

/**
 * Engagement multiplier = `ER_INTERCEPT + ER_SLOPE × (ER / benchmark)`,
 * dijepit ke [ER_MIN, ER_MAX]. Fungsi kontinu, bukan tangga.
 *
 * Angka-angkanya sengaja dipilih supaya melewati titik yang sama dengan tangga
 * lama pada rasio bulat — 1.0× di benchmark, 1.15× di 1.5×, 1.3× di 2.0×,
 * 1.45× di 2.5× — tapi tanpa lompatan mendadak di batas antar tingkat.
 * Tangga lama punya dua tebing pada benchmark 5.0%: 0.7×→0.9× (+29%) tepat di
 * ER 2.5%, dan 1.0×→1.15× (+15%) tepat di ER 5%.
 */
const ER_INTERCEPT = 0.7;
const ER_SLOPE = 0.3;
const ER_MIN = 0.7;
const ER_MAX = 1.45;

/**
 * Hitung Base Rate dari impressions & CPM
 * @param {number} impressions - Jumlah tayangan (views)
 * @param {number} cpm - Cost per mille (IDR per 1000 impressions)
 * @returns {number} IDR
 */
export function calculateBaseRate(impressions, cpm) {
  return (Number(impressions) / 1000) * Number(cpm);
}

/**
 * Engagement rate berbasis tayangan, dalam persen.
 * Sama dengan metrik "Engagement rate" di TikTok Analytics.
 * @param {object} metrics
 * @param {number} metrics.views
 * @param {number} metrics.likes
 * @param {number} metrics.comments
 * @param {number} metrics.shares
 * @returns {number} persen, 0 kalau views kosong/nol
 */
export function calculateEngagementRate({ views, likes, comments, shares }) {
  const totalViews = Number(views);
  if (!totalViews) return 0;
  const interactions =
    Number(likes) + Number(comments) + Number(shares);
  return (interactions / totalViews) * 100;
}

/**
 * Hitung engagement multiplier.
 * ratio = ER creator / ER benchmark niche.
 * @param {number} engagementRate - ER dalam persen (misal 4.8)
 * @param {number} nicheERBenchmark - ER benchmark untuk niche tsb
 */
export function calculateEngagementMultiplier(
  engagementRate,
  nicheERBenchmark = DEFAULT_ER_BENCHMARK,
) {
  const ratio = Number(engagementRate) / Number(nicheERBenchmark);
  // NaN gagal di semua perbandingan dan bisa jatuh ke nilai ekstrem, artinya
  // data yang tidak lengkap diam-diam dapat diskon atau bonus penuh. Netral.
  if (!Number.isFinite(ratio)) return 1.0;
  return Math.min(Math.max(ER_INTERCEPT + ER_SLOPE * ratio, ER_MIN), ER_MAX);
}

/**
 * Floor untuk satu format, diskalakan dari CPM-nya terhadap format acuan.
 *
 * Tanpa ini semua format menempel di MINIMUM_RATE yang sama saat volume rendah,
 * sehingga breakdown per format kehilangan arti. Skalanya masuk akal karena
 * CPM sudah menyatakan nilai relatif tiap format.
 *
 * @param {number} cpm - CPM format ini
 * @param {number} referenceCpm - CPM format acuan (biasanya `tiktok.video`)
 * @param {number} [base] - floor format acuan
 * @returns {number} IDR
 */
export function formatFloor(cpm, referenceCpm, base = MINIMUM_RATE) {
  const ratio = Number(cpm) / Number(referenceCpm);
  if (!Number.isFinite(ratio) || ratio <= 0) return base;
  return base * ratio;
}

/**
 * Terapkan floor + pembulatan ke tarif akhir satu deliverable.
 * Panggil ini di lapisan paling luar, sekali per harga yang ditampilkan —
 * jangan di tengah rantai perkalian, karena hasilnya dipakai untuk mengali lagi.
 * @param {number} rate - tarif mentah (IDR)
 * @param {number} [floor] - floor untuk format ini, lihat `formatFloor()`
 * @returns {number} IDR, kelipatan RATE_ROUNDING
 */
export function finalizeRate(rate, floor = MINIMUM_RATE) {
  const numeric = Number(rate);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  const minimum = Number.isFinite(Number(floor)) ? Number(floor) : MINIMUM_RATE;
  return Math.round(Math.max(safe, minimum) / RATE_ROUNDING) * RATE_ROUNDING;
}

/**
 * Formula akhir: combined rate.
 * Tarif mentah — belum kena floor/pembulatan. Bungkus hasilnya dengan
 * `finalizeRate(rate, formatFloor(cpm, referenceCpm))` sebelum ditampilkan.
 *
 * Tidak ada parameter bobot per-content-type di sini dengan sengaja: perbedaan
 * antar format sepenuhnya dinyatakan oleh `cpm`. Menambah bobot kedua kalinya
 * pernah membuat `integration` terdiskon dua kali.
 *
 * @returns {number} IDR
 */
export function calculateRate({
  impressions,
  cpm,
  engagementRate,
  nicheERBenchmark = DEFAULT_ER_BENCHMARK,
  nicheMultiplier = 1.0,
  durationMultiplier = 1.0,
}) {
  const base = calculateBaseRate(impressions, cpm);
  const engagementMult = calculateEngagementMultiplier(
    engagementRate,
    nicheERBenchmark,
  );
  const totalMultiplier =
    Number(durationMultiplier) * engagementMult * Number(nicheMultiplier);
  return base * totalMultiplier;
}
