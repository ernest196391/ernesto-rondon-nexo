// Digitaliza tus productos — bloque 1: recepción → ficha → Core.
// Pantallas: inicio (borradores y recepciones guardadas) y una recepción en
// 5 pasos: tipo, fotos, datos, revisar, resultado. Cada cambio se guarda en
// este dispositivo; Core solo recibe la ficha confirmada.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { storeConfig } from "./store-config.js";
import { openDrafts } from "./drafts.js";
import { createCore } from "./core.js";
import { renderKnowledge } from "./knowledge.js";
import {
  KINDS, STEPS, STAGE_LABEL, SYNC_LABEL, newDraft, missing, stage, nextStep, parseMoney, parseQty,
  formatMoney, groupCatalog, targetFrom, pendingAfterSync,
} from "./domain.js";

const params = new URLSearchParams(location.search);
const BUSINESS = params.get("negocio") || "casa-viva";
const config = storeConfig(BUSINESS);
// Modo de prueba: Core local (scripts/digitaliza-local-core.mjs). Nunca Casa Viva real.
const LOCAL = params.get("core") === "local";

const supabase = LOCAL
  ? createClient(location.origin, "prueba-local", {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-test-user": params.get("como") || "duena" } },
    })
  : createClient("https://viwwlriwlwodrfukbgbj.supabase.co", "sb_publishable_1NdUSjDeoYWTMgu2MYOfeg_1K0G241x");

const $ = (s, el = document) => el.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const view = $("#view");
const STEP_LABEL = { tipo: "Tipo", fotos: "Fotos", datos: "Datos", revisar: "Ficha", resultado: "Core" };
const KIND_CLASS = { new: "badge-info", restock: "badge-ok", correction: "badge-low" };
const SYNC_CLASS = { local: "badge-calm", sending: "badge-info", synced: "badge-ok", failed: "badge-out" };

let drafts;
let core;
let access = { receive: false, create: false, correct: false };
let catalog = [];
let draft = null;
let step = "tipo";
let savedAt = null;
let pick = "";
let busy = false;
let offlineNote = "";
const urls = new Map();

const photoUrl = (p) => {
  if (!urls.has(p.id)) urls.set(p.id, URL.createObjectURL(p.blob));
  return urls.get(p.id);
};

// ---------- Guardado del borrador ----------
let saveTimer;
async function persist() {
  clearTimeout(saveTimer);
  await drafts.save(draft);
  savedAt = new Date();
  const el = $("[data-saved]");
  if (el) el.textContent = savedLabel();
}
const persistSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => void persist(), 400); };
const savedLabel = () => drafts.persistent
  ? (savedAt ? `Borrador guardado en este dispositivo a las ${savedAt.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}` : "Se guarda solo mientras escribes")
  : "Este navegador no guarda borradores (modo privado): no cierres la página hasta guardar en Core";

// ---------- Inicio ----------
async function home() {
  draft = null;
  const q = new URLSearchParams(location.search);
  q.delete("r");
  history.replaceState(null, "", q.size ? `?${q}` : location.pathname);
  const local = await drafts.list(BUSINESS);
  view.innerHTML = `
    <div class="page-head"><h1>Recibir productos</h1></div>
    <p class="muted">Fotos, datos y cantidades de lo que llega. Se guarda en este dispositivo mientras trabajas y en Core al confirmar la ficha.</p>
    ${offlineNote ? `<p class="dz-alert" data-tone="calm">${esc(offlineNote)}</p>` : ""}
    ${drafts.persistent ? "" : `<p class="dz-alert" data-tone="warn">${esc(savedLabel())}</p>`}
    <section class="panel"><h2 class="t-lg">En este dispositivo</h2>
      <div class="dz-list" data-local>${local.length ? local.map(row).join("") : '<p class="muted t-sm">No hay recepciones abiertas.</p>'}</div></section>
    <section class="panel"><h2 class="t-lg">Guardadas en Core</h2><div class="dz-list" data-core><p class="muted t-sm">Cargando…</p></div></section>
    <div class="dz-dock"><div><button type="button" class="btn btn-primary btn-xl btn-block" data-new>Nueva recepción</button></div></div>`;
  $("[data-new]").onclick = () => openDraft(newDraft(config));
  view.querySelectorAll("[data-open]").forEach((b) => (b.onclick = async () => openDraft(await drafts.get(b.dataset.open))));
  try {
    const list = await core.list();
    $("[data-core]").innerHTML = list.length ? list.map((r) => `
      <div class="dz-item"><span><b>${esc(r.name ?? "Recepción")}</b><span class="dz-src">Nº ${r.number} · ${esc(KINDS[r.kind].label)} · ${esc(r.by ?? "")} · ${new Date(r.at).toLocaleString("es")}</span>
      <span class="dz-src">${(r.lines ?? []).map((l) => `${esc(l.variantLabel ?? l.name)}: ${l.added != null ? "+" + l.added : (l.difference >= 0 ? "+" : "") + l.difference} → ${l.stockAfter}`).join(" · ")}</span></span>
      <span class="badges"><span class="badge ${KIND_CLASS[r.kind]}">${esc(KINDS[r.kind].label)}</span><span class="badge badge-calm">${esc(STAGE_LABEL[r.contentStatus])}</span>
      <button type="button" class="btn btn-soft" data-ficha="${esc(r.groupId)}">Ficha</button></span></div>`).join("")
      : '<p class="muted t-sm">Todavía no hay recepciones en Core.</p>';
    view.querySelectorAll("[data-ficha]").forEach((b) => (b.onclick = () => openKnowledge(b.dataset.ficha)));
  } catch (e) {
    $("[data-core]").innerHTML = `<p class="dz-alert" data-tone="calm">${esc(e.message)}</p>`;
  }
}

