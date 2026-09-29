/**
 * Konfigurasi per niche.
 *
 * `platformCPMs.<platform>.<format>` adalah **sumber tunggal** tarif: IDR per
 * 1000 views untuk format itu. `contentTypes[].cpmRef` menunjuk key yang tepat,
 * jadi jangan pernah mengalikan CPM dengan bobot per-format lagi — beda format
 * akan terdiskon dua kali.
 *
 * `engagementMultiplier` adalah premi/diskon niche terhadap tarif akhir, dikali
 * setelah engagement multiplier.
 *
 * ---
 * Dasar angka (riset pasar Indonesia, 2025).
 *
 * Acuan pasar untuk band tengah (`general`) adalah Rp20.000–30.000 per 1000
 * views (≈Rp20–30/view), dengan 50.000 views setara Rp1–1,5 juta per video.
 * Setelah premi/diskon niche, kolom `tiktok.video` membentang Rp18.000 (gaming)
 * sampai Rp36.000 (finance). Tabel sebelumnya memakai Rp8.000–16.000 — sekitar
 * 2–3× di bawah pasar.
 *
 * Urutan premium antar niche mengikuti kategori yang eksplisit disebut mahal
 * (finance, tech, beauty halal, fashion premium) turun ke yang disebut berada
 * di titik tengah (food, gaming, general).
 *
 * Rasio antar format di dalam satu platform, dan tiap baris di bawah ini
 * mengikutinya setelah dibulatkan ke kelipatan Rp1.000:
 * - TikTok — photoMode 0.8× video · integration 1.2× · dedicatedVideo 2.0×
 * - Instagram — feedPost 1.35× video TikTok (StarNgage: CPM IG ~Rp120rb vs
 *   TikTok ~Rp90rb); story 0.5× feedPost; reels 1.4× feedPost
 * - YouTube — integration 2.5× video TikTok; dedicatedVideo 5.0× video TikTok
 *
 * Turunkan angka turunan dari `tiktok.video` niche-nya; jangan diketik manual
 * tanpa membulatkan dengan aturan yang sama.
 *
 * Catatan: model "views × CPM" ini pas untuk TikTok/Instagram, tapi lemah untuk
 * YouTube — tarif YouTube digerakkan jumlah subscriber jauh lebih banyak
 * daripada jumlah views. Angka YouTube di bawah ini konservatif dan modelnya
 * perlu pendekatan sendiri saat halaman YouTube benar-benar dibangun.
 */

/**
 * CPM dasar TikTok per niche (IDR / 1000 views), dan tabel turunannya.
 * Ditulis eksplisit, bukan dihitung saat runtime, supaya angka yang dipakai
 * rate card bisa dibaca dan dikoreksi langsung di sini.
 */
export const NICHES = [
  {
    id: 'beauty',
    label: 'Beauty & Skincare',
    description: 'Konten kecantikan, skincare, makeup, grooming',
    platformCPMs: {
      instagram: { feedPost: 34000, story: 17000, reels: 48000 },
      tiktok: { video: 25000, photoMode: 20000, integration: 30000, dedicatedVideo: 50000 },
      youtube: { integration: 63000, dedicatedVideo: 125000 },
    },
    engagementMultiplier: 1.15,
  },
  {
    id: 'fashion',
    label: 'Fashion & Lifestyle',
    description: 'Konten fashion, style, daily lifestyle, outfit',
    platformCPMs: {
      instagram: { feedPost: 31000, story: 16000, reels: 43000 },
      tiktok: { video: 23000, photoMode: 18000, integration: 28000, dedicatedVideo: 46000 },
      youtube: { integration: 58000, dedicatedVideo: 115000 },
    },
    engagementMultiplier: 1.05,
  },
  {
    id: 'food',
    label: 'Food & Culinary',
    description: 'Konten kuliner, restoran, recipe, food review',
    platformCPMs: {
      instagram: { feedPost: 26000, story: 13000, reels: 36000 },
      tiktok: { video: 19000, photoMode: 15000, integration: 23000, dedicatedVideo: 38000 },
      youtube: { integration: 48000, dedicatedVideo: 95000 },
    },
    engagementMultiplier: 1.0,
  },
  {
    id: 'gaming',
    label: 'Gaming & Esports',
    description: 'Konten game, esports, gaming vlog, review game',
    platformCPMs: {
      instagram: { feedPost: 24000, story: 12000, reels: 34000 },
      tiktok: { video: 18000, photoMode: 14000, integration: 22000, dedicatedVideo: 36000 },
      youtube: { integration: 45000, dedicatedVideo: 90000 },
    },
    engagementMultiplier: 0.95,
  },
  {
    id: 'tech',
    label: 'Tech & Gadget',
    description: 'Konten teknologi, gadget review, software, tech news',
    platformCPMs: {
      instagram: { feedPost: 41000, story: 21000, reels: 57000 },
      tiktok: { video: 30000, photoMode: 24000, integration: 36000, dedicatedVideo: 60000 },
      youtube: { integration: 75000, dedicatedVideo: 150000 },
    },
    engagementMultiplier: 1.2,
  },
  {
    id: 'finance',
    label: 'Finance & Business',
    description: 'Konten keuangan, investasi, bisnis, fintech, edukasi keuangan',
    platformCPMs: {
      instagram: { feedPost: 49000, story: 25000, reels: 69000 },
      tiktok: { video: 36000, photoMode: 29000, integration: 43000, dedicatedVideo: 72000 },
      youtube: { integration: 90000, dedicatedVideo: 180000 },
    },
    engagementMultiplier: 1.35,
  },
  {
    id: 'general',
    label: 'General / Lainnya',
    description: 'Konten umum, vlog, entertainment, atau niche lain yang tidak tercover',
    platformCPMs: {
      instagram: { feedPost: 27000, story: 14000, reels: 38000 },
      tiktok: { video: 20000, photoMode: 16000, integration: 24000, dedicatedVideo: 40000 },
      youtube: { integration: 50000, dedicatedVideo: 100000 },
    },
    engagementMultiplier: 1.0,
  },
];
