// "Llegó mercancía" desde la caja (las dependientas reciben la mercancía).
// La caja se identifica con su clave (x-nexo-device-token), como al sincronizar.
//   POST {action:"check"}                → { curru: bool }  (¿se puede leer la factura con Curru?)
//   POST {action:"read", image}          → lo que Curru lee de la factura, con el producto sugerido
//   POST {action:"save", receipt}        → guarda la entrada (stock + costo), firma la dependienta de "Atiende"
// Curru: la de la tienda (Core), la clave de la IA nunca sale de WordPress.
// Deploy: npx.cmd supabase functions deploy nexo-device-receive --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-nexo-device-token",
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

async function core(method: "GET" | "POST", path: string, body?: unknown) {
  const res = await fetch(`${(Deno.env.get("WOO_URL") ?? "").replace(/\/$/, "")}/wp-json/casa-viva/v1/${path}?_=${Date.now()}`, {
    method, headers: { "x-nexo-panel-key": Deno.env.get("CASAVIVA_PANEL_KEY") ?? "", "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`core ${path} ${res.status}`);
  return data;
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "method" });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const token = req.headers.get("x-nexo-device-token") ?? "";
  const { data: who } = await admin.rpc("nexo_business_device_identity", { p_token: token });
  if (!who || who.error) return json(401, { error: "unauthorized" });
  const business = who.businessId as string;
  const body = await req.json().catch(() => ({})) as { action?: string; image?: string; receipt?: Record<string, unknown> };

  if (body.action === "check") {
    const s = await core("GET", "panel/curru/status").catch(() => ({ enabled: false }));
    return json(200, { curru: s.enabled === true });
  }

  if (body.action === "read") {
    const image = body.image ?? "";
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 1_500_000) return json(400, { error: "invalid_image" });
    let read: { supplier?: string | null; lines?: Array<{ name: string; quantity: number; unitCost: number | null; currency?: string }>; total?: number | null };
    try { read = await core("POST", "panel/curru/invoice", { system: SYSTEM, image }); }
    catch { return json(502, { error: "ai_error" }); }
    const lines = (read.lines ?? []).filter(l => l && typeof l.name === "string").slice(0, 40);
    const { data: matches } = await admin.rpc("nexo_business_match_names", { p_business: business, p_names: lines.map(l => l.name) });
    const byName = new Map(((matches ?? []) as Array<{ name: string; productId: string; score: number }>).map(m => [m.name, m]));
    return json(200, {
      supplier: read.supplier ?? null, total: read.total ?? null,
      lines: lines.map(l => {
        const m = byName.get(l.name);
        return { name: l.name, quantity: Number(l.quantity) || 1, unitCost: l.unitCost ?? null,
          currency: ["USD", "CUP", "MLC"].includes(String(l.currency).toUpperCase()) ? String(l.currency).toUpperCase() : "USD",
          productId: m && Number(m.score) >= 0.6 ? m.productId : null };
      }),
    });
  }

  if (body.action === "save") {
    const { data, error } = await admin.rpc("nexo_business_device_receive_goods", { p_token: token, p_receipt: body.receipt ?? {} });
    if (error) return json(500, { error: error.message });
    return json(data?.error ? 400 : 200, data);
  }

  return json(400, { error: "unknown_action" });
});