function row(d) {
  const name = d.product?.name || d.target?.name || "Sin nombre todavía";
  return `<button type="button" class="dz-item" data-open="${esc(d.id)}">
    <span><b>${esc(name)}</b><span class="dz-src">${d.kind ? esc(KINDS[d.kind].label) : "Tipo sin elegir"} · ${new Date(d.updatedAt).toLocaleString("es")}</span></span>
    <span class="badges"><span class="badge badge-calm">${esc(STAGE_LABEL[stage(d)])}</span><span class="badge ${SYNC_CLASS[d.sync.status]}">${esc(SYNC_LABEL[d.sync.status])}</span></span></button>`;
}

function openDraft(d) {
  if (!d) return void home();
  draft = d;
  // Un envío interrumpido (página cerrada a mitad) se trata como fallido: el reintento es seguro.
  if (draft.sync.status === "sending") draft.sync.status = "failed";
  step = nextStep(draft).step;
  history.replaceState(null, "", `?${new URLSearchParams({ ...Object.fromEntries(params), r: d.id })}`);
  // Un borrador vacío (sin tipo) no se guarda: no ensucia la lista.
  if (draft.kind) void persist();
  render();
}

// ---------- Recepción ----------
const reachable = (s) => {
  if (draft.sync.status === "synced") return s === "resultado" || s === "revisar";
  if (s === "tipo") return true;
  if (!draft.kind) return false;
  if (s === "resultado") return false;
  if (s === "revisar") return missing(draft).length === 0;
  return true;
};

function render() {
  const n = nextStep(draft);
  const m = missing(draft);
  const idx = STEPS.indexOf(step);
  view.innerHTML = `
    <ol class="dz-steps" aria-label="Pasos">${STEPS.map((s, i) => `<li><button type="button" data-go="${s}" ${reachable(s) ? "" : "disabled"}
      data-done="${i < idx}" ${s === step ? 'aria-current="step"' : ""}>${i + 1}. ${STEP_LABEL[s]}</button></li>`).join("")}</ol>
    <div class="dz-status"><span class="badge badge-calm">${esc(STAGE_LABEL[stage(draft)])}</span>
      <span class="badge ${SYNC_CLASS[draft.sync.status]}">${esc(SYNC_LABEL[draft.sync.status])}</span>
      ${draft.kind ? `<span class="badge ${KIND_CLASS[draft.kind]}">${esc(KINDS[draft.kind].label)}</span>` : ""}
      <button type="button" class="btn btn-ghost dz-discard" data-discard>${draft.sync.status === "synced" ? "Quitar de este dispositivo" : "Descartar borrador"}</button></div>
    <div class="dz-missing" data-missing ${step !== "resultado" && step !== "tipo" && m.length ? "" : "hidden"}>${missingHtml(m)}</div>
    <section class="panel form" data-body></section>
    <div class="dz-dock"><div><button type="button" class="btn btn-primary btn-xl btn-block" data-main></button>
      <span class="dz-saved" data-saved>${esc(savedLabel())}</span></div></div>`;
  view.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { step = b.dataset.go; render(); }));
  $("[data-discard]").onclick = async () => {
    const synced = draft.sync.status === "synced";
    if (!confirm(synced ? "Se quita solo de este dispositivo. Lo guardado en Core no cambia." : "Se borran los datos y las fotos de esta recepción en este dispositivo. No se ha guardado en Core.")) return;
    await drafts.remove(draft.id);
    await home();
  };
  const body = $("[data-body]");
  const main = $("[data-main]");
  ({ tipo: stepKind, fotos: stepPhotos, datos: stepData, revisar: stepReview, resultado: stepResult })[step](body, main, n);
  window.scrollTo({ top: 0 });
}

