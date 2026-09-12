import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const runId = String(process.env.NEXO_E2E_RUN || "").trim();
if (!runId) process.exit(0);

const baseUrl = String(process.env.NEXO_E2E_BASE_URL || "https://ernesto-rondon-nexo.onrender.com").replace(/\/$/, "");
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is not configured");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pool = new Pool({ connectionString: dbUrl, max: 2, idleTimeoutMillis: 10_000 });

const summary = {
  runId,
  startedAt: new Date().toISOString(),
  baseUrl,
  steps: [],
  slug: null,
  referralCode: null,
  productId: null,
  orderId: null,
  wooMeta: {},
  dashboardSeesOrder: false,
  dbOrderRows: [],
  cleanup: null,
};

function mark(step, ok, detail = "") {
  summary.steps.push({ step, ok, detail: String(detail).slice(0, 500), at: new Date().toISOString() });
  console.log("NEXO_E2E_STEP", JSON.stringify(summary.steps.at(-1)));
}

function cookieValues(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const value = headers.get("set-cookie");
  return value ? value.split(/,(?=[^;,]+=)/g) : [];
}

class Jar {
  constructor() { this.map = new Map(); }
  absorb(headers) {
    for (const raw of cookieValues(headers)) {
      const first = raw.split(";", 1)[0];
      const idx = first.indexOf("=");
      if (idx > 0) this.map.set(first.slice(0, idx).trim(), first.slice(idx + 1).trim());
    }
  }
  header() { return [...this.map.entries()].map(([k, v]) => `${k}=${v}`).join("; "); }
}

