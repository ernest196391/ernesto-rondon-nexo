import { Pool } from "pg";
import { createCajaRecoveryHandler } from "../../../../scripts/caja-recovery-adapter.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const CORE = "https://casaviva.company/wp-json/casa-viva/v1/panel/caja/recovery-orders";
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-nexo-device-token",
  "cache-control": "no-store, private",
};
let pool: Pool | undefined;
export function OPTIONS() { return new Response(null, {status: 204, headers: cors}); }
export async function POST(request: Request) {
  const dsn = process.env.NEXO_CAJA_RECOVERY_DATABASE_URL;
  const key = process.env.NEXO_CAJA_RECOVERY_KEY;
  if (process.env.NEXO_CAJA_RECOVERY_ENABLED !== "1" || !dsn || !key || !/^[0-9a-f]{64}$/.test(key))
    return Response.json({error:"recovery_disabled"}, {status:503, headers:cors});
  // Only dedicated server-side DB role with EXECUTE on the existing identity RPC.
  // No fallback to general DATABASE_URL or snapshot; verify current device on every request.
  pool ??= new Pool({connectionString:dsn, max:2, connectionTimeoutMillis:4000, statement_timeout:4000, query_timeout:5000});
  const activePool = pool;
  const handler = createCajaRecoveryHandler({
    businessId:"casa-viva",
    async authorizeCurrentDevice(token) {
      const result = await activePool.query<{who:{businessId?:string;deviceId?:string;error?:string}}>(
        "SELECT public.nexo_business_device_person($1::text, ''::text) AS who", [token]);
      const who = result.rows[0]?.who;
      if (!who || who.error || who.businessId !== "casa-viva" || !who.deviceId) return null;
      return {current:true,businessId:who.businessId,canReadOrders:true};
    },
    async readCoreOrders() {
      const res = await fetch(CORE, {method:"GET",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(8000),
        headers:{"x-nexo-caja-read-key":key}});
      if (!res.ok) throw new Error("Core unavailable");
      return res.json();
    }
  });
  const response = await handler(request);
  for (const [name,value] of Object.entries(cors)) response.headers.set(name,value);
  return response;
}
