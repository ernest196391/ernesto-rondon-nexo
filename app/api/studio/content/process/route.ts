import { NextResponse } from "next/server";

export const runtime = "nodejs";
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"]);

export async function POST(request: Request) {
  const workerUrl = process.env.CONTENT_WORKER_URL; const workerSecret = process.env.CONTENT_WORKER_SECRET;
  if (!workerUrl || !workerSecret) return NextResponse.json({ error: "Content Studio todavía no tiene worker seguro configurado." }, { status: 503 });
  const incoming = await request.formData(); const file = incoming.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo de vídeo." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Formato no admitido. Usa MP4, MOV, M4V o WebM." }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "El vídeo debe pesar menos de 25 MB." }, { status: 400 });
  const outgoing = new FormData(); outgoing.append("file", file, file.name);
  try {
    const response = await fetch(`${workerUrl.replace(/\/$/, "")}/process`, { method: "POST", body: outgoing, headers: { "x-nexo-worker-key": workerSecret }, signal: AbortSignal.timeout(190_000) });
    if (!response.ok) { const detail = await response.text(); return NextResponse.json({ error: "El worker no pudo procesar el vídeo.", detail: detail.slice(0, 1200) }, { status: 502 }); }
    return new Response(await response.arrayBuffer(), { status: 200, headers: { "content-type": "video/mp4", "content-disposition": 'attachment; filename="nexo-vertical.mp4"', "cache-control": "no-store" } });
  } catch { return NextResponse.json({ error: "No se pudo conectar con el worker." }, { status: 502 }); }
}
