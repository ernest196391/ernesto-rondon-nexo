import { NextResponse } from "next/server";
import { assistantClientKey, consumeAssistantRateLimit } from "../../../../lib/commerce/assistant-rate-limit";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const limited = consumeAssistantRateLimit(`audio:${assistantClientKey(request.headers)}`);
  if (!limited.allowed) return NextResponse.json({ error: "Espera unos minutos antes de volver a grabar." }, { status: 429 });
  try {
    const input = await request.formData(), audio = input.get("audio");
    if (!(audio instanceof File) || !audio.size || audio.size > 10 * 1024 * 1024) return NextResponse.json({ error: "La grabación no es válida o supera 10 MB." }, { status: 400 });
    if (!/^audio\/(webm|ogg|mp4|mpeg|wav|x-m4a)/.test(audio.type)) return NextResponse.json({ error: "El formato de audio no es compatible." }, { status: 415 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "La transcripción está temporalmente sin conexión." }, { status: 503 });
    const body = new FormData(); body.set("file", audio, `consulta.${audio.type.includes("ogg") ? "ogg" : audio.type.includes("mp4") ? "m4a" : "webm"}`); body.set("model", process.env.NEXO_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe"); body.set("language", "es");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body, signal: AbortSignal.timeout(45_000) });
    if (!response.ok) throw new Error("No pudimos transcribir el audio.");
    const data = await response.json(); return NextResponse.json({ text: String(data.text || "").trim() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos transcribir el audio." }, { status: 503 }); }
}
