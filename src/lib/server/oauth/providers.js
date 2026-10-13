/**
 * Definisi provider OAuth untuk "Connect akun sosmed" Cardify.
 *
 * Setiap provider mengekspos antarmuka yang sama:
 *   configured()                    → apakah credential-nya sudah lengkap
 *   buildAuthUrl({state, redirectUri}) → URL login platform
 *   exchangeCode({code, redirectUri})  → token setelah user menyetujui
 *   refresh(session)                → perbarui token yang hampir/ sudah mati
 *   fetchMetrics(session)           → metrik akun MILIK USER yang login
 *
 * Poin penting: karena user login ke akunnya sendiri, kita membaca metrik akun
 * itu langsung — bukan menebak dari handle. Ini yang membuat Instagram dan
 * TikTok mungkin sama sekali (keduanya menolak lookup handle sembarang).
 *
 * Semua credential dibaca dari `process.env` TANPA prefix NEXT_PUBLIC_.
 */

import { googleAuth, fetchYouTubeOwnChannel, resolveOwnChannel, fetchRecentVideos } from "@/lib/server/youtubeApi";

const DEFAULT_GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || "v21.0";

class OAuthError extends Error {
  constructor(message, { statusCode = 502, code } = {}) {
    super(message);
    this.name = "OAuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

class NotConfiguredError extends Error {
  constructor(provider, vars) {
    super(`OAuth ${provider} belum dikonfigurasi. Butuh env: ${vars.join(", ")}.`);
    this.name = "NotConfiguredError";
    this.requiredVars = vars;
    this.statusCode = 503;
  }
}

const minutes = (n) => Date.now() + n * 60 * 1000;
const days = (n) => Date.now() + n * 24 * 60 * 60 * 1000;

async function postForm(url, params, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(params),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/* ================================================================== */
/* YouTube (Google OAuth 2.0)                                          */
/* ================================================================== */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
];

const youtube = {
  id: "youtube",
  label: "YouTube",

  requiredEnv: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"],

  configured() {
    return Boolean(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET);
  },

  assertConfigured() {
    if (!this.configured()) throw new NotConfiguredError("YouTube", this.requiredEnv);
  },

  buildAuthUrl({ state, redirectUri }) {
    this.assertConfigured();
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", process.env.YOUTUBE_CLIENT_ID);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
    // `offline` + `consent` supaya Google mengirim refresh_token; tanpa keduanya
    // token mati dalam 1 jam dan user harus login ulang terus.
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("include_granted_scopes", "true");
    url.searchParams.set("state", state);
    return url.toString();
  },

  async exchangeCode({ code, redirectUri }) {
    this.assertConfigured();
    const { ok, data } = await postForm(GOOGLE_TOKEN_URL, {
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    if (!ok || !data.access_token) {
      throw new OAuthError(data.error_description || "Gagal menukar kode otorisasi Google.");
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: minutes(data.expires_in ? data.expires_in / 60 : 55),
      scope: data.scope || GOOGLE_SCOPES.join(" "),
    };
  },

  async refresh(session) {
    if (!session.refreshToken) {
      throw new OAuthError("Sesi YouTube tidak punya refresh token. Silakan hubungkan ulang.", {
        statusCode: 401,
        code: "REAUTH_REQUIRED",
      });
    }
    const { ok, data } = await postForm(GOOGLE_TOKEN_URL, {
      refresh_token: session.refreshToken,
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      grant_type: "refresh_token",
    });

    if (!ok || !data.access_token) {
      throw new OAuthError("Gagal memperbarui akses YouTube. Silakan hubungkan ulang.", {
        statusCode: 401,
        code: "REAUTH_REQUIRED",
      });
    }

    return {
      ...session,
      accessToken: data.access_token,
      expiresAt: minutes(data.expires_in ? data.expires_in / 60 : 55),
    };
  },

  async fetchMetrics(session) {
    const auth = googleAuth({ accessToken: session.accessToken });
    const channel = await resolveOwnChannel(auth);
    const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;

    let videos = await fetchRecentVideos(playlistId, auth, 30);
    if (!videos.length) videos = await fetchRecentVideos(playlistId, auth, 0);

    return buildYouTubeMetrics(channel, videos, {
      username: channel.snippet?.customUrl?.replace(/^@/, "") || "",
    });
  },

  /** Info ringkas untuk ditampilkan di UI setelah connect (nama + avatar). */
  async fetchProfile(session) {
    const auth = googleAuth({ accessToken: session.accessToken });
    const channel = await resolveOwnChannel(auth);
    return {
      username: channel.snippet?.customUrl?.replace(/^@/, "") || "",
      fullName: channel.snippet?.title || "",
      avatarUrl: channel.snippet?.thumbnails?.default?.url || "",
    };
  },
};

/* ================================================================== */
/* Instagram (Instagram Login & Instagram Graph API v26.0)            */
/* ================================================================== */

/**
 * Instagram Login memakai kredensial BERBEDA dari App ID/Secret Meta biasa.
 * App Dashboard → Instagram → "API setup with Instagram business login" →
 * "Set up Instagram business login" → Business login settings menampilkan
 * *Instagram App ID* & *Instagram App Secret*. Kalau yang dipakai adalah
 * App ID dari Settings → Basic, Meta membalas "Invalid platform app".
 * Kita utamakan env khusus, fallback ke nama lama biar tidak breaking.
 */
const IG_APP_ID = () => process.env.INSTAGRAM_LOGIN_APP_ID || process.env.INSTAGRAM_APP_ID;
const IG_APP_SECRET = () => process.env.INSTAGRAM_LOGIN_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;

const instagram = {
  id: "instagram",
  label: "Instagram",

  requiredEnv: ["INSTAGRAM_LOGIN_APP_ID", "INSTAGRAM_LOGIN_APP_SECRET"],

  configured() {
    return Boolean(IG_APP_ID() && IG_APP_SECRET());
  },

  assertConfigured() {
    if (!this.configured()) throw new NotConfiguredError("Instagram", this.requiredEnv);
  },

  buildAuthUrl({ state, redirectUri }) {
    this.assertConfigured();
    // Menggunakan Instagram Login (api.instagram.com) langsung — tanpa Facebook Page
    const url = new URL("https://www.instagram.com/oauth/authorize");
    url.searchParams.set("client_id", IG_APP_ID());
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");
    url.searchParams.set(
      "scope",
      ["instagram_business_basic", "instagram_business_manage_insights"].join(","),
    );
    return url.toString();
  },

  async exchangeCode({ code, redirectUri }) {
    this.assertConfigured();

    // Meta menambahkan fragmen "#_" di akhir authorization code; harus dibuang
    // sebelum ditukar, kalau tidak penukaran gagal.
    const authCode = String(code || "").replace(/#_$/, "");

    // 1) Tukar code dengan short-lived token di api.instagram.com
    const tokenUrl = new URL("https://api.instagram.com/oauth/access_token");
    const res = await postForm(tokenUrl.toString(), {
      client_id: IG_APP_ID(),
      client_secret: IG_APP_SECRET(),
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code: authCode,
    });

    if (!res.ok || !res.data.access_token) {
      throw new OAuthError(
        res.data?.error_message || res.data?.error?.message || "Gagal menukar kode otorisasi Instagram.",
      );
    }

    const shortToken = res.data.access_token;
    const igUserId = res.data.user_id;

    // 2) Tukar short-lived token menjadi long-lived token (60 hari)
    const longUrl = new URL("https://graph.instagram.com/access_token");
    longUrl.searchParams.set("grant_type", "ig_exchange_token");
    longUrl.searchParams.set("client_secret", IG_APP_SECRET());
    longUrl.searchParams.set("access_token", shortToken);

    const longRes = await getJson(longUrl.toString());
    const accessToken = longRes.ok && longRes.data?.access_token ? longRes.data.access_token : shortToken;
    const expiresIn = longRes.ok && longRes.data?.expires_in ? longRes.data.expires_in : 60 * 24 * 60 * 60;

    return {
      accessToken,
      refreshToken: null,
      expiresAt: days(expiresIn / (24 * 60 * 60)),
      igUserId: igUserId ? String(igUserId) : null,
    };
  },

  async refresh(session) {
    const token = session.accessToken;
    if (!token) {
      throw new OAuthError("Sesi Instagram tidak lengkap. Silakan hubungkan ulang.", {
        statusCode: 401,
        code: "REAUTH_REQUIRED",
      });
    }

    const url = new URL("https://graph.instagram.com/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", token);

    const { ok, data } = await getJson(url.toString());
    if (!ok || !data.access_token) {
      throw new OAuthError("Gagal memperbarui akses Instagram. Silakan hubungkan ulang.", {
        statusCode: 401,
        code: "REAUTH_REQUIRED",
      });
    }

    return {
      ...session,
      accessToken: data.access_token,
      expiresAt: days((data.expires_in ?? 60 * 24 * 60 * 60) / (24 * 60 * 60)),
    };
  },

  async fetchMetrics(session) {
    const token = session.accessToken;
    if (!token) {
      throw new OAuthError("Sesi Instagram belum terautentikasi. Hubungkan ulang.", {
        statusCode: 401,
        code: "REAUTH_REQUIRED",
      });
    }

    // Menggunakan graph.instagram.com/v26.0/me atau ID user langsung
    const profileUrl = `https://graph.instagram.com/v26.0/me?fields=user_id,username,name,followers_count,media_count&access_token=${encodeURIComponent(
      token,
    )}`;

    const profile = await getJson(profileUrl);
    if (!profile.ok) {
      const code = profile.data?.error?.code;
      throw new OAuthError(
        profile.data?.error?.message || "Gagal membaca profil Instagram.",
        { statusCode: code === 190 ? 401 : 502, code: code === 190 ? "REAUTH_REQUIRED" : undefined },
      );
    }

    const data = profile.data || {};
    const igId = data.user_id || data.id;

    // Ambil media dari endpoint /{ig_id}/media
    let items = [];
    if (igId) {
      const mediaUrl = `https://graph.instagram.com/v26.0/${igId}/media?fields=like_count,comments_count,timestamp,media_type&limit=25&access_token=${encodeURIComponent(
        token,
      )}`;
      const media = await getJson(mediaUrl);
      if (media.ok) {
        items = media.data?.data || [];
      }
    }

    const count = items.length;
    const sum = (key) => items.reduce((acc, m) => acc + (Number(m[key]) || 0), 0);

    const followers = Number(data.followers_count) || 0;
    const mediaCount = Number(data.media_count) || count;
    const totalLikes = sum("like_count");
    const totalComments = sum("comments_count");

    return {
      platform: "instagram",
      username: data.username || "",
      fullName: data.name || data.username || "",
      followers,
      dataPeriod: "30",
      totalReach: Math.max(followers * count, totalLikes + totalComments),
      totalLikes,
      totalComments,
      totalSharesSaves: 0,
      contentCount: mediaCount,
    };
  },

  async fetchProfile(session) {
    const token = session.accessToken;
    const { ok, data } = await getJson(
      `https://graph.instagram.com/v26.0/me?fields=username,name,profile_picture_url&access_token=${encodeURIComponent(
        token,
      )}`,
    );
    if (!ok) return { username: "", fullName: "" };
    return {
      username: data.username || "",
      fullName: data.name || data.username || "",
      avatarUrl: data.profile_picture_url || "",
    };
  },
};

/* ================================================================== */
/* TikTok (Login Kit v2 + Display API)                                 */
/* ================================================================== */

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";

const tiktok = {
  id: "tiktok",
  label: "TikTok",

  requiredEnv: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],

  configured() {
    return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
  },

  assertConfigured() {
    if (!this.configured()) throw new NotConfiguredError("TikTok", this.requiredEnv);
  },

  buildAuthUrl({ state, redirectUri }) {
    this.assertConfigured();
    const url = new URL(TIKTOK_AUTH_URL);
    url.searchParams.set("client_key", process.env.TIKTOK_CLIENT_KEY);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "user.info.basic,user.info.stats,video.list");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    return url.toString();
  },

  async exchangeCode({ code, redirectUri }) {
    this.assertConfigured();
    const { ok, data } = await postForm(TIKTOK_TOKEN_URL, {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    if (!ok || !data.access_token) {
      throw new OAuthError(
        data.error_description || data.error || "Gagal menukar kode otorisasi TikTok.",
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      // TikTok memberi durasi dalam detik.
      expiresAt: Date.now() + (Number(data.expires_in) || 86400) * 1000,
      refreshExpiresAt: Date.now() + (Number(data.refresh_expires_in) || 31536000) * 1000,
      openId: data.open_id || "",
      scope: data.scope || "",
    };
  },

  async refresh(session) {
    if (!session.refreshToken) {
      throw new OAuthError("Sesi TikTok tidak punya refresh token. Silakan hubungkan ulang.", {
        statusCode: 401,
        code: "REAUTH_REQUIRED",
      });
    }

    const { ok, data } = await postForm(TIKTOK_TOKEN_URL, {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    });

    if (!ok || !data.access_token) {
      throw new OAuthError("Gagal memperbarui akses TikTok. Silakan hubungkan ulang.", {
        statusCode: 401,
        code: "REAUTH_REQUIRED",
      });
    }

    return {
      ...session,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || session.refreshToken,
      expiresAt: Date.now() + (Number(data.expires_in) || 86400) * 1000,
      refreshExpiresAt: Date.now() + (Number(data.refresh_expires_in) || 31536000) * 1000,
    };
  },

  async fetchMetrics(session) {
    const fields = [
      "open_id",
      "union_id",
      "avatar_url",
      "display_name",
      "username",
      "follower_count",
      "following_count",
      "likes_count",
      "video_count",
    ].join(",");

    const profile = await getJson(
      `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(fields)}`,
      { Authorization: `Bearer ${session.accessToken}` },
    );

    const apiError = profile.data?.error;
    if (!profile.ok || (apiError && apiError.code && apiError.code !== "ok")) {
      const isAuth = profile.status === 401 || apiError?.code === "access_token_invalid";
      throw new OAuthError(apiError?.message || "Gagal membaca profil TikTok.", {
        statusCode: isAuth ? 401 : 502,
        code: isAuth ? "REAUTH_REQUIRED" : undefined,
      });
    }

    const user = profile.data?.data?.user || {};
    const videos = await fetchTikTokVideos(session.accessToken);

    const count = videos.length;
    const sum = (key) => videos.reduce((acc, v) => acc + (Number(v[key]) || 0), 0);
    const totalViews = sum("view_count");

    return {
      platform: "tiktok",
      username: user.username || "",
      fullName: user.display_name || user.username || "",
      followers: Number(user.follower_count) || 0,
      dataPeriod: "30",
      totalViews,
      totalLikes: sum("like_count"),
      totalComments: sum("comment_count"),
      totalShares: sum("share_count"),
      videoCount: count || Number(user.video_count) || 0,
      avgViewsPerVideo: count ? Math.round(totalViews / count) : 0,
      avatarUrl: user.avatar_url || "",
    };
  },

  async fetchProfile(session) {
    const { ok, data } = await getJson(
      "https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url",
      { Authorization: `Bearer ${session.accessToken}` },
    );
    if (!ok) return { username: "", fullName: "" };
    const user = data?.data?.user || {};
    return {
      username: user.username || "",
      fullName: user.display_name || user.username || "",
      avatarUrl: user.avatar_url || "",
    };
  },
};

async function fetchTikTokVideos(accessToken) {
  const fields = "id,title,view_count,like_count,comment_count,share_count,create_time";
  const res = await fetch(
    `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_count: 20 }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data?.error?.code && data.error.code !== "ok")) {
    // Kegagalan daftar video tidak boleh membatalkan seluruh auto-fill; metrik
    // akun tetap berguna. Kembalikan kosong biar field video terisi 0.
    console.warn("[TikTok] video/list gagal:", data?.error?.message || res.status);
    return [];
  }
  return data?.data?.videos || [];
}

/* ================================================================== */

export const OAUTH_PROVIDERS = { youtube, instagram, tiktok };

export function getProvider(id) {
  const provider = OAUTH_PROVIDERS[String(id || "").toLowerCase()];
  if (!provider) {
    const err = new Error(`Provider OAuth tidak dikenal: ${id}`);
    err.statusCode = 404;
    throw err;
  }
  return provider;
}

/** Status kesiapan tiap provider — dipakai UI untuk menyembunyikan tombol yang belum siap. */
export function getOAuthStatus() {
  return Object.values(OAUTH_PROVIDERS).map((provider) => ({
    id: provider.id,
    label: provider.label,
    configured: provider.configured(),
    requiredEnv: provider.requiredEnv,
  }));
}

export { OAuthError, NotConfiguredError };
