// "Llegó mercancía" en la caja: la dependienta hace foto a la factura (o la elige de la galería),
// Curru la lee si está activada, revisa los productos y confirma. Sube el stock y guarda el costo
// en la nube (función nexo-device-receive). Necesita internet: si no hay, lo dice y no guarda nada.
import type Database from "@tauri-apps/plugin-sql";
import { attribution, can } from "./attribution";
import { DEFAULT_ENDPOINT, requestSync } from "./sync";
import { escapeHtml as esc, icon, openSheet } from "./ui";

type Line = { productId: string | null; readName?: string; quantity: number; unitCost: number | null; currency: string };
type Product = { id: string; name: string };

const URL_FN = DEFAULT_ENDPOINT.replace(/nexo-sync-push\/?$/, "nexo-device-receive");
const HIDE = 'style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"';
let curru: boolean | null = null;

function token() {
  try { return localStorage.getItem("nexo.sync.deviceToken") ?? ""; } catch { return ""; }
}
async function call(body: unknown) {
  const r = await fetch(URL_FN, { method: "POST", headers: { "content-type": "application/json", "x-nexo-device-token": token() }, body: JSON.stringify(body) });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(out.message ?? out.error ?? `HTTP ${r.status}`);
  return out;
}
function partners(): Product[] {
  try { return (JSON.parse(localStorage.getItem("nexo.people") ?? "[]") as Array<{ id: string; kind: string; name: string }>).filter(p => p.kind === "partner").map(p => ({ id: p.id, name: p.name })); }
  catch { return []; }
}
/** Foto a JPEG pequeño (máx. 1400 px) para subir rápido con datos móviles. */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1400 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function openReceive(db: Database) {
  const allowed = can("receive");
  if (!allowed.ok) { alert(allowed.reason); return; }
  if (!navigator.onLine) { alert("Para recibir mercancía hace falta internet. Conéctate y vuelve a intentarlo."); return; }
  if (!token()) { alert("Esta caja todavía no está conectada a la tienda (Más → Sincronización)."); return; }
  const products = await db.select<Product[]>("SELECT id,name FROM local_products WHERE active=1 ORDER BY name");
  const nameOf = (id: string | null) => products.find(p => p.id === id)?.name ?? "";
  if (curru === null) curru = await call({ action: "check" }).then(r => r.curru === true).catch(() => false);
  const own = partners();
  const lines: Line[] = [];
  let photo: string | null = null, aiUsed = false;
  const sheet = openSheet(`
    <div class="sheet-head"><h2 class="t-lg">Llegó mercancía</h2><button type="button" class="btn btn-ghost" data-close>Cerrar</button></div>
    <form class="nx-form" data-recv>
      <img data-prev alt="" hidden style="width:100%;max-height:40vh;object-fit:contain;border-radius:12px">
      <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <label class="btn btn-secondary" style="position:relative">📷 Hacer foto<input type="file" accept="image/*" capture="environment" data-photo ${HIDE}></label>
        <label class="btn btn-secondary" style="position:relative">🖼️ Galería<input type="file" accept="image/*" data-photo ${HIDE}></label>
      </div>
      ${curru ? `<button type="button" class="btn btn-secondary btn-block" data-curru>✨ Que Curru lea la factura</button>` : ""}
      <p class="t-sm" data-msg role="status"></p>
      <label class="field">Proveedor<input class="input" name="supplier" required maxlength="80" placeholder="Ej.: Dayra"></label>
      ${own.length ? `<label class="field">Es mercancía de<select class="input" name="partner"><option value="">Casa Viva</option>${own.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select></label>` : ""}
      <label class="field">Añadir producto<input class="input" data-q type="search" placeholder="Buscar producto" autocomplete="off"></label>
      <div data-items></div>
      <div data-lines></div>
      <label class="field">Nota<input class="input" name="note" maxlength="200" placeholder="Ej.: 2 llegaron rotos"></label>
      <button type="submit" class="btn btn-primary btn-xl btn-block">Confirmar entrada</button>
    </form>`, "Llegó mercancía");
  const form = sheet.el.querySelector<HTMLFormElement>("[data-recv]")!;
  const msg = form.querySelector<HTMLElement>("[data-msg]")!;
  const say = (t: string, bad = false) => { msg.textContent = t; msg.style.color = bad ? "var(--nx-danger)" : ""; };

  const renderLines = () => {
    form.querySelector<HTMLElement>("[data-lines]")!.innerHTML = lines.map((l, i) => `<div class="panel" data-i="${i}" style="padding:10px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${l.productId ? esc(nameOf(l.productId)) : `<span style="color:var(--nx-danger)">Elige el producto: «${esc(l.readName)}»</span>`}</b><button type="button" class="btn btn-ghost" data-del aria-label="Quitar">✕</button></div>
      ${l.productId ? "" : `<select class="input" data-fix><option value="">— elegir —</option>${products.filter(p => !l.readName || p.name.toLowerCase().includes(l.readName.split(" ")[0].toLowerCase())).slice(0, 40).map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select>`}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px">
        <label class="field t-sm">Cantidad<input class="input" data-qty inputmode="numeric" value="${l.quantity}"></label>
        <label class="field t-sm">Costo c/u<input class="input" data-cost inputmode="decimal" value="${l.unitCost ?? ""}"></label>
        <label class="field t-sm">Moneda<select class="input" data-cur>${["USD", "CUP", "MLC"].map(c => `<option${l.currency === c ? " selected" : ""}>${c}</option>`).join("")}</select></label>
      </div></div>`).join("");
    form.querySelectorAll<HTMLElement>("[data-i]").forEach(row => {
      const l = lines[Number(row.dataset.i)];
      row.querySelector<HTMLButtonElement>("[data-del]")!.onclick = () => { lines.splice(lines.indexOf(l), 1); renderLines(); };
      row.querySelector<HTMLSelectElement>("[data-fix]")?.addEventListener("change", e => { l.productId = (e.target as HTMLSelectElement).value || null; renderLines(); });
      row.querySelector<HTMLInputElement>("[data-qty]")!.onchange = e => { l.quantity = Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1); };
      row.querySelector<HTMLInputElement>("[data-cost]")!.onchange = e => { const v = Number((e.target as HTMLInputElement).value.replace(",", ".")); l.unitCost = Number.isFinite(v) && v >= 0 ? v : null; };
      row.querySelector<HTMLSelectElement>("[data-cur]")!.onchange = e => { l.currency = (e.target as HTMLSelectElement).value; };
    });
  };
  const q = form.querySelector<HTMLInputElement>("[data-q]")!;
  q.oninput = () => {
    const t = q.value.trim().toLowerCase();
    const box = form.querySelector<HTMLElement>("[data-items]")!;
    box.innerHTML = t ? products.filter(p => p.name.toLowerCase().includes(t)).slice(0, 10).map(p => `<button type="button" class="btn btn-ghost btn-block" style="justify-content:space-between" data-add="${esc(p.id)}">${esc(p.name)} ${icon("plus", "sm")}</button>`).join("") : "";
    box.querySelectorAll<HTMLButtonElement>("[data-add]").forEach(b => (b.onclick = () => { lines.push({ productId: b.dataset.add!, quantity: 1, unitCost: null, currency: "USD" }); q.value = ""; box.innerHTML = ""; renderLines(); }));
  };
  form.querySelectorAll<HTMLInputElement>("[data-photo]").forEach(input => (input.onchange = async () => {
    const f = input.files?.[0];
    if (!f) return;
    try { photo = await shrink(f); const prev = form.querySelector<HTMLImageElement>("[data-prev]")!; prev.src = photo; prev.hidden = false; say(""); }
    catch { photo = null; say("Esa foto no se pudo abrir. Prueba con otra.", true); }
  }));
  const cb = form.querySelector<HTMLButtonElement>("[data-curru]");
  if (cb) cb.onclick = async () => {
    if (!photo) return say("Primero haz o elige la foto de la factura.", true);
    cb.disabled = true; say("Curru está leyendo la factura…");
    try {
      const out = await call({ action: "read", image: photo });
      aiUsed = true;
      if (out.supplier && !form.supplier.value) form.supplier.value = out.supplier;
      for (const l of out.lines) lines.push({ productId: l.productId, readName: l.name, quantity: l.quantity, unitCost: l.unitCost, currency: l.currency });
      say(`Curru leyó ${out.lines.length} productos. Revísalos antes de confirmar.`);
      renderLines();
    } catch { say("Curru no pudo leerla. Añade los productos a mano.", true); }
    finally { cb.disabled = false; }
  };
  form.onsubmit = async e => {
    e.preventDefault();
    if (!form.supplier.value.trim()) return say("Escribe el proveedor.", true);
    if (!lines.length) return say("Añade al menos un producto.", true);
    if (lines.some(l => !l.productId)) return say("Hay productos sin elegir (en rojo).", true);
    if (lines.some(l => l.unitCost == null)) return say("Falta el costo de algún producto.", true);
    const btn = form.querySelector<HTMLButtonElement>("[type=submit]")!;
    btn.disabled = true; say("Guardando…");
    try {
      const out = await call({ action: "save", receipt: {
        supplierName: form.supplier.value.trim(), partnerId: (form.elements.namedItem("partner") as HTMLSelectElement | null)?.value || null,
        photo, aiUsed, note: (form.elements.namedItem("note") as HTMLInputElement).value.trim(), staffId: attribution.staffId,
        lines: lines.map(l => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost, currency: l.currency })) } });
      sheet.close();
      alert(`Entrada #${out.number} guardada. Las cantidades se actualizan en la caja y en la web en unos minutos.`);
      requestSync();
    } catch (err) { btn.disabled = false; say("No se guardó: " + (err as Error).message, true); }
  };
  renderLines();
}
