/**
 * Helper YouTube Data API v3 — dipakai bersama oleh dua jalur:
 *
 * 1. `socialProviders.js` → lookup PUBLIK, channel siapa pun, dengan API key.
 * 2. `oauth/providers.js` → lookup AKUN SENDIRI (`mine=true`) dengan access
 *    token OAuth hasil login kreator.
 *
 * Keduanya memakai parsing dan penghitungan rata-rata yang sama supaya angka
 * yang keluar konsisten, terlepas dari jalur mana yang dipilih user.
 */

const NORMALIZED_DATA_PERIOD = "30";

/**
 * Bentuk otentikasi ke Google API. OAuth (bearer) dipakai kalau ada, kalau
 * tidak jatuh ke API key. Salah satu wajib ada.
 */
export function googleAuth({ apiKey, accessToken } = {}) {
  if (accessToken) return { kind: "bearer", accessToken };
  if (apiKey) return { kind: "key", apiKey };
  throw new Error("Butuh YOUTUBE_API_KEY atau access token OAuth YouTube.");
}

/** GET ke YouTube Data API v3 dengan error handling terpusat. */
async function googleFetch(path, auth, params = {}) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  if (auth.kind === "key") url.searchParams.set("key", auth.apiKey);

  const res = await fetch(url.toString(), {
    headers:
      auth.kind === "bearer" ? { Authorization: `Bearer ${auth.accessToken}` } : undefined,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const reason = data?.error?.errors?.[0]?.reason;

    // Kuota habis bukan kesalahan user — beri pesan yang bisa ditindaklanjuti.
    if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
      const err = new Error(
        "Kuota harian YouTube Data API habis. Coba lagi besok atau naikkan quota di Google Cloud Console.",
      );
      err.statusCode = 429;
      throw err;
    }

    // Token OAuth kedaluwarsa / dicabut → 401 supaya UI meminta user login ulang.
    if (data?.error?.status === "UNAUTHENTICATED" || res.status === 401) {
      const err = new Error("Akses YouTube kedaluwarsa. Silakan hubungkan ulang akun Anda.");
      err.statusCode = 401;
      err.code = "REAUTH_REQUIRED";
      throw err;
    }

    const err = new Error(data?.error?.message || `YouTube API error (HTTP ${res.status}).`);
    err.statusCode = res.status === 404 ? 404 : 502;
    throw err;
  }

  return data;
}

const CHANNEL_PART = "snippet,statistics,contentDetails";

/**
 * Channel milik user yang sedang login (`mine=true`). Ini jalur OAuth, tidak
 * butuh handle dan tidak bisa gagal karena "channel tidak ditemukan" kecuali
 * akun Google-nya memang belum punya channel YouTube.
 */
export async function resolveOwnChannel(auth) {
  const data = await googleFetch("channels", auth, { part: CHANNEL_PART, mine: "true" });
  if (!data.items?.length) {
    const err = new Error("Akun Google ini belum memiliki channel YouTube.");
    err.statusCode = 404;
    throw err;
  }
  return data.items[0];
}

/**
 * Resolusi channel dari handle/username tanpa login (jalur API key).
 * Urutan dari yang paling murah: forHandle → forUsername → search (100 unit).
 *
 * `allowSearch: false` mematikan fallback `search.list`. Satu panggilan search
 * berbiaya 100 unit kuota — 100 user yang salah ketik handle sudah menghabiskan
 * 1% kuota harian. Untuk input user sebaiknya matikan dan balas 404.
 */
export async function resolveChannelByHandle(handle, auth, { allowSearch = true } = {}) {
  const clean = String(handle || "").replace(/^@/, "").trim();
  if (!clean) {
    const err = new Error("Handle YouTube kosong.");
    err.statusCode = 400;
    throw err;
  }

  for (const params of [{ forHandle: `@${clean}` }, { forUsername: clean }]) {
    const data = await googleFetch("channels", auth, { part: CHANNEL_PART, ...params });
    if (data.items?.length) return data.items[0];
  }

  if (allowSearch) {
    const search = await googleFetch("search", auth, {
      part: "snippet",
      type: "channel",
      maxResults: 1,
      q: clean,
    });
    const channelId = search.items?.[0]?.id?.channelId;
    if (channelId) {
      const detail = await googleFetch("channels", auth, { part: CHANNEL_PART, id: channelId });
      if (detail.items?.length) return detail.items[0];
    }
  }

  const err = new Error(`Channel YouTube "@${clean}" tidak ditemukan.`);
  err.statusCode = 404;
  throw err;
}

/** Resolusi channel dari ID kanonik (`UC...`) — 1 unit kuota, paling murah. */
export async function resolveChannelById(channelId, auth) {
  const clean = String(channelId || "").trim();
  if (!clean) {
    const err = new Error("Channel ID YouTube kosong.");
    err.statusCode = 400;
    throw err;
  }

  const data = await googleFetch("channels", auth, { part: CHANNEL_PART, id: clean });
  if (!data.items?.length) {
    const err = new Error(`Channel YouTube dengan ID "${clean}" tidak ditemukan.`);
    err.statusCode = 404;
    throw err;
  }
  return data.items[0];
}