function verifiedEmailCookie(email) {
  const secret = String(process.env.NEXO_GESTORA_SESSION_SECRET || "");
  if (!secret) throw new Error("NEXO_GESTORA_SESSION_SECRET is not configured");
  const payload = Buffer.from(JSON.stringify({ email, expires: Date.now() + 20 * 60_000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

async function request(path, { method = "GET", body, jar, origin = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (jar?.header()) headers.Cookie = jar.header();
  if (origin) headers.Origin = baseUrl;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  if (jar) jar.absorb(response.headers);
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text.slice(0, 1000) }; }
  return { response, data };
}

async function wooOrder(orderId) {
  const store = String(process.env.WOOCOMMERCE_URL || "").replace(/\/$/, "");
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY || "";
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET || "";
  if (!store || !key || !secret) throw new Error("WooCommerce credentials are not configured");
  const url = new URL(`${store}/wp-json/wc/v3/orders/${orderId}`);
  url.searchParams.set("consumer_key", key);
  url.searchParams.set("consumer_secret", secret);
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await r.json();
  if (!r.ok) throw new Error(`Woo order read failed ${r.status}: ${JSON.stringify(data).slice(0, 400)}`);
  return { store, key, secret, data };
}

async function cancelWooOrder(store, key, secret, orderId) {
  const url = new URL(`${store}/wp-json/wc/v3/orders/${orderId}`);
  url.searchParams.set("consumer_key", key);
  url.searchParams.set("consumer_secret", secret);
  const r = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Woo order cancel failed ${r.status}: ${JSON.stringify(data).slice(0, 400)}`);
  return data.status;
}

async function inspectDbOrder(orderId) {
  const tableRows = await pool.query(`
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name
    WHERE c.table_schema='public' AND t.table_type='BASE TABLE'
      AND c.table_name LIKE 'nexo_%'
      AND c.column_name IN ('woocommerce_order_id','order_id')
    ORDER BY c.table_name, c.column_name
  `);
  const found = [];
  for (const row of tableRows.rows) {
    const table = row.table_name.replace(/"/g, '');
    const column = row.column_name.replace(/"/g, '');
    const q = await pool.query(`SELECT COUNT(*)::int AS count FROM "${table}" WHERE "${column}"::text=$1`, [String(orderId)]);
    if (q.rows[0]?.count > 0) found.push({ table, column, count: q.rows[0].count });
  }
  return found;
}

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS nexo_e2e_runs (
    run_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const claim = await pool.query("INSERT INTO nexo_e2e_runs(run_id,status) VALUES($1,'running') ON CONFLICT(run_id) DO NOTHING RETURNING run_id", [runId]);
  if (!claim.rowCount) {
    console.log("NEXO_E2E_SKIP", JSON.stringify({ runId, reason: "already_claimed" }));
    return;
  }

  await sleep(25_000);
  const jar = new Jar();
  const short = runId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-8) || crypto.randomUUID().slice(0, 8);
  const email = `nexo-e2e-${short}@example.invalid`;
  const password = `Nx!${crypto.createHash("sha256").update(runId).digest("hex").slice(0, 18)}aA9`;
  const publicName = `NEXO QA ${short}`;

  // The production registration flow requires a verified-email cookie. The
  // one-shot E2E harness signs its own short-lived QA cookie with the same
  // server-side secret, without sending mail to a synthetic address.
  jar.map.set("nexo_email_verified", verifiedEmailCookie(email));

  let r = await request("/api/gestoras/auth/register", { method: "POST", jar, body: { email, password, publicName, whatsapp: "+5355550000" } });
  if (!r.response.ok) throw new Error(`register ${r.response.status}: ${JSON.stringify(r.data)}`);
  summary.slug = r.data?.slug || null;
  mark("register_gestora", true, summary.slug);

  r = await request("/api/gestoras/dashboard", { jar });
  if (!r.response.ok) throw new Error(`dashboard ${r.response.status}: ${JSON.stringify(r.data)}`);
  const dashboard = r.data || {};
  summary.referralCode = dashboard.profile?.referralCode || null;
  if (!summary.referralCode) throw new Error(`dashboard did not expose referralCode; keys=${Object.keys(dashboard).join(",")}`);
  mark("dashboard_authenticated", true, `ref=${summary.referralCode}`);

  r = await request("/api/gestoras/dashboard", { method: "POST", jar, body: { action: "price_rule", mode: "fixed", scope: "global", value: 5, minFinal: "", maxFinal: "", rounding: 0.01, currency: "USD" } });
  if (!r.response.ok) throw new Error(`margin rule ${r.response.status}: ${JSON.stringify(r.data)}`);
  mark("gestora_margin_rule", true, "+5 USD");

  const candidates = (dashboard.catalog || []).filter((p) => p && p.stockStatus === "instock" && Number(p.price) > 0).sort((a, b) => Number(a.price) - Number(b.price));
  if (!candidates.length) throw new Error("No in-stock priced catalog product available for E2E");

  let cartResult = null;
  for (const candidate of candidates.slice(0, 12)) {
    const save = await request("/api/gestoras/dashboard", { method: "POST", jar, body: { action: "products", productIds: [Number(candidate.id)] } });
    if (!save.response.ok) continue;
    const storefront = await request(`/api/gestoras/storefront/${encodeURIComponent(summary.slug)}`, { jar });
    const hasProduct = storefront.response.ok && Array.isArray(storefront.data?.products) && storefront.data.products.some((p) => Number(p.id) === Number(candidate.id));
    if (!hasProduct) continue;
    const add = await request("/api/commerce/cart", { method: "POST", jar, body: { action: "add", productId: Number(candidate.id), quantity: 1, referral: summary.referralCode } });
    if (add.response.ok && add.data?.cart?.items?.length) {
      summary.productId = Number(candidate.id);
      cartResult = add.data;
      break;
    }
  }
  if (!cartResult) throw new Error("Could not add any selected in-stock product to cart");
  mark("select_and_add_product", true, `product=${summary.productId}`);

  const projectedItem = cartResult.cart.items[0];
  mark("commercial_projection", Boolean(projectedItem), projectedItem?.name || "item present");

  const idempotencyKey = `e2e-${crypto.randomUUID()}`;
  r = await request("/api/commerce/checkout", {
    method: "POST",
    jar,
    body: {
      idempotencyKey,
      fullName: "Cliente Prueba NEXO",
      phone: "+5355550001",
      alternatePhone: "",
      email: `cliente-${short}@example.invalid`,
      postcode: "10400",
      mode: "pickup",
      municipality: "",
      locality: "",
      manualLocality: false,
      address: "",
      reference: "",
      notes: `E2E BLOQUE 1 ${runId}`,
      deliveryWindow: "",
      latitude: "",
      longitude: "",
      locationAccuracy: "",
      locationTimestamp: ""
    }
  });
  if (!r.response.ok) throw new Error(`checkout ${r.response.status}: ${JSON.stringify(r.data)}`);
  summary.orderId = Number(r.data?.orderId ?? r.data?.order?.id);
  if (!Number.isInteger(summary.orderId) || summary.orderId <= 0) throw new Error(`checkout returned invalid orderId: ${JSON.stringify(r.data)}`);
  mark("checkout_created", true, `order=${summary.orderId}`);

  const woo = await wooOrder(summary.orderId);
  const meta = Object.fromEntries((woo.data.meta_data || []).map((x) => [x.key, x.value]));
  const note = String(woo.data.customer_note || "");
  const noteValue = (label) => note.match(new RegExp(`(?:^|\\n)${label}:\\s*(.+)`, "i"))?.[1]?.trim() || "";
  const read = (key) => meta[key] ?? meta[String(key).replace(/^_/, "")] ?? null;
  const origin = String(read("_nexo_order_origin") || noteValue("Origen NEXO") || "");
  const gestoraName = String(read("_nexo_effective_gestora_name") || noteValue("Gestora") || "");
  const ref = String(read("_nexo_referral_effective") || noteValue("Código referido") || "");
  summary.wooMeta = { origin, gestoraName, ref, slug: read("_nexo_effective_gestora_slug"), gestoraId: read("_nexo_effective_gestora_id") };
  const attributionOk = origin === "gestora_store" && gestoraName === publicName && ref === summary.referralCode;
  if (!attributionOk) throw new Error(`Woo attribution mismatch: ${JSON.stringify(summary.wooMeta)}`);
  mark("woo_attribution", true, JSON.stringify(summary.wooMeta));

  summary.dbOrderRows = await inspectDbOrder(summary.orderId);
  const hasSnapshot = summary.dbOrderRows.some((x) => x.table === "nexo_order_commercial_snapshots");
  const hasLedger = summary.dbOrderRows.some((x) => x.table === "nexo_commission_ledger");
  mark("db_snapshot_ledger", hasSnapshot && hasLedger, JSON.stringify(summary.dbOrderRows));
  if (!hasSnapshot || !hasLedger) throw new Error("Commercial snapshot or commission ledger missing");

  r = await request("/api/gestoras/dashboard", { jar });
  if (r.response.ok) {
    summary.dashboardSeesOrder = JSON.stringify(r.data).includes(String(summary.orderId));
  }
  mark("gestora_dashboard_order_visibility", summary.dashboardSeesOrder, summary.dashboardSeesOrder ? `order=${summary.orderId}` : "order id not found in dashboard payload");
  if (!summary.dashboardSeesOrder) throw new Error("Gestora dashboard does not expose the order earning");

  summary.cleanup = await cancelWooOrder(woo.store, woo.key, woo.secret, summary.orderId);
  mark("cleanup_cancel_test_order", summary.cleanup === "cancelled", summary.cleanup);

  await pool.query("UPDATE nexo_gestora_profiles SET status='inactive',updated_at=NOW() WHERE slug=$1", [summary.slug]).catch(() => undefined);
  summary.finishedAt = new Date().toISOString();
  summary.status = "passed";
  await pool.query("UPDATE nexo_e2e_runs SET status='passed',result=$2::jsonb,updated_at=NOW() WHERE run_id=$1", [runId, JSON.stringify(summary)]);
  console.log("NEXO_E2E_RESULT", JSON.stringify(summary));
}

main().catch(async (error) => {
  summary.finishedAt = new Date().toISOString();
  summary.status = "failed";
  summary.error = error instanceof Error ? error.message : String(error);
  console.error("NEXO_E2E_RESULT", JSON.stringify(summary));
  try { await pool.query("UPDATE nexo_e2e_runs SET status='failed',result=$2::jsonb,updated_at=NOW() WHERE run_id=$1", [runId, JSON.stringify(summary)]); } catch {}
  process.exitCode = 1;
}).finally(async () => { await pool.end().catch(() => undefined); });
