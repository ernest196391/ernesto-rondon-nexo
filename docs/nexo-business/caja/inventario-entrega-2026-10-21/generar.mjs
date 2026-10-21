// Inventario de entrega de turno (Casa Viva) — SOLO LECTURA de la web y de la caja.
// Uso (1 minuto):
//   node generar.mjs --inicio "2026-10-15 10:00" [--de Zaymi] [--a Daniela] [--fecha 2026-10-21] [--sin-red]
//   --inicio = hora de Cuba (UTC-4) en que empezó el período de la dependienta que entrega.
//   --sin-red = reusar los datos ya bajados (no vuelve a consultar la web ni la caja).
// Salida en esta carpeta: entrega-<fecha>.pdf, entrega-<fecha>.csv, entrega-<fecha>.html
//
// Método (por cada producto con stock propio; fuera SKU MK- y categoría «Bajo pedido»):
//   web(T)      = stock de la web en el momento T. web(inicio) = stock de ahora − movimientos desde el inicio
//                 (pedidos web de wp_cvd_inventory_movements + ajustes que la caja aplicó a la web, wp_cvd_nexo_stock_keys).
//   apartado(T) = unidades de pedidos web que ya descontaron stock pero aún no salieron de la tienda en T
//                 (no entregados, no recogidos y no «con mensajero»).
//   Físico(T)   = web(T) + apartado(T).
//   Al empezar  = Físico(inicio).
//   Salió       = pedidos web que salieron (recogidos/con mensajero/entregados) en el período + ventas del mostrador de la caja.
//   Entró       = entradas y conteos al alza de la caja + devoluciones (de la caja o de pedidos ya entregados).
//   Ajuste      = conteos a la baja de la caja (correcciones, no ventas).
//   Debe haber  = web ahora + apartado ahora = Al empezar + Entró − Salió + Ajuste.
//   Las ventas del mostrador NO se cuentan dos veces: la caja manda a la web solo sus propios movimientos (clave única
//   por movimiento), y los pedidos web se cuentan solo por su pedido.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (k, def) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : def; };
const INICIO_CUBA = arg("--inicio", "2026-10-15 10:00");
const DE = arg("--de", "Zaymi"), A = arg("--a", "Daniela");
const FECHA = arg("--fecha", new Date(Date.now() - 4 * 3600e3).toISOString().slice(0, 10));
const SIN_RED = args.includes("--sin-red");
const CACHE = join(tmpdir(), "cv-inventario-entrega"); mkdirSync(CACHE, { recursive: true });

const toUtc = (cuba) => { const [d, t = "00:00"] = cuba.split(" "); const ms = Date.parse(`${d}T${t.length === 5 ? t + ":00" : t}-04:00`); return new Date(ms).toISOString().slice(0, 19).replace("T", " "); };
const START = toUtc(INICIO_CUBA);
const HOME = process.env.USERPROFILE || process.env.HOME;
const WOO_SSH = ["-i", join(HOME, ".ssh/casa-viva-github-actions"), "-p", "65002", "-o", "BatchMode=yes", "u824654880@88.223.85.72"];
const VPS_SSH = ["-i", join(HOME, ".ssh/vivabot_vps"), "-o", "BatchMode=yes", "root@179.236.242.212"];

// ---------- 1. Datos ----------
let woo, cajaReasons;
if (SIN_RED && existsSync(join(CACHE, "woo.json"))) {
  woo = JSON.parse(readFileSync(join(CACHE, "woo.json"), "utf8"));
  cajaReasons = JSON.parse(readFileSync(join(CACHE, "caja.json"), "utf8"));
} else {
  const php = readFileSync(join(HERE, "extraer-woo.php"));
  const raw = execFileSync("ssh", [...WOO_SSH, `cd ~/domains/casaviva.company/public_html && CV_START='${START}' wp eval-file - 2>/dev/null`], { input: php, maxBuffer: 64e6 }).toString();
  woo = JSON.parse(raw.slice(raw.indexOf("{")));
  const sql = `select w.stock_key, w.delta, m.reason from nexo_business.web_stock_sync w left join nexo_business.stock_movements m on m.event_id::text = split_part(w.stock_key, ':', 1) and m.business_id = w.business_id where w.direction = 'to_web' and w.created_at >= timestamptz '${START}+00' - interval '2 days'`;
  const out = execFileSync("ssh", [...VPS_SSH, 'node /root/supervisor/caja.mjs "$(cat)"'], { input: sql, maxBuffer: 64e6 }).toString();
  cajaReasons = JSON.parse(out.slice(out.indexOf("[")));
  writeFileSync(join(CACHE, "woo.json"), JSON.stringify(woo));
  writeFileSync(join(CACHE, "caja.json"), JSON.stringify(cajaReasons));
}
const NOW = woo.now_utc;
const reasonByKey = new Map(cajaReasons.map((r) => [r.stock_key, r.reason || ""]));

