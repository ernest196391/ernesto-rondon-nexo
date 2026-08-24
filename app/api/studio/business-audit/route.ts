import { NextResponse } from "next/server";
import { runBusinessAudit } from "../../../../lib/studio/business-audit";
import { runBusinessPublicAudit } from "../../../../lib/studio/business-public";
import { buildBusinessReportHtml } from "../../../../lib/studio/business-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { answers?: string; url?: string };
    if (!body.answers?.trim()) return NextResponse.json({ error: "Pega las respuestas del formulario para analizar la parte interna." }, { status: 400 });
    const inside = runBusinessAudit(body.answers);
    if (inside.privacyBlocked) return NextResponse.json({ ok: false, result: inside }, { status: 422 });

    let outside = null;
    let outsideError: string | null = null;
    if (body.url?.trim()) {
      try {
        outside = await runBusinessPublicAudit(body.url.trim(), inside);
      } catch (error) {
        outsideError = error instanceof Error ? error.message : "No se pudo analizar la presencia pública.";
      }
    }
    const result = {
      inside,
      outside,
      outsideError,
      reportHtml: buildBusinessReportHtml(inside, outside),
    };
    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json({ error: "No se pudo analizar el formulario." }, { status: 400 });
  }
}
