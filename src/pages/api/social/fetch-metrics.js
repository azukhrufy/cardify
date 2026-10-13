/**
 * Next.js API Route: /api/social/fetch-metrics
 *
 * Mengambil metrik akun yang sedang terhubung lewat OAuth (lihat
 * `/api/social/oauth/connect`). Membaca sesi dari cookie httpOnly terenkripsi,
 * memperbarui access token otomatis bila hampir kedaluwarsa, lalu memanggil
 * `provider.fetchMetrics(session)`.
 *
 * Route ini TIDAK menerima handle: satu-satunya akun yang bisa dibaca adalah
 * akun yang tokennya ada di sesi user — jadi tidak ada cara membaca metrik
 * akun orang lain yang tidak memberi izin.
 */

import { getProvider } from "@/lib/server/oauth/providers";
import { readSession, writeSession } from "@/lib/server/oauth/crypto";

// Refresh token 5 menit sebelum expired, supaya request yang sedang jalan
// tidak mati di tengah.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    let session = readSession(req);

    if (!session.platform || !session.accessToken) {
      return res.status(401).json({
        success: false,
        code: "NOT_CONNECTED",
        error: "Belum ada akun yang terhubung. Klik 'Hubungkan Akun' dulu ya.",
      });
    }

    const provider = getProvider(session.platform);

    if (session.expiresAt && session.expiresAt < Date.now() + REFRESH_MARGIN_MS) {
      try {
        if (typeof provider.refresh === "function") {
          session = await provider.refresh(session);
          const isSecure = req.headers["x-forwarded-proto"] === "https" || req.secure;
          writeSession(res, session, { secure: isSecure });
        }
      } catch (refreshErr) {
        console.warn(`[fetch-metrics] refresh ${session.platform} gagal:`, refreshErr.message);
        if (refreshErr.code === "REAUTH_REQUIRED" || refreshErr.statusCode === 401) {
          return res.status(401).json({
            success: false,
            code: "REAUTH_REQUIRED",
            error: "Sesi Anda sudah berakhir. Silakan hubungkan ulang akun Anda.",
          });
        }
      }
    }

    const metrics = await provider.fetchMetrics(session);

    return res.status(200).json({
      success: true,
      platform: session.platform,
      ...metrics,
    });
  } catch (err) {
    console.error("[API /social/fetch-metrics]:", err);

    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      code: err.code,
      error: err.message || "Gagal mengambil metrik akun yang terhubung.",
    });
  }
}
