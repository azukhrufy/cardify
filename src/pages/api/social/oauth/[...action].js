/**
 * Next.js API Route: /api/social/oauth/[action]
 *
 * Mengatur seluruh siklus hidup OAuth connect akun sosial media:
 * - GET /api/social/oauth/status  → Cek provider mana saja yang sudah configured
 * - GET /api/social/oauth/connect?platform=...&next=... → Buat URL state & redirect user
 * - GET /api/social/oauth/callback?code=...&state=... → Tukar code, simpan token di httpOnly cookie, redirect balik ke halaman kalkulator
 * - GET /api/social/oauth/me      → Cek profil akun yang sedang terhubung di sesi aktif
 * - POST /api/social/oauth/disconnect → Hapus sesi / cookie
 */

import { getProvider, getOAuthStatus } from "@/lib/server/oauth/providers";
import {
  isSessionConfigured,
  signState,
  verifyState,
  readSession,
  writeSession,
  clearSession,
} from "@/lib/server/oauth/crypto";

function getBaseUrl(req) {
  // Prioritas 1: URL kanonik eksplisit. Redirect URI wajib SAMA PERSIS antara
  // saat authorize dan saat menukar code; kalau di belakang proxy/CDN nilai
  // turunan dari header bisa berubah dan penukaran token gagal.
  const canonical = process.env.SOCIAL_OAUTH_BASE_URL;
  if (canonical) return canonical.replace(/\/+$/, "");

  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  const { action } = req.query;
  const pathAction = Array.isArray(action) ? action[0] : action;

  // 1. /api/social/oauth/status
  if (pathAction === "status" && req.method === "GET") {
    return res.status(200).json({
      success: true,
      sessionConfigured: isSessionConfigured(),
      providers: getOAuthStatus(),
    });
  }

  // 2. /api/social/oauth/me
  if (pathAction === "me" && req.method === "GET") {
    try {
      const session = readSession(req);
      if (!session.platform || !session.providerData) {
        return res.status(200).json({ success: true, connected: false });
      }
      return res.status(200).json({
        success: true,
        connected: true,
        platform: session.platform,
        profile: session.providerData,
      });
    } catch (err) {
      return res.status(200).json({ success: true, connected: false, error: err.message });
    }
  }

  // 3. /api/social/oauth/disconnect (POST)
  if (pathAction === "disconnect" && req.method === "POST") {
    const isSecure = req.headers["x-forwarded-proto"] === "https" || req.secure;
    clearSession(res, { secure: isSecure });
    return res.status(200).json({ success: true, connected: false });
  }

  // 4. /api/social/oauth/connect?platform=...&next=...
  if (pathAction === "connect" && req.method === "GET") {
    try {
      if (!isSessionConfigured()) {
        return res.status(503).json({
          error: "Sesi OAuth belum dikonfigurasi di server (SOCIAL_SESSION_SECRET kosong).",
          code: "SESSION_SECRET_MISSING",
        });
      }

      const platform = String(req.query.platform || "").toLowerCase();
      const nextPath = String(req.query.next || `/calculator/${platform}`);
      const provider = getProvider(platform);

      provider.assertConfigured();

      const baseUrl = getBaseUrl(req);
      const redirectUri = `${baseUrl}/api/social/oauth/callback`;

      const stateToken = signState({
        platform,
        next: nextPath,
        nonce: Math.random().toString(36).slice(2),
      });

      const authUrl = provider.buildAuthUrl({ state: stateToken, redirectUri });
      return res.redirect(302, authUrl);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ success: false, error: err.message });
    }
  }

  // 5. /api/social/oauth/callback?code=...&state=...
  if (pathAction === "callback" && req.method === "GET") {
    try {
      const { code, state, error, error_description } = req.query;

      if (error) {
        throw new Error(error_description || error || "Otorisasi dibatalkan oleh pengguna.");
      }

      if (!code || !state) {
        throw new Error("Parameter callback OAuth tidak lengkap (code atau state hilang).");
      }

      const payload = verifyState(state);
      if (!payload || !payload.platform) {
        throw new Error("Token state OAuth tidak valid atau sudah kedaluwarsa. Silakan ulangi.");
      }

      const provider = getProvider(payload.platform);
      const baseUrl = getBaseUrl(req);
      const redirectUri = `${baseUrl}/api/social/oauth/callback`;

      // Tukar code menjadi token
      const tokenData = await provider.exchangeCode({ code, redirectUri });

      // Simpan token sementara di sesi in-flight untuk fetch profile
      const tempSession = { platform: payload.platform, ...tokenData };
      let profileData = { username: "", fullName: "" };
      try {
        if (typeof provider.fetchProfile === "function") {
          profileData = await provider.fetchProfile(tempSession);
        }
      } catch (profileErr) {
        console.warn("[OAuth Callback] Gagal mengambil profil ringkas:", profileErr.message);
      }

      const isSecure = req.headers["x-forwarded-proto"] === "https" || req.secure;
      writeSession(
        res,
        {
          platform: payload.platform,
          ...tokenData,
          providerData: profileData,
          connectedAt: Date.now(),
        },
        { secure: isSecure },
      );

      const safeNext =
        typeof payload.next === "string" && payload.next.startsWith("/")
          ? payload.next
          : `/calculator/${payload.platform}`;

      // Selalu lewat halaman penutup: kalau dibuka sebagai popup (ada opener),
      // halaman itu mengirim sinyal ke jendela utama lalu menutup diri; kalau
      // navigasi penuh (popup diblokir), ia meneruskan ke halaman kalkulator.
      const closeUrl = new URL("/oauth/close", baseUrl);
      closeUrl.searchParams.set("next", safeNext);
      closeUrl.searchParams.set("platform", payload.platform);
      closeUrl.searchParams.set("status", "success");
      return res.redirect(302, closeUrl.toString());
    } catch (err) {
      console.error("[OAuth Callback Error]:", err);
      const message = err.message || "Gagal menghubungkan akun.";
      const baseUrl = getBaseUrl(req);
      const closeUrl = new URL("/oauth/close", baseUrl);
      closeUrl.searchParams.set("next", "/calculator");
      closeUrl.searchParams.set("status", "error");
      closeUrl.searchParams.set("message", message);
      return res.redirect(302, closeUrl.toString());
    }
  }

  return res.status(404).json({ error: `Action tidak dikenal: ${pathAction}` });
}
