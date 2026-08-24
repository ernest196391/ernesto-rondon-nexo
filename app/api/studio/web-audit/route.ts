import { NextResponse } from "next/server";
import { auditWebsite } from "../../../../lib/web-studio/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url) return NextResponse.json({ error: "Indica una URL." }, { status: 400 });

    const result = await auditWebsite(url);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo auditar la web.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
