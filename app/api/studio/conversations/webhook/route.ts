import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && expected && token === expected && challenge) return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  // Transport endpoint only. Persisting/acting on incoming messages will be added
  // after Meta credentials and webhook signing are configured. Never log the body:
  // it can contain customer PII.
  try { await request.json(); } catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); }
  return NextResponse.json({ received: true }, { status: 200 });
}
