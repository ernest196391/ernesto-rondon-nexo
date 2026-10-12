#!/usr/bin/env node
// Simulador del motor de precios — NO CAMBIA NADA.
// Lee fotos de solo lectura (nube + web + Excel de octubre) y escribe un informe en markdown y CSV.
// Nunca escribe precios, comisiones ni meta en la nube ni en la web: no tiene ni credenciales ni red.
//
// Uso (Node 24, que entiende TypeScript):
//   node scripts/precios/simular-precios.mjs docs/nexo-business/simulacion-precios/2026-10-11
//
// La carpeta debe tener datos/ con:
//   nube-productos-con-costo.json  ← SELECT de nexo_business.catalog_products + product_costs + product_commissions (ver LEEME.md)
//   nube-import-review.json        ← SELECT de nexo_business.import_review (emparejamiento Excel→producto)
//   web.json                       ← scripts/precios/leer-web.php con wp eval-file (solo lectura)
//   extra-manual.json              ← productos sin costo en la nube con datos dados a mano (Parker)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { quotePrice, quoteAtMarketPrice, fixedShareFromPolicy, round2 } from "../../packages/business-domain/src/pricing/engine.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const outDir = resolve(process.argv[2] ?? join(repo, "docs/nexo-business/simulacion-precios/2026-10-11"));
const dataDir = join(outDir, "datos");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

const policy = readJson(join(repo, "packages/business-domain/src/pricing/config/casa-viva.v1.json"));
const cloud = readJson(join(dataDir, "nube-productos-con-costo.json"));
const review = readJson(join(dataDir, "nube-import-review.json")).rows;
const web = readJson(join(dataDir, "web.json"));
const extra = readJson(join(dataDir, "extra-manual.json")).rows;
const excel = readJson(join(repo, "docs/nexo-business/import/excel-costs-2026-10.json"));

const CLOUD_CUP = 775; // nexo_business.exchange_rates (3-oct). La web manda la del día.
const webRate = Number(web.cvd_daily_rates?.cup) || null;
const rates = { cup: webRate, updatedAt: web.cvd_daily_rates?.updated_at ? new Date(web.cvd_daily_rates.updated_at * 1000).toISOString() : undefined, otherCup: { source: "nube", value: CLOUD_CUP } };
const now = web.fetched_at;
const fixedShare = fixedShareFromPolicy(policy, webRate);
const defaultRate = Number(web.cvd_default_commission_rate ?? 10);

const webById = new Map(web.products.map((p) => [Number(p.id), p]));
function webCommission(wooId, priceUsd) {
  const p = webById.get(Number(wooId));
  if (!p) return { usd: round2((priceUsd * defaultRate) / 100), source: `general ${defaultRate} %` };
  let own = p;
  if (p.commission_type === "" && p.commission_value === "" && p.parent_id) own = webById.get(Number(p.parent_id)) ?? p;
  if (own.commission_type !== "" || own.commission_value !== "") {
    const v = Number(own.commission_value || 0);
    const src = own === p ? "producto" : "producto padre";
    return own.commission_type === "fixed" ? { usd: v, source: `${src} fija` } : { usd: round2((priceUsd * v) / 100), source: `${src} ${v} %` };
  }
  return { usd: round2((priceUsd * defaultRate) / 100), source: `general ${defaultRate} %` };
}

