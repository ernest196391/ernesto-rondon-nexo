const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createStudioSession(secret: string, ttlSeconds = 12 * 60 * 60) {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `studio.${expires}`;
  return `${payload}.${await sign(payload, secret)}`;
}

export async function verifyStudioSession(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "studio") return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires <= Math.floor(Date.now() / 1000)) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = await sign(payload, secret);
  if (expected.length !== parts[2].length) return false;
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) diff |= expected.charCodeAt(index) ^ parts[2].charCodeAt(index);
  return diff === 0;
}

export const STUDIO_SESSION_COOKIE = "nexo_studio_session";
