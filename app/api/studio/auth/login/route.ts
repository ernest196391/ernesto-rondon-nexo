import { NextResponse } from "next/server";
import { createStudioSession, STUDIO_SESSION_COOKIE } from "../../../../../lib/studio/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

export async function POST(request: Request) {
  const expected = process.env.NEXO_STUDIO_ACCESS_KEY;
  const secret = process.env.NEXO_STUDIO_SESSION_SECRET;
  if (!expected || !secret) return NextResponse.json({ error: "Studio authentication is not configured." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { accessKey?: string };
  if (!body.accessKey || !equal(body.accessKey, expected)) return NextResponse.json({ error: "Código de acceso incorrecto." }, { status: 401 });
  const token = await createStudioSession(secret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STUDIO_SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 12 * 60 * 60 });
  return response;
}
