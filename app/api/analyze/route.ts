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

type RateLimitEntry = { count: number; resetAt: number };
type UsageRecord = { provider: "gemini" | "openai"; model: string; inputTokens?: number; outputTokens?: number; totalTokens?: number };

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_RATE_LIMIT_PER_HOUR = 8;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const SYSTEM_INSTRUCTIONS = "Eres NEXO Business Analyzer. Evalúa ideas de negocio con criterio empresarial. No inventes evidencia, demanda, precios ni regulación. Separa lo que puede inferirse de lo que debe validarse. La puntuación mide la calidad de la oportunidad con la información disponible, no garantiza éxito. Responde en español.";

const schema = {
  type: "object", additionalProperties: false,
  required: ["score", "decision", "problem", "customer", "monetization", "differentiation", "risks", "mvp", "validation_test", "next_steps"],
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    decision: { type: "string", enum: ["GO", "TEST FIRST", "PIVOT", "STOP"] },
    problem: { type: "string" }, customer: { type: "string" }, monetization: { type: "string" }, differentiation: { type: "string" },
    risks: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    mvp: { type: "string" }, validation_test: { type: "string" },
    next_steps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
  },
};

function extractOpenAIOutputText(payload: any): string | null {
  if (!Array.isArray(payload?.output)) return null;
  for (const item of payload.output) for (const content of Array.isArray(item?.content) ? item.content : []) if (content?.type === "output_text" && typeof content?.text === "string") return content.text;
  return null;
}
function extractGeminiOutputText(payload: any): string | null {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts.map((part: any) => typeof part?.text === "string" ? part.text : "").join("").trim();
  return text || null;
}
function isStringArray(value: unknown, min: number, max: number): value is string[] { return Array.isArray(value) && value.length >= min && value.length <= max && value.every((item) => typeof item === "string" && item.trim().length > 0); }
function isAnalysisData(value: unknown): value is AnalysisData {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  return Number.isInteger(d.score) && typeof d.score === "number" && d.score >= 0 && d.score <= 100 && (d.decision === "GO" || d.decision === "TEST FIRST" || d.decision === "PIVOT" || d.decision === "STOP") && typeof d.problem === "string" && d.problem.trim().length > 0 && typeof d.customer === "string" && d.customer.trim().length > 0 && typeof d.monetization === "string" && d.monetization.trim().length > 0 && typeof d.differentiation === "string" && d.differentiation.trim().length > 0 && isStringArray(d.risks, 1, 5) && typeof d.mvp === "string" && d.mvp.trim().length > 0 && typeof d.validation_test === "string" && d.validation_test.trim().length > 0 && isStringArray(d.next_steps, 2, 5);
}
function parseAnalysis(text: string): AnalysisData | null { try { const parsed: unknown = JSON.parse(text); return isAnalysisData(parsed) ? parsed : null; } catch { return null; } }
function formatAnalysis(d: AnalysisData) { return `PUNTUACIÓN NEXO: ${d.score}/100\nDECISIÓN: ${d.decision}\n\nPROBLEMA\n${d.problem}\n\nCLIENTE\n${d.customer}\n\nMONETIZACIÓN\n${d.monetization}\n\nDIFERENCIACIÓN\n${d.differentiation}\n\nRIESGOS\n${d.risks.map((x) => `• ${x}`).join("\n")}\n\nMVP\n${d.mvp}\n\nPRUEBA DE VALIDACIÓN\n${d.validation_test}\n\nPRÓXIMOS PASOS\n${d.next_steps.map((x, i) => `${i + 1}. ${x}`).join("\n")}`; }
function logUsage(record: UsageRecord) { console.info("NEXO_AI_USAGE", JSON.stringify(record)); }

async function callGemini(idea: string, apiKey: string): Promise<AnalysisData | null> {
  // Use a stable, documented Flash-Lite model by default. Render can override this with GEMINI_MODEL.
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST", signal: controller.signal,
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
        contents: [{ role: "user", parts: [{ text: `Analiza esta idea de negocio:\n\n${idea}` }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema },
      }),
    });
    if (!response.ok) { const errorBody = await response.text(); console.warn("Gemini API error", response.status, errorBody.slice(0, 500)); return null; }
    const payload = await response.json(); const usage = payload?.usageMetadata;
    logUsage({ provider: "gemini", model, inputTokens: usage?.promptTokenCount, outputTokens: usage?.candidatesTokenCount, totalTokens: usage?.totalTokenCount });
    const outputText = extractGeminiOutputText(payload); return outputText ? parseAnalysis(outputText) : null;
  } catch (error) { if (error instanceof Error && error.name === "AbortError") console.warn("Gemini API timeout"); else console.warn("Gemini API request failed", error); return null; } finally { clearTimeout(timeout); }
}

