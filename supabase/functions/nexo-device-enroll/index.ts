// NEXO Business: alta de un equipo con código corto. La app manda { code } y recibe
// su identidad y su clave de dispositivo (una sola vez). Sin código válido no hay clave.
// Deploy: npx.cmd supabase functions deploy nexo-device-enroll --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let code = "";
  try {
    code = String((await req.json())?.code ?? "");
  } catch {
    return json(400, { error: "Falta el código" });
  }
  if (code.replace(/[^A-Za-z0-9]/g, "").length !== 6) return json(400, { error: "El código tiene 6 letras o números" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("nexo_business_enroll_device", { p_code: code });
  if (error) {
    console.error("enroll failed", error.message);
    return json(500, { error: "No se pudo dar de alta. Prueba otra vez." });
  }
  if (data?.error) {
    await new Promise(r => setTimeout(r, 800)); // frena a quien pruebe códigos al azar
    return json(400, data);
  }
  return json(200, data);
});