function stepKind(body, main) {
  body.innerHTML = `<h2 class="t-lg">¿Qué llegó?</h2><div class="dz-options">${Object.entries(KINDS).map(([k, v]) => {
    const allowed = k === "restock" ? access.receive : k === "new" ? access.create : access.correct;
    return `<button type="button" class="dz-option" data-kind="${k}" aria-pressed="${draft.kind === k}" ${allowed && draft.sync.status !== "synced" ? "" : "disabled"}>
      <b>${esc(v.label)}</b><span class="t-sm muted">${esc(v.hint)}</span>${allowed ? "" : '<span class="t-xs">Solo la dueña o la economista.</span>'}</button>`;
  }).join("")}</div>`;
  body.querySelectorAll("[data-kind]").forEach((b) => (b.onclick = () => {
    if (draft.kind !== b.dataset.kind) { draft.kind = b.dataset.kind; draft.target = null; draft.confirmedAt = null; }
    persistSoon();
    render();
  }));
  main.textContent = "Continuar";
  main.disabled = !draft.kind;
  main.onclick = () => { step = "fotos"; render(); };
}

function stepPhotos(body, main) {
  const required = draft.kind === "new";
  body.innerHTML = `<h2 class="t-lg">Fotos ${required ? "" : '<span class="t-sm muted">(opcional)</span>'}</h2>
    <p class="t-sm muted">${required ? "Foto clara del producto entero, de frente, y de la etiqueta si tiene medidas o materiales. Se guardan sin retocar." : "Puedes añadir una foto de la mercancía o de la factura."}</p>
    <div class="dz-actions-2">
      <label class="btn btn-secondary dz-file">Tomar foto<input type="file" accept="image/*" capture="environment" data-file></label>
      <label class="btn btn-secondary dz-file">Elegir fotos<input type="file" accept="image/*" multiple data-file></label>
    </div>
    <div class="dz-photos">${draft.photos.map((p) => `<figure class="dz-photo"><img src="${photoUrl(p)}" alt="${esc(p.name)}">
      ${p.uploadedPath ? "" : `<button type="button" class="btn btn-secondary" data-del="${esc(p.id)}" aria-label="Quitar foto">✕</button>`}</figure>`).join("")}</div>
    <p class="t-xs muted">${draft.photos.length} foto(s) · ${(draft.photos.reduce((a, p) => a + p.size, 0) / 1048576).toFixed(1)} MB</p>`;
  body.querySelectorAll("[data-file]").forEach((input) => (input.onchange = async () => {
    for (const f of input.files) {
      if (!f.type.startsWith("image/")) continue;
      draft.photos.push({ id: crypto.randomUUID(), name: f.name || "foto.jpg", type: f.type, size: f.size, blob: f, uploadedPath: null });
    }
    await persist();
    render();
  }));
  body.querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => {
    draft.photos = draft.photos.filter((p) => p.id !== b.dataset.del);
    await persist();
    render();
  }));
  main.textContent = required && !draft.photos.length ? "Añade al menos una foto" : "Continuar a los datos";
  main.disabled = required && !draft.photos.length;
  main.onclick = () => { step = "datos"; render(); };
}

