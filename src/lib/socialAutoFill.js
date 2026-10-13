/**
 * Auto-fill metrik sosial media untuk kalkulator rate card.
 *
 * Alur produksi: handle/URL dikirim ke backend (edge function / API route) yang
 * menyimpan kredensial platform — YouTube Data API v3, Instagram Graph API,
 * TikTok Display API. Kredensial TIDAK boleh ada di bundle client, jadi
 * endpoint-nya dipisah lewat env `NEXT_PUBLIC_SOCIAL_API_URL`; backend
 * mengembalikan metrik publik dalam bentuk normal (lihat bentuk return di
 * bawah) dan halaman tinggal memetakannya ke field form.
 *
 * Selama endpoint itu belum dikonfigurasi, fungsi ini memakai profil simulasi
 * deterministik per handle supaya alur UI (connect → review → hitung) bisa
 * dites end-to-end. Panel connect menampilkan badge "Mode Demo" agar angka
 * simulasi tidak dikira data asli. `isAutoFillDemo` dipakai untuk badge itu.
 */

const SOCIAL_API_URL = process.env.NEXT_PUBLIC_SOCIAL_API_URL || "";

/** True kalau belum ada backend integrasi, jadi datanya simulasi. */
export const isAutoFillDemo = !SOCIAL_API_URL;

export const SOCIAL_PLATFORMS = {
  tiktok: { label: "TikTok" },
  instagram: { label: "Instagram" },
  youtube: { label: "YouTube" },
};

/**
 * Hash sederhana (djb2) supaya angka simulasi stabil: handle yang sama selalu
 * menghasilkan angka yang sama, jadi hasilnya bisa diprediksi saat testing —
 * bukan angka acak yang berubah tiap klik.
 */
function hashString(value) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return Math.abs(hash);
}

/** Angka pseudo-acak 0..1 yang deterministik dari seed + salt. */
function seededFraction(seed, salt) {
  const h = hashString(`${seed}:${salt}`);
  return (h % 100000) / 100000;
}

function pick(seed, salt, min, max) {
  return Math.round(min + seededFraction(seed, salt) * (max - min));
}

/** "@nama" / URL profil → nama polos tanpa "@". */
export function normalizeHandle(rawHandle) {
  const trimmed = String(rawHandle || "").trim();
  if (!trimmed) return "";

  // Terima URL lengkap juga: tiktok.com/@user, instagram.com/user, youtube.com/@user
  const fromUrl = trimmed
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/^(tiktok|instagram|youtube)\.com\//i, "")
    .replace(/^@?/, "")
    .split(/[/?#]/)[0];

  return fromUrl.replace(/^@/, "").trim();
}

function buildSimulatedProfile(platform, handle) {
  const seed = `${platform}:${handle.toLowerCase()}`;
  const followers = pick(seed, "followers", 12000, 480000);

  if (platform === "tiktok") {
    const videoCount = pick(seed, "videos", 8, 40);
    const avgViews = pick(seed, "avgviews", 8000, 220000);
    const totalViews = avgViews * videoCount;
    return {
      platform,
      username: handle,
      fullName: handle.replace(/[._]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      followers,
      dataPeriod: "30",
      totalViews,
      totalLikes: Math.round(totalViews * (0.04 + seededFraction(seed, "likeRate") * 0.06)),
      totalComments: Math.round(totalViews * (0.002 + seededFraction(seed, "commentRate") * 0.004)),
      totalShares: Math.round(totalViews * (0.001 + seededFraction(seed, "shareRate") * 0.003)),
      videoCount,
    };
  }

  if (platform === "instagram") {
    const contentCount = pick(seed, "posts", 6, 30);
    const avgReach = pick(seed, "avgreach", 6000, 180000);
    const totalReach = avgReach * contentCount;
    return {
      platform,
      username: handle,
      fullName: handle.replace(/[._]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      followers,
      dataPeriod: "30",
      totalReach,
      totalLikes: Math.round(totalReach * (0.05 + seededFraction(seed, "likeRate") * 0.07)),
      totalComments: Math.round(totalReach * (0.002 + seededFraction(seed, "commentRate") * 0.005)),
      totalSharesSaves: Math.round(totalReach * (0.004 + seededFraction(seed, "saveRate") * 0.008)),
      contentCount,
    };
  }

  // youtube — metrik per video, sesuai form YouTube yang memakai rata-rata.
  const avgViewsPerVideo = pick(seed, "avgviews", 4000, 160000);
  return {
    platform,
    username: handle,
    fullName: handle.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    followers,
    dataPeriod: "30",
    totalSubscribers: followers,
    avgViewsPerVideo,
    avgLikesPerVideo: Math.round(avgViewsPerVideo * (0.035 + seededFraction(seed, "likeRate") * 0.05)),
    avgCommentsPerVideo: Math.round(avgViewsPerVideo * (0.001 + seededFraction(seed, "commentRate") * 0.003)),
    avgSharesPerVideo: Math.round(avgViewsPerVideo * (0.0005 + seededFraction(seed, "shareRate") * 0.0015)),
  };
}

/**
 * Ambil metrik publik sebuah akun.
 *
 * @param {"tiktok"|"instagram"|"youtube"} platform
 * @param {string} rawHandle handle ("@user") atau URL profil
 * @returns {Promise<object>} profil ternormalisasi (lihat buildSimulatedProfile)
 * @throws {Error} kalau handle kosong atau koneksi/endpoint gagal
 */
export async function fetchSocialProfile(platform, rawHandle) {
  const handle = normalizeHandle(rawHandle);
  if (!handle) {
    throw new Error("Isi username atau URL akun dulu ya.");
  }

  if (!SOCIAL_API_URL) {
    // Simulasi: tahan sebentar supaya state loading tombol terlihat wajar.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return buildSimulatedProfile(platform, handle);
  }

  const response = await fetch(
    `${SOCIAL_API_URL.replace(/\/$/, "")}/profile?platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(handle)}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "Akun tidak ditemukan atau metriknya tidak publik."
        : "Gagal mengambil data dari server. Coba lagi sebentar lagi.",
    );
  }

  const payload = await response.json();
  if (!payload || payload.error) {
    throw new Error(payload?.error || "Data akun tidak bisa dibaca.");
  }

  return { platform, username: handle, ...payload };
}
