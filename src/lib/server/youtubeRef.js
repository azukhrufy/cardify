/**
 * Parser input bebas user menjadi referensi channel YouTube.
 *
 * Dipisah dari route supaya bisa diuji tanpa menyalakan Next.js, dan supaya
 * route API hanya mengekspor `default` (Next.js tidak suka export tambahan di
 * file page).
 *
 * Bentuk yang didukung:
 *   @handle · handle · UC... · youtube.com/@handle · youtube.com/c/nama
 *   youtube.com/user/nama · youtube.com/channel/UC...
 */

export function parseYouTubeRef(raw) {
  const input = String(raw || "").trim();
  if (!input) return null;

  const isUrl =
    /^https?:\/\//i.test(input) ||
    /^(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(input);

  if (isUrl) {
    let url;
    try {
      url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    } catch {
      return null;
    }

    // Host lain (mis. `evil.com/youtube.com/@x`) tidak boleh ikut diproses.
    if (!/(^|\.)(youtube\.com|youtu\.be)$/i.test(url.hostname)) return null;

    const parts = url.pathname.split("/").filter(Boolean);
    if (!parts.length) return null;

    const [first, second] = parts;

    if (first === "channel" && second) return { kind: "id", value: second };
    if ((first === "c" || first === "user") && second) {
      return { kind: "handle", value: second };
    }
    if (first.startsWith("@")) {
      const value = first.slice(1).trim();
      return value ? { kind: "handle", value } : null;
    }

    return null;
  }

  if (input.startsWith("@")) {
    const value = input.slice(1).trim();
    return value ? { kind: "handle", value } : null;
  }

  // Channel ID kanonik: "UC" + 22 karakter.
  if (/^UC[\w-]{22}$/.test(input)) return { kind: "id", value: input };

  if (/^[\w.\-]{2,80}$/.test(input)) return { kind: "handle", value: input };

  return null;
}