// ------------------------------------------------------------ simulación por producto
const rows = [];
const all = [
  ...cloud.rows.map((r) => ({ ...r, profile: "tienda-casa-viva", origin: "nube" })),
  ...extra.map((r) => ({ ...r, active: true, price_minor: null, origin: "manual" })),
];
for (const r of all) {
  const w = r.woo_id ? webById.get(Number(r.woo_id)) : null;
  const webPrice = w && w.price !== "" ? Number(w.price) : null;
  const cloudPrice = r.price_minor != null ? r.price_minor / 100 : null;
  const priceToday = webPrice ?? cloudPrice;
  if (!priceToday) continue;
  const comToday = webCommission(r.woo_id, priceToday);
  const input = {
    productId: r.product_id, name: r.name, category: r.category ?? null, supplierId: r.supplier ?? null, profile: r.profile,
    cost: { amount: r.purchase_amount, currency: r.purchase_currency, purchaseRate: r.purchase_rate || 1 },
    freightUsd: r.freight_usd ?? 0, fixedCostShareUsd: r.profile === "tienda-casa-viva" ? fixedShare : undefined, rates, now,
  };
  const today = quoteAtMarketPrice(policy, input, priceToday, { mode: "fixed_usd", value: comToday.usd, skipGuard: true, source: comToday.source });
  const ruleAtToday = quoteAtMarketPrice(policy, input, priceToday);
  const sug = quotePrice(policy, input);
  // Definición «pierde dinero» igual que la lista enviada a Lennys (outbox 480):
  // precio de la nube − compra − flete − (comisión de product_commissions, o 10 % del precio) < 0.
  const simpleCommission = r.product_commission_usd ?? (cloudPrice ?? priceToday) * 0.1;
  const simpleNet = (cloudPrice ?? priceToday) - r.purchase_amount / (r.purchase_rate || 1) - (r.freight_usd ?? 0) - simpleCommission;
  const flags = new Set(today.guards.filter((g) => g.code !== "tasa-distinta" && g.code !== "sin-tasa").map((g) => g.code));
  if (today.ownerProfitUsd < 2.5 && today.ownerProfitUsd >= 0) flags.add("tienda-gana-menos-de-2.5");
  if (webPrice != null && cloudPrice != null && Math.abs(webPrice - cloudPrice) > 0.009) flags.add("precio-web-distinto-nube");
  const cloudCom = r.product_commission_usd;
  if (cloudCom != null && Math.abs(cloudCom - comToday.usd) > 0.009) flags.add("comision-web-distinta-nube");
  rows.push({
    r, w, webPrice, cloudPrice, priceToday, comToday, today, ruleAtToday, sug, simpleNet: round2(simpleNet),
    losesSimple: simpleNet < -1e-9, flags: [...flags],
  });
}

// ------------------------------------------------------------ auditoría de emparejamiento Excel → producto
const STOP = new Set(["de", "la", "el", "para", "con", "y", "en", "a", "los", "las", "del", "por", "al", "un", "una", "nuevo", "nueva", "nuevas", "nuevos"]);
function norm(s) {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/×/g, "x").replace(/(\d)\s*x\s*(\d)/g, "$1x$2").replace(/(\d)\s*x\s*(\d)/g, "$1x$2")
    .replace(/(\d),(\d)/g, "$1.$2").replace(/[^a-z0-9.x ]+/g, " ").replace(/\s+/g, " ").trim();
}
function sizeTokens(s) {
  const n = norm(s);
  const out = new Set();
  for (const m of n.matchAll(/\b\d+(?:\.\d+)?x\d+(?:\.\d+)?(?:x\d+(?:\.\d+)?)?\b/g)) out.add(m[0]);
  for (const m of n.matchAll(/\b(\d+(?:\.\d+)?)\s*(cm|mm|m|l|lt|lts|litros|litro|pcs|pc|pz|pzas|piezas|pieza|niveles|nivel|pisos|piso|plazas|w|we)\b/g)) {
    const u = { lt: "l", lts: "l", litros: "l", litro: "l", pcs: "pz", pc: "pz", pzas: "pz", piezas: "pz", pieza: "pz", niveles: "niv", nivel: "niv", pisos: "niv", piso: "niv", we: "w" }[m[2]] ?? m[2];
    out.add(m[1] + u);
  }
  for (const m of n.matchAll(/\b(?:set|juego|kit|pack) de (\d+)\b/g)) out.add(m[1] + "pz");
  return out;
}
function words(s) {
  return new Set(norm(s).split(" ").filter((t) => t && !STOP.has(t) && !/^\d/.test(t)).map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t)));
}
function bigrams(s) {
  const c = [...words(s)].sort().join("");
  const out = new Map();
  for (let i = 0; i < c.length - 1; i++) { const g = c.slice(i, i + 2); out.set(g, (out.get(g) ?? 0) + 1); }
  return out;
}
function similarity(a, b) {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return { sim: 0, sizeConflict: false };
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const wordDice = (2 * inter) / (A.size + B.size);
  // Letras de dos en dos sobre el nombre sin espacios: «Sobrecama» = «Sobre cama».
  const ga = bigrams(a), gb = bigrams(b);
  let gi = 0, na = 0, nb = 0;
  for (const [g, n] of ga) { na += n; gi += Math.min(n, gb.get(g) ?? 0); }
  for (const n of gb.values()) nb += n;
  const charDice = na + nb ? (2 * gi) / (na + nb) : 0;
  let sim = Math.max(wordDice, charDice * 0.95);
  const sa = sizeTokens(a), sb = sizeTokens(b);
  let sizeConflict = false;
  if (sa.size && sb.size) {
    const shared = [...sa].some((t) => sb.has(t));
    if (shared) sim = Math.min(1, sim + 0.15);
    else { sim *= 0.4; sizeConflict = true; }
  } else if (sa.size || sb.size) sim *= 0.9;
  return { sim: round2(sim), sizeConflict };
}
const baseName = (n) => String(n).split(" — ")[0];
const excelRows = excel.map(([fila, nombre, compra, flete, comision, duena]) => ({ fila, nombre, compra, flete, comision, duena }));
const reviewByProduct = new Map();
for (const rv of review) if (rv.product_id) (reviewByProduct.get(rv.product_id) ?? reviewByProduct.set(rv.product_id, []).get(rv.product_id)).push(rv);