// ---------- 2. Productos con stock propio ----------
const GENERIC = /^(sin categor|uncategor)/i;
const own = woo.products.filter((p) => p.manage && !/^MK-/i.test(p.sku || "") && !/^MK-/i.test(p.parent_sku || "") && !p.cats.some((c) => /bajo pedido/i.test(c)));
const prod = new Map();
for (const p of own) {
  const cat = p.cats.find((c) => !GENERIC.test(c)) || "Otros";
  prod.set(String(p.id), { id: p.id, name: p.name, sku: p.sku, cat, status: p.status, now: Number(p.stock || 0),
    webDelta: 0, cajaDelta: 0, salioWeb: 0, salioCaja: 0, entro: 0, ajuste: 0, heldStart: 0, heldNow: 0 });
}
const sid = (m) => String(Number(m.variation_id) || Number(m.product_id));

// ---------- 3. Movimientos ----------
const movByOrder = new Map();
for (const m of woo.mov) {
  if (m.reference_type === "woocommerce_order") {
    const k = String(m.reference_id); if (!movByOrder.has(k)) movByOrder.set(k, []); movByOrder.get(k).push(m);
  }
  if (m.created_at >= START && prod.has(sid(m))) prod.get(sid(m)).webDelta += Number(m.d);
}
for (const c of woo.caja) {
  const p = prod.get(String(c.product_id)); if (!p) continue;
  const d = Number(c.delta); p.cajaDelta += d;
  const reason = reasonByKey.get(c.stock_key) || "";
  if (reason === "sale" && d < 0) p.salioCaja += -d;
  else if (reason === "return" && d > 0 && p.salioCaja >= d) p.salioCaja -= d; // devolución de una venta del mostrador: se anula
  else if (d > 0) p.entro += d;          // entrada, conteo al alza o devolución en la caja
  else p.ajuste += d;                    // conteo a la baja (corrección)
}

// ---------- 4. Pedidos: cuándo salió cada uno de la tienda ----------
const OUT_STATES = new Set(["with_courier", "delivered", "picked_up", "completed"]);
const exitTime = (o) => {
  const h = (o.history || []).filter((x) => OUT_STATES.has(x.to) && x.at).map((x) => x.at).sort();
  if (h.length) return h[0];
  if (o.status === "completed") return o.completed_gmt || NOW;
  if (OUT_STATES.has(o.op_status)) return NOW;   // salió pero sin hora registrada
  return null;                                   // sigue en la tienda (o cancelado)
};
const openOrders = [];
for (const o of woo.orders) {
  const ms = movByOrder.get(String(o.id)) || [];
  const ex = exitTime(o);
  const net = (T) => { const r = new Map(); for (const m of ms) if (m.created_at < T) r.set(sid(m), (r.get(sid(m)) || 0) - Number(m.d)); return r; };
  const stillIn = (T) => !ex || ex > T;
  if (stillIn(START)) for (const [k, q] of net(START)) if (prod.has(k)) prod.get(k).heldStart += q;
  if (stillIn(NOW)) for (const [k, q] of net("9999")) if (prod.has(k)) prod.get(k).heldNow += q;
  if (ex && ex >= START && ex <= NOW) {
    for (const [k, q] of net(ex)) if (prod.has(k)) prod.get(k).salioWeb += q;
    for (const m of ms) if (m.created_at >= ex && prod.has(sid(m))) { const d = Number(m.d); if (d > 0) prod.get(sid(m)).entro += d; else prod.get(sid(m)).salioWeb += -d; }
  } else if (ex && ex < START) {
    for (const m of ms) if (m.created_at >= START && prod.has(sid(m))) { const d = Number(m.d); if (d > 0) prod.get(sid(m)).entro += d; else prod.get(sid(m)).salioWeb += -d; }
  }
  if (stillIn(NOW) && !["cancelled", "refunded", "failed", "trash"].includes(o.status)) {
    const held = net("9999");
    const lines = o.lines.map((l) => ({ ...l, k: String(l.vid || l.pid) })).filter((l) => prod.has(l.k) && (held.get(l.k) || 0) > 0);
    if (lines.length) openOrders.push({ o, lines: lines.map((l) => ({ name: prod.get(l.k).name, qty: Math.min(l.qty, held.get(l.k)) })) });
  }
}
// Pedidos que descontaron stock y nunca se registraron en el pedido abierto (seguridad): nada que hacer, ya están en heldNow.

