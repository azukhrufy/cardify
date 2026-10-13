/**
 * Next.js API Route: /api/social/profile
 *
 * Menerima query parameter `platform` (youtube | instagram | tiktok) dan `handle`.
 * Menjalankan provider server-side (`src/lib/server/socialProviders.js`) yang
 * memanggil API platform resmi menggunakan kredensial rahasia dari `process.env`.
 *
 * Jika platform belum dikonfigurasi (misal YOUTUBE_API_KEY belum diisi),
 * endpoint mengembalikan status 503 beserta daftar variabel env yang dibutuhkan,
 * sehingga frontend bisa otomatis mendeteksi dan memberi tahu user.
 */

import { fetchPlatformMetrics, getPlatformStatus, ProviderNotConfiguredError } from "@/lib/server/socialProviders";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { platform, handle } = req.query;

  if (platform === "status") {
    return res.status(200).json({
      success: true,
      platforms: getPlatformStatus(),
    });
  }

  if (!platform || !handle) {
    return res.status(400).json({
      error: "Parameter `platform` dan `handle` wajib diisi.",
    });
  }

  const cleanPlatform = String(platform).toLowerCase().trim();
  const cleanHandle = String(handle).trim();

  const validPlatforms = ["youtube", "instagram", "tiktok"];
  if (!validPlatforms.includes(cleanPlatform)) {
    return res.status(400).json({
      error: `Platform tidak valid. Pilih salah satu dari: ${validPlatforms.join(", ")}.`,
    });
  }

  try {
    const metrics = await fetchPlatformMetrics(cleanPlatform, cleanHandle);
    return res.status(200).json({
      success: true,
      platform: cleanPlatform,
      ...metrics,
    });
  } catch (err) {
    console.error(`[API /social/profile] Error (${cleanPlatform} / ${cleanHandle}):`, err.message);

    if (err instanceof ProviderNotConfiguredError) {
      return res.status(503).json({
        success: false,
        code: "PROVIDER_NOT_CONFIGURED",
        error: err.message,
        platform: err.platform,
        requiredVars: err.requiredVars,
      });
    }

    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || "Gagal mengambil metrik dari platform.",
    });
  }
}
