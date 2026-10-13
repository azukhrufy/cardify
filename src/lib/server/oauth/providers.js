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
/* Instagram (Facebook Login + Instagram Graph API)                    */
/* ================================================================== */

const instagram = {
  id: "instagram",
  label: "Instagram",

  requiredEnv: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"],

  configured() {
    return Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET);
  },

  assertConfigured() {
    if (!this.configured()) throw new NotConfiguredError("Instagram", this.requiredEnv);
  },

  buildAuthUrl({ state, redirectUri }) {
    this.assertConfigured();
    const url = new URL(`https://www.facebook.com/${DEFAULT_GRAPH_VERSION}/dialog/oauth`);
    url.searchParams.set("client_id", process.env.INSTAGRAM_APP_ID);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");
    url.searchParams.set(
      "scope",
      ["instagram_basic", "instagram_manage_insights", "pages_show_list", "pages_read_engagement"].join(","),
    );
    return url.toString();
  },

  async exchangeCode({ code, redirectUri }) {
    this.assertConfigured();

    // 1) code → short-lived user token
    const shortUrl = new URL(`https://graph.facebook.com/${DEFAULT_GRAPH_VERSION}/oauth/access_token`);
    shortUrl.searchParams.set("client_id", process.env.INSTAGRAM_APP_ID);
    shortUrl.searchParams.set("client_secret", process.env.INSTAGRAM_APP_SECRET);
    shortUrl.searchParams.set("redirect_uri", redirectUri);
    shortUrl.searchParams.set("code", code);

    const short = await getJson(shortUrl.toString());
    if (!short.ok || !short.data.access_token) {
      throw new OAuthError(short.data?.error?.message || "Gagal menukar kode otorisasi Meta.");
    }

    // 2) short-lived → long-lived (≈60 hari). Token pendek hanya bertahan 1 jam.
    const longUrl = new URL(`https://graph.facebook.com/${DEFAULT_GRAPH_VERSION}/oauth/access_token`);
    longUrl.searchParams.set("grant_type", "fb_exchange_token");
    longUrl.searchParams.set("client_id", process.env.INSTAGRAM_APP_ID);
    longUrl.searchParams.set("client_secret", process.env.INSTAGRAM_APP_SECRET);
    longUrl.searchParams.set("fb_exchange_token", short.data.access_token);

    const long = await getJson(longUrl.toString());
    const userToken = long.data?.access_token || short.data.access_token;
    const expiresIn = long.data?.expires_in ?? 60 * 24 * 60 * 60;

    // 3) Ambil Page + IG business account. Page token inilah yang dipakai untuk
    //    membaca insight; page token turunan long-lived user token tidak expire.
    const pages = await getJson(
      `https://graph.facebook.com/${DEFAULT_GRAPH_VERSION}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(userToken)}`,
    );

    if (!pages.ok) {
      throw new OAuthError(pages.data?.error?.message || "Gagal membaca daftar Halaman Facebook.");
    }

    const withIg = (pages.data?.data || []).find((page) => page.instagram_business_account?.id);
    if (!withIg) {
      throw new OAuthError(
        "Tidak ada akun Instagram Bisnis yang tertaut ke Halaman Facebook Anda. " +
          "Ubah akun Instagram ke tipe Bisnis/Kreator lalu tautkan ke Halaman Facebook.",
        { statusCode: 400, code: "NO_IG_BUSINESS_ACCOUNT" },
      );
    }

    return {
      accessToken: withIg.access_token || userToken,
      userAccessToken: userToken,
      refreshToken: null, // Meta tidak memakai refresh token; pakai fb_exchange_token.
      expiresAt: days(expiresIn / (24 * 60 * 60)),
      igUserId: withIg.instagram_business_account.id,
      pageId: withIg.id,
      pageName: withIg.name || "",
    };
  },

  async refresh(session) {
    const token = session.userAccessToken || session.accessToken;
    if (!token) {
      throw new OAuthError("Sesi Instagram tidak lengkap. Silakan hubungkan ulang.", {
        statusCode: 401,
        code: "REAUTH_REQUIRED",
      });
    }

    const url = new URL(`https://graph.facebook.com/${DEFAULT_GRAPH_VERSION}/oauth/access_token`);
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", process.env.INSTAGRAM_APP_ID);
    url.searchParams.set("client_secret", process.env.INSTAGRAM_APP_SECRET);
    url.searchParams.set("fb_exchange_token", token);

    const { ok, data } = await getJson(url.toString());
    if (!ok || !data.access_token) {
      throw new OAuthError("Gagal memperbarui akses Instagram. Silakan hubungkan ulang.", {
        statusCode: 401,
        code: "REAUTH_REQUIRED",
      });
    }

    return {
      ...session,
      userAccessToken: data.access_token,
      expiresAt: days((data.expires_in ?? 60 * 24 * 60 * 60) / (24 * 60 * 60)),
    };
  },

  async fetchMetrics(session) {
    const token = session.accessToken;
    if (!session.igUserId || !token) {
      throw new OAuthError("Sesi Instagram belum punya akun bisnis. Hubungkan ulang.", {
        statusCode: 401,
        code: "REAUTH_REQUIRED",
      });
    }

    const base = `https://graph.facebook.com/${DEFAULT_GRAPH_VERSION}/${session.igUserId}`;

    const profile = await getJson(
      `${base}?fields=username,followers_count,media_count&access_token=${encodeURIComponent(token)}`,
    );
    if (!profile.ok) {
      const code = profile.data?.error?.code;
      throw new OAuthError(
        profile.data?.error?.message || "Gagal membaca profil Instagram.",
        { statusCode: code === 190 ? 401 : 502, code: code === 190 ? "REAUTH_REQUIRED" : undefined },
      );
    }

    const media = await getJson(
      `${base}/media?fields=like_count,comments_count,timestamp,media_type&limit=25&access_token=${encodeURIComponent(token)}`,
    );
    const items = media.ok ? media.data?.data || [] : [];
    const count = items.length;
    const sum = (key) => items.reduce((acc, m) => acc + (Number(m[key]) || 0), 0);

    const followers = Number(profile.data.followers_count) || 0;
    const mediaCount = Number(profile.data.media_count) || count;
    const totalLikes = sum("like_count");
    const totalComments = sum("comments_count");

    return {
      platform: "instagram",
      username: profile.data.username || "",
      fullName: profile.data.username || "",
      followers,
      dataPeriod: "30",
      // `business_discovery` tidak mengekspos reach/impresi per media. Basis
      // engagement-rate karena itu diturunkan dari follower × jumlah konten,
      // dengan interaksi nyata sebagai lantai.
      totalReach: Math.max(followers * count, totalLikes + totalComments),
      totalLikes,
      totalComments,
      // Share/save tidak tersedia di level media lewat field dasar.
      totalSharesSaves: 0,
      contentCount: mediaCount,
    };
  },

  async fetchProfile(session) {
    const token = session.accessToken;
    const { ok, data } = await getJson(
      `https://graph.facebook.com/${DEFAULT_GRAPH_VERSION}/${session.igUserId}?fields=username,name,profile_picture_url&access_token=${encodeURIComponent(token)}`,
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
