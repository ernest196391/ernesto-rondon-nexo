#!/usr/bin/env node
// Costos fiables + precio mínimo (14-oct-2026). NO CAMBIA NADA: lee fotos y escribe archivos.
//
// Uso: node scripts/precios/costos-y-minimo.mjs <carpeta>
//   <carpeta>/datos/web.json        ← scripts/precios/leer-web-costos.php (wp eval-file, solo lectura)
//   <carpeta>/datos/nube-costos.json ← nexo_business.catalog_products + product_costs (SELECT, ver README de la carpeta)
//   <carpeta>/datos/market.json     ← crm_market_items (id, supplier_price, my_price, …)
// Además lee la simulación del 11-oct (avisos y costos cruzados) y el Excel de octubre.
//
// Escribe en <carpeta>:
//   carga-costos.json     → lo que se carga en Core (_cvd_cost_usd): solo costos NO dudosos
//   estado-minimo.csv     → cada producto publicado: costo, precio, mínimo, OK / bajo el mínimo / sin costo
//   dudosos.json          → costos que NO se cargan (cruzados, ¿paquete?, ¿CUP?, precio < costo)
// y docs/nexo-business/precios/propuesta-2026-10-14.{md,csv}
//
// La fórmula del mínimo es la misma que CVD_Costs::floor() en Core (casa-viva-dropship-core/includes/class-cvd-costs.php).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const dir = resolve(process.argv[2] ?? join(repo, "docs/nexo-business/precios/2026-10-14"));
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const sim = join(repo, "docs/nexo-business/simulacion-precios/2026-10-11");

// ---------- reglas (iguales a Core) ----------
export const RULES = {
  tienda: { fixedUsd: 1.58, minPct: 10, minUsd: 1 },   // gastos fijos 407.408,5 CUP / 780 / 330 u.; ganancia mínima 10 % o 1 USD
  pedido: { fixedUsd: 0, minPct: 2.5, minUsd: 1 },     // bajo pedido (MK-): sin almacén; cubre cobros/transferencias (2,5 %)
};
const r2 = (v) => Math.round(v * 100) / 100;
const ceil2 = (v) => Math.ceil(v * 100 - 1e-6) / 100;
/** Precio mínimo: costo + gastos fijos + comisión + máx(minPct % del precio, minUsd). */
export function floor(cost, comm, rules) {
  const K = cost + rules.fixedUsd;
  const p = rules.minPct / 100;
  if (comm.type === "fixed") return ceil2(Math.max(K + comm.value + rules.minUsd, (K + comm.value) / (1 - p)));
  const c = comm.value / 100;
  return ceil2(Math.max((K + rules.minUsd) / (1 - c), K / (1 - c - p)));
}
const commAt = (comm, price) => (comm.type === "fixed" ? comm.value : (price * comm.value) / 100);
const step = (v) => (v <= 100 ? 1 : v <= 500 ? 5 : 10);
const roundUp = (v) => Math.ceil(v / step(v) - 1e-9) * step(v);

// ---------- datos ----------
const web = readJson(join(dir, "datos/web.json"));
const cloud = readJson(join(dir, "datos/nube-costos.json"));
const market = readJson(join(dir, "datos/market.json"));
const defaultRate = Number(web.cvd_default_commission_rate ?? 10);
const parseCsv = (file) => {
  const L = readFileSync(file, "utf8").replace(/^﻿/, "").trim().split(/\r?\n/);
  const h = L[0].split(";");
  return L.slice(1).map((l) => { const c = l.split(";"); return Object.fromEntries(h.map((k, i) => [k, c[i] ?? ""])); });
};
const num = (s) => (s === "" || s == null ? null : Number(String(s).replace(",", ".")));
const simRows = new Map(parseCsv(join(sim, "simulacion-precios.csv")).map((r) => [r.producto_id, r]));
const crossRows = new Map(parseCsv(join(sim, "posibles-costos-cruzados.csv")).filter((r) => r.nivel === "ALTA" || r.nivel === "MEDIA").map((r) => [r.producto_id, r]));
const byId = new Map(web.products.map((p) => [Number(p.id), p]));
const marketById = new Map(market.map((m) => [Number(m.id), m]));

