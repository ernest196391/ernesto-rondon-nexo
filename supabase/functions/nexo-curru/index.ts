// Curru, Casa Viva's assistant, in Casa Viva Core. Same engine as the website's
// Curru (OpenAI chat completions, gpt-4.1-mini by default; see the Casa-Viva repo
// class-cvd-curru-ai.php). First skill: read a supplier invoice photo and
// propose the lines of a goods receipt. The person always reviews before
// confirming; nothing is written here.
//
// POST {business, image: "data:image/jpeg;base64,..."} with the user's session.
// Secrets: OPENAI_API_KEY (required), CURRU_MODEL, CURRU_BASE_URL (optional).
// Deploy: npx.cmd supabase functions deploy nexo-curru --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, apikey",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

const SYSTEM = "Eres Curru, la asistente de Casa Viva (tienda de artículos para el hogar en La Habana). "
  + "Lees facturas o notas de entrega de proveedores, a veces escritas a mano. Extrae SOLO lo que se lee en la imagen; "
  + "si algo no se lee, déjalo en null. No inventes productos ni precios. "
  + "Moneda: USD, CUP o MLC según la factura (si no se indica y los precios son de miles, es CUP). "
  + 'Responde SOLO con JSON: {"supplier": "nombre o null", "date": "AAAA-MM-DD o null", '
  + '"lines": [{"name": "producto como aparece", "quantity": número, "unitCost": número o null, "currency": "USD|CUP|MLC"}], '
  + '"total": número o null, "notes": "dudas breves o null"}';

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "method" });
  const key = Deno.env.get("OPENAI_API_KEY") ?? "";
  if (!key) return json(503, { error: "ai_not_configured" });

  const body = await req.json().catch(() => ({})) as { business?: string; image?: string };
  const business = body.business ?? "casa-viva";
  const image = body.image ?? "";
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 1_500_000) return json(400, { error: "invalid_image" });

  // Only people who may receive goods can use it (checked with their own session).
  const jwt = req.headers.get("authorization") ?? "";
  const asUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { authorization: jwt } }, auth: { persistSession: false },
  });
  const { data: allowed } = await asUser.rpc("nexo_business_receipts", { p_business: business, p_limit: 1 });
  if (!Array.isArray(allowed)) return json(401, { error: "unauthorized" });

  const base = (Deno.env.get("CURRU_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const r = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("CURRU_MODEL") ?? "gpt-4.1-mini",
      temperature: 0,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: [{ type: "text", text: "Lee esta factura de mercancía." }, { type: "image_url", image_url: { url: image } }] },
      ],
    }),
  });
  if (!r.ok) {
    console.error("curru openai", r.status);
    return json(502, { error: "ai_error", status: r.status });
  }
  const out = await r.json();
  let read: { supplier?: string | null; date?: string | null; lines?: Array<{ name: string; quantity: number; unitCost: number | null; currency?: string }>; total?: number | null; notes?: string | null };
  try { read = JSON.parse(out.choices?.[0]?.message?.content ?? "{}"); } catch { return json(502, { error: "ai_unreadable" }); }
  const lines = (read.lines ?? []).filter(l => l && typeof l.name === "string").slice(0, 40);

  // Match each read name to the catalog (same matcher as the Excel import).
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: matches } = await admin.rpc("nexo_business_match_names", { p_business: business, p_names: lines.map(l => l.name) });
  const byName = new Map(((matches ?? []) as Array<{ name: string; productId: string; productName: string; score: number }>).map(m => [m.name, m]));
  return json(200, {
    supplier: read.supplier ?? null, date: read.date ?? null, total: read.total ?? null, notes: read.notes ?? null,
    lines: lines.map(l => {
      const m = byName.get(l.name);
      const sure = m && Number(m.score) >= 0.6;
      return { name: l.name, quantity: Number(l.quantity) || 1, unitCost: l.unitCost ?? null,
        currency: ["USD", "CUP", "MLC"].includes(String(l.currency).toUpperCase()) ? String(l.currency).toUpperCase() : "USD",
        productId: sure ? m!.productId : null, productName: sure ? m!.productName : null, score: m?.score ?? 0 };
    }),
  });
});
