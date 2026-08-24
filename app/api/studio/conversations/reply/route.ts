import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = {
  businessName?: string;
  objective?: string;
  allowedPrices?: string;
  allowedHosts?: string;
  handoffKeywords?: string;
  message?: string;
};

type ModelReply = {
  response: string;
  intent: string;
  leadScore: number;
  handoff: boolean;
};

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["response", "intent", "leadScore", "handoff"],
  properties: {
    response: { type: "string" },
    intent: { type: "string" },
    leadScore: { type: "integer", minimum: 0, maximum: 100 },
    handoff: { type: "boolean" },
  },
};

function list(value = "") {
  return value.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
}

function deterministic(body: Required<Pick<RequestBody, "businessName" | "objective" | "message">>): ModelReply {
  const lower = body.message.toLowerCase();
  if (/precio|cuesta|costo|tarifa/.test(lower)) {
    return { response: `Puedo orientarte sobre ${body.businessName}, pero antes necesito confirmar la opción exacta para darte solo información autorizada.`, intent: "precio", leadScore: 55, handoff: false };
  }
  if (/comprar|reservar|contratar|quiero|necesito/.test(lower)) {
    return { response: `Perfecto. Para ayudarte con ${body.objective}, dime qué necesitas exactamente y para cuándo.`, intent: "intención de compra", leadScore: 75, handoff: false };
  }
  return { response: `Gracias por escribir a ${body.businessName}. Cuéntame qué necesitas y te guío con el siguiente paso.`, intent: "consulta", leadScore: 35, handoff: false };
}

async function callOpenAI(prompt: string, apiKey: string): Promise<ModelReply | null> {
  const model = process.env.OPENAI_MODEL || "gpt-5.6";
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        store: false,
        instructions: "Eres el motor de simulación de NEXO Conversations. Responde como asistente comercial útil y breve. No inventes precios, enlaces, disponibilidad, acciones realizadas ni políticas. Si falta información, pregunta. Si el caso requiere humano, marca handoff=true. Devuelve JSON estricto.",
        input: prompt,
        text: { format: { type: "json_schema", name: "nexo_conversation_reply", strict: true, schema: OUTPUT_SCHEMA } },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    for (const item of Array.isArray(payload?.output) ? payload.output : []) {
      for (const part of Array.isArray(item?.content) ? item.content : []) {
        if (part?.type === "output_text" && typeof part.text === "string") {
          try { return JSON.parse(part.text) as ModelReply; } catch { return null; }
        }
      }
    }
    return null;
  } catch { return null; }
}

async function callGemini(prompt: string, apiKey: string): Promise<ModelReply | null> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "Eres el motor de simulación de NEXO Conversations. No inventes precios, enlaces, disponibilidad, acciones realizadas ni políticas. Si falta información, pregunta. Si requiere humano, handoff=true." }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: OUTPUT_SCHEMA },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("").trim();
    if (!text) return null;
    try { return JSON.parse(text) as ModelReply; } catch { return null; }
  } catch { return null; }
}

function extractHosts(text: string) {
  const urls = text.match(/https?:\/\/[^\s)]+/g) || [];
  return urls.map((url) => { try { return new URL(url).hostname.toLowerCase(); } catch { return ""; } }).filter(Boolean);
}

function unauthorizedPrice(text: string, allowed: string[]) {
  const amounts = [...text.matchAll(/(?:\$|USD\s*|EUR\s*|€\s*)(\d+(?:[.,]\d+)?)/gi)].map((m) => m[1].replace(",", "."));
  if (!amounts.length) return false;
  const normalizedAllowed = allowed.map((x) => x.replace(/[^0-9.,]/g, "").replace(",", ".")).filter(Boolean);
  return amounts.some((amount) => !normalizedAllowed.includes(amount));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const businessName = body.businessName?.trim() || "este negocio";
    const objective = body.objective?.trim() || "atender y calificar consultas";
    const message = body.message?.trim() || "";
    if (message.length < 1 || message.length > 3000) return NextResponse.json({ error: "Mensaje no válido." }, { status: 400 });

    const allowedPrices = list(body.allowedPrices);
    const allowedHosts = list(body.allowedHosts).map((x) => x.replace(/^https?:\/\//, "").split("/")[0].toLowerCase());
    const handoffKeywords = list(body.handoffKeywords || "humano,reclamación,queja,devolución,denuncia");
    const explicitHandoff = handoffKeywords.some((keyword) => message.toLowerCase().includes(keyword.toLowerCase()));
    if (explicitHandoff) {
      return NextResponse.json({ ok: true, result: { response: "Voy a pasar esta conversación a una persona del equipo para que pueda ayudarte correctamente.", intent: "handoff", leadScore: 50, handoff: true }, guardrails: { blocked: false, reason: null }, provider: "deterministic" });
    }

    const prompt = `Negocio: ${businessName}\nObjetivo: ${objective}\nPrecios autorizados: ${allowedPrices.join(", ") || "ninguno aportado"}\nHosts autorizados: ${allowedHosts.join(", ") || "ninguno aportado"}\nMensaje del cliente: ${message}\n\nResponde en español, breve, útil y orientado al siguiente paso.`;
    let result: ModelReply | null = null;
    let provider = "deterministic";
    if (process.env.GEMINI_API_KEY) { result = await callGemini(prompt, process.env.GEMINI_API_KEY); if (result) provider = "gemini"; }
    if (!result && process.env.OPENAI_API_KEY) { result = await callOpenAI(prompt, process.env.OPENAI_API_KEY); if (result) provider = "openai"; }
    if (!result) result = deterministic({ businessName, objective, message });

    const hosts = extractHosts(result.response);
    const badHost = hosts.find((host) => !allowedHosts.includes(host));
    const badPrice = unauthorizedPrice(result.response, allowedPrices);
    if (badHost || badPrice) {
      return NextResponse.json({
        ok: true,
        result: { response: "Necesito confirmar ese dato antes de responder para no darte información incorrecta. ¿Quieres que lo revise o prefieres hablar con una persona?", intent: result.intent, leadScore: result.leadScore, handoff: false },
        guardrails: { blocked: true, reason: badHost ? `enlace no autorizado: ${badHost}` : "importe no autorizado" },
        provider,
      });
    }

    return NextResponse.json({ ok: true, result, guardrails: { blocked: false, reason: null }, provider });
  } catch {
    return NextResponse.json({ error: "No se pudo simular la conversación." }, { status: 500 });
  }
}