function commissionOf(p) {
  for (const q of [p, p.parent_id ? byId.get(Number(p.parent_id)) : null]) {
    if (!q) continue;
    if (q.commission_type !== "" || q.commission_value !== "") {
      return { type: q.commission_type === "fixed" ? "fixed" : "percent", value: Number(q.commission_value || 0), source: q === p ? "producto" : "padre" };
    }
  }
  return { type: "percent", value: defaultRate, source: "general" };
}
const isMk = (p) => /^MK-/i.test(p.sku || "") || /^MK-/i.test(byId.get(Number(p.parent_id))?.sku || "");
const sellable = web.products.filter((p) => p.type !== "variable" && p.status === "publish" && (p.type !== "variation" || p.parent_status === "publish"));
const displayName = (p) => p.name.replace(/\s+/g, " ").trim();

// ---------- 1) costos fiables y dudosos ----------
// Revisados a mano el 14-oct: el aviso no aplica (se cargan).
const TRUST = {
  2489: "fila 45 «PARAGUAS DE NÑA 55CM,8H» = 1,08 USD: coincide nombre y medida (no es un error, es barato)",
  2704: "Lennys eligió el 13-oct la fila 301 «CORTINA BAÑO TEFLON MARYTA» = 8,5 USD (se vende a 8: va en la lista de bajo el mínimo)",
};
const load = [];     // { id, cost, source, note }
const doubtful = []; // { id, name, cost, price, kind, why, proposed, evidence }
for (const c of cloud) {
  if (!c.woo_id || c.retired) continue;
  const p = byId.get(Number(c.woo_id));
  if (!p) continue;
  const cost = r2(c.pa / (c.rate || 1) + (c.fr || 0));
  const s = simRows.get(c.product_id);
  const simCost = s ? num(s.compra_usd) + 0 : null;
  const changed = s ? Math.abs(simCost - c.pa / (c.rate || 1)) > 0.009 : true; // costo cambiado (o producto nuevo) después del 11-oct
  const price = Number(p.price || p.regular_price || 0);
  const flags = [];
  if (!changed && s) {
    const cross = crossRows.get(c.product_id);
    if (cross) flags.push({ kind: "cruzado-" + cross.nivel.toLowerCase(), cross });
    for (const a of (s.avisos || "").split(", ")) {
      if (a === "¿costo del paquete?") flags.push({ kind: "paquete" });
      if (a === "¿CUP apuntado como USD?") flags.push({ kind: "cup" });
      if (a === "costo muy bajo (¿seguro?)") flags.push({ kind: "muy-bajo" });
    }
  }
  if (price > 0 && cost > price) flags.push({ kind: "precio-menor-que-costo" });
  if (flags.length && !TRUST[c.woo_id]) { doubtful.push({ id: Number(c.woo_id), productId: c.product_id, name: displayName(p), cost, price, flags, status: p.status }); continue; }
  load.push({ id: Number(c.woo_id), cost, source: changed ? "manual" : "bizne", productId: c.product_id });
}
// bajo pedido: supplier_price de la bolsa
for (const p of web.products) {
  if (!/^MK-/i.test(p.sku || "")) continue;
  const m = marketById.get(Number(p.sku.slice(3)));
  if (!m || m.currency !== "USD" || !(Number(m.supplier_price) > 0)) continue;
  load.push({ id: Number(p.id), cost: r2(Number(m.supplier_price)), source: "proveedor", itemId: m.id });
}
const costById = new Map(load.map((l) => [l.id, l]));
const doubtById = new Map(doubtful.map((d) => [d.id, d]));
const costFor = (p) => costById.get(Number(p.id)) ?? (p.parent_id ? costById.get(Number(p.parent_id)) : null) ?? null;

// ---------- 2) mínimo para cada producto publicado ----------
const rows = sellable.map((p) => {
  const mk = isMk(p);
  const rules = mk ? RULES.pedido : RULES.tienda;
  const comm = commissionOf(p);
  const price = Number(p.price || 0);
  const c = costFor(p);
  const base = { id: Number(p.id), parent: Number(p.parent_id) || null, sku: p.sku, name: displayName(p), kind: mk ? "bajo pedido" : "tienda", price, regular: Number(p.regular_price || 0),
    comm, commUsd: r2(commAt(comm, price)), sold90: p.sold_90d, stock: p.stock_status, doubt: doubtById.get(Number(p.id)) ?? null };
  if (!c) return { ...base, cost: null, floor: null, status: "sin_costo" };
  const f = floor(c.cost, comm, rules);
  const profit = r2(price - c.cost - rules.fixedUsd - commAt(comm, price));
  return { ...base, cost: c.cost, source: c.source, floor: f, profit, status: price + 0.005 >= f ? "ok" : "bajo" };
});

