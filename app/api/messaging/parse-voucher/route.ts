import { NextResponse } from "next/server";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const voucherSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "orderCode", "store", "manager", "managerCode", "products", "productTotals",
    "deliveryCharge", "customer", "phones", "address", "betweenStreets", "reference", "zone", "notes",
    "scheduledDate", "scheduledTime",
    "changeRequired", "sourceUrl", "missing", "warnings", "confidence"
  ],
  properties: {
    orderCode: { type: ["string", "null"] },
    store: { type: ["string", "null"] },
    manager: { type: ["string", "null"] },
    managerCode: { type: ["string", "null"] },
    products: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "quantity", "unitPrice", "currency"],
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          unitPrice: { type: ["number", "null"] },
          currency: { type: ["string", "null"] }
        }
      }
    },
    productTotals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["amount", "currency"],
        properties: {
          amount: { type: "number" },
          currency: { type: "string" }
        }
      }
    },
    deliveryCharge: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["amount", "currency", "payer", "commissionAdjustment"],
      properties: {
        amount: { type: "number" },
        currency: { type: "string" },
        payer: { type: ["string", "null"] },
        commissionAdjustment: { type: ["number", "null"] }
      }
    },
    customer: { type: ["string", "null"] },
    phones: { type: "array", items: { type: "string" } },
    address: { type: ["string", "null"] },
    betweenStreets: { type: ["string", "null"] },
    reference: { type: ["string", "null"] },
    zone: { type: ["string", "null"] },
    notes: { type: "array", items: { type: "string" } },
    scheduledDate: { type: ["string", "null"] },
    scheduledTime: { type: ["string", "null"] },
    changeRequired: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["amount", "currency"],
        properties: {
          amount: { type: "number" },
          currency: { type: "string" }
        }
      }
    },
    sourceUrl: { type: ["string", "null"] },
    missing: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  }
};

type Voucher = {
  orderCode: string | null;
  store: string | null;
  manager: string | null;
  managerCode: string | null;
  products: Array<{ name: string; quantity: number; unitPrice: number | null; currency: string | null }>;
  productTotals: Array<{ amount: number; currency: string }>;
  deliveryCharge: { amount: number; currency: string; payer: string | null; commissionAdjustment: number | null } | null;
  customer: string | null;
  phones: string[];
  address: string | null;
  betweenStreets: string | null;
  reference: string | null;
  zone: string | null;
  notes: string[];
  scheduledDate: string | null;
  scheduledTime: string | null;
  changeRequired: Array<{ amount: number; currency: string }>;
  sourceUrl: string | null;
  missing: string[];
  warnings: string[];
  confidence: number;
};

function parseJson(text: string): Voucher | null {
  try {
    const value = JSON.parse(text) as Voucher;
    if (!value || typeof value !== "object" || !Array.isArray(value.products) || !Array.isArray(value.missing) || typeof value.confidence !== "number") return null;
    return value;
  } catch {
    return null;
  }
}

function geminiText(payload: any): string | null {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts.map((p: any) => typeof p?.text === "string" ? p.text : "").join("").trim();
  return text || null;
}

function openAIText(payload: any): string | null {
  if (!Array.isArray(payload?.output)) return null;
  for (const item of payload.output) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return null;
}

const instructions = `Eres NEXO Voucher Parser para Casa Viva. Convierte un vale operativo de WhatsApp en JSON estructurado sin inventar datos.
Reglas:
- Conserva importes y monedas exactamente como aparecen. No conviertas monedas.
- No calcules tarifas oficiales ni reemplaces la mensajería escrita en el vale.
- Distingue precio/producto de mensajería y de vuelto.
- "Llevar 20 USD de vuelto" significa changeRequired=[{amount:20,currency:"USD"}], no un cobro.
- Si una mensajería se descuenta de comisión, conserva el cobro al cliente y registra el ajuste en commissionAdjustment cuando el vale lo indique.
- Para direcciones cubanas conserva entrecalles, reparto, municipio y referencias textuales; no inventes coordenadas.
- Separa las entrecalles en betweenStreets y los puntos de referencia en reference cuando estén explícitos.
- Conserva la fecha solicitada en scheduledDate y el horario o ventana de entrega en scheduledTime. No infieras fechas absolutas cuando el vale solo diga "mañana".
- Si hay varios teléfonos, conserva todos.
- Si un dato necesario no aparece, usa null/[] y añádelo a missing.
- Añade warnings solo cuando exista ambigüedad real, contradicción o dato operativo que requiera confirmación.
- confidence es una estimación de la calidad de extracción, no de la veracidad del vale.
- Este endpoint solo interpreta. No crea pedidos ni cambia estados.`;

