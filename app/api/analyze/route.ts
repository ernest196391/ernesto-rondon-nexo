import { NextResponse } from "next/server";

export const runtime = "nodejs";

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "score",
    "decision",
    "problem",
    "customer",
    "monetization",
    "differentiation",
    "risks",
    "mvp",
    "validation_test",
    "next_steps",
  ],
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    decision: { type: "string", enum: ["GO", "TEST FIRST", "PIVOT", "STOP"] },
    problem: { type: "string" },
    customer: { type: "string" },
    monetization: { type: "string" },
    differentiation: { type: "string" },
    risks: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    mvp: { type: "string" },
    validation_test: { type: "string" },
    next_steps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
  },
};

function extractOutputText(payload: any): string | null {
  if (!Array.isArray(payload?.output)) return null;
  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) continue;
    for (const content of item.content) {
      if (content?.type === "output_text" && typeof content?.text === "string") {
        return content.text;
      }
    }
  }
  return null;
}

function formatAnalysis(data: any) {
  return `PUNTUACIÓN NEXO: ${data.score}/100\nDECISIÓN: ${data.decision}\n\nPROBLEMA\n${data.problem}\n\nCLIENTE\n${data.customer}\n\nMONETIZACIÓN\n${data.monetization}\n\nDIFERENCIACIÓN\n${data.differentiation}\n\nRIESGOS\n${data.risks.map((x: string) => `• ${x}`).join("\n")}\n\nMVP\n${data.mvp}\n\nPRUEBA DE VALIDACIÓN\n${data.validation_test}\n\nPRÓXIMOS PASOS\n${data.next_steps.map((x: string, i: number) => `${i + 1}. ${x}`).join("\n")}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idea = typeof body?.idea === "string" ? body.idea.trim() : "";

    if (idea.length < 10) {
      return NextResponse.json(
        { error: "Describe la idea con un poco más de detalle." },
        { status: 400 },
      );
    }

    if (idea.length > 5000) {
      return NextResponse.json(
        { error: "La idea es demasiado larga para este análisis inicial." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "El analizador con IA todavía no tiene configurada su clave del servidor." },
        { status: 503 },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-5.6",
          store: false,
          instructions:
            "Eres NEXO Business Analyzer. Evalúa ideas de negocio con criterio empresarial. No inventes evidencia, demanda, precios ni regulación. Separa lo que puede inferirse de lo que debe validarse. La puntuación mide la calidad de la oportunidad con la información disponible, no garantiza éxito. Responde en español.",
          input: `Analiza esta idea de negocio:\n\n${idea}`,
          text: {
            format: {
              type: "json_schema",
              name: "nexo_business_analysis",
              strict: true,
              schema,
            },
          },
        }),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { error: "El análisis tardó demasiado. Inténtalo de nuevo en unos segundos." },
          { status: 504 },
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI API error", response.status, errorBody.slice(0, 500));
      return NextResponse.json(
        { error: "La IA no pudo completar el análisis. Inténtalo de nuevo." },
        { status: 502 },
      );
    }

    const payload = await response.json();
    const outputText = extractOutputText(payload);
    if (!outputText) {
      return NextResponse.json(
        { error: "La IA respondió sin un análisis utilizable." },
        { status: 502 },
      );
    }

    const data = JSON.parse(outputText);
    return NextResponse.json({ analysis: formatAnalysis(data), data });
  } catch (error) {
    console.error("NEXO analyzer error", error);
    return NextResponse.json(
      { error: "No se pudo procesar el análisis." },
      { status: 500 },
    );
  }
}
