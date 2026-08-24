import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"]);

type Word = { word: string; start: number; end: number };
type Cut = { start: number; end: number; reason?: string };

export async function POST(request: Request) {
  const workerUrl = process.env.CONTENT_WORKER_URL;
  if (!workerUrl) return NextResponse.json({ error: "Content Studio todavía no tiene worker configurado." }, { status: 503 });
  const incoming = await request.formData();
  const file = incoming.get("file");
  const rawWords = incoming.get("words");
  const rawCuts = incoming.get("cuts");
  const approved = incoming.get("approved") === "true";
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo de vídeo." }, { status: 400 });
  if (!ALLOWED.has(file.type) || file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "Archivo de vídeo no válido." }, { status: 400 });
  if (!approved) return NextResponse.json({ error: "Debes aprobar NEXO entendió esto antes de renderizar." }, { status: 400 });
  let words: Word[] = []; let cuts: Cut[] = [];
  try {
    words = JSON.parse(typeof rawWords === "string" ? rawWords : "[]") as Word[];
    cuts = JSON.parse(typeof rawCuts === "string" ? rawCuts : "[]") as Cut[];
  } catch {
    return NextResponse.json({ error: "El plan de edición no es válido." }, { status: 400 });
  }
  if (words.length > 5000 || cuts.length > 60) return NextResponse.json({ error: "El plan excede los límites permitidos." }, { status: 400 });
  const outgoing = new FormData();
  outgoing.append("file", file, file.name);
  outgoing.append("plan", JSON.stringify({ approved: true, words, cuts }));
  try {
    const response = await fetch(`${workerUrl.replace(/\/$/, "")}/render`, { method: "POST", body: outgoing, signal: AbortSignal.timeout(250_000) });
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: "El worker no pudo renderizar el plan aprobado.", detail: detail.slice(0, 1400) }, { status: 502 });
    }
    return new Response(await response.arrayBuffer(), { status: 200, headers: { "content-type": "video/mp4", "content-disposition": 'attachment; filename="nexo-editado.mp4"', "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con el worker de edición." }, { status: 502 });
  }
}
