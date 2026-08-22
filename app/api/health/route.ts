import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY);

  return NextResponse.json(
    {
      ok: true,
      service: "nexo-web",
      analyzerConfigured: geminiConfigured || openaiConfigured,
      analyzerProviders: {
        gemini: geminiConfigured,
        openai: openaiConfigured,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