// ---------- 5. Filas ----------
// Cambios de stock hechos a mano en la web (sin registro): se detectan con el «stock antes» que guarda el primer
// movimiento web del período. Ese ancla manda; la diferencia con la cuenta hacia atrás va a «Ajuste».
const firstMov = new Map();
for (const m of woo.mov) if (m.created_at >= START && prod.has(sid(m)) && !firstMov.has(sid(m))) firstMov.set(sid(m), m);
const rows = [];
let manuales = [];
for (const p of prod.values()) {
  let webStart = p.now - p.webDelta - p.cajaDelta;
  const fm = firstMov.get(String(p.id));
  if (fm) {
    const cajaAntes = woo.caja.filter((c) => String(c.product_id) === String(p.id) && c.applied_at < fm.created_at).reduce((s, c) => s + Number(c.delta), 0);
    const anchored = Number(fm.sb) - cajaAntes;
    const manual = webStart - anchored;
    if (manual !== 0) { p.ajuste += manual; manuales.push(`${p.name}: ${manual > 0 ? "+" : ""}${manual}`); webStart = anchored; }
  }
  p.start = webStart + p.heldStart;
  p.debe = p.now + p.heldNow;
  p.check = p.start + p.entro - p.salioWeb - p.salioCaja + p.ajuste - p.debe;
  p.salio = p.salioWeb + p.salioCaja;
  if (p.start === 0 && p.debe === 0 && p.entro === 0 && p.salio === 0 && p.ajuste === 0) continue;
  rows.push(p);
}
const coll = new Intl.Collator("es", { sensitivity: "base", numeric: true });
rows.sort((a, b) => coll.compare(a.cat, b.cat) || coll.compare(a.name, b.name));
const cats = [...new Set(rows.map((r) => r.cat))];
const bad = rows.filter((r) => Math.abs(r.check) > 1e-9);
const T = (k) => rows.reduce((s, r) => s + r[k], 0);