function stepData(body, main) {
  if (draft.kind === "new") dataNew(body); else dataExisting(body);
  main.textContent = "Revisar la ficha";
  main.onclick = () => {
    const m = missing(draft);
    if (m.length) { refreshMissing(); $("[data-missing]").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    step = "revisar";
    render();
  };
}

const missingHtml = (m) => `<b>Falta:</b><ul>${m.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;

// Actualiza solo el aviso de lo que falta: no redibuja, para no perder el foco ni el toque.
function refreshMissing() {
  const box = $("[data-missing]");
  if (!box) return;
  const m = missing(draft);
  box.innerHTML = missingHtml(m);
  box.hidden = m.length === 0;
}

function bindField(el, apply) {
  el.oninput = () => {
    apply(el.value);
    draft.confirmedAt = null;
    persistSoon();
    refreshMissing();
  };
}

function dataNew(body) {
  const p = draft.product;
  const cats = [...new Set(catalog.map((c) => c.category).filter(Boolean))].sort();
  body.innerHTML = `<h2 class="t-lg">Datos del producto</h2>
    <label class="field">Nombre<input class="input" data-f="name" maxlength="120" value="${esc(p.name)}" placeholder="Ej.: Lámpara de mesa de cerámica"></label>
    <label class="field">Categoría <span class="t-xs muted">(opcional)</span><input class="input" data-f="category" list="dz-cats" value="${esc(p.category)}"></label>
    <datalist id="dz-cats">${cats.map((c) => `<option value="${esc(c)}">`).join("")}</datalist>
    <div class="grid-2"><label class="field">Precio de venta<input class="input" data-f="price" inputmode="decimal" value="${esc(p.price)}" placeholder="0,00"></label>
      <label class="field">Moneda<select class="input" data-f="currency">${config.currencies.map((c) => `<option ${c.code === p.currency ? "selected" : ""}>${esc(c.code)}</option>`).join("")}</select></label></div>
    <label class="field">Descripción <span class="t-xs muted">(opcional: medidas, material, uso — solo lo que sepas seguro)</span><textarea class="input" rows="3" data-f="description">${esc(p.description)}</textarea></label>
    <label class="field">Código o SKU <span class="t-xs muted">(opcional)</span><input class="input" data-f="sku" value="${esc(p.sku)}"></label>
    <label class="check"><input type="checkbox" data-variants ${draft.hasVariants ? "checked" : ""}> Tiene variantes (color, talla, modelo…)</label>
    ${draft.hasVariants ? `<div class="dz-rows">${draft.variants.map((v, i) => `<div class="dz-row">
        <label class="field">Variante ${i + 1}<input class="input" data-vl="${i}" value="${esc(v.label)}" placeholder="Ej.: Azul"></label>
        <label class="field">Recibidas<input class="input" data-vq="${i}" inputmode="numeric" value="${esc(v.quantity)}" placeholder="0"></label>
        <button type="button" class="btn btn-ghost btn-icon" data-vdel="${i}" aria-label="Quitar variante" ${draft.variants.length < 2 ? "disabled" : ""}>✕</button></div>`).join("")}
        <button type="button" class="btn btn-soft" data-vadd>Añadir variante</button></div>`
      : `<label class="field">Cantidad recibida<input class="input" data-qty inputmode="numeric" value="${esc(draft.quantity)}" placeholder="0"></label>`}`;
  body.querySelectorAll("[data-f]").forEach((el) => bindField(el, (v) => { p[el.dataset.f] = v; draft.sources[el.dataset.f] = "person"; }));
  const qty = $("[data-qty]", body);
  if (qty) bindField(qty, (v) => { draft.quantity = v; draft.sources.quantity = "person"; });
  body.querySelectorAll("[data-vl]").forEach((el) => bindField(el, (v) => { draft.variants[el.dataset.vl].label = v; draft.sources.variants = "person"; }));
  body.querySelectorAll("[data-vq]").forEach((el) => bindField(el, (v) => { draft.variants[el.dataset.vq].quantity = v; draft.sources.variants = "person"; }));
  $("[data-variants]", body).onchange = (e) => { draft.hasVariants = e.target.checked; persistSoon(); render(); };
  $("[data-vadd]", body)?.addEventListener("click", () => { draft.variants.push({ key: crypto.randomUUID(), label: "", quantity: "" }); persistSoon(); render(); });
  body.querySelectorAll("[data-vdel]").forEach((b) => (b.onclick = () => { draft.variants.splice(Number(b.dataset.vdel), 1); persistSoon(); render(); }));
}

function dataExisting(body) {
  const field = draft.kind === "restock" ? "quantity" : "counted";
  if (!draft.target) {
    const groups = groupCatalog(catalog);
    const q = pick.trim().toLowerCase();
    const shown = groups.filter((g) => !q || g.name.toLowerCase().includes(q) || g.items.some((i) => (i.sku ?? "").toLowerCase().includes(q))).slice(0, 40);
    body.innerHTML = `<h2 class="t-lg">¿Qué producto es?</h2>
      <label class="field">Buscar en Core<input class="input" data-pick value="${esc(pick)}" placeholder="Nombre o SKU" autocomplete="off"></label>
      <div class="dz-pick">${shown.map((g) => `<button type="button" data-g="${esc(g.groupId)}"><span>${esc(g.name)}${g.items.length > 1 ? `<span class="dz-src">${g.items.length} variantes</span>` : ""}</span>
        <span class="num">${g.items.reduce((a, i) => a + i.stock, 0)} en stock</span></button>`).join("") || '<p class="muted t-sm">Sin resultados. Si es un producto que no existe, vuelve a «Tipo» y elige «Producto nuevo».</p>'}</div>`;
    const input = $("[data-pick]", body);
    input.oninput = () => { pick = input.value; const pos = input.selectionStart; render(); const again = $("[data-pick]"); again.focus(); again.setSelectionRange(pos, pos); };
    body.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => {
      draft.target = targetFrom(groups.find((g) => g.groupId === b.dataset.g));
      draft.sources.target = "person";
      persistSoon();
      render();
    }));
    return;
  }
  const t = draft.target;
  const external = t.lines.some((l) => l.stockAuthority === "external");
  body.innerHTML = `<div class="kv"><h2 class="t-lg">${esc(t.name)}</h2><button type="button" class="btn btn-ghost" data-change ${draft.sync.status === "synced" ? "disabled" : ""}>Cambiar</button></div>
    <p class="t-sm muted">${draft.kind === "restock" ? "Escribe cuántas unidades llegaron de cada una. Se suman a lo que ya hay." : "Escribe cuántas hay de verdad al contarlas. Core guardará la diferencia."}</p>
    ${external ? `<p class="dz-alert" data-tone="warn">Las existencias de este producto las cuenta ${esc(config.externalStockSource)}. La importación de cada hora vuelve a poner su cifra: registra también esta entrada allí.</p>` : ""}
    <div class="dz-rows">${t.lines.map((l, i) => `<div class="dz-row is-restock"><span>${esc(l.label ?? "Unidades")}<span class="dz-src">Ahora: ${l.stock}</span></span>
      <input class="input" inputmode="numeric" aria-label="${draft.kind === "restock" ? "Recibidas" : "Contadas"} ${esc(l.label ?? "")}" data-l="${i}" value="${esc(l[field])}" placeholder="${draft.kind === "restock" ? "+0" : l.stock}"></div>`).join("")}</div>`;
  $("[data-change]", body).onclick = () => { draft.target = null; draft.confirmedAt = null; persistSoon(); render(); };
  body.querySelectorAll("[data-l]").forEach((el) => bindField(el, (v) => { t.lines[el.dataset.l][field] = v; draft.sources.quantity = "person"; }));
}

const SOURCE = { person: "Lo escribiste tú", ai: "Sugerido por IA y aceptado" };
const src = (k) => (draft.sources[k] ? `<span class="dz-src">${esc(SOURCE[draft.sources[k]] ?? draft.sources[k])}</span>` : "");

function stepReview(body, main) {
  const p = draft.product;
  const synced = draft.sync.status === "synced";
  const last = draft.sync.attempts.at(-1);
  let table;
  if (draft.kind === "new") {
    const rows = draft.hasVariants ? draft.variants.map((v) => [v.label, parseQty(v.quantity)]) : [["Unidades", parseQty(draft.quantity)]];
    table = `<table class="dz-table"><tr><th>${draft.hasVariants ? "Variante" : ""}</th><th class="num">Entran</th></tr>${rows.map(([l, q]) => `<tr><td>${esc(l)}</td><td class="num">+${q}</td></tr>`).join("")}</table>`;
  } else {
    const field = draft.kind === "restock" ? "quantity" : "counted";
    const rows = draft.target.lines.filter((l) => parseQty(l[field]) !== null && (draft.kind === "correction" || parseQty(l[field]) > 0));
    table = `<table class="dz-table"><tr><th></th><th class="num">Ahora</th><th class="num">${draft.kind === "restock" ? "Entran" : "Contadas"}</th><th class="num">Quedará</th></tr>${rows.map((l) => {
      const q = parseQty(l[field]);
      return `<tr><td>${esc(l.label ?? "Unidades")}</td><td class="num">${l.stock}</td><td class="num">${draft.kind === "restock" ? "+" + q : q}</td><td class="num"><b>${draft.kind === "restock" ? l.stock + q : q}</b></td></tr>`;
    }).join("")}</table><p class="t-xs muted">«Ahora» es el stock de Core cuando elegiste el producto; al guardar se usa la cifra del momento.</p>`;
  }
  body.innerHTML = `<h2 class="t-lg">Revisa la ficha</h2>
    ${draft.photos.length ? `<div class="dz-strip">${draft.photos.map((ph) => `<img src="${photoUrl(ph)}" alt="">`).join("")}</div>` : ""}
    <div class="dz-sheet"><dl>
      ${draft.kind === "new" ? `<dt>Nombre</dt><dd>${esc(p.name)}${src("name")}</dd>
        <dt>Precio</dt><dd>${esc(formatMoney(parseMoney(p.price), p.currency))}${src("price")}</dd>
        ${p.category ? `<dt>Categoría</dt><dd>${esc(p.category)}${src("category")}</dd>` : ""}
        ${p.description ? `<dt>Descripción</dt><dd>${esc(p.description)}${src("description")}</dd>` : ""}
        ${p.sku ? `<dt>SKU</dt><dd>${esc(p.sku)}</dd>` : ""}` : `<dt>Producto</dt><dd>${esc(draft.target.name)}${src("target")}</dd>`}
      <dt>Fotos</dt><dd>${draft.photos.length} original(es)</dd>
    </dl></div>
    ${table}
    ${draft.target?.lines.some((l) => l.stockAuthority === "external") ? `<p class="dz-alert" data-tone="warn">Recuerda registrar también la entrada en ${esc(config.externalStockSource)}.</p>` : ""}
    <p class="t-xs muted">La IA no ha sugerido nada en esta ficha: todos los datos los escribió una persona.</p>
    ${synced ? "" : `<label class="check"><input type="checkbox" data-confirm ${draft.confirmedAt ? "checked" : ""}> He revisado la ficha: los datos y las cantidades son correctos.</label>`}
    ${last && !synced ? `<p class="dz-alert" data-tone="${last.code === "offline" ? "calm" : "bad"}">${esc(last.message)}</p>` : ""}
    ${draft.sync.attempts.length ? `<details><summary class="t-sm">Intentos de guardado (${draft.sync.attempts.length})</summary><ul class="t-xs">${draft.sync.attempts.map((a) =>
      `<li>${new Date(a.at).toLocaleString("es")}: ${a.ok ? "guardado" : esc(a.code)}${a.replayed ? " (ya estaba guardado; no se repitió)" : ""}</li>`).join("")}</ul></details>` : ""}`;
  if (synced) {
    main.textContent = "Ver qué quedó guardado";
    main.onclick = () => { step = "resultado"; render(); };
    return;
  }
  const box = $("[data-confirm]", body);
  box.onchange = () => { draft.confirmedAt = box.checked ? new Date().toISOString() : null; persistSoon(); render(); };
  main.textContent = busy ? "Guardando en Core…" : draft.sync.status === "failed" ? "Reintentar guardar en Core" : "Guardar en Core";
  main.disabled = busy || !draft.confirmedAt;
  main.onclick = () => void send(main);
}

async function send(main) {
  if (busy) return;
  busy = true;
  draft.sync.status = "sending";
  await persist();
  main.disabled = true;
  try {
    const result = await core.commit(draft, (i, n) => { main.textContent = `Subiendo fotos ${i}/${n}…`; });
    draft.sync = { status: "synced", result, attempts: [...draft.sync.attempts, { at: new Date().toISOString(), ok: true, replayed: !!result.replayed }] };
    step = "resultado";
  } catch (e) {
    draft.sync.status = "failed";
    draft.sync.attempts.push({ at: new Date().toISOString(), ok: false, code: e.code ?? "unknown", message: e.message });
  } finally {
    busy = false;
    await persist();
    render();
  }
}

function stepResult(body, main) {
  const r = draft.sync.result;
  const pending = pendingAfterSync(draft);
  body.innerHTML = `<p class="dz-alert" data-tone="ok"><b>Guardado en Core.</b> ${r.replayed ? "Ya estaba guardado: no se creó nada dos veces." : ""}</p>
    <h2 class="t-lg">Qué quedó guardado</h2>
    <table class="dz-table"><tr><th>Producto en Core</th><th class="num">${draft.kind === "correction" ? "Diferencia" : "Entraron"}</th><th class="num">Stock</th></tr>
      ${r.lines.map((l) => `<tr><td>${esc(l.name)}<span class="dz-src">${esc(l.productId)}${l.created ? " · nuevo" : ""}</span></td>
        <td class="num">${draft.kind === "correction" ? (l.difference >= 0 ? "+" : "") + l.difference : "+" + l.added}</td><td class="num">${l.stockBefore} → <b>${l.stockAfter}</b></td></tr>`).join("")}</table>
    <ul class="t-sm"><li>Ficha confirmada con la fuente de cada dato.</li><li>${draft.photos.length} foto(s) original(es) en el archivo privado de la tienda.</li>
      <li>Movimiento de inventario ${r.eventId ? `<span class="dz-id">${esc(r.eventId)}</span>` : "sin cambios (la cifra ya cuadraba)"}.</li>
      ${draft.kind === "new" ? "<li>El producto ya aparece en la caja (POS) en la próxima sincronización del catálogo.</li>" : ""}</ul>
    ${pending.length ? `<h2 class="t-lg">Qué sigue pendiente</h2><ul class="t-sm">${pending.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}`;
  main.textContent = "Nueva recepción";
  main.onclick = () => openDraft(newDraft(config));
  const back = document.createElement("button");
  back.type = "button";
  back.className = "btn btn-ghost btn-block";
  back.textContent = "Volver al inicio";
  back.onclick = () => void home();
  const ficha = document.createElement("button");
  ficha.type = "button";
  ficha.className = "btn btn-soft btn-block";
  ficha.textContent = "Abrir la ficha de conocimiento";
  ficha.onclick = () => openKnowledge(r.groupId);
  body.append(ficha);
  main.after(back);
}

// ---------- Ficha de conocimiento ----------
function openKnowledge(groupId) {
  draft = null;
  history.replaceState(null, "", `?${new URLSearchParams({ ...Object.fromEntries(params), ficha: groupId })}`);
  void renderKnowledge(view, { core, groupId, canEditFacts: access.create, onBack: () => {
    const q = new URLSearchParams(location.search); q.delete("ficha"); history.replaceState(null, "", `?${q}`); void home();
  } });
}

// ---------- Arranque ----------
async function start() {
  if (!config) {
    view.innerHTML = `<p class="dz-alert" data-tone="bad">La tienda «${esc(BUSINESS)}» no está configurada en Digitaliza.</p>`;
    return;
  }
  $("#store-name").textContent = config.name;
  if (LOCAL) {
    const banner = $("#test-banner");
    banner.hidden = false;
    banner.textContent = `MODO PRUEBA · Core local simulado · usuario: ${params.get("como") || "duena"} · no toca ${config.name}`;
  }
  drafts = await openDrafts();
  core = createCore(supabase, BUSINESS);
  if (!LOCAL) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      view.innerHTML = `<p class="dz-alert" data-tone="calm">Entra primero en el panel con tu cuenta y vuelve aquí.</p><a class="btn btn-primary btn-xl btn-block" href="./">Ir al panel</a>`;
      return;
    }
  }
  try {
    const data = await core.catalog();
    access = data.access;
    catalog = data.products;
  } catch (e) {
    if (e.code === "forbidden") {
      view.innerHTML = `<div class="page-head"><h1>Sin acceso</h1></div><p class="dz-alert" data-tone="bad">${esc(e.message)}</p><a class="btn btn-secondary btn-block" href="./">Volver al panel</a>`;
      return;
    }
    // Sin conexión: se puede seguir con borradores; reponer necesita el catálogo.
    // Los permisos se comprueban otra vez en Core al guardar.
    access = { receive: true, create: true, correct: true };
    offlineNote = e.message;
  }
  const open = params.get("r");
  if (params.get("ficha")) openKnowledge(params.get("ficha"));
  else if (open) openDraft(await drafts.get(open));
  else await home();
}

void start();