// ---------- 3) recomendación para los que están bajo el mínimo ----------
function recommend(r) {
  const rules = r.kind === "bajo pedido" ? RULES.pedido : RULES.tienda;
  const K = r.cost + rules.fixedUsd;
  const up = roundUp(r.floor);
  const raisePct = (up - r.price) / r.price;
  // comisión fija máxima (a medio dólar) que deja el precio de hoy en el mínimo
  const maxComm = Math.floor((r.price - K - Math.max((rules.minPct / 100) * r.price, rules.minUsd)) * 2) / 2;
  const odd = r.comm.type === "fixed" && r.commUsd > 0.25 * r.price ? ` (comisión de ${fmt(r.commUsd)} USD en un producto de ${fmt(r.price)}: ¿error al apuntarla?)` : "";
  if (raisePct <= 0.15) return { action: "subir", to: up, text: `subir a ${up} USD` };
  // Comisión por encima de la regla de Lennys (10 % del precio, al dólar, mínimo 1): se ajusta a la regla.
  const lennys = (P) => Math.max(1, Math.ceil(P * 0.1 - 1e-9));
  if (r.kind === "tienda" && r.commUsd > lennys(r.price)) {
    for (let P = Math.ceil(r.price); P <= r.price * 1.15 + 1e-9; P++) {
      const c = lennys(P);
      if (c < r.commUsd && P + 0.005 >= floor(r.cost, { type: "fixed", value: c }, rules)) {
        return P === r.price ? { action: "comision", to: c, text: `bajar comisión fija a ${c} USD (regla de Lennys: 10 %)${odd}` }
          : { action: "ambos", to: P, comm: c, text: `subir a ${P} USD y comisión fija a ${c} USD (regla de Lennys: 10 %)${odd}` };
      }
    }
  }
  if (maxComm >= 1 && maxComm < r.commUsd) return { action: "comision", to: maxComm, text: `bajar comisión fija a ${fmt(maxComm)} USD${odd}` };
  if (raisePct <= 0.35 || r.kind === "bajo pedido") return { action: "subir", to: up, text: `subir a ${up} USD` };
  return { action: "liquidar", to: null, text: `liquidar y no reponer (necesitaría ${up} USD)` };
}
const fmt = (v) => (v == null ? "" : Number(v).toLocaleString("es", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }));
for (const r of rows) if (r.status === "bajo") r.rec = recommend(r);

// ---------- 4) costos dudosos: costo propuesto con evidencia (NO se cargan) ----------
const excel = readJson(join(repo, "docs/nexo-business/import/excel-costs-2026-10.json")); // [fila, nombre, compra, flete, comisión, dueña]
const xrow = (n) => excel.find((e) => e[0] === n);
const xtxt = (n) => { const e = xrow(n); return `fila ${n} «${String(e[1]).replace(/\s+/g, " ").trim()}» = ${fmt(e[2])} USD (comisión ${fmt(e[4])})`; };
// Revisado a mano el 14-oct: nombre, medida, precio y comisión de cada fila del Excel de octubre.
const MANUAL = {
  "Cojín decorativo": { cost: 7, why: () => `hoy tiene el costo de la fila 6 «arbolito decorativo» (5,63). Los cojines del Excel son forro + relleno: ${xtxt(108)} + ${xtxt(116)} → 7 con relleno (4 si es solo el forro)` },
  "Árbol de navidad": { cost: 17.85, why: () => `hoy tiene la fila 9 «adorno de navidad arbol cartel» (3,85). Misma medida: ${xtxt(56)}` },
  "Estante esquinero": { cost: 18, why: () => `dos filas posibles: ${xtxt(176)} y ${xtxt(44)}. La web paga 3 USD de comisión, como la de 18 → se queda en 18 salvo que Lennys diga otra cosa` },
  "Lámparas recargables con panel solar": { cost: 15, why: () => `hoy tiene la fila 77 «lampara recargable con base» (10). Mismo nombre: ${xtxt(231)}` },
  "Mochila M- 1": { cost: 9, why: () => `hoy tiene la fila 105 «TERMO 1 L» (10,2). Las mochilas Gorder (filas 50-54) cuestan todas 9 USD, p. ej. ${xtxt(50)}` },
  "Set de utensilios para cocina (5 piezas)": { cost: 1.68, why: () => `hoy tiene la fila 126 «SET POZUELO DE 5 PIEZAS-JAGUAR» (6). Mismo producto: ${xtxt(47)}` },
  "Zapatera 5 niveles": { cost: null, why: () => `hoy tiene la fila 43 «MUEBLE ZAPATERA DE 10 NIVELES» (23). En el Excel no hay zapatera de 5 niveles; lo más parecido: ${xtxt(279)} y ${xtxt(296)}. Lo dice Lennys` },
  "Bucaro blanco": { cost: 8, why: () => `el 13-oct se enlazó por error con las filas 268/269 «GAVETERO BLANCO DAYRA» (53/48). Su fila: ${xtxt(100)}` },
  "Rasuradora": { cost: 8, why: () => `hoy tiene la fila 76 «Lampara recargable PORTATIL redonda» (19,5). Su fila: ${xtxt(208)} (la facial es la 212, 6 USD)` },
  "Luminoliss": { cost: 8, why: () => `hoy 12 = ${xtxt(190)}, igual que el precio. Otras filas: ${xtxt(221)} y ${xtxt(195)}. El 11-oct quedó apuntado «Luminoliss costo ¿8?»` },
};
const crossList = doubtful.map((d) => {
  const key = Object.keys(MANUAL).find((k) => d.name.startsWith(k));
  const m = key ? MANUAL[key] : null;
  const p = byId.get(d.id);
  const comm = commissionOf(p);
  const proposed = m ? m.cost : null;
  const fl = proposed != null ? floor(proposed, comm, RULES.tienda) : null;
  return { ...d, group: key ?? d.name, proposed, evidence: m ? m.why() : "sin fila clara en el Excel: lo dice Lennys", commUsd: r2(commAt(comm, d.price)),
    floorProposed: fl, okProposed: fl == null ? null : d.price + 0.005 >= fl };
});

