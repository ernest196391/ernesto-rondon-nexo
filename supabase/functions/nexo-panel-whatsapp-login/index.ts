// Panel NEXO: "Entrar con WhatsApp". Recibe { phone, site } y, si el número es de
// alguien del panel, el bot le manda por WhatsApp un enlace de un solo uso.
// La respuesta es siempre la misma para no revelar qué números existen.
// Deploy: npx.cmd supabase functions deploy nexo-panel-whatsapp-login --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};
const SITES = ["https://casaviva.company/panel/", "https://negocio.nexocuba.com/", "https://nexo-negocio.vercel.app/"];
const SAME = { ok: true, message: "Si ese número está registrado en el panel, te llega un WhatsApp con el enlace para entrar." };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let phone = "", site = SITES[0];
  try {
    const body = await req.json();
    phone = String(body?.phone ?? "");
    if (SITES.includes(String(body?.site))) site = String(body.site);
  } catch {
    return json(400, { error: "Escribe tu número de WhatsApp" });
  }
  if (phone.replace(/\D/g, "").length < 8) return json(400, { error: "Escribe tu número de WhatsApp (8 cifras)" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: target, error } = await supabase.rpc("nexo_panel_whatsapp_login_target", { p_phone: phone });
  if (error) {
    console.error("login target failed", error.message);
    return json(500, { error: "No se pudo enviar ahora. Prueba otra vez en un minuto." });
  }
  if (!target?.email) {
    await new Promise(r => setTimeout(r, 600));
    return json(200, SAME);
  }

  const { data: link, error: linkError } = await supabase.auth.admin.generateLink({ type: "magiclink", email: target.email });
  const token = link?.properties?.hashed_token;
  if (linkError || !token) {
    console.error("generateLink failed", linkError?.message);
    return json(500, { error: "No se pudo enviar ahora. Prueba otra vez en un minuto." });
  }

  const url = `${site}?acceso=${encodeURIComponent(token)}`;
  const body =
    `🔐 Tu enlace para entrar al panel de Casa Viva:\n${url}\n\n` +
    `Sirve una sola vez y caduca en 1 hora. No se lo pases a nadie. ` +
    `Si no lo pediste tú, ignora este mensaje.`;
  const { error: sendError } = await supabase.rpc("nexo_panel_whatsapp_login_send", {
    p_crm_business: target.crm_business_id, p_phone: target.phone, p_body: body,
  });
  if (sendError) {
    console.error("outbox insert failed", sendError.message);
    return json(500, { error: "No se pudo enviar ahora. Prueba otra vez en un minuto." });
  }
  return json(200, SAME);
});