// ---------- 6. CSV ----------
const esc = (v) => { const s = String(v ?? ""); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = [["Categoría", "Producto", "SKU", "ID web", "Al empezar", "Entró", "Salió", "Ajuste", "Apartado", "Debe haber", "Stock web ahora", "Contado", "Diferencia"].join(";")]
  .concat(rows.map((r) => [r.cat, r.name, r.sku, r.id, r.start, r.entro, r.salio, r.ajuste, r.heldNow, r.debe, r.now, "", ""].map(esc).join(";")));
const BASE = join(HERE, `entrega-${FECHA}`);
writeFileSync(BASE + ".csv", "\ufeff" + csv.join("\r\n"), "utf8");

// ---------- 7. HTML → PDF ----------
const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const n = (v) => (v === 0 ? '<span class="z">0</span>' : v);
const sg = (v) => (v === 0 ? "" : v > 0 ? "+" + v : "−" + -v);
const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fmtDia = (iso) => { if (!iso) return ""; const [y, m, d] = iso.slice(0, 10).split("-"); return `${+d}-${MES[+m - 1]}`; };
const titulo = `Entrega de turno · ${DE} → ${A} · ${fmtDia(FECHA)}-${FECHA.slice(0, 4)}`;
const nowCuba = new Date(Date.parse(NOW.replace(" ", "T") + "Z") - 4 * 3600e3).toISOString().slice(11, 16);
const [di, hi] = INICIO_CUBA.split(" ");
const head = `<tr><th class="p">Producto</th><th>Al empezar</th><th>Entró</th><th>Salió</th><th>Ajuste</th><th>Apartado</th><th class="dh">Debe haber</th><th class="w">Contado</th><th class="w">Diferencia</th></tr>`;
let body = "";
for (const c of cats) {
  const rs = rows.filter((r) => r.cat === c);
  body += `<h2>${h(c)} <small>(${rs.length})</small></h2><table><thead>${head}</thead><tbody>`;
  for (const r of rs) body += `<tr${r.debe < 0 ? ' class="neg"' : ""}><td class="p">${h(r.name)}${r.sku ? ` <span class="sku">${h(r.sku)}</span>` : ""}</td><td>${n(r.start)}</td><td>${r.entro ? "+" + r.entro : ""}</td><td>${r.salio ? "−" + r.salio : ""}</td><td>${sg(r.ajuste)}</td><td>${r.heldNow || ""}</td><td class="dh">${r.debe}</td><td class="w"></td><td class="w"></td></tr>`;
  body += `<tr class="tot"><td class="p">Total ${h(c)}</td><td>${rs.reduce((s, r) => s + r.start, 0)}</td><td>+${rs.reduce((s, r) => s + r.entro, 0)}</td><td>−${rs.reduce((s, r) => s + r.salio, 0)}</td><td>${sg(rs.reduce((s, r) => s + r.ajuste, 0)) || 0}</td><td>${rs.reduce((s, r) => s + r.heldNow, 0)}</td><td class="dh">${rs.reduce((s, r) => s + r.debe, 0)}</td><td class="w"></td><td class="w"></td></tr></tbody></table>`;
}
const wl = { morning: "mañana", afternoon: "tarde", evening: "noche" };
openOrders.sort((a, b) => Number(a.o.number) - Number(b.o.number));
let ord = `<table class="ord"><thead><tr><th>Pedido</th><th class="p">Cliente</th><th class="p">Producto</th><th>Cant.</th><th class="p">Cómo y cuándo</th><th class="w">✓</th></tr></thead><tbody>`;
for (const { o, lines } of openOrders) {
  const nombre = (o.buyer || o.first_name || "").trim().split(/\s+/)[0] || "—";
  const como = (o.fulfillment === "pickup" ? "Recoge en tienda" : "Mensajería") + (o.delivery_date ? ` · ${fmtDia(o.delivery_date)}` : "") + (o.delivery_window ? ` (${wl[o.delivery_window] || o.delivery_window})` : "");
  lines.forEach((l, i) => { ord += `<tr${i === 0 ? ' class="first"' : ""}><td>${i === 0 ? "#" + h(o.number) : ""}</td><td class="p">${i === 0 ? h(nombre) : ""}</td><td class="p">${h(l.name)}</td><td>${l.qty}</td><td class="p">${i === 0 ? h(como) : ""}</td><td class="w"></td></tr>`; });
}
ord += `</tbody></table>`;
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${h(titulo)}</title><style>
@page { size: A4 landscape; margin: 12mm 10mm 14mm; @bottom-center { content: "Página " counter(page) " de " counter(pages); font: 11pt Arial, sans-serif; color: #444; } @top-right { content: "${h(titulo)}"; font: 9pt Arial, sans-serif; color: #777; } }
body { font-family: Arial, Helvetica, sans-serif; font-size: 13pt; color: #111; margin: 0; }
h1 { font-size: 22pt; margin: 0 0 4px; } .sub { font-size: 12pt; margin: 0 0 8px; color: #333; }
.box { border: 2px solid #111; padding: 6px 10px; margin: 6px 0 10px; font-size: 12pt; line-height: 1.35; }
.box b { font-size: 12.5pt; }
h2 { font-size: 16pt; margin: 14px 0 4px; break-after: avoid; background: #eee; padding: 3px 6px; } h2 small { font-weight: normal; font-size: 11pt; }
table { width: 100%; border-collapse: collapse; } thead { display: table-header-group; }
th, td { border: 1px solid #777; padding: 5px 6px; text-align: center; } th { background: #f3f3f3; font-size: 11pt; }
td.p, th.p { text-align: left; } td.p { width: 44%; } tr { break-inside: avoid; }
td { font-size: 13.5pt; } .sku { font-size: 9pt; color: #666; } .z { color: #999; }
.dh { font-weight: bold; background: #fff7d6; font-size: 15pt; } .w { width: 8.5%; background: #fff; }
tr.tot td { font-weight: bold; background: #f3f3f3; } tr.neg td.dh { background: #ffd6d6; }
.ord td.p { width: auto; } .ord tr.first td { border-top: 2px solid #111; } .ord .w { width: 6%; }
.sec { break-before: page; } .gt { font-size: 14pt; margin: 10px 0; }
</style></head><body>
<h1>${h(titulo)}</h1>
<p class="sub">Desde el ${fmtDia(di)} a las ${h(hi)} (hora de Cuba) hasta hoy ${fmtDia(FECHA)} a las ${nowCuba}. Solo productos de la tienda (sin «Bajo pedido» ni productos de proveedor MK-).</p>
<div class="box"><b>Cómo se lee:</b> <b>Al empezar</b> = lo que había cuando empezó ${h(DE)}. <b>Entró</b> = mercancía que entró (entradas y devoluciones). <b>Salió</b> = vendido y entregado o recogido (web y mostrador). <b>Ajuste</b> = correcciones de conteo hechas en la caja. <b>Apartado</b> = pedidos web todavía en la tienda (ver lista al final). <b>Debe haber</b> = lo que tiene que estar físicamente en la tienda ahora, contando lo apartado.<br>
<b>Qué hacer:</b> cuenten juntas cada producto (incluido lo apartado), escriban el número en <b>Contado</b> y en <b>Diferencia</b> pongan Contado − Debe haber (falta = número con −).</div>
<p class="gt"><b>Totales:</b> Al empezar ${T("start")} · Entró +${T("entro")} · Salió −${T("salio")} · Ajuste ${sg(T("ajuste")) || 0} · Apartado ${T("heldNow")} · <b>Debe haber ${T("debe")}</b> unidades en ${rows.length} productos.</p>
${body}
<div class="sec"><h1>Pedidos apartados en la tienda (${openOrders.length})</h1>
<p class="sub">Pedidos web que ya descontaron stock de la web pero todavía están físicamente en la tienda (no entregados ni recogidos, ni con mensajero). Búsquenlos y márquenlos con ✓.</p>
${ord}
<h2>Productos que encontraron y no están en la lista</h2>
<table><thead><tr><th class="p">Producto</th><th>Contado</th><th class="p">Nota</th></tr></thead><tbody>${'<tr><td class="p" style="height:30px"></td><td></td><td class="p"></td></tr>'.repeat(8)}</tbody></table>
<p class="sub" style="margin-top:14px">Firmas: ${h(DE)} ______________________ &nbsp;&nbsp; ${h(A)} ______________________ &nbsp;&nbsp; Lennys ______________________</p></div>
</body></html>`;
writeFileSync(BASE + ".html", html, "utf8");
const browsers = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].filter(existsSync);
execFileSync(browsers[0], ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${BASE}.pdf`, "file:///" + (BASE + ".html").replace(/\\/g, "/")], { stdio: "ignore" });

console.log(JSON.stringify({ inicio_cuba: INICIO_CUBA, inicio_utc: START, ahora_utc: NOW, productos: rows.length, categorias: cats.length,
  totales: { al_empezar: T("start"), entro: T("entro"), salio: T("salio"), salio_web: T("salioWeb"), salio_caja: T("salioCaja"), ajuste: T("ajuste"), apartado: T("heldNow"), debe_haber: T("debe"), stock_web: T("now") },
  ajustes_a_mano_web: manuales, pedidos_apartados: openOrders.length, cuadre_mal: bad.length, negativos: rows.filter((r) => r.debe < 0 || r.start < 0).map((r) => `${r.name} (empezar ${r.start}, debe ${r.debe})`),
  pdf: BASE + ".pdf" }, null, 1));
