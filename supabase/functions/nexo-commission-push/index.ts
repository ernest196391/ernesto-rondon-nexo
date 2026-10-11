// D37: las comisiones se gestionan solo en el panel (tabla nexo_business.product_commissions).
// Esta función las copia a la web (meta _cvd_commission_type/_cvd_commission_value de cada
// producto WooCommerce) para que Casa Viva Core cobre lo mismo que la caja.
//   POST { products?: ["cv-684", ...] }  → solo esos; sin lista, todos los de Casa Viva.
// Autorización: sesión de una dueña (Authorization: Bearer <jwt>) o la clave interna NEXO_IMPORT_KEY.
// Deploy: npx.cmd supabase functions deploy nexo-commission-push --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUSINESS = "casa-viva";
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, apikey, x-nexo-key",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

const base = () => (Deno.env.get("WOO_URL") ?? "").replace(/\/$/, "");
const auth = () => "Basic " + btoa(`${Deno.env.get("WOO_CK") ?? ""}:${Deno.env.get("WOO_CS") ?? ""}`);

async function pushOne(wooId: number, parentWooId: number | null, usd: number) {
  // Las variantes (un color de un producto) viven bajo su producto padre.
  const path = parentWooId ? `products/${parentWooId}/variations/${wooId}` : `products/${wooId}`;
  const res = await fetch(`${base()}/wp-json/wc/v3/${path}`, {
    method: "PUT",
    headers: { authorization: auth(), "content-type": "application/json" },
    body: JSON.stringify({ meta_data: [
      { key: "_cvd_commission_type", value: "fixed" },
      { key: "_cvd_commission_value", value: usd.toFixed(2) },
    ] }),
  });
  if (!res.ok) throw new Error(`woo ${wooId} ${res.status}`);
  const p = await res.json();
  const got = p.meta_data?.find((m: { key: string }) => m.key === "_cvd_commission_value")?.value;
  return got === undefined ? null : Number(got);
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!base() || !Deno.env.get("WOO_CK")) return json(500, { error: "La conexión con la web no está configurada." });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  // Automático: la clave manual (secreto de la función) o la del trabajo nocturno (Vault).
  const key = req.headers.get("x-nexo-key") ?? "";
  const internal = Deno.env.get("NEXO_IMPORT_KEY") ?? "";
  let automated = internal.length >= 32 && key === internal;
  if (!automated && key.length >= 32) {
    const { data: vaultOk } = await admin.rpc("nexo_business_check_import_key", { p_key: key });
    automated = vaultOk === true;
  }
  if (!automated) {
    const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer /i, "");
    const { data: who } = await admin.auth.getUser(jwt);
    if (!who?.user) return json(401, { error: "Inicia sesión otra vez." });
    const { data: owner } = await admin.rpc("nexo_panel_is_owner", { p_user: who.user.id, p_business: BUSINESS });
    if (owner !== true) return json(403, { error: "Solo la dueña puede cambiar comisiones." });
  }

  let body: { products?: string[] } = {};
  try { body = await req.json(); } catch { /* todos */ }
  const { data: rows, error } = await admin.rpc("nexo_business_commissions_for_push", {
    p_business: BUSINESS, p_products: Array.isArray(body.products) ? body.products : null,
  });
  if (error) return json(500, { error: error.message });

  const done: string[] = [], failed: { product: string; error: string }[] = [];
  for (const r of rows as { product_id: string; commission_usd: number; woo_id: number | null; parent_woo_id: number | null }[]) {
    const wooId = Number(r.woo_id ?? r.product_id.replace(/^cv-/, ""));
    if (!Number.isInteger(wooId) || wooId <= 0) continue; // productos que no vienen de la web
    try {
      const got = await pushOne(wooId, r.parent_woo_id ? Number(r.parent_woo_id) : null, Number(r.commission_usd));
      if (got === null || Math.abs(got - Number(r.commission_usd)) > 0.001) throw new Error(`la web guardó ${got}`);
      done.push(r.product_id);
    } catch (e) {
      failed.push({ product: r.product_id, error: (e as Error).message });
    }
  }
  return json(failed.length ? 207 : 200, { pushed: done.length, failed });
});