// ---------- 5) efecto en la ganancia ----------
// «Ganancia limpia» = precio − costo − gastos fijos (1,58 tienda) − comisión. Una unidad de cada producto con costo.
function effect(list, apply) {
  let price = 0, profit = 0;
  for (const r of list) {
    let P = r.price, comm = r.comm;
    if (apply && r.rec) {
      if (r.rec.action === "liquidar") continue;
      if (r.rec.action === "subir") P = r.rec.to;
      if (r.rec.action === "comision") comm = { type: "fixed", value: r.rec.to };
      if (r.rec.action === "ambos") { P = r.rec.to; comm = { type: "fixed", value: r.rec.comm }; }
    }
    const rules = r.kind === "bajo pedido" ? RULES.pedido : RULES.tienda;
    price += P; profit += P - r.cost - rules.fixedUsd - commAt(comm, P);
  }
  return { price: r2(price), profit: r2(profit), pct: price ? r2((100 * profit) / price) : null };
}
const costed = rows.filter((r) => r.cost != null);
const tienda = costed.filter((r) => r.kind === "tienda");
const pedido = costed.filter((r) => r.kind === "bajo pedido");
const fx = { tiendaHoy: effect(tienda, false), tiendaDespues: effect(tienda, true), pedidoHoy: effect(pedido, false), todoHoy: effect(costed, false), todoDespues: effect(costed, true) };

// ---------- salida ----------
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "carga-costos.json"), JSON.stringify(load.map(({ id, cost, source }) => ({ id, cost, source })), null, 1));
writeFileSync(join(dir, "dudosos.json"), JSON.stringify(crossList.map((d) => ({ id: d.id, name: d.name, cost: d.cost, price: d.price, flags: d.flags.map((f) => f.kind), proposed: d.proposed, evidence: d.evidence })), null, 1));
const cell = (v) => (v == null ? "" : typeof v === "number" ? String(v).replace(".", ",") : String(v).replace(/;/g, ","));
const csv = (list, cols) => "﻿" + [cols.map((c) => c[0]).join(";"), ...list.map((r) => cols.map((c) => cell(c[1](r))).join(";"))].join("\r\n") + "\r\n";
const commTxt = (r) => (r.comm.type === "fixed" ? "fija " + fmt(r.comm.value) + " USD" : fmt(r.comm.value) + " %") + " (" + r.comm.source + ")";
writeFileSync(join(dir, "estado-minimo.csv"), csv(rows, [
  ["woo_id", (r) => r.id], ["padre", (r) => r.parent], ["sku", (r) => r.sku], ["producto", (r) => r.name], ["tipo", (r) => r.kind],
  ["costo_usd", (r) => r.cost], ["origen_costo", (r) => r.source], ["precio_hoy", (r) => r.price], ["comision_usd", (r) => r.commUsd], ["comision", commTxt],
  ["minimo_usd", (r) => r.floor], ["estado", (r) => ({ ok: "OK", bajo: "bajo el mínimo", sin_costo: "sin costo" })[r.status]],
  ["costo_dudoso", (r) => (r.doubt ? r.doubt.flags.map((f) => f.kind).join(" ") : "")], ["vendidas_90d", (r) => r.sold90],
]));

