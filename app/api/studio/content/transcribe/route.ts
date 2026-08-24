import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-m4v", "audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/x-m4a"]);

type Word = { word: string; start: number; end: number };
type Cut = { start: number; end: number; reason: string };

function buildCutPlan(words: Word[]): Cut[] {
  if (!words.length) return [];
  const cuts: Cut[] = [];
  let segmentStart = Math.max(0, words[0].start);
  for (let i = 1; i < words.length; i += 1) {
    const gap = words[i].start - words[i - 1].end;
    if (gap >= 0.9) {
      cuts.push({ start: segmentStart, end: words[i - 1].end, reason: `Pausa de ${gap.toFixed(1)} s` });
      segmentStart = words[i].start;
    }
  }
  cuts.push({ start: segmentStart, end: words[words.length - 1].end, reason: "Fin de intervención" });
  return cuts.filter((cut) => cut.end - cut.start >= 0.35);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY no está configurada." }, { status: 503 });

  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo de vídeo o audio." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Formato no admitido para transcripción." }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "El archivo debe pesar menos de 25 MB." }, { status: 400 });

  const body = new FormData();
  body.append("file", file, file.name || "entrada.mp4");
  body.append("model", "whisper-1");
  body.append("response_format", "verbose_json");
  body.append("timestamp_granularities[]", "word");
  body.append("temperature", "0");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body,
      signal: AbortSignal.timeout(120_000),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      text?: string;
      language?: string;
      duration?: number;
      words?: Array<{ word?: string; start?: number; end?: number }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      return NextResponse.json({ error: "No se pudo transcribir el archivo.", detail: payload.error?.message?.slice(0, 400) }, { status: 502 });
    }
    const words: Word[] = (payload.words ?? [])
      .filter((word) => typeof word.word === "string" && typeof word.start === "number" && typeof word.end === "number")
      .map((word) => ({ word: word.word!.trim(), start: word.start!, end: word.end! }));

    return NextResponse.json({
      ok: true,
      provider: "openai",
      model: "whisper-1",
      language: payload.language ?? null,
      durationSeconds: payload.duration ?? (words.length ? words[words.length - 1].end : null),
      text: payload.text ?? words.map((word) => word.word).join(" "),
      words,
      cutPlan: buildCutPlan(words),
      truthPolicy: "La transcripción y los timestamps proceden del proveedor STT; el plan de cortes solo usa pausas detectadas y no inventa contenido semántico.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo conectar con el proveedor de transcripción.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
