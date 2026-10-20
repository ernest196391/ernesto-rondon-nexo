// «Un cajón por tienda» (20-oct): el turno de la tienda para las cajas.
// La caja se identifica con su clave (x-nexo-device-token), como al sincronizar.
//   POST {action:"status", shiftId?}           → turno abierto de la tienda y el estado del mío
//   POST {action:"open", shiftId, operatorId}   → reserva la apertura; {action:"join"} si ya hay uno abierto
//   POST {action:"expected", shiftId}           → «debería haber» de todo el cajón: todas las cajas
//                                                  + efectivo cobrado en Ventas (Core) que no pasó por la caja
// El efectivo de Ventas se pide a Core (/panel/caja/cash-collections, Core 3.14.42). Si Core no
// contesta, se devuelve igual con webMissing = true para que la caja avise.
// Deploy: npx.cmd supabase functions deploy nexo-device-shift --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-nexo-device-token",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

async function core(path: string) {
  const base = (Deno.env.get("WOO_URL") ?? "").replace(/\/$/, "");
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${base}/wp-json/casa-viva/v1/${path}${sep}_=${Date.now()}`, {
    headers: { "x-nexo-panel-key": Deno.env.get("CASAVIVA_PANEL_KEY") ?? "" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`core ${path} ${res.status}`);
  return data;
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "method" });
  const token = req.headers.get("x-nexo-device-token") ?? "";
  if (token.length < 32) return json(401, { error: "unauthorized" });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const body = await req.json().catch(() => ({})) as { action?: string; shiftId?: string; operatorId?: string };
  const action = String(body.action ?? "");
  const shiftId = typeof body.shiftId === "string" ? body.shiftId.slice(0, 80) : "";
  const rpc = async (a: string, data: Record<string, unknown>) => {
    const { data: out, error } = await admin.rpc("nexo_business_device_shift", { p_token: token, p_action: a, p_data: data });
    if (error) throw new Error(error.message);
    return out as Record<string, unknown> & { error?: string };
  };
  try {
    if (action === "status" || action === "open") {
      const out = await rpc(action, { shiftId, operatorId: typeof body.operatorId === "string" ? body.operatorId : null });
      if (out.error === "unauthorized") return json(401, out);
      return json(out.error ? 400 : 200, out);
    }
    if (action === "expected") {
      if (!shiftId) return json(400, { error: "invalid" });
      const status = await rpc("status", { shiftId });
      if (status.error === "unauthorized") return json(401, status);
      const mine = status.mine as { openedAt?: string } | null;
      if (!mine?.openedAt) return json(409, { error: "unknown_shift", message: "La nube aún no tiene este turno: sincroniza y prueba otra vez." });
      let web: unknown[] = [];
      let webOrders: unknown[] = [];
      let webMissing = false;
      try {
        const cash = await core(`panel/caja/cash-collections?from=${encodeURIComponent(mine.openedAt)}`);
        web = Array.isArray(cash.web) ? cash.web : [];
        webOrders = Array.isArray(cash.orders) ? cash.orders : [];
      } catch (e) {
        console.warn("cash-collections", (e as Error).message);
        webMissing = true;
      }
      const out = await rpc("expected", { shiftId, web });
      return json(out.error ? 409 : 200, { ...out, webOrders, webMissing });
    }
    return json(400, { error: "unknown_action" });
  } catch (e) {
    console.error("nexo-device-shift", (e as Error).message);
    return json(502, { error: "server_error", message: "No se pudo hablar con la nube. Prueba en un minuto." });
  }
});