const audit = [];
for (const r of cloud.rows) {
  const name = baseName(r.name);
  const cost = r.purchase_amount / (r.purchase_rate || 1);
  const linked = reviewByProduct.get(r.product_id) ?? [];
  const sameCost = linked.filter((x) => Math.abs((x.purchase_usd ?? -1) - cost) < 0.01);
  const rank = { imported: 3, resolved: 2, needs_review: 1, ignored: 0 };
  sameCost.sort((a, b) => (rank[b.status] ?? 0) - (rank[a.status] ?? 0) || (b.score ?? 0) - (a.score ?? 0));
  let matched = sameCost[0] ?? null;
  let matchedFrom = matched ? "import_review" : null;
  if (!matched) {
    // Sin fila enlazada con ese costo: la fila del Excel con el mismo costo y el nombre más parecido.
    const cands = excelRows.filter((e) => Math.abs(e.compra - cost) < 0.01).map((e) => ({ e, s: similarity(name, e.nombre) })).sort((a, b) => b.s.sim - a.s.sim);
    if (cands[0] && cands[0].s.sim >= 0.3) {
      matched = { source_row: cands[0].e.fila, excel_name: cands[0].e.nombre, purchase_usd: cands[0].e.compra, score: null, status: "deducida" };
      matchedFrom = "mismo-costo";
    }
  }
  const mSim = matched ? similarity(name, matched.excel_name) : null;
  const alts = excelRows
    .filter((e) => !matched || e.fila !== matched.source_row)
    .map((e) => ({ ...e, ...similarity(name, e.nombre) }))
    .filter((e) => e.sim >= 0.35)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 3);
  const best = alts[0];
  const reasons = [];
  let level = "";
  const diffPct = (a, b) => (Math.max(a, b) > 0 ? Math.abs(a - b) / Math.max(a, b) : 0);
  if (matched && mSim.sizeConflict) reasons.push(`la fila usada tiene otra medida (${[...sizeTokens(matched.excel_name)].join(", ")} y el producto ${[...sizeTokens(name)].join(", ") || "sin medida"})`);
  const perfect = linked.find((x) => (x.score ?? 0) >= 0.99 && Math.abs((x.purchase_usd ?? -1) - cost) >= 0.01);
  if (perfect) reasons.push(`la fila ${perfect.source_row} «${perfect.excel_name}» coincide al 100 % y dice ${round2(perfect.purchase_usd)}`);
  if (best && !best.sizeConflict && best.sim >= 0.6 && (!mSim || best.sim >= mSim.sim + 0.2) && diffPct(best.compra, cost) >= 0.2) {
    reasons.push(`la fila ${best.fila} «${best.nombre}» se parece más (${best.sim} contra ${mSim ? mSim.sim : "—"}) y dice ${round2(best.compra)}`);
  }
  // La fila usada es de otra cosa: la primera palabra del producto (el sustantivo) no aparece en ella.
  const GENERIC = new Set(["juego", "set", "kit", "pack", "par", "mueble", "estante"]);
  const noun = [...words(name)].find((w) => !GENERIC.has(w));
  const hasNoun = (excelName) => !noun || [...words(excelName)].some((w) => w.slice(0, 5) === noun.slice(0, 5));
  if (matched && !hasNoun(matched.excel_name)) reasons.push(`la fila usada «${matched.excel_name}» parece otro producto (no dice «${noun}»)`);
  const sim0 = rows.find((x) => x.r.product_id === r.product_id);
  const losing = sim0 ? sim0.losesSimple || cost >= sim0.priceToday : false;
  if (!reasons.length && best && !best.sizeConflict && best.sim >= 0.6 && mSim && best.sim >= mSim.sim + 0.1 && diffPct(best.compra, cost) >= 0.2 && hasNoun(best.nombre)) {
    const txt = `la fila ${best.fila} «${best.nombre}» se parece más (${best.sim} contra ${mSim.sim}) y dice ${round2(best.compra)}`;
    if (losing) reasons.push(`${txt}, y con el costo de hoy se pierde dinero`);
    else { level = "MEDIA"; reasons.push(txt); }
  }
  if (reasons.length && !level) level = "ALTA";
  else if (level) { /* MEDIA ya puesto */ }
  else if (matched && mSim.sim < 0.5 && best && best.sim >= 0.5 && !best.sizeConflict && diffPct(best.compra, cost) >= 0.2) {
    level = "MEDIA"; reasons.push(`la fila usada se parece poco (${mSim.sim}); la ${best.fila} «${best.nombre}» (${best.sim}) dice ${round2(best.compra)}`);
  } else if (!matched && best && best.sim >= 0.7 && !best.sizeConflict && diffPct(best.compra, cost) >= 0.3) {
    level = "MEDIA"; reasons.push(`el costo no sale de ninguna fila del Excel; la ${best.fila} «${best.nombre}» (${best.sim}) dice ${round2(best.compra)}`);
  }
  const sim = rows.find((x) => x.r.product_id === r.product_id);
  const suggestedCost = (() => {
    if (perfect) return perfect.purchase_usd;
    if (best && !best.sizeConflict && best.sim >= 0.6) return best.compra;
    return null;
  })();
  audit.push({
    r, name, cost, matched, matchedFrom, mSim, alts, level, reasons, suggestedCost,
    priceToday: sim?.priceToday ?? null, losesSimple: sim?.losesSimple ?? false,
    impact: suggestedCost != null ? Math.abs(cost - suggestedCost) : 0,
  });
}

