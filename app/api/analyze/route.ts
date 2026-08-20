import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AnalysisData = {
  score: number;
  decision: "GO" | "TEST FIRST" | "PIVOT" | "STOP";
  problem: string;
  customer: string;
  monetization: string;
  differentiation: string;
  risks: string[];
  mvp: string;
  validation_test: string;
  next_steps: string[];
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_RATE_LIMIT_PER_HOUR = 8;

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

function isStringArray(value: unknown, min: number, max: number): value is string[] {
  return Array.isArray(value) && value.length >= min && value.length <= max && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function isAnalysisData(value: unknown): value is AnalysisData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  const validDecision = data.decision === "GO" || data.decision === "TEST FIRST" || data.decision === "PIVOT" || data.decision === "STOP";

  return (
    Number.isInteger(data.score) &&
    typeof data.score === "number" &&
    data.score >= 0 &&
    data.score <= 100 &&
    validDecision &&
    typeof data.problem === "string" && data.problem.trim().length > 0 &&
    typeof data.customer === "string" && data.customer.trim().length > 0 &&
    typeof data.monetization === "string" && data.monetization.trim().length > 0 &&
    typeof data.differentiation === "string" && data.differentiation.trim().length > 0 &&
    isStringArray(data.risks, 1, 5) &&
    typeof data.mvp === "string" && data.mvp.trim().length > 0 &&
    typeof data.validation_test === "string" && data.validation_test.trim().length > 0 &&
    isStringArray(data.next_steps, 2, 5)
  );
}

function formatAnalysis(data: AnalysisData) {
  return `PUNTUACIÓN NEXO: ${data.score}/100\nDECISIÓN: ${data.decision}\n\nPROBLEMA\n${data.problem}\n\nCLIENTE\n${data.customer}\n\nMONETIZACIÓN\n${data.monetization}\n\nDIFERENCIACIÓN\n${data.differentiation}\n\nRIESGOS\n${data.risks.map((x) => `• ${x}`).join("\n")}\n\nMVP\n${data.mvp}\n\nPRUEBA DE VALIDACIÓN\n${data.validation_test}\n\nPRÓXIMOS PASOS\n${data.next_steps.map((x, i) => `${i + 1}. ${x}`).join("\n")}`;
}

function getClientKey(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "unknown";
}

function getRateLimitPerHour() {
  const configured = Number.parseInt(process.env.NEXO_ANALYZER_RATE_LIMIT_PER_HOUR || "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_RATE_LIMIT_PER_HOUR;
}

function consumeRateLimit(key: string) {
  const now = Date.now();
  const maxRequests = getRateLimitPerHour();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: maxRequests - 1, resetAt: entry.resetAt };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt };
}

export async function POST(req: Request) {
  try {
    const rateLimit = consumeRateLimit(getClientKey(req));
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Has alcanzado el límite temporal de análisis. Inténtalo de nuevo más tarde." },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfterSeconds.toString(),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

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

    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      return NextResponse.json(
        { error: "La IA devolvió un formato de análisis inválido." },
        { status: 502 },
      );
    }

    if (!isAnalysisData(parsed)) {
      return NextResponse.json(
        { error: "La IA devolvió un análisis incompleto o inconsistente." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { analysis: formatAnalysis(parsed), data: parsed },
      { headers: { "X-RateLimit-Remaining": Math.max(0, rateLimit.remaining).toString() } },
    );
  } catch (error) {
    console.error("NEXO analyzer error", error);
    return NextResponse.json(
      { error: "No se pudo procesar el análisis." },
      { status: 500 },
    );
  }
}
