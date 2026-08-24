import { NextResponse } from "next/server";
import { getMessagingProvider } from "../../../../../lib/studio/messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const provider = getMessagingProvider();
  return NextResponse.json({ provider: provider.id, configured: provider.isConfigured(), transport: "official-api", sendRequiresApproval: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { to?: string; text?: string; approved?: boolean };
    if (body.approved !== true) return NextResponse.json({ error: "Human approval is required before sending." }, { status: 409 });
    if (!body.to || !body.text) return NextResponse.json({ error: "Missing recipient or text." }, { status: 400 });
    const provider = getMessagingProvider();
    if (!provider.isConfigured()) return NextResponse.json({ error: "WhatsApp Business Platform credentials are not configured." }, { status: 503 });
    const receipt = await provider.sendText({ to: body.to, text: body.text });
    return NextResponse.json({ ok: true, receipt });
  } catch (error) {
    console.error("messaging.send failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The message could not be sent." }, { status: 502 });
  }
}
