/**
 * Provider integrasi sosial media — jalan HANYA di server.
 *
 * Semua kredensial dibaca dari `process.env` (tanpa prefix NEXT_PUBLIC_ supaya
 * Next.js tidak pernah memasukkannya ke browser bundle). Setiap fungsi
 * mengembalikan metrik dalam BENTUK TERNORMALISASI yang sama dengan
 * `buildSimulatedProfile()` di `src/lib/socialAutoFill.js`, sehingga halaman
 * kalkulator memetakannya ke field form tanpa perubahan apa pun.
 *
 * Catatan penting soal akses data publik per platform:
 * - YouTube  → YouTube Data API v3 bisa membaca statistik publik channel
 *              hanya dari handle/username. Ini satu-satunya platform di sini
 *              yang metrik publiknya benar-benar bisa ditarik tanpa login
 *              pemilik akun.
 * - Instagram → metrik follower/reach tidak publik. Graph API hanya bisa
 *              membaca akun bisnis/kreator lewat `business_discovery`, dan itu
 *              butuh token dengan izin `instagram_basic` + akun bisnis yang
 *              sudah ditautkan ke App Meta.
 * - TikTok   → Display API (`/v2/user/info/`) hanya mengembalikan data akun
 *              yang SUDAH memberi izin OAuth ke aplikasi kita. TikTok tidak
 *              menyediakan lookup metrik sembarang handle. Jadi untuk TikTok,
 *              "connect" berarti user login TikTok dan mengizinkan Cardify.
 */

const NORMALIZED_DATA_PERIOD = "30";

/** Status konfigurasi credential per platform — dipakai endpoint /status. */
export function getPlatformStatus() {
  return {
    youtube: {
      configured: Boolean(process.env.YOUTUBE_API_KEY),
      requiredVars: ["YOUTUBE_API_KEY"],
      authMode: "api_key",
      lookupByHandle: true,
    },
    instagram: {
      configured: Boolean(
        process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
      ),
      requiredVars: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID"],
      authMode: "business_discovery",
      lookupByHandle: true,
    },
    tiktok: {
      configured: Boolean(
        process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET,
      ),
      requiredVars: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
      authMode: "oauth_user_token",
      // TikTok tidak punya endpoint metrik publik per-handle.
      lookupByHandle: false,
    },
  };
}

/** Error yang menandai "credential belum diisi", bukan kegagalan upstream. */
export class ProviderNotConfiguredError extends Error {
  constructor(platform, requiredVars) {
    super(
      `Integrasi ${platform} belum dikonfigurasi. Butuh env: ${requiredVars.join(", ")}.`,
    );
    this.name = "ProviderNotConfiguredError";
    this.platform = platform;
    this.requiredVars = requiredVars;
  }
}

export async function fetchPlatformMetrics(platform, handle) {
  if (platform === "youtube") return fetchYouTubeMetrics(handle);
  if (platform === "instagram") return fetchInstagramMetrics(handle);
  if (platform === "tiktok") return fetchTikTokMetrics(handle);
  throw new Error(`Platform tidak dikenal: ${platform}`);
}

/* ------------------------------------------------------------------ */
/* YouTube Data API v3                                                 */
/* ------------------------------------------------------------------ */

export async function fetchYouTubeMetrics(handle) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new ProviderNotConfiguredError("YouTube", ["YOUTUBE_API_KEY"]);
  }

  const channel = await resolveYouTubeChannel(handle, apiKey);
  const stats = channel.statistics || {};
  const snippet = channel.snippet || {};
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

  const videos = await fetchRecentYouTubeVideos(uploadsPlaylistId, apiKey, 30);

  // Pakai video 30 hari terakhir kalau ada; kalau channel jarang upload,
  // jatuh ke 10 video terakhir supaya rata-ratanya tetap masuk akal.
  const recent =
    videos.length > 0 ? videos : await fetchRecentYouTubeVideos(uploadsPlaylistId, apiKey, 10);

  const count = recent.length || 1;
  const sum = (key) => recent.reduce((acc, v) => acc + (Number(v[key]) || 0), 0);

  const avgViewsPerVideo = recent.length
    ? Math.round(sum("viewCount") / count)
    : // Channel tanpa video sama sekali: tidak ada dasar untuk rata-rata.
      0;

  const subscriberCount = Number(stats.subscriberCount) || 0;

  return {
    platform: "youtube",
    username: handle,
    fullName: snippet.title || handle,
    followers: subscriberCount,
    totalSubscribers: subscriberCount,
    dataPeriod: NORMALIZED_DATA_PERIOD,
    avgViewsPerVideo,
    avgLikesPerVideo: recent.length ? Math.round(sum("likeCount") / count) : 0,
    avgCommentsPerVideo: recent.length ? Math.round(sum("commentCount") / count) : 0,
    // YouTube tidak mengekspos jumlah share per video → dibiarkan kosong.
    avatarUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
    totalVideos: Number(stats.videoCount) || 0,
  };
}

