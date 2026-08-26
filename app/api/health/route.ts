import { NextResponse } from "next/server";
import { wordpressConfigured } from "../../../lib/commerce/wordpress";
import { wooConfigured } from "../../../lib/commerce/woocommerce";

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
      commerce: {
        database: Boolean(process.env.DATABASE_URL),
        woocommerce: wooConfigured(),
        wordpressMedia: wordpressConfigured(),
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