async function callOpenAI(idea: string, apiKey: string): Promise<AnalysisData | null> {
  const model = process.env.OPENAI_MODEL || "gpt-5.6"; const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, store: false, instructions: SYSTEM_INSTRUCTIONS, input: `Analiza esta idea de negocio:\n\n${idea}`, text: { format: { type: "json_schema", name: "nexo_business_analysis", strict: true, schema } } }) });
    if (!response.ok) { const errorBody = await response.text(); console.error("OpenAI API error", response.status, errorBody.slice(0, 500)); return null; }
    const payload = await response.json(); const usage = payload?.usage; logUsage({ provider: "openai", model: payload?.model || model, inputTokens: usage?.input_tokens, outputTokens: usage?.output_tokens, totalTokens: usage?.total_tokens });
    const outputText = extractOpenAIOutputText(payload); return outputText ? parseAnalysis(outputText) : null;
  } catch (error) { if (error instanceof Error && error.name === "AbortError") console.warn("OpenAI API timeout"); else console.error("OpenAI API request failed", error); return null; } finally { clearTimeout(timeout); }
}

function getClientKey(req: Request) { return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown"; }
function getRateLimitPerHour() { const configured = Number.parseInt(process.env.NEXO_ANALYZER_RATE_LIMIT_PER_HOUR || "", 10); return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_RATE_LIMIT_PER_HOUR; }
function consumeRateLimit(key: string) {
  const now = Date.now(), maxRequests = getRateLimitPerHour(), existing = rateLimitStore.get(key);
  if (!existing || existing.resetAt <= now) { const entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }; rateLimitStore.set(key, entry); return { allowed: true, remaining: maxRequests - 1, resetAt: entry.resetAt }; }
  if (existing.count >= maxRequests) return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  existing.count += 1; return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt };
}

export async function POST(req: Request) {
  try {
    let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: "La solicitud no contiene un JSON válido." }, { status: 400, headers: NO_STORE_HEADERS }); }
    const idea = typeof (body as { idea?: unknown })?.idea === "string" ? (body as { idea: string }).idea.trim() : "";
    if (idea.length < 10) return NextResponse.json({ error: "Describe la idea con un poco más de detalle." }, { status: 400, headers: NO_STORE_HEADERS });
    if (idea.length > 5000) return NextResponse.json({ error: "La idea es demasiado larga para este análisis inicial." }, { status: 400, headers: NO_STORE_HEADERS });
    const rateLimit = consumeRateLimit(getClientKey(req));
    if (!rateLimit.allowed) { const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000)); return NextResponse.json({ error: "Has alcanzado el límite temporal de análisis. Inténtalo de nuevo más tarde." }, { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": retryAfterSeconds.toString(), "X-RateLimit-Remaining": "0" } }); }
    const geminiApiKey = process.env.GEMINI_API_KEY, openaiApiKey = process.env.OPENAI_API_KEY;
    if (!geminiApiKey && !openaiApiKey) return NextResponse.json({ error: "El analizador con IA todavía no tiene configurado un proveedor." }, { status: 503, headers: NO_STORE_HEADERS });
    let analysis: AnalysisData | null = null;
    if (geminiApiKey) analysis = await callGemini(idea, geminiApiKey);
    if (!analysis && openaiApiKey) { console.info("NEXO_AI_ROUTER fallback=gemini_to_openai"); analysis = await callOpenAI(idea, openaiApiKey); }
    if (!analysis) return NextResponse.json({ error: "La IA no pudo completar el análisis. Inténtalo de nuevo." }, { status: 502, headers: NO_STORE_HEADERS });
    return NextResponse.json({ analysis: formatAnalysis(analysis), data: analysis }, { headers: { ...NO_STORE_HEADERS, "X-RateLimit-Remaining": Math.max(0, rateLimit.remaining).toString() } });
  } catch (error) { console.error("NEXO analyzer error", error); return NextResponse.json({ error: "No se pudo procesar el análisis." }, { status: 500, headers: NO_STORE_HEADERS }); }
}
