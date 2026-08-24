import { NextResponse } from "next/server";
import { runSpecialistUrlAudit, type SpecialistAuditKind } from "../../../../lib/studio/url-audit";

const allowed = new Set<SpecialistAuditKind>(["commerce", "brand", "creator"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { kind?: string; url?: string };
    if (!body.kind || !allowed.has(body.kind as SpecialistAuditKind)) {
      return NextResponse.json({ error: "Especialista no válido." }, { status: 400 });
    }
    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json({ error: "Falta una URL pública." }, { status: 400 });
    }
    const result = await runSpecialistUrlAudit(body.kind as SpecialistAuditKind, body.url);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo completar la auditoría.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
