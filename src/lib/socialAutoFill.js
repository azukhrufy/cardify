/**
 * Client helper untuk "Hubungkan Akun" (OAuth) di kalkulator Cardify.
 *
 * TIDAK ADA data simulasi. Satu-satunya sumber metrik adalah akun yang
 * benar-benar diotorisasi user lewat OAuth. Access token disimpan server-side
 * di cookie httpOnly terenkripsi (lihat `src/lib/server/oauth/crypto.js`) —
 * browser tidak pernah memegang token, jadi tidak ada jalur untuk membaca akun
 * orang lain yang tidak memberi izin.
 *
 * Alur:
 *   buildConnectUrl(platform) → navigasi browser ke /api/social/oauth/connect
 *   fetchOAuthStatus()        → provider mana yang siap dipakai di server
 *   fetchConnection()         → akun yang sedang terhubung di sesi ini
 *   fetchConnectedMetrics()   → metrik akun terhubung
 *   disconnect()              → hapus sesi
 */

export const SOCIAL_PLATFORMS = {
  tiktok: { label: "TikTok", connectLabel: "Hubungkan TikTok" },
  instagram: { label: "Instagram", connectLabel: "Hubungkan Instagram" },
  youtube: { label: "YouTube", connectLabel: "Hubungkan YouTube" },
};

async function getJson(url, options) {
  const res = await fetch(url, options);
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  return { ok: res.ok, status: res.status, payload };
}

/**
 * URL untuk memulai OAuth. Dipakai dengan navigasi halaman penuh (bukan fetch)
 * karena user harus melihat halaman login platform.
 */
export function buildConnectUrl(platform, nextPath) {
  const target = nextPath || `/calculator/${platform}`;
  return `/api/social/oauth/connect?platform=${encodeURIComponent(platform)}&next=${encodeURIComponent(target)}`;
}

/** Status server: sesi sudah dikonfigurasi dan provider mana yang siap. */
export async function fetchOAuthStatus() {
  const { ok, payload } = await getJson("/api/social/oauth/status");
  if (!ok || !payload?.success) {
    return { sessionConfigured: false, providers: [] };
  }
  return payload;
}

/** Akun yang sedang terhubung di sesi browser ini (kalau ada). */
export async function fetchConnection() {
  const { ok, payload } = await getJson("/api/social/oauth/me");
  if (!ok || !payload?.success || !payload.connected) {
    return { connected: false };
  }
  return payload;
}

/**
 * Metrik akun yang terhubung.
 * @returns {Promise<object>} metrik ternormalisasi
 * @throws {Error} dengan `.code` ("NOT_CONNECTED" | "REAUTH_REQUIRED") kalau UI
 *   perlu meminta user menghubungkan / menghubungkan ulang akunnya.
 */
export async function fetchConnectedMetrics() {
  const { ok, status, payload } = await getJson("/api/social/fetch-metrics");

  if (!ok || !payload?.success) {
    const err = new Error(payload?.error || "Gagal mengambil metrik akun Anda.");
    err.code = payload?.code;
    err.status = status;
    throw err;
  }

  return payload;
}

export async function disconnect() {
  const { ok, payload } = await getJson("/api/social/oauth/disconnect", { method: "POST" });
  return Boolean(ok && payload?.success);
}

/** "@nama" / URL profil → nama polos tanpa "@". Masih dipakai untuk input manual. */
export function normalizeHandle(rawHandle) {
  const trimmed = String(rawHandle || "").trim();
  if (!trimmed) return "";

  const fromUrl = trimmed
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/^(tiktok|instagram|youtube)\.com\//i, "")
    .replace(/^@?/, "")
    .split(/[/?#]/)[0];

  return fromUrl.replace(/^@/, "").trim();
}