/**
 * Statistik video dari playlist uploads.
 * `daysWindow > 0` = hanya video dalam N hari terakhir; hasilnya bisa kosong
 * untuk channel yang jarang upload (pemanggil yang memutuskan fallback-nya).
 */
export async function fetchRecentVideos(playlistId, auth, daysWindow = 30) {
  if (!playlistId) return [];

  const list = await googleFetch("playlistItems", auth, {
    part: "snippet,contentDetails",
    maxResults: 50,
    playlistId,
  });
  const entries = list.items || [];
  if (!entries.length) return [];

  let selected = entries;
  if (daysWindow > 0) {
    const cutoff = Date.now() - daysWindow * 24 * 60 * 60 * 1000;
    const withinWindow = entries.filter((item) => {
      const published = Date.parse(
        item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt,
      );
      return Number.isFinite(published) && published >= cutoff;
    });
    if (withinWindow.length > 0) selected = withinWindow;
  }

  const ids = selected
    .map((item) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
    .filter(Boolean)
    .slice(0, 50);
  if (!ids.length) return [];

  const stats = await googleFetch("videos", auth, {
    part: "statistics",
    id: ids.join(","),
  });
  return (stats.items || []).map((item) => item.statistics || {});
}

/**
 * Ubah channel + statistik video menjadi bentuk metrik ternormalisasi yang
 * dipakai halaman kalkulator (lihat `buildSimulatedProfile` untuk bentuk lama).
 */
export function buildYouTubeMetrics(channel, videos, { username } = {}) {
  const stats = channel?.statistics || {};
  const snippet = channel?.snippet || {};

  const count = videos.length;
  const sum = (key) => videos.reduce((acc, v) => acc + (Number(v[key]) || 0), 0);

  const subscriberCount = Number(stats.subscriberCount) || 0;

  return {
    platform: "youtube",
    username: username || snippet.customUrl?.replace(/^@/, "") || snippet.title || "",
    fullName: snippet.title || username || "",
    followers: subscriberCount,
    totalSubscribers: subscriberCount,
    dataPeriod: NORMALIZED_DATA_PERIOD,
    // Channel tanpa video sama sekali tidak punya dasar rata-rata — kirim 0
    // daripada menebak.
    avgViewsPerVideo: count ? Math.round(sum("viewCount") / count) : 0,
    avgLikesPerVideo: count ? Math.round(sum("likeCount") / count) : 0,
    avgCommentsPerVideo: count ? Math.round(sum("commentCount") / count) : 0,
    avatarUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
    totalVideos: Number(stats.videoCount) || 0,
    // YouTube tidak mengekspos jumlah share per video.
    avgSharesPerVideo: 0,
    videoSampleSize: count,
    // Channel bisa menyembunyikan subscriber count; API tetap mengembalikan
    // field-nya tapi nilainya bukan angka sebenarnya.
    subscriberCountHidden: stats.hiddenSubscriberCount === true,
  };
}

/**
 * Channel + video → metrik ternormalisasi. Dipakai semua jalur supaya angka
 * yang keluar konsisten, terlepas dari cara channel itu ditemukan.
 */
async function metricsForChannel(channel, auth, username) {
  const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;

  let videos = await fetchRecentVideos(playlistId, auth, 30);
  if (!videos.length) {
    videos = await fetchRecentVideos(playlistId, auth, 0);
  }

  return buildYouTubeMetrics(channel, videos, { username });
}

/**
 * Alur lengkap untuk channel publik berdasarkan handle (butuh API key).
 * Rata-rata dihitung dari video 30 hari terakhir; kalau channel jarang upload,
 * jatuh ke 10 video terakhir supaya angkanya tetap masuk akal.
 */
export async function fetchYouTubeByHandle(handle, auth, options = {}) {
  const channel = await resolveChannelByHandle(handle, auth, options);
  return metricsForChannel(channel, auth, String(handle).replace(/^@/, ""));
}

/**
 * Titik masuk untuk input bebas user: `@handle`, `handle`, `UC...`,
 * `youtube.com/@handle`, `/c/nama`, `/user/nama`, atau `/channel/UC...`.
 * `ref` adalah hasil `parseYouTubeRef()` di sisi route.
 */
export async function fetchYouTubeByRef(ref, auth, { allowSearch = false } = {}) {
  const channel =
    ref.kind === "id"
      ? await resolveChannelById(ref.value, auth)
      : await resolveChannelByHandle(ref.value, auth, { allowSearch });

  return metricsForChannel(channel, auth, ref.value.replace(/^@/, ""));
}

/** Alur untuk akun sendiri via OAuth. */
export async function fetchYouTubeOwnChannel(auth, username) {
  const channel = await resolveOwnChannel(auth);
  return metricsForChannel(channel, auth, username);
}
