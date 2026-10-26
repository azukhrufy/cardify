/**
 * Next.js API Route: /api/social/youtube/lookup
 *
 * Auto-fill kalkulator YouTube dari username/handle — TANPA login user.
 * Hanya butuh `YOUTUBE_API_KEY` (server-side, tidak pernah dikirim ke client).
 *
 * GET /api/social/youtube/lookup?ref=@namaChannel
 *
 * Menerima:
 *   - @handle / handle
 *   - https://youtube.com/@handle
 *   - https://youtube.com/c/nama
 *   - https://youtube.com/user/nama
 *   - https://youtube.com/channel/UC...
 *   - UC... (channel ID kanonik)
 *
 * Sengaja TIDAK memakai fallback `search.list`: satu panggilan berbiaya 100 unit
 * kuota, sementara lookup normal hanya 3–5 unit. Input salah ketik tidak boleh
 * menghabiskan kuota harian.
 */

import { googleAuth, fetchYouTubeByRef } from "@/lib/server/youtubeApi";
import { parseYouTubeRef } from "@/lib/server/youtubeRef";

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;

/** Map sederhana per instance server. Cukup untuk MVP; lihat catatan di README. */
const cache = new Map();
const rateLimitHits = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();

  // Map tidak pernah dibersihkan sendiri; kalau tumbuh besar, buang entri yang
  // jendelanya sudah lewat supaya tidak jadi kebocoran memori pelan-pelan.
  if (rateLimitHits.size >= 2000) {
    for (const [key, entry] of rateLimitHits) {
      if (now > entry.resetAt) rateLimitHits.delete(key);
    }
  }

  const entry = rateLimitHits.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return true;

  entry.count += 1;
  return false;
}

function readCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache(key, value) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Buang entri paling tua; Map menjaga urutan insert.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Ambil avatar channel lalu jadikan data URL. `html2canvas` saat export PDF
 * memakai `useCORS: true` — URL eksternal `yt3.ggpht.com` bisa gagal dimuat,
 * sedangkan data URL selalu aman. Best-effort: gagal → string kosong.
 */
async function inlineAvatar(url) {
  if (!url) return "";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return "";

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return "";

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > 512 * 1024) return "";

    return `data:${contentType.split(";")[0]};base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Metode tidak didukung." });
  }

  // Kunci API hanya hidup di server. Client tidak pernah menerimanya.
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      code: "NOT_CONFIGURED",
      error:
        "Fitur auto-fill YouTube belum diaktifkan di server (YOUTUBE_API_KEY kosong).",
    });
  }

  const ref = parseYouTubeRef(req.query.ref);
  if (!ref) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REF",
      error:
        "Format tidak dikenali. Masukkan @handle, URL channel YouTube, atau Channel ID (UC...).",
    });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({
      success: false,
      code: "RATE_LIMITED",
      error: "Terlalu banyak permintaan. Coba lagi dalam 1 menit.",
    });
  }

  const cacheKey = `${ref.kind}:${ref.value.toLowerCase()}`;

  const cached = readCache(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, cached: true, data: cached });
  }

  try {
    const metrics = await fetchYouTubeByRef(ref, googleAuth({ apiKey }), {
      allowSearch: false,
    });

    const avatarDataUrl = await inlineAvatar(metrics.avatarUrl);

    const data = {
      username: metrics.username,
      fullName: metrics.fullName,
      totalSubscribers: metrics.totalSubscribers,
      subscriberCountHidden: metrics.subscriberCountHidden,
      avgViewsPerVideo: metrics.avgViewsPerVideo,
      avgLikesPerVideo: metrics.avgLikesPerVideo,
      avgCommentsPerVideo: metrics.avgCommentsPerVideo,
      // YouTube Data API tidak mengekspos share count — selalu 0.
      avgSharesPerVideo: metrics.avgSharesPerVideo,
      dataPeriod: metrics.dataPeriod,
      totalVideos: metrics.totalVideos,
      videoSampleSize: metrics.videoSampleSize,
      avatarUrl: metrics.avatarUrl,
      avatarDataUrl,
    };

    writeCache(cacheKey, data);

    return res.status(200).json({ success: true, cached: false, data });
  } catch (err) {
    const statusCode = err.statusCode || 500;

    // 404 dan 400 adalah kesalahan input user, bukan kegagalan server.
    if (statusCode === 404) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: err.message || "Channel YouTube tidak ditemukan.",
      });
    }

    if (statusCode === 400) {
      return res.status(400).json({ success: false, code: "INVALID_REF", error: err.message });
    }

    if (statusCode === 429) {
      return res.status(429).json({
        success: false,
        code: "QUOTA_EXCEEDED",
        error: err.message,
      });
    }

    console.error("[youtube/lookup]", err);
    return res.status(502).json({
      success: false,
      code: "UPSTREAM_ERROR",
      error: "Gagal mengambil data dari YouTube. Coba lagi sebentar lagi.",
    });
  }
}