// Agrupar colores/diseños con los mismos números.
const baseName = (s) => { const i = Math.max(s.lastIndexOf(" - "), s.lastIndexOf(" — ")); return i > 0 ? s.slice(0, i).trim() : s; };
const groupRows = (list, keyFn) => {
  const g = new Map();
  for (const r of list) { const k = keyFn(r); if (!g.has(k)) g.set(k, []); g.get(k).push(r); }
  return [...g.values()].map((items) => ({ ...items[0], items, label: items.length > 1 ? `${baseName(items[0].name)} (${items.length} colores)` : items[0].name }));
};
const under = groupRows(rows.filter((r) => r.status === "bajo"), (r) => `${r.parent || r.id}|${r.cost}|${r.price}|${r.commUsd}`)
  .sort((a, b) => (b.floor - b.price) * b.items.length - (a.floor - a.price) * a.items.length);
const doubts = groupRows(crossList, (r) => `${byId.get(r.id).parent_id || r.id}|${r.cost}|${r.price}`);

const propDir = join(repo, "docs/nexo-business/precios");
writeFileSync(join(propDir, "propuesta-2026-10-14.csv"), csv([
  ...under.flatMap((g) => g.items.map((r) => ({ ...r, tipo: "bajo el mínimo" }))),
  ...crossList.map((r) => ({ ...r, tipo: "costo dudoso (no cargado)", floor: null })),
], [
  ["tipo", (r) => r.tipo], ["woo_id", (r) => r.id], ["producto", (r) => r.name], ["costo_usd", (r) => r.cost], ["precio_hoy", (r) => r.price],
  ["comision_hoy_usd", (r) => r.commUsd], ["minimo_usd", (r) => r.floor], ["recomendacion", (r) => r.rec?.text ?? ""],
  ["costo_propuesto", (r) => r.proposed ?? ""], ["minimo_con_costo_propuesto", (r) => r.floorProposed ?? ""],
  ["precio_hoy_alcanza", (r) => (r.okProposed == null ? "" : r.okProposed ? "sí" : "no")], ["evidencia", (r) => r.evidence ?? ""],
]));

