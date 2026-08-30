import { NextResponse } from "next/server";
import {
  assistantClientKey,
  consumeAssistantRateLimit,
} from "../../../../lib/commerce/assistant-rate-limit";
import { validateAudio } from "../../../../lib/commerce/audio-validation";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const limited = consumeAssistantRateLimit(
    `audio:${assistantClientKey(request.headers)}`,
  );
  if (!limited.allowed)
    return NextResponse.json(
      { error: "Espera unos minutos antes de volver a grabar." },
      { status: 429 },
    );
  try {
    const input = await request.formData(),
      audio = input.get("audio");
    if (!(audio instanceof File))
      return NextResponse.json(
        {
          ok: false,
          message: "No pudimos transcribir el audio. Inténtalo nuevamente.",
        },
        { status: 400 },
      );
    const bytes = new Uint8Array(await audio.arrayBuffer());
    const validation = validateAudio(audio, bytes);
    if (!validation.ok)
      return NextResponse.json(
        { ok: false, message: validation.message },
        { status: validation.status },
      );
    if (!process.env.OPENAI_API_KEY)
      return NextResponse.json(
        {
          ok: false,
          message: "No pudimos transcribir el audio. Inténtalo nuevamente.",
        },
        { status: 503 },
      );
    const body = new FormData();
    body.set(
      "file",
      new Blob([bytes], { type: validation.mime }),
      `audio-${crypto.randomUUID()}.${validation.extension}`,
    );
    body.set(
      "model",
      process.env.NEXO_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe",
    );
    body.set("language", "es");
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body,
        signal: AbortSignal.timeout(45_000),
      },
    );
    if (!response.ok) throw new Error("TRANSCRIPTION_PROVIDER_ERROR");
    const data = await response.json();
    const transcript = String(data.text || "").trim();
    if (!transcript) throw new Error("TRANSCRIPTION_EMPTY");
    return NextResponse.json(
      { ok: true, transcript, text: transcript },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos transcribir el audio. Inténtalo nuevamente.",
      },
      { status: 503 },
    );
  }
}
