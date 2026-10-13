// Next.js API route untuk mengambil metrik sosial media secara aman di server-side.
// Kredensial platform (API key, client secret) dibaca dari environment server (process.env.*)
// sehingga TIDAK PERNAH terekspos ke browser / client bundle.

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const platform = req.query.platform || req.body?.platform;
  const handle = req.query.handle || req.body?.handle;

  if (!platform || !handle) {
    return res.status(400).json({ error: "Missing 'platform' or 'handle' parameter." });
  }

  const cleanHandle = handle.replace(/^@/, "").trim();

  try {
    let metrics = null;

    if (platform === "tiktok") {
      metrics = await fetchTikTokMetrics(cleanHandle);
    } else if (platform === "instagram") {
      metrics = await fetchInstagramMetrics(cleanHandle);
    } else if (platform === "youtube") {
      metrics = await fetchYouTubeMetrics(cleanHandle);
    } else {
      return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }

    return res.status(200).json({
      success: true,
      platform,
      handle: cleanHandle,
      metrics,
    });
  } catch (err) {
    console.error(`[Social API Error] [${platform}] ${cleanHandle}:`, err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch metrics from platform API.",
    });
  }
}

/**
 * TikTok API Integration (TikTok Research API / Display API / Creator Marketplace API)
 */
async function fetchTikTokMetrics(handle) {
  const apiKey = process.env.TIKTOK_CLIENT_KEY;
  const apiSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("TikTok API credentials not configured on server (TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET).");
  }

  // TODO: Implementasi pemanggilan TikTok API resmi menggunakan access token client credentials / user token
  // Contoh kerangka fetch ke TikTok API:
  /*
  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: apiKey,
      client_secret: apiSecret,
      grant_type: "client_credentials"
    })
  });
  const tokenData = await tokenRes.json();
  ...
  */

  throw new Error("TikTok API integration pending platform approval and live token setup.");
}

/**
 * Instagram Graph API Integration
 */
async function fetchInstagramMetrics(handle) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Instagram access token not configured on server (INSTAGRAM_ACCESS_TOKEN).");
  }

  // TODO: Implementasi Graph API untuk mencari business account ID berdasarkan username
  /*
  const searchRes = await fetch(`https://graph.facebook.com/v18.0/ig_export?username=${handle}&access_token=${accessToken}`);
  const searchData = await searchRes.json();
  ...
  */

  throw new Error("Instagram Graph API integration pending Business Verification and Access Token setup.");
}

/**
 * YouTube Data API v3 Integration
 */
async function fetchYouTubeMetrics(handle) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YouTube API key not configured on server (YOUTUBE_API_KEY).");
  }

  // Hapus '@' jika ada di handle
  const query = handle.startsWith("@") ? handle.substring(1) : handle;

  // 1. Cari channel berdasarkan handle atau username
  const searchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(
    query
  )}&key=${apiKey}`;

  const res = await fetch(searchUrl);
  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    // Coba fallback dengan parameter `forUsername` jika `forHandle` gagal
    const fallbackUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forUsername=${encodeURIComponent(
      query
    )}&key=${apiKey}`;
    const fallbackRes = await fetch(fallbackUrl);
    const fallbackData = await fallbackRes.json();

    if (!fallbackData.items || fallbackData.items.length === 0) {
      throw new Error(`YouTube channel '@${query}' not found via YouTube Data API.`);
    }
    return parseYouTubeChannelData(fallbackData.items[0], apiKey);
  }

  return parseYouTubeChannelData(data.items[0], apiKey);
}

async function parseYouTubeChannelData(channel, apiKey) {
  const stats = channel.statistics || {};
  const snippet = channel.snippet || {};
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

  const subscriberCount = Number(stats.subscriberCount) || 0;
  const viewCount = Number(stats.viewCount) || 0;
  const videoCount = Number(stats.videoCount) || 0;

  // Hitung rata-rata views dari video terbaru di playlist uploads (ambil 10 video terakhir)
  let avgViewsPerVideo = 15000; // default estimasi aman

  if (uploadsPlaylistId) {
    try {
      const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${apiKey}`;
      const plRes = await fetch(playlistItemsUrl);
      const plData = await plRes.json();

      const videoIds = plData.items?.map((item) => item.snippet?.resourceId?.videoId).filter(Boolean) || [];

      if (videoIds.length > 0) {
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(",")}&key=${apiKey}`;
        const vRes = await fetch(videosUrl);
        const vData = await vRes.json();

        const totalViews = vData.items?.reduce((acc, v) => acc + (Number(v.statistics?.viewCount) || 0), 0) || 0;
        avgViewsPerVideo = Math.round(totalViews / videoIds.length);
      }
    } catch (e) {
      console.warn("Failed to fetch recent video views for average calculation, falling back to estimation.", e);
      if (videoCount > 0) {
        avgViewsPerVideo = Math.round(viewCount / Math.max(videoCount, 1));
      }
    }
  }

  return {
    totalSubscribers: subscriberCount,
    avgViews: avgViewsPerVideo,
    totalVideos: videoCount,
    profileName: snippet.title || "",
    avatarUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
  };
}
