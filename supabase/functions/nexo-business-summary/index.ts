// NEXO Business owner summary: sales per day and currency, open receivables,
// messenger cash and device sync state for the business of the calling device.
// Auth: the device token in `x-nexo-device-token` (same as nexo-sync-push).
// Deploy: npx.cmd supabase functions deploy nexo-business-summary --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt
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
  const days = Number(new URL(req.url).searchParams.get("days") ?? "7");

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("nexo_business_summary", {
    p_token: token,
    p_days: Number.isFinite(days) ? Math.trunc(days) : 7,
  });
  if (error) {
    console.error("business_summary failed", error.message);
    return json(500, { error: "server_error" });
  }
  if (data?.error === "unauthorized") return json(401, data);
  return json(200, data);
});