async function callGemini(rawVoucher: string, apiKey: string): Promise<Voucher | null> {
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions }] },
      contents: [{ role: "user", parts: [{ text: rawVoucher }] }],
      generationConfig: { responseMimeType: "application/json", responseJsonSchema: voucherSchema }
    })
  });
  if (!response.ok) {
    console.warn("NEXO_VOUCHER_GEMINI_ERROR", response.status, (await response.text()).slice(0, 500));
    return null;
  }
  const payload = await response.json();
  const usage = payload?.usageMetadata;
  console.info("NEXO_AI_USAGE", JSON.stringify({ provider: "gemini", purpose: "parse-voucher", model, inputTokens: usage?.promptTokenCount, outputTokens: usage?.candidatesTokenCount, totalTokens: usage?.totalTokenCount }));
  const text = geminiText(payload);
  return text ? parseJson(text) : null;
}

async function callOpenAI(rawVoucher: string, apiKey: string): Promise<Voucher | null> {
  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      instructions,
      input: rawVoucher,
      text: { format: { type: "json_schema", name: "casa_viva_voucher", strict: true, schema: voucherSchema } }
    })
  });
  if (!response.ok) {
    console.error("NEXO_VOUCHER_OPENAI_ERROR", response.status, (await response.text()).slice(0, 500));
    return null;
  }
  const payload = await response.json();
  const usage = payload?.usage;
  console.info("NEXO_AI_USAGE", JSON.stringify({ provider: "openai", purpose: "parse-voucher", model: payload?.model || model, inputTokens: usage?.input_tokens, outputTokens: usage?.output_tokens, totalTokens: usage?.total_tokens }));
  const text = openAIText(payload);
  return text ? parseJson(text) : null;
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400, headers: NO_STORE_HEADERS });
    }
    const rawVoucher = typeof (body as { rawVoucher?: unknown })?.rawVoucher === "string" ? (body as { rawVoucher: string }).rawVoucher.trim() : "";
    if (rawVoucher.length < 20) return NextResponse.json({ error: "El vale está vacío o es demasiado corto." }, { status: 400, headers: NO_STORE_HEADERS });
    if (rawVoucher.length > 12000) return NextResponse.json({ error: "El vale supera el tamaño permitido." }, { status: 400, headers: NO_STORE_HEADERS });

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!geminiKey && !openaiKey) return NextResponse.json({ error: "No hay proveedor de IA configurado." }, { status: 503, headers: NO_STORE_HEADERS });

    let draft: Voucher | null = null;
    let provider: "gemini" | "openai" | null = null;
    if (geminiKey) {
      draft = await callGemini(rawVoucher, geminiKey);
      if (draft) provider = "gemini";
    }
    if (!draft && openaiKey) {
      console.info("NEXO_AI_ROUTER fallback=gemini_to_openai purpose=parse-voucher");
      draft = await callOpenAI(rawVoucher, openaiKey);
      if (draft) provider = "openai";
    }
    if (!draft) return NextResponse.json({ error: "No se pudo interpretar el vale." }, { status: 502, headers: NO_STORE_HEADERS });

    return NextResponse.json({
      draft,
      meta: {
        provider,
        requiresHumanConfirmation: true,
        persisted: false,
        createsOrder: false
      }
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("NEXO parse-voucher error", error);
    return NextResponse.json({ error: "No se pudo procesar el vale." }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
