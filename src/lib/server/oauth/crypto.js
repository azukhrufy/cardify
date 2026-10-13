import crypto from "crypto";

/**
 * Kriptografi untuk alur OAuth social connect.
 *
 * Dua hal yang dilindungi di sini:
 * 1. `state` OAuth — ditandatangani HMAC supaya callback palsu (CSRF) ditolak,
 *    dan berisi tujuan redirect + expiry pendek (10 menit).
 * 2. Cookie sesi — berisi access/refresh token milik user, dienkripsi
 *    AES-256-GCM lalu disimpan sebagai cookie httpOnly. Token TIDAK PERNAH
 *    dikirim ke client dalam bentuk terbuka.
 *
 * Kunci untuk keduanya berasal dari `SOCIAL_SESSION_SECRET` (server-only).
 * Selama secret itu belum diisi, OAuth dimatikan dan UI menampilkan pesan
 * konfigurasi — bukan diam-diam memakai data palsu.
 */

export const SESSION_COOKIE = "cardify_social";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 hari
const STATE_TTL_SECONDS = 60 * 10; // 10 menit
const MIN_SECRET_LENGTH = 32;

export function isSessionConfigured() {
  const secret = (process.env.SOCIAL_SESSION_SECRET || "").trim();
  return secret.length >= MIN_SECRET_LENGTH;
}

function getSecret() {
  const secret = (process.env.SOCIAL_SESSION_SECRET || "").trim();
  if (secret.length < MIN_SECRET_LENGTH) {
    const err = new Error(
      `SOCIAL_SESSION_SECRET belum diatur (butuh minimal ${MIN_SECRET_LENGTH} karakter acak).`,
    );
    err.code = "SESSION_SECRET_MISSING";
    err.statusCode = 503;
    throw err;
  }
  return secret;
}

const toBase64Url = (value) => Buffer.from(value).toString("base64url");
const fromBase64Url = (value) => Buffer.from(value, "base64url");

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest();
}

/* ------------------------------------------------------------------ */
/* state OAuth (stateless — payload + tanda tangan)                    */
/* ------------------------------------------------------------------ */

export function signState(payload) {
  const secret = getSecret();
  const body = toBase64Url(
    JSON.stringify({ ...payload, exp: Date.now() + STATE_TTL_SECONDS * 1000 }),
  );
  return `${body}.${toBase64Url(sign(body, secret))}`;
}

/** @returns {object|null} payload kalau tanda tangan & expiry valid, else null. */
export function verifyState(token) {
  const secret = getSecret();
  if (typeof token !== "string" || !token.includes(".")) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body, secret);
  const given = fromBase64Url(signature);
  // Panjang harus sama sebelum timingSafeEqual, kalau tidak Node melempar.
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(body).toString("utf8"));
  } catch {
    return null;
  }

  if (!payload?.exp || payload.exp < Date.now()) return null;
  return payload;
}

/* ------------------------------------------------------------------ */
/* sesi terenkripsi (cookie httpOnly)                                  */
/* ------------------------------------------------------------------ */

function sessionKey() {
  return crypto.createHash("sha256").update(getSecret()).digest();
}

export function encryptSession(session) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", sessionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(session), "utf8")),
    cipher.final(),
  ]);
  return ["v1", toBase64Url(iv), toBase64Url(cipher.getAuthTag()), toBase64Url(ciphertext)].join(
    ".",
  );
}

export function decryptSession(value) {
  if (typeof value !== "string") return null;

  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", sessionKey(), fromBase64Url(parts[1]));
    decipher.setAuthTag(fromBase64Url(parts[2]));
    const plain = Buffer.concat([
      decipher.update(fromBase64Url(parts[3])),
      decipher.final(),
    ]);
    return JSON.parse(plain.toString("utf8"));
  } catch {
    // Tag tidak cocok / payload rusak → anggap tidak ada sesi.
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* cookie helpers (tanpa dependency eksternal)                         */
/* ------------------------------------------------------------------ */

export function serializeCookie(name, value, options = {}) {
  const {
    maxAge,
    httpOnly = true,
    secure = true,
    sameSite = "Lax",
    path = "/",
  } = options;

  const parts = [`${name}=${value}`];
  if (path) parts.push(`Path=${path}`);
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  if (httpOnly) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  if (sameSite) parts.push(`SameSite=${sameSite}`);
  return parts.join("; ");
}

export function parseCookies(req) {
  const header = req?.headers?.cookie || "";
  if (!header) return {};

  return header.split(/;\s*/).reduce((acc, pair) => {
    const index = pair.indexOf("=");
    if (index === -1) return acc;
    const key = pair.slice(0, index).trim();
    const raw = pair.slice(index + 1).trim();
    try {
      acc[key] = decodeURIComponent(raw);
    } catch {
      acc[key] = raw;
    }
    return acc;
  }, {});
}

/** @returns {object} sesi (bisa kosong) — tidak pernah melempar. */
export function readSession(req) {
  if (!isSessionConfigured()) return {};
  return decryptSession(parseCookies(req)[SESSION_COOKIE]) || {};
}

export function writeSession(res, session, { secure = true } = {}) {
  const value = encryptSession(session);
  res.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE, value, {
      maxAge: SESSION_TTL_SECONDS,
      secure,
    }),
  );
}

export function clearSession(res, { secure = true } = {}) {
  res.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE, "", { maxAge: 0, secure }));
}