// ------------------------------------------------------------ salidas
mkdirSync(outDir, { recursive: true });
const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "number" ? String(round2(v)).replace(".", ",") : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (header, data) => "﻿" + [header.join(";"), ...data.map((row) => row.map(csvCell).join(";"))].join("\r\n") + "\r\n";
const usd = (n) => (n === null || n === undefined ? "—" : `${round2(n).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);
const flagEs = {
  "bajo-costo": "se vende por debajo del costo",
  "perdida-tras-comision": "pierde después de la comisión",
  "ganancia-minima-no-alcanzada": "tienda gana menos de 2,5",
  "tienda-gana-menos-de-2.5": "tienda gana menos de 2,5",
  "posible-paquete": "¿costo del paquete?",
  "posible-cup-como-usd": "¿CUP apuntado como USD?",
  "costo-muy-bajo": "costo muy bajo (¿seguro?)",
  "bajo-suelo": "bajo el suelo",
  "precio-web-distinto-nube": "precio web ≠ nube",
  "comision-web-distinta-nube": "comisión web ≠ nube",
  "recargo-gestora-alto": "recargo de gestora alto",
  "comision-reducida": "comisión reducida",
  "tasa-vieja": "tasa vieja",
};
const flagText = (fl) => [...new Set(fl.map((f) => flagEs[f] ?? f))].join(", ");

const header = ["producto_id", "woo_id", "nombre", "categoria", "activo", "perfil", "compra_usd", "costo_total_usd", "precio_hoy_usd", "precio_nube_usd",
  "comision_hoy_usd", "origen_comision_hoy", "tienda_gana_hoy_usd", "margen_hoy_pct",
  "comision_regla_a_precio_hoy_usd", "tienda_gana_regla_a_precio_hoy_usd",
  "precio_sugerido_usd", "diferencia_sugerido_menos_hoy_usd", "comision_regla_sugerido_usd", "tienda_gana_sugerido_usd", "margen_sugerido_pct", "suelo_usd",
  "precio_sugerido_cup", "pierde_dinero_lista_lennys", "neto_lista_lennys_usd", "costo_cruzado_posible", "avisos"];
const auditById = new Map(audit.map((a) => [a.r.product_id, a]));
const csvRows = rows.map((x) => [x.r.product_id, x.r.woo_id, x.r.name, x.r.category, x.r.active ? "sí" : "no", x.r.profile, x.today.costs.purchaseUsd, x.today.costs.totalUsd,
  x.priceToday, x.cloudPrice, x.comToday.usd, x.comToday.source, x.today.ownerProfitUsd, x.today.ownerMarginPct,
  x.ruleAtToday.commissionUsd, x.ruleAtToday.ownerProfitUsd,
  x.sug.suggestedUsd, x.sug.suggestedUsd - x.priceToday, x.sug.commissionUsd, x.sug.ownerProfitUsd, x.sug.ownerMarginPct, x.sug.floorUsd,
  x.sug.priceCup, x.losesSimple ? "sí" : "no", x.simpleNet, auditById.get(x.r.product_id)?.level ?? "", flagText(x.flags)]);
writeFileSync(join(outDir, "simulacion-precios.csv"), toCsv(header, csvRows));

const aHeader = ["nivel", "producto_id", "nombre", "costo_hoy_usd", "precio_hoy_usd", "fila_usada", "nombre_fila_usada", "costo_fila_usada", "parecido_fila_usada", "como_se_sabe",
  "alternativa_1", "alternativa_2", "alternativa_3", "costo_que_podria_ser", "por_que"];
const altText = (e) => (e ? `fila ${e.fila} «${e.nombre}» = ${e.compra} USD (parecido ${e.sim}${e.sizeConflict ? ", otra medida" : ""})` : "");
const levelRank = { ALTA: 0, MEDIA: 1, "": 2 };
const auditSorted = [...audit].sort((a, b) => levelRank[a.level] - levelRank[b.level] || b.impact - a.impact || a.name.localeCompare(b.name));
writeFileSync(join(outDir, "posibles-costos-cruzados.csv"), toCsv(aHeader, auditSorted.map((a) => [a.level || "ok", a.r.product_id, a.r.name, a.cost, a.priceToday,
  a.matched?.source_row, a.matched?.excel_name, a.matched?.purchase_usd, a.mSim?.sim, a.matchedFrom ?? "sin fila del Excel",
  altText(a.alts[0]), altText(a.alts[1]), altText(a.alts[2]), a.suggestedCost, a.reasons.join(" · ")])));

// ------------------------------------------------------------ números clave
const store = rows.filter((x) => x.r.profile === "tienda-casa-viva");
const active = store.filter((x) => x.r.active);
const up = active.filter((x) => x.sug.suggestedUsd > x.priceToday + 0.009);
const down = active.filter((x) => x.sug.suggestedUsd < x.priceToday - 0.009);
const same = active.length - up.length - down.length;
const comChange = active.filter((x) => Math.abs(x.ruleAtToday.commissionUsd - x.comToday.usd) > 0.009);
const comUp = comChange.filter((x) => x.ruleAtToday.commissionUsd > x.comToday.usd);
const losers = store.filter((x) => x.losesSimple).sort((a, b) => a.simpleNet - b.simpleNet);
const losersEngine = store.filter((x) => x.today.ownerProfitUsd < 0);
const belowCost = store.filter((x) => x.flags.includes("bajo-costo"));
const lowStore = store.filter((x) => x.today.ownerProfitUsd >= 0 && x.today.ownerProfitUsd < 2.5);
const pack = store.filter((x) => x.flags.includes("posible-paquete"));
const cupUsd = store.filter((x) => x.flags.includes("posible-cup-como-usd"));
const priceMismatch = store.filter((x) => x.flags.includes("precio-web-distinto-nube"));
const comMismatch = store.filter((x) => x.flags.includes("comision-web-distinta-nube"));
const crossedHigh = audit.filter((a) => a.level === "ALTA");
const crossedMid = audit.filter((a) => a.level === "MEDIA");
const median = (arr) => { const s = [...arr].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// Top 20 para revisar: los que más se mueven (sin contar los que pierden dinero, que van en su propia lista).
const loserIds = new Set(losers.map((x) => x.r.product_id));
const top20Raw = active.filter((x) => !loserIds.has(x.r.product_id))
  .map((x) => ({ x, score: Math.abs(x.sug.suggestedUsd - x.priceToday) + (x.today.ownerProfitUsd < 2.5 ? 5 : 0) + (auditById.get(x.r.product_id)?.level === "ALTA" ? 10 : 0) }))
  .sort((a, b) => b.score - a.score);
// Un renglón por producto: los colores con los mismos números se juntan.
const top20 = [];
{
  const seen = new Map();
  for (const { x } of top20Raw) {
    const key = [baseName(x.r.name), x.priceToday, x.today.costs.purchaseUsd, x.comToday.usd].join("|");
    if (seen.has(key)) { seen.get(key).n++; continue; }
    const item = { x, n: 1 };
    seen.set(key, item);
    if (top20.length < 20) top20.push(item);
  }
}

const parker = rows.find((x) => x.r.product_id === "wc-1013");
const distinct = (list) => new Set(list.map((a) => baseName(a.r.name))).size;
// Sensibilidad: qué pasa con otros márgenes objetivo (para que Lennys decida el número).
function movesWithTarget(target) {
  const p = structuredClone(policy);
  p.profiles["tienda-casa-viva"].rules.targetNetMarginPct = target;
  let upN = 0, downN = 0;
  for (const x of active) {
    const input = { productId: x.r.product_id, profile: "tienda-casa-viva", cost: { amount: x.r.purchase_amount, currency: x.r.purchase_currency, purchaseRate: x.r.purchase_rate || 1 }, freightUsd: x.r.freight_usd ?? 0, fixedCostShareUsd: fixedShare, rates };
    const q = quotePrice(p, input);
    if (q.suggestedUsd > x.priceToday + 0.009) upN++; else if (q.suggestedUsd < x.priceToday - 0.009) downN++;
  }
  return { target, up: upN, down: downN, same: active.length - upN - downN };
}
const sensitivity = [8, 10, 12, 15, 18].map(movesWithTarget);

const L = [];
L.push(`# Simulación del motor de precios — Casa Viva, ${basename(outDir)} (fotos de datos del ${now.slice(0, 16).replace("T", " ")} UTC)`);
L.push("");
L.push("**Solo simulación: no se cambió ningún precio, comisión ni dato.** Reglas: `packages/business-domain/src/pricing/config/casa-viva.v1.json` (versión " + policy.version + ", borrador). Motor 1.0.0.");
L.push("");
L.push("## Resumen para Lennys");
L.push("");
L.push("| | Cuántos |");
L.push("|---|---|");
L.push(`| Productos con costo apuntado (nube) | ${store.length} (${active.length} activos) |`);
L.push(`| Con la regla, el precio **sube** | ${up.length} |`);
L.push(`| Con la regla, el precio **baja** | ${down.length} |`);
L.push(`| Se queda igual | ${same} |`);
L.push(`| La comisión de hoy cambia con la regla de Lennys (al precio de hoy) | ${comChange.length} (sube en ${comUp.length}, baja en ${comChange.length - comUp.length}) |`);
L.push(`| **Pierden dinero** (precio − compra − comisión < 0, la misma cuenta que la lista enviada) | **${losers.length}** |`);
L.push(`| Pierden dinero contando también gastos fijos (${usd(fixedShare)} USD/unidad) e imprevistos | ${losersEngine.length} |`);
L.push(`| Se venden por debajo de lo que costó comprarlos | ${belowCost.length} |`);
L.push(`| La tienda gana menos de 2,5 USD (y no pierde) | ${lowStore.length} |`);
L.push(`| ¿Costo del paquete en vez de la unidad? | ${pack.length} |`);
L.push(`| ¿Costo en CUP apuntado como USD? | ${cupUsd.length} |`);
L.push(`| **Costo probablemente cruzado con otra fila del Excel** | **${distinct(crossedHigh)} productos** (${crossedHigh.length} contando colores) + ${distinct(crossedMid)} por revisar |`);
L.push("");
L.push(`- Tasa del CUP: la web usa **${webRate}** y la nube **${CLOUD_CUP}**. Tiene que quedar una sola (la de la web).`);
L.push(`- Precio web distinto del de la nube: ${priceMismatch.length} productos. Comisión web distinta de la nube: ${comMismatch.length}.`);
L.push(`- Hoy la tienda gana de mediana **${usd(median(active.map((x) => x.today.ownerProfitUsd)))} USD** por unidad (${usd(median(active.map((x) => x.today.ownerMarginPct)))} %), y la gestora **${usd(median(active.map((x) => x.comToday.usd)))} USD**.`);
L.push(`- Con la regla (precio sugerido): tienda **${usd(median(active.map((x) => x.sug.ownerProfitUsd)))} USD** (${usd(median(active.map((x) => x.sug.ownerMarginPct)))} %), gestora **${usd(median(active.map((x) => x.sug.commissionUsd)))} USD**.`);
L.push("");
L.push("**Ojo:** muchos de los que pierden dinero tienen el costo cruzado con otra fila del Excel de octubre (ver `posibles-costos-cruzados.md`). Primero hay que corregir esos costos; después la simulación cambia.");
L.push("");
L.push("## Las reglas que se simularon (borrador, Lennys decide)");
L.push("");
const t = policy.profiles["tienda-casa-viva"].rules;
L.push(`- Costo total = compra + flete + gastos fijos (${usd(fixedShare)} USD por unidad: ${policy.fixedCosts.monthlyCup.toLocaleString("es-ES")} CUP al mes ÷ ${webRate} ÷ ${policy.fixedCosts.unitsPerMonth} unidades), + ${t.contingencyPct} % de imprevistos.`);
L.push(`- Gastos variables: ${t.variablePct} % del precio (otros cargos 2 % + dependienta 0,5 %).`);
L.push(`- Precio sugerido: el menor precio en dólares enteros que deja a la tienda un **${t.targetNetMarginPct} % limpio** (consignación: ${policy.profiles["tienda-casa-viva"].consignacion.targetNetMarginPct} %). Nunca por debajo del ${t.minNetMarginPct} %.`);
L.push(`- Comisión de la gestora: **${t.commission.pct} % del precio, hacia arriba al dólar**; sube hasta el ${t.commission.maxPct} % si la tienda sigue ganando al menos lo mismo que la gestora. Si la tienda gana menos de **${t.minOwnerProfitUsd} USD**, la comisión baja (nunca de ${t.commission.minUsd} USD).`);
L.push(`- El recargo propio de la gestora va aparte (suma), como hoy en la web.`);
L.push("");
L.push("**Si el margen limpio objetivo fuera otro** (con los costos de hoy, incluidos los cruzados):");
L.push("");
L.push("| Margen limpio objetivo | Suben | Bajan | Igual |");
L.push("|---|---|---|---|");
for (const s of sensitivity) L.push(`| ${s.target} %${s.target === t.targetNetMarginPct ? " (el simulado)" : ""} | ${s.up} | ${s.down} | ${s.same} |`);
L.push("");
L.push(`## Los ${losers.length} que pierden dinero`);
L.push("");
L.push(`Son **${distinct(losers)} productos distintos** (cada color cuenta como un renglón). En ${losers.filter((x) => auditById.get(x.r.product_id)?.level).length} renglones el costo parece cruzado con otra fila del Excel.`);
L.push("");
L.push("| Producto | Compra | Precio hoy | Comisión | Queda | Qué parece | Costo del Excel que podría ser |");
L.push("|---|---|---|---|---|---|---|");
for (const x of losers) {
  const a = auditById.get(x.r.product_id);
  const why = a?.level ? "costo cruzado con otra fila" : flagText(x.flags.filter((f) => ["posible-paquete", "posible-cup-como-usd"].includes(f))) || "precio bajo o costo raro";
  L.push(`| ${x.r.name} | ${usd(x.today.costs.purchaseUsd)} | ${usd(x.cloudPrice ?? x.priceToday)} | ${usd(x.r.product_commission_usd ?? (x.cloudPrice ?? x.priceToday) * 0.1)} | **${usd(x.simpleNet)}** | ${why} | ${a?.suggestedCost != null ? usd(a.suggestedCost) : "—"} |`);
}
L.push("");
L.push("## Los 20 que más conviene revisar (sin contar los de arriba)");
L.push("");
L.push("| Producto | Compra | Precio hoy | Sugerido | Comisión hoy → regla | Tienda gana hoy → sugerido | Avisos |");
L.push("|---|---|---|---|---|---|---|");
const crossLabel = (id) => ({ ALTA: ["costo cruzado"], MEDIA: ["¿costo cruzado?"] })[auditById.get(id)?.level] ?? [];
for (const { x, n } of top20) {
  L.push(`| ${n > 1 ? `${baseName(x.r.name)} (${n} colores)` : x.r.name} | ${usd(x.today.costs.purchaseUsd)} | ${usd(x.priceToday)} | **${usd(x.sug.suggestedUsd)}** | ${usd(x.comToday.usd)} → ${usd(x.sug.commissionUsd)} | ${usd(x.today.ownerProfitUsd)} → ${usd(x.sug.ownerProfitUsd)} | ${flagText([...x.flags, ...crossLabel(x.r.product_id)]) || "—"} |`);
}
L.push("");
if (parker) {
  const p = parker;
  const nexoToday = p.today.ownerProfitUsd;
  L.push("## Aire split Parker (producto 1013), perfil «NEXO bajo pedido» (D43)");
  L.push("");
  L.push(`- Proveedor ${usd(p.today.costs.purchaseUsd)} USD, precio web ${usd(p.priceToday)} USD, comisión en la web **fija de ${usd(p.comToday.usd)} USD**.`);
  L.push(`- Hoy, con la comisión fija: NEXO se queda **${usd(nexoToday)} USD antes del transporte**. El mínimo para NEXO es ${policy.profiles["nexo-bajo-pedido"].rules.minOwnerProfitUsd} USD: **si el transporte pasa de ${usd(nexoToday - 10)} USD, se rompe el mínimo**; si pasa de ${usd(nexoToday)} USD, NEXO pierde.`);
  L.push(`- Con D43 (40 % del margen para la gestora, sin transporte): gestora ${usd(p.ruleAtToday.commissionUsd)} USD / NEXO ${usd(p.ruleAtToday.ownerProfitUsd)} USD. Con D43 el mínimo se rompe si el transporte pasa de ${usd(29 - 10 / 0.6)} USD.`);
  L.push(`- Precio sugerido por D43 (proveedor + el mayor de 30 USD y el 9 %): **${usd(p.sug.suggestedUsd)} USD** sin transporte (suelo ${usd(p.sug.floorUsd)}). Cada dólar de transporte se suma encima.`);
  L.push("- Ojo: si la gestora pone su propio recargo en la web, Core le paga **comisión + recargo** (suma). D43 dice que el recargo **cuenta dentro** de su 40 %. En la web hoy no se cumple D43 para este producto.");
  L.push("");
}
L.push("## Cómo se hizo (para repetirlo)");
L.push("");
L.push("1. Fotos de solo lectura en `datos/`: nube (`SELECT` a `nexo_business`), web (`scripts/precios/leer-web.php` con `wp eval-file -`) y el Excel ya importado (`docs/nexo-business/import/excel-costs-2026-10.json`).");
L.push("2. `node scripts/precios/simular-precios.mjs docs/nexo-business/simulacion-precios/" + basename(outDir) + "`");
L.push("3. Archivos: `simulacion-precios.csv` (un renglón por producto, se abre en Excel), `posibles-costos-cruzados.csv/.md`, este informe y `mensaje-para-lennys.md`.");
L.push("4. Comisión «hoy» = la que paga la web (`_cvd_commission_type/value` del producto o del padre; si no tiene, la general " + defaultRate + " %). Precio «hoy» = el de la web.");
L.push("5. «Pierde dinero» usa la misma cuenta que la lista ya enviada a Lennys (precio de la nube − compra − flete − comisión de la nube o 10 %), para que los números coincidan.");
writeFileSync(join(outDir, "informe.md"), L.join("\n") + "\n");

// Markdown de costos cruzados
const C = [];
C.push(`# Posibles costos cruzados — importación del Excel de octubre`);
C.push("");
C.push("**Solo lectura: no se cambió ningún costo.** Para cada producto con costo se busca de qué fila del Excel de Maryta salió (tabla `import_review` de la nube) y qué filas se le parecen más por el nombre. Las medidas (40x60, 12 L, 2 piezas…) tienen que coincidir.");
C.push("");
C.push(`- **ALTA** (casi seguro cruzado): ${distinct(crossedHigh)} productos (${crossedHigh.length} renglones contando colores) · **MEDIA** (revisar): ${distinct(crossedMid)} · sin problema visible: ${audit.length - crossedHigh.length - crossedMid.length} renglones.`);
C.push("- «Podría ser» = el costo de la fila del Excel que mejor coincide. Es una pista, no una corrección: lo confirma Lennys.");
C.push(`- De los ${losers.length} que pierden dinero, ${losers.filter((x) => auditById.get(x.r.product_id)?.level).length} tienen el costo marcado aquí.`);
C.push("- Lista completa con las 3 mejores alternativas: `posibles-costos-cruzados.csv`.");
C.push("");
C.push("| Nivel | Producto | Costo hoy | Precio hoy | Salió de la fila | Fila que se parece más | Podría ser | Por qué |");
C.push("|---|---|---|---|---|---|---|---|");
for (const a of auditSorted.filter((a) => a.level)) {
  C.push(`| ${a.level} | ${a.r.name} | ${usd(a.cost)} | ${usd(a.priceToday)} | ${a.matched ? `${a.matched.source_row} «${a.matched.excel_name}» (${usd(a.matched.purchase_usd)})` : "—"} | ${a.alts[0] ? `${a.alts[0].fila} «${a.alts[0].nombre}» (${usd(a.alts[0].compra)})` : "—"} | ${a.suggestedCost != null ? `**${usd(a.suggestedCost)}**` : "—"} | ${a.reasons.join("; ")} |`);
}
writeFileSync(join(outDir, "posibles-costos-cruzados.md"), C.join("\n") + "\n");

console.log(JSON.stringify({
  productos: store.length, activos: active.length, sube: up.length, baja: down.length, igual: same,
  comision_cambia: comChange.length, comision_sube: comUp.length,
  pierden_lista: losers.length, pierden_con_fijos: losersEngine.length, bajo_costo: belowCost.length, tienda_menos_2_5: lowStore.length,
  paquete: pack.length, cup_usd: cupUsd.length, precio_web_distinto: priceMismatch.length, comision_web_distinta: comMismatch.length,
  cruzados_alta: crossedHigh.length, cruzados_alta_distintos: distinct(crossedHigh), cruzados_media_distintos: distinct(crossedMid), sensibilidad: sensitivity, cruzados_media: crossedMid.length,
  mediana_tienda_hoy: median(active.map((x) => x.today.ownerProfitUsd)), mediana_tienda_sugerido: median(active.map((x) => x.sug.ownerProfitUsd)),
  suma_precios_hoy: sum(active.map((x) => x.priceToday)), suma_sugeridos: sum(active.map((x) => x.sug.suggestedUsd)),
  parker: parker ? { hoy_nexo: parker.today.ownerProfitUsd, d43_gestora: parker.ruleAtToday.commissionUsd, d43_nexo: parker.ruleAtToday.ownerProfitUsd, sugerido: parker.sug.suggestedUsd, suelo: parker.sug.floorUsd } : null,
}, null, 1));