/**
 * Cari channel dari handle/username. Urutan: `forHandle` (paling umum sekarang)
 * → `forUsername` (channel lama) → `search.list` (biaya 100 unit quota).
 */
async function resolveYouTubeChannel(handle, apiKey) {
  const clean = handle.replace(/^@/, "").trim();

  const attempts = [
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(
      `@${clean}`,
    )}&key=${apiKey}`,
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forUsername=${encodeURIComponent(
      clean,
    )}&key=${apiKey}`,
  ];

  for (const url of attempts) {
    const data = await googleGet(url);
    if (data.items?.length) return data.items[0];
  }

  // Fallback terakhir: pencarian bebas. Paling mahal, jadi ditaruh paling akhir.
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(
    clean,
  )}&key=${apiKey}`;
  const searchData = await googleGet(searchUrl);
  const channelId = searchData.items?.[0]?.id?.channelId;

  if (channelId) {
    const detailUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`;
    const detailData = await googleGet(detailUrl);
    if (detailData.items?.length) return detailData.items[0];
  }

  const err = new Error(`Channel YouTube "@${clean}" tidak ditemukan.`);
  err.statusCode = 404;
  throw err;
}

/**
 * Ambil statistik video terbaru dari playlist uploads.
 * `daysWindow` = 0 berarti "N video terakhir tanpa filter tanggal".
 */
async function fetchRecentYouTubeVideos(playlistId, apiKey, daysWindow = 30) {
  if (!playlistId) return [];

  const listUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
  const listData = await googleGet(listUrl);
  const entries = listData.items || [];
  if (!entries.length) return [];

  let selected = entries;
  if (daysWindow > 0) {
    const cutoff = Date.now() - daysWindow * 24 * 60 * 60 * 1000;
    const withinWindow = entries.filter((item) => {
      const published = Date.parse(item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt);
      return Number.isFinite(published) && published >= cutoff;
    });
    if (withinWindow.length > 0) selected = withinWindow;
  }

  const ids = selected
    .map((item) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
    .filter(Boolean)
    .slice(0, 50);

  if (!ids.length) return [];

  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(",")}&key=${apiKey}`;
  const statsData = await googleGet(statsUrl);

  return (statsData.items || []).map((item) => item.statistics || {});
}

async function googleGet(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Google mengirim alasan kuota habis di error.errors[].reason
    const reason = data?.error?.errors?.[0]?.reason;
    if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
      const err = new Error(
        "Kuota harian YouTube Data API habis. Coba lagi besok atau naikkan quota di Google Cloud Console.",
      );
      err.statusCode = 429;
      throw err;
    }
    const err = new Error(data?.error?.message || `YouTube API error (HTTP ${res.status}).`);
    err.statusCode = res.status === 404 ? 404 : 502;
    throw err;
  }

  return data;
}

/* ------------------------------------------------------------------ */
/* Instagram Graph API (business_discovery)                            */
/* ------------------------------------------------------------------ */

export async function fetchInstagramMetrics(handle) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !businessAccountId) {
    throw new ProviderNotConfiguredError("Instagram", [
      "INSTAGRAM_ACCESS_TOKEN",
      "INSTAGRAM_BUSINESS_ACCOUNT_ID",
    ]);
  }

  const clean = handle.replace(/^@/, "").trim();
  const version = process.env.INSTAGRAM_GRAPH_VERSION || "v21.0";

  // business_discovery hanya mengembalikan metrik akun bisnis/kreator yang
  // publik. 25 media terakhir dipakai untuk menghitung rata-rata reach.
  const fields = [
    "username",
    "followers_count",
    "media_count",
    `media.limit(25){like_count,comments_count,timestamp,media_type}`,
  ].join(",");

  const url =
    `https://graph.facebook.com/${version}/${businessAccountId}` +
    `?fields=business_discovery.username(${encodeURIComponent(clean)}){${fields}}` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.error) {
    const message = data?.error?.message || `Instagram Graph API error (HTTP ${res.status}).`;
    const err = new Error(message);
    // Graph API mengembalikan subcode khusus kalau akun bukan bisnis/kreator.
    err.statusCode = data?.error?.code === 100 ? 404 : 502;
    throw err;
  }

  const discovery = data?.business_discovery;
  if (!discovery) {
    const err = new Error(
      `Akun Instagram "@${clean}" tidak bisa dibaca. Pastikan akunnya Bisnis/Kreator dan publik.`,
    );
    err.statusCode = 404;
    throw err;
  }

  const media = discovery.media?.data || [];
  const count = media.length;
  const sum = (key) => media.reduce((acc, m) => acc + (Number(m[key]) || 0), 0);

  const totalLikes = sum("like_count");
  const totalComments = sum("comments_count");
  // Graph API tidak mengekspos reach dari business_discovery, jadi engagement
  // dihitung dari interaksi media. Halaman kalkulator memakai totalReach
  // sebagai basis engagement rate, jadi di sini dipetakan ke total interaksi.
  const totalReach = Number(discovery.followers_count) * count || totalLikes + totalComments;

  return {
    platform: "instagram",
    username: discovery.username || clean,
    fullName: discovery.username || clean,
    followers: Number(discovery.followers_count) || 0,
    dataPeriod: NORMALIZED_DATA_PERIOD,
    totalReach,
    totalLikes,
    totalComments,
    // Graph API tidak menyediakan share/save di level media → 0 supaya field
    // form jelas kosong, bukan angka tebakan.
    totalSharesSaves: 0,
    contentCount: Number(discovery.media_count) || count,
  };
}

