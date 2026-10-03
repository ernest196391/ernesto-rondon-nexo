// NEXO Business device identity: which business and device a device key
// belongs to, so the POS scopes its local data with it (provisioning).
// Auth: device token in `x-nexo-device-token`, same as nexo-sync-push.
// Deploy: npx.cmd supabase functions deploy nexo-device-identity --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-nexo-device-token",
  "access-control-allow-methods": "GET, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET") return json(405, { error: "method_not_allowed" });

  const token = req.headers.get("x-nexo-device-token") ?? "";
  if (token.length < 32) return json(401, { error: "unauthorized" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("nexo_business_device_identity", { p_token: token });
  if (error) {
    console.error("device_identity failed", error.message);
    return json(500, { error: "server_error" });
  }
  if (data?.error === "unauthorized") return json(401, data);
  return json(200, data);
});
