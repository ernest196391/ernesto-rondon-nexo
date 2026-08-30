import { createHmac, timingSafeEqual } from "node:crypto";

export const GESTORA_SESSION_COOKIE = "nexo_gestora_session";
export const ATTRIBUTION_COOKIE = "nexo_attribution";

type GestoraSession = { userId: string; gestoraId: string; role: "gestora" | "admin"; expires: number };

function secret() { const value = process.env.NEXO_GESTORA_SESSION_SECRET; if (!value) throw new Error("NEXO_GESTORA_SESSION_SECRET is not configured"); return value; }
function signature(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }

export function createGestoraSession(input: Omit<GestoraSession, "expires">, ttlSeconds = 12 * 60 * 60) {
  const payload = Buffer.from(JSON.stringify({ ...input, expires: Math.floor(Date.now() / 1000) + ttlSeconds })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function readGestoraSession(token?: string): GestoraSession | null {
  if (!token) return null;
  const [payload, supplied, ...rest] = token.split(".");
  if (!payload || !supplied || rest.length) return null;
  const expected = signature(payload);
  if (expected.length !== supplied.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return null;
  try { const value = JSON.parse(Buffer.from(payload, "base64url").toString()) as GestoraSession;
    return value.expires > Math.floor(Date.now() / 1000) && ["gestora", "admin"].includes(value.role) ? value : null;
  } catch { return null; }
}
