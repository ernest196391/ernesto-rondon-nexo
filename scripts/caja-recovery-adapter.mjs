// Server-only, opt-in recovery adapter. No listener or credential provisioning.
export function createCajaRecoveryHandler({ businessId, authorizeCurrentDevice, readCoreOrders }) {
  if (!businessId || typeof authorizeCurrentDevice !== "function" || typeof readCoreOrders !== "function") throw new Error("missing configuration");
  const json = (status, data) => new Response(JSON.stringify(data), {
    status, headers: { "content-type": "application/json", "cache-control": "no-store, private" },
  });
  return async (request) => {
    if (request.method !== "POST") return json(405, { error: "method" });
    const token = request.headers.get("x-nexo-device-token") ?? "";
    if (token.length < 32 || token.length > 512) return json(401, { error: "unauthorized" });
    let body;
    try { body = await request.json(); } catch { return json(400, { error: "invalid_json" }); }
    if (!body || body.action !== "list") return json(503, { error: "recovery_read_only" });
    let who;
    try { who = await authorizeCurrentDevice(token); } catch { return json(503, { error: "auth_unavailable" }); }
    if (!who || who.current !== true || who.businessId !== businessId || who.canReadOrders !== true)
      return json(401, { error: "unauthorized" });
    try {
      const data = await readCoreOrders();
      if (data?.recoveryReadOnly !== true || !Array.isArray(data.orders) || typeof data.generatedAt !== "string" || !Number.isFinite(Date.parse(data.generatedAt)))
        return json(502, { error: "invalid_core_response" });
      return json(200, { generatedAt: data.generatedAt, recoveryReadOnly: true,
        orders: data.orders.map(order => ({ ...order, chargeable: false })) });
    } catch { return json(502, { error: "core_unavailable" }); }
  };
}
