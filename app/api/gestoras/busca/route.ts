import { NextResponse } from "next/server";
import { requireGestora } from "../../../../lib/commercial/auth";
import { parseSearchPayload } from "../../../../lib/product-search/validation";
export const runtime = "nodejs";
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]),
  MAX = 8 * 1024 * 1024;
function outputText(p: any) {
  for (const i of p?.output || [])
    for (const c of i?.content || [])
      if (c?.type === "output_text") return c.text as string;
  return "";
}
const resultProperties = {
  title: { type: "string" },
  match: {
    type: "string",
    enum: ["exact", "close", "alternative", "unconfirmed"],
  },
  price: { anyOf: [{ type: "number" }, { type: "null" }] },
  currency: { type: "string" },
  priceLabel: { type: "string" },
  location: { type: "string" },
  phone: { type: "string" },
  url: { type: "string" },
  source: { type: "string" },
  observedAt: { type: "string" },
  availability: { type: "string", enum: ["advertised", "unconfirmed"] },
  note: { type: "string" },
};
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["hypothesis", "summary", "results", "verificationQuestions"],
  properties: {
    hypothesis: {
      type: "object",
      additionalProperties: false,
      required: [
        "name",
        "category",
        "request",
        "visibleAttributes",
        "missingImportant",
        "confidence",
        "distinction",
      ],
      properties: {
        name: { type: "string" },
        category: { type: "string" },
        request: { type: "string" },
        visibleAttributes: { type: "array", items: { type: "string" } },
        missingImportant: { type: "array", items: { type: "string" } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        distinction: { type: "string" },
      },
    },
    summary: { type: "string" },
    verificationQuestions: { type: "array", items: { type: "string" } },
    results: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: Object.keys(resultProperties),
        properties: resultProperties,
      },
    },
  },
};
export async function POST(request: Request) {
  try {
    const actor = await requireGestora();
    if (actor.role === "admin")
      return NextResponse.json(
        { error: "Selecciona una cuenta de gestora para utilizar NEXO Busca." },
        { status: 422 },
      );
    if (!process.env.OPENAI_API_KEY)
      return NextResponse.json(
        {
          error:
            "NEXO Busca todavía no tiene configurada la conexión de investigación.",
        },
        { status: 503 },
      );
    const form = await request.formData(),
      context = String(form.get("context") || "")
        .trim()
        .slice(0, 2000),
      location = String(form.get("location") || "")
        .trim()
        .slice(0, 160),
      file = form.get("image");
    if (
      !(file instanceof File) ||
      !allowed.has(file.type) ||
      file.size <= 0 ||
      file.size > MAX
    )
      return NextResponse.json(
        { error: "Sube una imagen JPG, PNG o WebP de hasta 8 MB." },
        { status: 400 },
      );
    const bytes = Buffer.from(await file.arrayBuffer()),
      dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`,
      requestId = crypto.randomUUID();
    const instructions = `Eres NEXO Busca, asistente de sourcing para gestoras en Cuba. Analiza la imagen y el contexto. Distingue el producto exacto de objetos parecidos (por ejemplo capa para conductor vs funda de moto; organizador sobre fregadero vs platero común). Busca ofertas públicas actuales en Cuba usando web_search, priorizando anuncios directos y tiendas. No inventes teléfonos, precios, enlaces, disponibilidad ni especificaciones. Un anuncio solo significa disponibilidad anunciada y siempre debe verificarse. Devuelve enlaces directos cuando existan. Clasifica exact, close, alternative o unconfirmed. Responde en español y cumple estrictamente el esquema JSON.`;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(
        Number(process.env.NEXO_SEARCH_TIMEOUT_MS || 90000),
      ),
      body: JSON.stringify({
        model:
          process.env.NEXO_SEARCH_MODEL ||
          process.env.OPENAI_MODEL ||
          "gpt-5.6-terra",
        store: false,
        instructions,
        tools: [{ type: "web_search" }],
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Contexto: ${context || "Sin texto adicional"}\nZona: ${location || "No indicada"}`,
              },
              { type: "input_image", image_url: dataUrl },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "nexo_product_search",
            strict: true,
            schema,
          },
        },
      }),
    });
    if (!response.ok) {
      console.error(
        "NEXO_SEARCH_PROVIDER",
        response.status,
        (await response.text()).slice(0, 500),
      );
      return NextResponse.json(
        {
          error:
            "La investigación no pudo completarse ahora. Inténtalo nuevamente.",
        },
        { status: 502 },
      );
    }
    const payload = await response.json();
    let raw: unknown;
    try {
      raw = JSON.parse(outputText(payload));
    } catch {
      raw = null;
    }
    const parsed = parseSearchPayload(
      raw,
      requestId,
      String(payload.model || "openai"),
    );
    if (!parsed)
      return NextResponse.json(
        {
          error:
            "La investigación devolvió un resultado incompleto. Inténtalo otra vez.",
        },
        { status: 502 },
      );
    console.info(
      "NEXO_SEARCH_USAGE",
      JSON.stringify({
        requestId,
        gestoraId: actor.gestoraId,
        model: payload.model,
        inputTokens: payload.usage?.input_tokens,
        outputTokens: payload.usage?.output_tokens,
        resultCount: parsed.results.length,
      }),
    );
    return NextResponse.json(parsed, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const status = Number((error as any)?.status) || 500;
    return NextResponse.json(
      {
        error:
          status === 500
            ? "No pudimos completar la búsqueda."
            : (error as Error).message,
      },
      { status },
    );
  }
}
