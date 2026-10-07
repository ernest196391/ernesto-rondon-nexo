// Ficha central de conocimiento de un producto: hechos con fuente, evidencia,
// fecha, estado y variante; experiencias reales; piezas a revisar. Todo se
// lee y se escribe en Core; aquí no hay copia propia de las características.

export const STATUS = {
  verified: ["Verificado", "badge-ok"],
  declared: ["Declarado, sin verificar", "badge-calm"],
  pending: ["Pendiente", "badge-low"],
  contradicted: ["Contradicción", "badge-out"],
};
export const FACT_KINDS = {
  feature: "Característica", warranty: "Garantía", offer: "Oferta y condiciones", included: "Incluye",
  documentation: "Documentación", usage: "Uso y rendimiento", other: "Otro",
};

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "dato";

/** Valida el formulario antes de ir a Core (Core vuelve a validar). */
export function factFromForm(f) {
  const evidence = (f.evidence ?? "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [ref, ...rest] = l.split(" — ");
    return /^https?:\/\//.test(ref) ? { url: ref, conclusion: rest.join(" — ") || null } : { path: ref, conclusion: rest.join(" — ") || null };
  });
  const fact = {
    key: f.key || (/^[a-z]/.test(slug(f.label)) ? slug(f.label) : "d_" + slug(f.label)),
    label: (f.label ?? "").trim(), kind: f.kind, status: f.status, source: (f.source ?? "").trim(),
    value: f.status === "pending" ? null : (f.value ?? "").trim(), unit: (f.unit ?? "").trim() || null,
    appliesTo: f.appliesTo || null, scope: f.scope || "product", note: (f.note ?? "").trim() || null, evidence,
    observedOn: f.observedOn || undefined,
  };
  const errors = [];
  if (!fact.label) errors.push("Escribe qué dato es");
  if (!fact.source) errors.push("Indica la fuente");
  if (fact.status !== "pending" && !fact.value) errors.push("Escribe el valor o márcalo como pendiente");
  if (fact.status === "verified" && evidence.length === 0) errors.push("Un dato verificado necesita evidencia");
  return { fact, errors };
}