const n = (s) => rows.filter((r) => r.status === s).length;
const recCount = (a) => under.filter((g) => g.rec.action === a).length;
const M = [];
M.push("# Precios: propuesta para Ernesto (14-oct-2026)", "");
M.push("**No se cambió ningún precio ni comisión.** Tú decides; Lennys corrige después.", "");
M.push("## Resumen", "");
M.push(`- **${rows.length} productos publicados** (cada color cuenta): ${rows.filter((r) => r.kind === "tienda").length} de la tienda y ${rows.filter((r) => r.kind === "bajo pedido").length} bajo pedido.`);
M.push(`- **Con costo en la web: ${costed.length}** (tienda ${tienda.length}, bajo pedido ${pedido.length}). **Sin costo: ${n("sin_costo")}**, todos de la tienda.`);
M.push(`- **OK: ${n("ok")} · Bajo el mínimo: ${n("bajo")}** (${under.length} productos) · de bajo pedido, ${pedido.filter((r) => r.status === "bajo").length} bajo el mínimo.`);
M.push(`- **Ganancia de la tienda** (productos con costo, 1 unidad de cada uno): hoy **${fmt(fx.tiendaHoy.pct)} %** → con esta propuesta **${fmt(fx.tiendaDespues.pct)} %**.`);
M.push(`- Bajo pedido (precio − proveedor − comisión): **${fmt(fx.pedidoHoy.pct)} %**. Todo junto (tienda + bajo pedido, que pesa mucho porque son cosas caras): hoy **${fmt(fx.todoHoy.pct)} %** → **${fmt(fx.todoDespues.pct)} %**.`);
M.push("- Ojo: a eso aún hay que quitarle cobros y dependienta (~2,5 % del precio).");
M.push(`- **Costos dudosos que NO se cargaron: ${crossList.length}** (${doubts.length} productos). Abajo, el costo que propongo y por qué.`);
M.push(`- Propuesta para los ${under.length}: subir precio ${recCount("subir")} · bajar comisión fija ${recCount("comision")} · subir un poco y comisión al 10 % ${recCount("ambos")} · liquidar y no reponer ${recCount("liquidar")}.`, "");
M.push("**Para aplicarlo:** contesta «sí a todo» o di cuáles no. Los costos dudosos los confirma Lennys (o tú) y los cargo.", "");
M.push("## La regla (precio mínimo)", "");
M.push("- **Tienda:** costo + 1,58 USD de gastos fijos + comisión de la gestora + ganancia mínima (el 10 % del precio, o 1 USD si es más).");
M.push("- **Bajo pedido:** costo del proveedor + comisión + ganancia mínima (2,5 % del precio o 1 USD). Sin gastos fijos: no ocupa almacén ni dependienta.");
M.push("- Comisión: la fija del producto, o el 10 % general. El recargo propio de la gestora va aparte (lo paga el cliente).");
M.push("- Se recalcula sola cada vez que se guarda un producto en la web.", "");
M.push(`## Bajo el mínimo (${under.length} productos, ${n("bajo")} con colores)`, "");
M.push("| Producto | Costo | Hoy | Comisión | Mínimo | Propuesta |", "|---|---|---|---|---|---|");
for (const g of under) M.push(`| ${g.label} | ${fmt(g.cost)} | ${fmt(g.price)} | ${fmt(g.commUsd)} | ${fmt(g.floor)} | **${g.rec.text}** |`);
M.push("", "Cómo elegí: si basta subir hasta un 15 %, subir; si no, bajar la comisión fija (nunca por debajo de 1 USD), o subir un poco y dejar la comisión en el 10 % del precio (regla de Lennys); si tampoco, subir si es hasta un 35 %; si haría falta más, liquidar lo que hay y no reponer.");
for (const g of under.filter((x) => TRUST[x.id])) M.push("", `Nota ${g.label}: ${TRUST[g.id]}.`);
M.push("", `## Costos dudosos: no cargados (${doubts.length} productos)`, "");
M.push("| Producto | Costo hoy | Precio | Propongo | ¿Alcanza el precio? | Por qué |", "|---|---|---|---|---|---|");
for (const g of doubts) M.push(`| ${g.label} | ${fmt(g.cost)} | ${fmt(g.price)} | **${g.proposed == null ? "—" : fmt(g.proposed)}** | ${g.okProposed == null ? "—" : g.okProposed ? "sí" : `no (mínimo ${fmt(g.floorProposed)})`} | ${g.evidence} |`);
M.push("", "Ya corregidos con Lennys el 11-13 oct (están cargados): toalla pequeña 5, alfombras 40×60 a 5, alfombra antirresbalante 7, set de 2 alfombras 8, cesto encimera 3,5, batas lisas 13,2, toallas Cisne Blanco 5. Varios siguen bajo el mínimo con el costo bueno (tabla de arriba).");
M.push("", `## Sin costo (${n("sin_costo")})`, "");
M.push("Productos de la tienda que no tienen costo en la ficha de costos de la nube. En cuanto Lennys les ponga costo en el panel (o entre mercancía con factura), pasa solo a la web. Lista: `2026-10-14/estado-minimo.csv` (estado «sin costo»).");
M.push("", "## Archivos", "", "- `propuesta-2026-10-14.csv`: esta lista para Excel.", "- `2026-10-14/estado-minimo.csv`: los publicados con costo, mínimo y estado.", "- `2026-10-14/antes-de-cargar.csv`: copia de lo que había en la web antes de cargar los costos.", "- Cálculo: `node scripts/precios/costos-y-minimo.mjs docs/nexo-business/precios/2026-10-14`.");
writeFileSync(join(propDir, "propuesta-2026-10-14.md"), M.join("\n") + "\n");

console.log(JSON.stringify({ publicados: rows.length, ok: n("ok"), bajo: n("bajo"), bajoProductos: under.length, sinCosto: n("sin_costo"), conCosto: costed.length, tienda: tienda.length, pedido: pedido.length,
  cargar: load.length, dudosos: crossList.length, dudososProductos: doubts.length, fx, recs: { subir: recCount("subir"), comision: recCount("comision"), ambos: recCount("ambos"), liquidar: recCount("liquidar") } }, null, 1));