/* ------------------------------------------------------------------ */
/* TikTok Display API (butuh OAuth token milik pemilik akun)           */
/* ------------------------------------------------------------------ */

export async function fetchTikTokMetrics(handle) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    throw new ProviderNotConfiguredError("TikTok", [
      "TIKTOK_CLIENT_KEY",
      "TIKTOK_CLIENT_SECRET",
    ]);
  }

  // TikTok tidak punya endpoint "baca metrik handle siapa pun". Satu-satunya
  // jalur resmi: user login TikTok lalu kita pakai access token MILIKNYA untuk
  // memanggil /v2/user/info/ dan /v2/video/list/. Selama token user itu belum
  // ada, kita tidak bisa mengembalikan data apa pun.
  const userAccessToken = process.env.TIKTOK_USER_ACCESS_TOKEN;

  if (!userAccessToken) {
    const err = new Error(
      "TikTok Display API butuh access token dari pemilik akun (OAuth). " +
        "Isi TIKTOK_USER_ACCESS_TOKEN setelah alur login TikTok selesai, atau " +
        "gunakan Mode Demo untuk saat ini.",
    );
    err.statusCode = 501;
    throw err;
  }

  const fields = "open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count";
  const url = `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(fields)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${userAccessToken}` },
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.error?.code !== "ok") {
    const err = new Error(
      data?.error?.message || `TikTok API error (HTTP ${res.status}).`,
    );
    err.statusCode = res.status === 401 || res.status === 403 ? 401 : 502;
    throw err;
  }

  const user = data?.data?.user || {};

  // Ambil video terbaru untuk menghitung rata-rata views/interaksi.
  const videos = await fetchTikTokVideos(userAccessToken);

  const count = videos.length || 1;
  const sum = (key) => videos.reduce((acc, v) => acc + (Number(v[key]) || 0), 0);
  const totalViews = sum("view_count");

  return {
    platform: "tiktok",
    username: handle, // Display API tidak mengembalikan username publik.
    fullName: user.display_name || handle,
    followers: Number(user.follower_count) || 0,
    dataPeriod: NORMALIZED_DATA_PERIOD,
    totalViews,
    totalLikes: sum("like_count"),
    totalComments: sum("comment_count"),
    totalShares: sum("share_count"),
    videoCount: videos.length || Number(user.video_count) || 0,
    avgViewsPerVideo: videos.length ? Math.round(totalViews / count) : 0,
    avatarUrl: user.avatar_url || "",
  };
}

async function fetchTikTokVideos(userAccessToken) {
  const fields = "id,title,view_count,like_count,comment_count,share_count,create_time";
  const url = `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ max_count: 20 }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error?.code !== "ok") {
    // Video list gagal bukan alasan membatalkan seluruh auto-fill; metrik
    // akun tetap berguna. Kembalikan array kosong supaya field video terisi 0.
    console.warn("[TikTok] video/list gagal:", data?.error?.message || res.status);
    return [];
  }

  return data?.data?.videos || [];
}