export async function renderKnowledge(view, { core, groupId, canEditFacts, onBack }) {
  let k;
  try {
    k = await core.knowledge(groupId);
  } catch (e) {
    view.innerHTML = `<p class="dz-alert" data-tone="bad">${esc(e.message)}</p>`;
    return;
  }
  const variantName = (id) => k.products.find((p) => p.productId === id)?.variantLabel ?? id;
  const price = k.products.map((p) => Object.entries(p.prices).map(([c, m]) => `${(m / 100).toLocaleString("es")} ${c}`).join(" · ")).filter((v, i, a) => a.indexOf(v) === i).join(" / ");
  const stock = k.products.reduce((a, p) => a + p.stock, 0);
  const byKind = Object.keys(FACT_KINDS).map((kind) => [kind, k.facts.filter((f) => f.kind === kind)]).filter(([, l]) => l.length);
  const review = k.pieces.filter((p) => p.status === "needs_review");

  view.innerHTML = `
    <div class="kv"><button type="button" class="btn btn-ghost" data-back>← Volver</button><span class="badge badge-info">Ficha v${k.version}</span></div>
    <div class="page-head"><h1>${esc(k.products[0]?.name.split(" — ")[0] ?? "Producto")}</h1></div>
    <p class="t-sm muted">Única fuente de datos para el contenido. Las piezas guardan la versión de la ficha que usaron.</p>
    <section class="panel dz-sheet"><dl>
      <dt>Precio</dt><dd>${esc(price || "—")}<span class="dz-src">De Core (se cambia en Productos)</span></dd>
      <dt>Existencias</dt><dd>${stock}<span class="dz-src">De Core (libro de inventario)</span></dd>
    </dl></section>
    ${review.length ? `<p class="dz-alert" data-tone="warn"><b>${review.length} pieza(s) a revisar:</b> ${review.map((p) => `${esc(p.channel)} (${esc(p.reviewReason)})`).join("; ")}</p>` : ""}
    ${k.pending.length ? `<div class="dz-missing"><b>Pendiente o en contradicción:</b><ul>${k.pending.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    ${byKind.map(([kind, list]) => `<section class="panel"><h2 class="t-lg">${FACT_KINDS[kind]}</h2><div class="dz-list">${list.map((f) => `
      <div class="dz-fact"><div class="kv"><b>${esc(f.label)}</b><span class="badge ${STATUS[f.status][1]}">${STATUS[f.status][0]}</span></div>
        <div>${f.value ? `${esc(f.value)} ${esc(f.unit ?? "")}` : '<span class="muted">Sin valor: no se completa por suposición</span>'}</div>
        <span class="dz-src">${esc(f.source)} · ${esc(f.observedOn)}${f.appliesTo ? ` · solo ${esc(variantName(f.appliesTo))}` : ""}${f.scope === "category" ? " · dato de la categoría, no de este producto" : ""} · v${f.version}</span>
        ${f.note ? `<p class="t-sm">${esc(f.note)}</p>` : ""}
        ${f.evidence.length ? `<ul class="t-xs">${f.evidence.map((e) => `<li>${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title ?? e.url)}</a>` : esc(e.path)}${e.conclusion ? ` — ${esc(e.conclusion)}` : ""}</li>`).join("")}</ul>` : ""}
        <div class="dz-fact-actions">${canEditFacts ? `<button type="button" class="btn btn-ghost" data-edit="${esc(f.id)}">Cambiar</button>` : ""}<button type="button" class="btn btn-ghost" data-hist="${esc(f.key)}">Historial</button></div>
        <div data-histbox="${esc(f.key)}"></div></div>`).join("")}</div></section>`).join("")}
    ${canEditFacts ? '<button type="button" class="btn btn-soft btn-block" data-add>Añadir dato</button>' : ""}
    <div data-factform></div>
    <section class="panel"><h2 class="t-lg">Experiencias reales</h2>
      <p class="t-sm muted">Pruebas hechas con el producto. Complementan las especificaciones; no las sustituyen.</p>
      <div class="dz-list">${k.experiences.map((e) => `<div class="dz-fact"><div class="kv"><b>${esc(e.title)}</b><span class="t-xs muted">${esc(e.testedOn)}${e.testedBy ? " · " + esc(e.testedBy) : ""}</span></div>
        <dl class="dz-exp">${[["Condiciones", e.conditions], ["Cantidades", e.quantities], ["Ajustes", e.settings], ["Tiempo", e.duration], ["Resultado", e.result]]
          .filter(([, v]) => v).map(([l, v]) => `<dt>${l}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
        ${e.files.length ? `<span class="dz-src">${e.files.length} archivo(s) de respaldo</span>` : ""}
        <button type="button" class="btn btn-ghost" data-expedit="${esc(e.id)}">Corregir</button></div>`).join("") || '<p class="muted t-sm">Todavía no hay pruebas registradas.</p>'}</div>
      <button type="button" class="btn btn-soft btn-block" data-expadd>Registrar una prueba</button><div data-expform></div></section>`;

  view.querySelector("[data-back]").onclick = onBack;
  const reload = () => renderKnowledge(view, { core, groupId, canEditFacts, onBack });
  view.querySelectorAll("[data-hist]").forEach((b) => (b.onclick = async () => {
    const h = await core.factHistory(groupId, b.dataset.hist);
    view.querySelector(`[data-histbox="${b.dataset.hist}"]`).innerHTML = `<ol class="t-xs">${h.map((x) =>
      `<li>${new Date(x.at).toLocaleString("es")}: ${x.value ? esc(x.value + " " + (x.unit ?? "")) : "sin valor"} · ${STATUS[x.status][0]} · ${esc(x.source)} · v${x.version}${x.current ? " (actual)" : ""}</li>`).join("")}</ol>`;
  }));

  const factForm = (f = {}) => {
    const box = view.querySelector("[data-factform]");
    box.innerHTML = `<form class="panel form"><h2 class="t-lg">${f.id ? "Cambiar dato" : "Nuevo dato"}</h2>
      <label class="field">Dato<input class="input" name="label" value="${esc(f.label)}" ${f.id ? "readonly" : ""} placeholder="Ej.: Capacidad"></label>
      <label class="field">Tipo<select class="input" name="kind">${Object.entries(FACT_KINDS).map(([v, l]) => `<option value="${v}" ${f.kind === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="field">Estado<select class="input" name="status">${Object.entries(STATUS).map(([v, [l]]) => `<option value="${v}" ${(f.status ?? "declared") === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <div class="grid-2"><label class="field">Valor<input class="input" name="value" value="${esc(f.value)}"></label><label class="field">Unidad<input class="input" name="unit" value="${esc(f.unit)}" placeholder="L, W, meses…"></label></div>
      <label class="field">Fuente<input class="input" name="source" value="${esc(f.source)}" placeholder="Manual del fabricante, placa, caja, prueba en tienda…"></label>
      <label class="field">Evidencia <span class="t-xs muted">(una por línea: enlace o archivo — conclusión)</span><textarea class="input" rows="3" name="evidence">${esc((f.evidence ?? []).map((e) => (e.url ?? e.path) + (e.conclusion ? " — " + e.conclusion : "")).join("\n"))}</textarea></label>
      <div class="grid-2"><label class="field">Aplica a<select class="input" name="appliesTo"><option value="">Todas las variantes</option>${k.products.filter((p) => p.variantLabel).map((p) => `<option value="${esc(p.productId)}" ${f.appliesTo === p.productId ? "selected" : ""}>${esc(p.variantLabel)}</option>`).join("")}</select></label>
        <label class="field">Alcance<select class="input" name="scope"><option value="product">Este producto</option><option value="category" ${f.scope === "category" ? "selected" : ""}>Solo la categoría</option></select></label></div>
      <label class="field">Fecha<input class="input" type="date" name="observedOn" value="${esc(f.observedOn ?? new Date().toISOString().slice(0, 10))}"></label>
      <label class="field">Nota <span class="t-xs muted">(contradicciones, qué falta)</span><textarea class="input" rows="2" name="note">${esc(f.note)}</textarea></label>
      <p class="msg" data-tone="bad" data-msg></p><button class="btn btn-primary btn-block">Guardar dato</button></form>`;
    box.scrollIntoView({ behavior: "smooth" });
    box.querySelector("form").onsubmit = async (ev) => {
      ev.preventDefault();
      const { fact, errors } = factFromForm({ ...Object.fromEntries(new FormData(ev.target)), key: f.key });
      const msg = box.querySelector("[data-msg]");
      if (errors.length) { msg.textContent = errors.join(". "); return; }
      try {
        const r = await core.saveFact(groupId, fact);
        if (r.piecesToReview) alert(`${r.piecesToReview} pieza(s) usaban este dato: quedan marcadas para revisar.`);
        await reload();
      } catch (e) { msg.textContent = e.message; }
    };
  };
  view.querySelector("[data-add]")?.addEventListener("click", () => factForm());
  view.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => factForm(k.facts.find((f) => f.id === b.dataset.edit))));

  const expForm = (e = {}) => {
    const box = view.querySelector("[data-expform]");
    const field = (n, l, ph = "") => `<label class="field">${l}<textarea class="input" rows="2" name="${n}" placeholder="${ph}">${esc(e[n])}</textarea></label>`;
    box.innerHTML = `<form class="form"><label class="field">Qué se probó<input class="input" name="title" value="${esc(e.title)}" placeholder="Ej.: Frijoles negros"></label>
      ${field("conditions", "Condiciones", "Remojo, tipo de agua, corriente…")}${field("quantities", "Cantidades", "500 g + 1,5 L de agua")}
      ${field("settings", "Ajustes", "Programa, válvula…")}${field("duration", "Tiempos", "45 min + 15 min de despresurizar")}${field("result", "Resultado")}
      <div class="grid-2"><label class="field">Fecha<input class="input" type="date" name="testedOn" value="${esc(e.testedOn ?? new Date().toISOString().slice(0, 10))}"></label>
        <label class="field">Quién la hizo<input class="input" name="testedBy" value="${esc(e.testedBy)}"></label></div>
      <label class="field">Archivos de respaldo <span class="t-xs muted">(rutas o enlaces, uno por línea)</span><textarea class="input" rows="2" name="files">${esc((e.files ?? []).map((x) => x.url ?? x.path).join("\n"))}</textarea></label>
      <p class="msg" data-tone="bad" data-msg></p><button class="btn btn-primary btn-block">Guardar prueba</button></form>`;
    box.querySelector("form").onsubmit = async (ev) => {
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(ev.target));
      data.files = data.files.split("\n").map((s) => s.trim()).filter(Boolean).map((s) => (/^https?:/.test(s) ? { url: s } : { path: s }));
      if (e.id) data.id = e.id;
      const msg = box.querySelector("[data-msg]");
      if (!data.title.trim() || !data.result.trim()) { msg.textContent = "Completa qué se probó y el resultado"; return; }
      try { await core.saveExperience(groupId, data); await reload(); } catch (err) { msg.textContent = err.message; }
    };
  };
  view.querySelector("[data-expadd]").onclick = () => expForm();
  view.querySelectorAll("[data-expedit]").forEach((b) => (b.onclick = () => expForm(k.experiences.find((x) => x.id === b.dataset.expedit))));
}
