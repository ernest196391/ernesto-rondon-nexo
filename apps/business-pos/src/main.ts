import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import { scan, Format, checkPermissions, requestPermissions } from "@tauri-apps/plugin-barcode-scanner";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/cinzel/600.css";
import "./nexo.css";
import "./themes/casaviva.css";
import "./app.css";
import { mountFinance, refreshFinance } from "./finance";
import type { DeviceIdentity } from "./sync";
import { openCheckout, describePayments, type PaymentInput } from "./checkout";
import { icon, ISOTIPO, escapeHtml, openSheet } from "./ui";

type Product = { id: string; name: string; price_minor: number; barcode: string | null };
type ListedProduct = Product & { category: string | null; variant_of: string | null; variant_label: string | null; image_url: string | null };
type CartLine = { product: ListedProduct; quantity: number };
type ProductStock = { productId: string; quantity: number; lowAt: number };
type ProductGroup = { key: string; title: string; items: ListedProduct[] };
type ReceiptLine = { name: string; quantity: number; unitPriceMinor: number; lineTotalMinor: number };
type Receipt = { saleId: string; occurredAt: string; currency: "USD"; payments: string[]; totalMinor: number; lines: ReceiptLine[] };
type IntegrityReport = { sales: number; saleLines: number; payments: number; inventoryMovements: number; outbox: number; incompleteSales: number; rollbackOk: boolean };
type SyncState = { pending: number; failing: number; synced: number; lastError: string | null };

const seed = [
  { id: "casa-viva-demo-001", sku: "CV-DEMO-001", name: "Producto Casa Viva Demo", price: 25000, barcode: "850000000001" },
  { id: "nexo-demo-002", sku: "NX-DEMO-002", name: "Producto NEXO Demo", price: 12500, barcode: "850000000002" }
];

// Set from the device identity (provisioning) before anything reads it.
let BUSINESS_ID = "casa-viva";
const PILOT_BUSINESS = "casa-viva";
const businessName = () => (BUSINESS_ID === PILOT_BUSINESS ? "Casa Viva" : BUSINESS_ID);
const NO_CATEGORY = "Sin categoría";
const VIEWS = [
  ["vender", "Vender", "tag"],
  ["caja", "Caja", "wallet"],
  ["inventario", "Inventario", "box"],
  ["mas", "Más", "grid"],
] as const;
type View = (typeof VIEWS)[number][0];

const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = `
<div class="nx app" data-theme="casaviva">
  <nav class="nav" aria-label="Principal">
    <div class="nav-logo">${ISOTIPO}</div>
    ${VIEWS.map(([id, label, ic]) => `<button type="button" class="tab" data-view="${id}" ${id === "vender" ? 'aria-current="page"' : ""}>${icon(ic)}${label}</button>`).join("")}
    <div class="nav-spacer"></div>
  </nav>
  <div class="views">
    <section class="view" data-view="vender">
      <header class="top"><div class="logo">${ISOTIPO}<span class="logo-name" id="store-name">Casa Viva</span></div><span class="pill calm" id="net">${icon("offline", "sm")}Sin conexión</span></header>
      <div class="sell">
        <div class="body">
          <div class="search">
            <label class="search-field">${icon("search")}<input id="query" type="search" autocomplete="off" inputmode="search" placeholder="Buscar nombre o código" aria-label="Buscar producto"></label>
            <button class="btn scan" id="scan" type="button" aria-label="Escanear código de barras">${icon("scan")}</button>
          </div>
          <div class="chips" id="categories" role="group" aria-label="Categorías"></div>
          <p class="t-sm muted status-line" id="status" role="status"></p>
          <div class="grid-prod" id="products"></div>
        </div>
        <aside class="side-cart" aria-label="Carrito"><div class="top"><h2 class="title" id="side-cart-title">Carrito</h2><button class="btn btn-ghost" id="side-cart-clear" style="color: var(--nx-danger)">Vaciar</button></div><div class="cart-body" id="side-cart-body"></div><div class="cart-foot" id="side-cart-foot"></div></aside>
      </div>
      <div class="dock" id="dock"><button class="cartbar is-empty" id="cartbar" type="button"><span class="count">Carrito vacío</span></button></div>
    </section>
    <section class="view" data-view="caja" hidden>
      <header class="top"><h1 class="title">Caja</h1></header>
      <div class="scroll"><div class="stack">
        <div id="fin-shift"></div>
        <details class="panel"><summary>Devoluciones</summary><div id="fin-returns"></div></details>
      </div></div>
    </section>
    <section class="view" data-view="inventario" hidden>
      <header class="top"><h1 class="title">Inventario</h1></header>
      <div class="scroll"><div class="stack">
        <div class="seg" role="group" aria-label="Vista de inventario"><button type="button" data-inv="low" aria-pressed="true">Poco stock</button><button type="button" data-inv="ops" aria-pressed="false">Ubicaciones y conteos</button></div>
        <section class="panel" data-inv-pane="low"><div class="low-list" id="low-stock"></div></section>
        <section class="panel" data-inv-pane="ops" hidden><div id="fin-locations"></div></section>
      </div></div>
    </section>
    <section class="view" data-view="mas" hidden>
      <header class="top"><h1 class="title">Más</h1></header>
      <div class="scroll"><div class="stack">
        <details class="panel"><summary>Último recibo</summary><div id="receipt-content"><p class="muted">Aún no hay ventas en esta sesión.</p></div></details>
        <details class="panel"><summary>Fiado y abonos</summary><div id="fin-fiado"></div></details>
        <details class="panel"><summary>Efectivo de mensajeros</summary><div id="fin-messenger"></div></details>
        <details class="panel"><summary>Consignación</summary><div id="fin-consignment" class="nx-form"></div></details>
        <details class="panel"><summary>Resumen del negocio</summary><div id="fin-summary"></div></details>
        <details class="panel"><summary>Sincronización</summary><div id="fin-sync"></div></details>
        <details class="panel"><summary>Este equipo</summary><p class="t-sm" id="device-label"></p><p class="t-sm muted" id="history"></p><p class="t-sm muted" id="audit">Auditoría local pendiente…</p></details>
      </div></div>
    </section>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
</div>`;

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
let db: Database;
const cart = new Map<string, CartLine>();
let lastReceipt: Receipt | null = null;
let toastTimer: number | undefined;
let selectedCategory = "";
let groupsByKey = new Map<string, ProductGroup>();
let stockNow = new Map<string, ProductStock>();
let cartSheet: ReturnType<typeof openSheet> | null = null;
/** Thumbnails saved on this device (url → data URL), so photos show offline. */
const photoCache = new Map<string, string>();
let caching = false;

// ---------- Navigation ----------

function showView(view: View) {
  document.querySelectorAll<HTMLElement>(".view").forEach(v => (v.hidden = v.dataset.view !== view));
  document.querySelectorAll<HTMLElement>(".nav .tab").forEach(t =>
    t.dataset.view === view ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current")
  );
  if (view === "inventario") void renderLowStock();
}
document.querySelectorAll<HTMLButtonElement>(".nav .tab").forEach(t => (t.onclick = () => showView(t.dataset.view as View)));

document.querySelectorAll<HTMLButtonElement>("[data-inv]").forEach(b => (b.onclick = () => {
  document.querySelectorAll("[data-inv]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  document.querySelectorAll<HTMLElement>("[data-inv-pane]").forEach(p => (p.hidden = p.dataset.invPane !== b.dataset.inv));
}));

// ---------- Feedback ----------

function showToast(message: string, tone: "success" | "info" | "error" = "info", ms = 3200, action?: { label: string; run: () => void }) {
  const toast = $("#toast");
  toast.textContent = message;
  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toast-action";
    button.textContent = action.label;
    button.onclick = () => {
      toast.hidden = true;
      action.run();
    };
    toast.append(" ", button);
  }
  toast.dataset.tone = tone;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.hidden = true), ms);
}
window.addEventListener("nexo:say", e => {
  const { message, tone } = (e as CustomEvent<{ message: string; tone: "ok" | "error" }>).detail;
  showToast(message, tone === "error" ? "error" : "success", tone === "error" ? 5000 : 3200);
});

function setStatus(text: string) {
  $("#status").textContent = text;
}

function showDeviceLabel(identity: DeviceIdentity) {
  $("#device-label").textContent = identity.provisioned
    ? `${identity.label ?? identity.deviceId} · ${identity.businessId}`
    : "Piloto 01 · Casa Viva";
  $("#store-name").textContent = businessName();
}
window.addEventListener("nexo:device-updated", e => showDeviceLabel((e as CustomEvent<DeviceIdentity>).detail));

/** "Sin conexión" stays calm; pending sales are shown, errors only if they persist. */
async function renderNet() {
  let state: SyncState | null = null;
  try {
    state = await invoke<SyncState>("sync_state");
  } catch {
    state = null;
  }
  const pill = $("#net");
  if (!navigator.onLine) {
    pill.className = "pill calm";
    pill.innerHTML = `${icon("offline", "sm")}Sin conexión${state?.pending ? ` · ${state.pending}` : ""}`;
  } else if (state?.failing) {
    pill.className = "pill danger";
    pill.innerHTML = `${icon("alert", "sm")}Revisar envío`;
  } else if (state?.pending) {
    pill.className = "pill info";
    pill.innerHTML = `${icon("cloud", "sm")}Enviando ${state.pending}`;
  } else {
    pill.className = "pill ok";
    pill.innerHTML = `${icon("check", "sm")}Al día`;
  }
}
window.addEventListener("online", () => void renderNet());
window.addEventListener("offline", () => void renderNet());
window.setInterval(() => void renderNet(), 10_000);

// ---------- Money and receipts ----------

function money(minor: number) {
  return `$${(minor / 100).toFixed(2)}`;
}

function receiptText(receipt: Receipt) {
  return [
    `${businessName()} · NEXO Business`,
    "Recibo digital",
    `Venta: ${receipt.saleId}`,
    `Fecha: ${new Date(receipt.occurredAt).toLocaleString()}`,
    "",
    ...receipt.lines.map(line => `${line.quantity} x ${line.name} · ${money(line.lineTotalMinor)}`),
    "",
    `Total: ${money(receipt.totalMinor)} USD`,
    ...receipt.payments.map(p => `Pago: ${p}`)
  ].join("\n");
}

function receiptHtml(receipt: Receipt) {
  return `<div class="kv t-sm muted"><span>${escapeHtml(new Date(receipt.occurredAt).toLocaleString())}</span><span class="num">${money(receipt.totalMinor)}</span></div>
    ${receipt.lines.map(l => `<div class="kv"><span>${l.quantity} × ${escapeHtml(l.name)}</span><span class="num">${money(l.lineTotalMinor)}</span></div>`).join("")}
    <div class="hr"></div>
    ${receipt.payments.map(p => `<p class="t-sm">${escapeHtml(p)}</p>`).join("")}
    <p class="t-xs muted">ID ${escapeHtml(receipt.saleId)}</p>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px"><button class="btn btn-secondary" data-share>${icon("share", "sm")}Compartir</button><button class="btn btn-secondary" data-copy>${icon("copy", "sm")}Copiar</button></div>`;
}

function wireReceipt(el: HTMLElement) {
  el.querySelector<HTMLButtonElement>("[data-share]")!.onclick = () => void shareReceipt();
  el.querySelector<HTMLButtonElement>("[data-copy]")!.onclick = () => void copyReceipt();
}

function renderReceipt(receipt: Receipt) {
  lastReceipt = receipt;
  const box = $("#receipt-content");
  box.innerHTML = receiptHtml(receipt);
  wireReceipt(box);
}

function openSaleDone(receipt: Receipt) {
  const sheet = openSheet(`
    <div class="sheet-head"><div><p class="t-xs muted" style="font-weight: 700">VENTA COMPLETADA</p><h2 class="t-brand">Recibo listo</h2></div><span class="total-big num">${money(receipt.totalMinor)}</span></div>
    <div class="panel">${receiptHtml(receipt)}</div>
    <button class="btn btn-primary btn-xl btn-block" data-new>Nueva venta</button>`, "Venta completada");
  wireReceipt(sheet.el);
  sheet.el.querySelector<HTMLButtonElement>("[data-new]")!.onclick = sheet.close;
}

async function copyReceipt(): Promise<boolean> {
  if (!lastReceipt) return false;
  const text = receiptText(lastReceipt);
  try {
    await navigator.clipboard.writeText(text);
    showToast("Recibo copiado · pégalo en WhatsApp", "success");
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.left = "-9999px";
    area.setAttribute("readonly", "");
    document.body.appendChild(area);
    area.focus();
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    showToast(copied ? "Recibo copiado · pégalo en WhatsApp" : "No se pudo copiar el recibo", copied ? "success" : "error");
    return copied;
  }
}

async function shareReceipt() {
  if (!lastReceipt) return;
  const text = receiptText(lastReceipt);
  if (navigator.share) {
    try {
      await navigator.share({ title: `Recibo ${businessName()}`, text });
      showToast("Recibo compartido", "success");
      return;
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return;
    }
  }
  if (await copyReceipt()) showToast("Compartir no está disponible aquí · recibo copiado", "success");
}

// ---------- Products ----------

async function stockFor(productIds: string[] = []) {
  try {
    const rows = await invoke<ProductStock[]>("stock_current", { productIds });
    return new Map(rows.map(r => [r.productId, r]));
  } catch {
    return new Map<string, ProductStock>();
  }
}

/** "Agotado" / "Quedan N" for tracked products at or below their warning level. */
function stockBadge(stock: ProductStock | undefined) {
  if (!stock) return "";
  if (stock.quantity <= 0) return `<span class="badge badge-out">Agotado</span>`;
  if (stock.quantity <= stock.lowAt) return `<span class="badge badge-low">Quedan ${stock.quantity}</span>`;
  return "";
}

/** Letter placeholder in the category color, with the photo on top when it loads. */
function thumb(url: string | null, title: string, category: string | null) {
  const letter = escapeHtml(title.trim().charAt(0).toUpperCase() || "?");
  const tone = `c${(Array.from(category ?? "").reduce((h, ch) => h + ch.charCodeAt(0), 0) % 5) + 1}`;
  const src = url ? photoCache.get(url) ?? url : null;
  const img = src ? `<img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : "";
  return `<div class="thumb ${tone}">${letter}${img}</div>`;
}

/** "Silla — Azul" with label "Azul" → "Silla" (the import names variants that way). */
function variantTitle(p: ListedProduct) {
  const label = p.variant_label?.trim();
  if (!label || !p.name.endsWith(label)) return p.name;
  return p.name.slice(0, -label.length).replace(/[\s—–-]+$/, "") || p.name;
}

function groupProducts(rows: ListedProduct[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();
  for (const p of rows) {
    const key = p.variant_of ? `v:${p.variant_of}` : `p:${p.id}`;
    const group = groups.get(key) ?? { key, title: p.variant_of ? variantTitle(p) : p.name, items: [] };
    group.items.push(p);
    groups.set(key, group);
  }
  return Array.from(groups.values()).sort((a, b) => a.title.localeCompare(b.title, "es"));
}

const queryInput = $<HTMLInputElement>("#query");

async function renderCategories() {
  const rows = await db.select<Array<{ category: string | null; count: number }>>(
    `SELECT p.category, COUNT(DISTINCT COALESCE(p.variant_of, p.id)) AS count
     FROM local_products p
     JOIN local_prices pr ON pr.product_id=p.id AND pr.business_id=p.business_id AND pr.active=1 AND pr.currency='USD'
     WHERE p.business_id=$1 AND p.active=1
     GROUP BY p.category
     ORDER BY p.category IS NULL, p.category`,
    [BUSINESS_ID]
  );
  const el = $("#categories");
  const names = rows.map(r => r.category ?? NO_CATEGORY);
  if (selectedCategory && !names.includes(selectedCategory)) selectedCategory = "";
  el.hidden = rows.length < 2;
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const chip = (value: string, count: number) =>
    `<button type="button" class="chip" data-category="${escapeHtml(value)}" aria-pressed="${value === selectedCategory}">${escapeHtml(value || "Todo")} <span class="count">${count}</span></button>`;
  el.innerHTML = chip("", total) + rows.map(r => chip(r.category ?? NO_CATEGORY, r.count)).join("");
  el.querySelectorAll<HTMLButtonElement>(".chip").forEach(b => (b.onclick = () => {
    selectedCategory = b.dataset.category ?? "";
    el.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c === b)));
    void renderProducts(queryInput.value);
  }));
}

function inCart(group: ProductGroup) {
  return group.items.reduce((n, p) => n + (cart.get(p.id)?.quantity ?? 0), 0);
}

function groupCard(g: ProductGroup) {
  const first = g.items[0];
  const isVariants = g.items.length > 1 || first.variant_of !== null;
  const prices = g.items.map(p => p.price_minor);
  const min = Math.min(...prices);
  const price = isVariants && Math.max(...prices) !== min ? `desde ${money(min)}` : money(min);
  const tracked = g.items.map(p => stockNow.get(p.id)).filter((s): s is ProductStock => Boolean(s));
  const allOut = tracked.length === g.items.length && tracked.every(s => s.quantity <= 0);
  const badge = isVariants
    ? allOut ? stockBadge(tracked[0]) : ""
    : stockBadge(stockNow.get(first.id));
  const qty = inCart(g);
  const photo = g.items.find(p => p.image_url)?.image_url ?? null;
  return `<button type="button" class="card${qty ? " in-cart" : ""}${allOut ? " is-out" : ""}" data-key="${escapeHtml(g.key)}" ${allOut ? 'aria-disabled="true"' : ""}>
    ${thumb(photo, g.title, first.category)}
    ${qty ? `<span class="qty-in-cart">${qty}</span>` : ""}
    <span class="name">${escapeHtml(g.title)}</span>
    <span class="row"><span class="price num">${price}</span>${isVariants ? `<span class="vars">${g.items.length} opciones</span>` : ""}${badge}</span>
  </button>`;
}

async function renderProducts(q: string) {
  const rows = await db.select<ListedProduct[]>(
    `SELECT p.id,p.name,p.category,p.variant_of,p.variant_label,p.image_url,pr.amount_minor AS price_minor,MIN(b.code) AS barcode
     FROM local_products p
     JOIN local_prices pr ON pr.product_id=p.id AND pr.business_id=p.business_id AND pr.active=1 AND pr.currency='USD'
     LEFT JOIN local_barcodes b ON b.product_id=p.id AND b.business_id=p.business_id
     WHERE p.business_id=$1 AND p.active=1
       AND (p.name LIKE $2 OR COALESCE(p.sku,'') LIKE $2 OR COALESCE(b.code,'') LIKE $2)
       AND ($3 = '' OR COALESCE(p.category,$4) = $3)
     GROUP BY p.id
     ORDER BY p.name`,
    [BUSINESS_ID, `%${q}%`, selectedCategory, NO_CATEGORY]
  );
  stockNow = await stockFor();
  const groups = groupProducts(rows);
  groupsByKey = new Map(groups.map(g => [g.key, g]));
  const el = $("#products");
  el.innerHTML = groups.map(groupCard).join("") || `<p class="empty">Sin productos para esta búsqueda</p>`;
  el.querySelectorAll<HTMLButtonElement>(".card").forEach(b => (b.onclick = () => pickGroup(groupsByKey.get(b.dataset.key!)!)));
}

function pickGroup(g: ProductGroup) {
  const isVariants = g.items.length > 1 || g.items[0].variant_of !== null;
  if (!isVariants) {
    const stock = stockNow.get(g.items[0].id);
    if (stock && stock.quantity <= 0) return showToast(`${g.title} está agotado`, "error");
    return addToCart(g.items[0]);
  }
  const sheet = openSheet(`
    <div class="sheet-head"><h2>${escapeHtml(g.title)}</h2><button class="btn btn-ghost btn-icon" data-close aria-label="Cerrar">×</button></div>
    <p class="t-sm muted">Elige la opción</p>
    <div class="vgrid">${g.items.map(p => {
      const s = stockNow.get(p.id);
      const out = Boolean(s && s.quantity <= 0);
      return `<button type="button" class="vopt" data-id="${escapeHtml(p.id)}" ${out ? "disabled" : ""}><span class="vname">${escapeHtml(p.variant_label ?? p.name)}</span><span class="num t-sm">${money(p.price_minor)}</span>${stockBadge(s)}</button>`;
    }).join("")}</div>`, `Opciones de ${g.title}`);
  sheet.el.querySelector<HTMLButtonElement>("[data-close]")!.onclick = sheet.close;
  sheet.el.querySelectorAll<HTMLButtonElement>(".vopt").forEach(b => (b.onclick = () => {
    addToCart(g.items.find(p => p.id === b.dataset.id)!);
    sheet.close();
  }));
}

async function refreshCatalog() {
  await renderCategories();
  await renderProducts(queryInput.value);
}

async function renderLowStock() {
  const stock = await stockFor();
  const low = Array.from(stock.values()).filter(s => s.quantity <= s.lowAt);
  if (!low.length) {
    $("#low-stock").innerHTML = `<p class="muted">Ningún producto está en su mínimo.</p>`;
    return;
  }
  const names = await db.select<Array<{ id: string; name: string; image_url: string | null; category: string | null }>>(
    "SELECT id,name,image_url,category FROM local_products WHERE business_id=$1 AND active=1",
    [BUSINESS_ID]
  );
  const byId = new Map(names.map(n => [n.id, n]));
  $("#low-stock").innerHTML = `<p class="t-sm muted">${low.length} productos con ${low.some(s => s.lowAt !== 2) ? "su mínimo" : "2 unidades"} o menos.</p>` + low
    .filter(s => byId.has(s.productId))
    .sort((a, b) => a.quantity - b.quantity)
    .map(s => {
      const p = byId.get(s.productId)!;
      return `<div class="list-row"><div style="width: 40px">${thumb(p.image_url, p.name, p.category)}</div><span class="grow">${escapeHtml(p.name)}</span>${stockBadge(s)}</div>`;
    })
    .join("");
}

/** Warns once when this sale leaves a product at or below its warning level. */
function warnLowStock(before: Map<string, ProductStock>, after: Map<string, ProductStock>, names: Map<string, string>) {
  const crossed = Array.from(after.values()).filter(s => {
    const prev = before.get(s.productId);
    return s.quantity <= s.lowAt && (!prev || prev.quantity > prev.lowAt);
  });
  if (!crossed.length) return;
  const text = crossed
    .map(s => (s.quantity <= 0 ? `${names.get(s.productId)} agotado` : `quedan ${s.quantity} de ${names.get(s.productId)}`))
    .join(" · ");
  window.setTimeout(() => showToast(`Atención: ${text}`, "error", 6000), 1500);
  setStatus(`Atención: ${text}`);
}

// ---------- Offline photos ----------

async function loadCachedPhotos() {
  try {
    const rows = await invoke<Array<{ url: string; dataUrl: string }>>("images_cached");
    for (const r of rows) photoCache.set(r.url, r.dataUrl);
  } catch (e) {
    console.warn("photo cache", e);
  }
}

/** Downloads missing thumbnails in the background, then repaints once. */
async function cachePhotos() {
  if (caching || !navigator.onLine) return;
  caching = true;
  let saved = 0;
  try {
    for (let round = 0; round < 10; round++) {
      const n = await invoke<number>("images_cache", { limit: 40, now: new Date().toISOString() });
      saved += n;
      if (n < 40) break;
    }
  } catch (e) {
    console.warn("photo download", e);
  } finally {
    caching = false;
  }
  if (saved) {
    await loadCachedPhotos();
    await renderProducts(queryInput.value);
  }
}
window.addEventListener("online", () => void cachePhotos());

// ---------- Cart ----------

function cartTotalMinor() {
  return Array.from(cart.values()).reduce((total, line) => total + line.product.price_minor * line.quantity, 0);
}

function cartCount() {
  return Array.from(cart.values()).reduce((n, l) => n + l.quantity, 0);
}

function cartLinesHtml() {
  if (!cart.size) return `<p class="empty">Toca un producto para añadirlo.</p>`;
  return `<div class="cart-lines">${Array.from(cart.values()).map(({ product, quantity }) => `
    <div class="line" data-id="${escapeHtml(product.id)}">
      ${thumb(product.image_url, product.name, product.category)}
      <div class="info"><div style="font-weight: 700">${escapeHtml(product.variant_of ? variantTitle(product) : product.name)}</div><div class="t-xs muted">${product.variant_label ? escapeHtml(product.variant_label) + " · " : ""}${money(product.price_minor)} c/u</div></div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px">
        <span class="num" style="font-weight: 700">${money(product.price_minor * quantity)}</span>
        <div class="stepper"><button type="button" data-minus aria-label="Quitar uno">${icon(quantity === 1 ? "trash" : "minus", "sm")}</button><span>${quantity}</span><button type="button" data-plus aria-label="Añadir uno">${icon("plus", "sm")}</button></div>
      </div>
    </div>`).join("")}</div>`;
}

function cartFootHtml() {
  const total = cartTotalMinor();
  return `<div class="kv"><span class="muted">Total</span><span class="total-big num">${money(total)}</span></div>
    <button class="btn btn-primary btn-xl btn-block" data-exact ${cart.size ? "" : "disabled"}>${icon("cash")}Efectivo USD exacto</button>
    <button class="btn btn-secondary btn-block" data-split ${cart.size ? "" : "disabled"}>Otra forma o dividir</button>`;
}

function wireCart(scope: HTMLElement) {
  scope.querySelectorAll<HTMLElement>(".line").forEach(row => {
    const id = row.dataset.id!;
    row.querySelector<HTMLButtonElement>("[data-minus]")!.onclick = () => changeQuantity(id, -1);
    row.querySelector<HTMLButtonElement>("[data-plus]")!.onclick = () => changeQuantity(id, 1);
  });
  const exact = scope.querySelector<HTMLButtonElement>("[data-exact]");
  if (exact) exact.onclick = () => void checkout(true);
  const split = scope.querySelector<HTMLButtonElement>("[data-split]");
  if (split) split.onclick = () => void checkout(false);
}

function renderCart() {
  const count = cartCount();
  const total = cartTotalMinor();
  const bar = $("#cartbar");
  bar.classList.toggle("is-empty", !count);
  bar.innerHTML = count
    ? `<span class="count">${count} ${count === 1 ? "artículo" : "artículos"}</span><span class="go">Cobrar ${money(total)} ${icon("chevron", "sm")}</span>`
    : `<span class="count">Carrito vacío</span>`;

  $("#side-cart-title").textContent = count ? `Carrito · ${count}` : "Carrito";
  $("#side-cart-body").innerHTML = cartLinesHtml();
  $("#side-cart-foot").innerHTML = cartFootHtml();
  wireCart($(".side-cart"));

  if (cartSheet) {
    if (!cart.size) {
      cartSheet.close();
    } else {
      cartSheet.el.querySelector<HTMLElement>("[data-lines]")!.innerHTML = cartLinesHtml();
      cartSheet.el.querySelector<HTMLElement>("[data-foot]")!.innerHTML = cartFootHtml();
      wireCart(cartSheet.el);
    }
  }
  // Card counters follow the cart.
  document.querySelectorAll<HTMLButtonElement>("#products .card").forEach(card => {
    const g = groupsByKey.get(card.dataset.key!);
    if (!g) return;
    const qty = inCart(g);
    card.classList.toggle("in-cart", qty > 0);
    let badge = card.querySelector(".qty-in-cart");
    if (qty && !badge) {
      badge = document.createElement("span");
      badge.className = "qty-in-cart";
      card.querySelector(".thumb")!.after(badge);
    }
    if (badge) qty ? (badge.textContent = String(qty)) : badge.remove();
  });
}

function openCart() {
  if (!cart.size) return;
  cartSheet = openSheet(`
    <div class="sheet-head"><h2>Carrito</h2><button class="btn btn-ghost" data-clear style="color: var(--nx-danger)">Vaciar</button></div>
    <div data-lines></div><div class="cart-foot" data-foot></div>`, "Carrito");
  cartSheet.el.querySelector<HTMLButtonElement>("[data-clear]")!.onclick = clearCart;
  void cartSheet.closed.then(() => (cartSheet = null));
  renderCart();
}

function addToCart(product: ListedProduct, undo = true) {
  const current = cart.get(product.id);
  cart.set(product.id, { product, quantity: (current?.quantity ?? 0) + 1 });
  renderCart();
  if (undo) {
    const name = product.variant_label ? `${variantTitle(product)} · ${product.variant_label}` : product.name;
    showToast(`Añadido: ${name}`, "info", 3000, { label: "Deshacer", run: () => changeQuantity(product.id, -1) });
  }
}

function changeQuantity(productId: string, delta: number) {
  const current = cart.get(productId);
  if (!current) return;
  const next = current.quantity + delta;
  if (next <= 0) cart.delete(productId);
  else cart.set(productId, { ...current, quantity: next });
  renderCart();
}

function clearCart() {
  if (!cart.size || !confirm("¿Vaciar el carrito?")) return;
  cart.clear();
  renderCart();
}

$("#cartbar").onclick = openCart;
$("#side-cart-clear").onclick = clearCart;

// ---------- Barcodes ----------

async function addBarcodeToCart(code: string, source: "camera" | "hid" | "manual") {
  const normalized = code.trim();
  if (!normalized) return false;
  const rows = await db.select<ListedProduct[]>(
    `SELECT p.id,p.name,p.category,p.variant_of,p.variant_label,p.image_url,pr.amount_minor AS price_minor,b.code AS barcode
     FROM local_barcodes b
     JOIN local_products p ON p.id=b.product_id AND p.business_id=b.business_id
     JOIN local_prices pr ON pr.product_id=p.id AND pr.business_id=p.business_id AND pr.active=1 AND pr.currency='USD'
     WHERE b.business_id=$1 AND b.code=$2 AND p.active=1
     LIMIT 1`,
    [BUSINESS_ID, normalized]
  );
  if (!rows.length) {
    setStatus(`Código no registrado: ${normalized}`);
    showToast(`Código no registrado: ${normalized}`, "error");
    return false;
  }
  addToCart(rows[0], false);
  const sourceLabel = source === "camera" ? "Cámara" : source === "hid" ? "Lector" : "Código";
  showToast(`${sourceLabel} · ${rows[0].name}`, "success");
  setStatus("");
  return true;
}

async function scanProduct() {
  const button = $<HTMLButtonElement>("#scan");
  try {
    button.disabled = true;
    let permission = await checkPermissions();
    if (permission !== "granted") permission = await requestPermissions();
    if (permission !== "granted") {
      setStatus("Permiso de cámara no concedido · puedes buscar a mano");
      return;
    }
    // The camera reopens after each product found, for the next code; it
    // stops when the seller closes it or a code is not in the catalog.
    for (let i = 0; i < 50; i++) {
      const result = await scan({
        cameraDirection: "back",
        formats: [Format.QRCode, Format.UPC_A, Format.UPC_E, Format.EAN8, Format.EAN13, Format.Code128]
      });
      const found = await addBarcodeToCart(result.content, "camera");
      if (!found) {
        queryInput.value = result.content.trim();
        await renderProducts(queryInput.value);
        break;
      }
      navigator.vibrate?.(60);
    }
  } catch (e) {
    if (!/cancel/i.test(String(e))) setStatus(`Escaneo no disponible: ${String(e)}`);
  } finally {
    button.disabled = false;
  }
}

// ---------- Sale ----------

async function checkout(exactUsdCash: boolean) {
  if (!cart.size) return;
  const totalMinor = cartTotalMinor();
  const payments: PaymentInput[] | null = exactUsdCash
    ? [{ paymentId: crypto.randomUUID(), method: "cash", currency: "USD", amountMinor: totalMinor, usdMinor: totalMinor, exchangeRate: null, provider: null, externalRef: null }]
    : await openCheckout(totalMinor);
  if (!payments) return;
  cartSheet?.close();
  await completeSale(payments);
}

async function completeSale(payments: PaymentInput[]) {
  const saleId = crypto.randomUUID();
  const now = new Date().toISOString();
  const cartSnapshot = Array.from(cart.values()).map(({ product, quantity }) => ({
    name: product.name,
    quantity,
    unitPriceMinor: product.price_minor,
    lineTotalMinor: product.price_minor * quantity
  }));
  const lines = Array.from(cart.values()).map(({ product, quantity }) => ({
    lineId: crypto.randomUUID(),
    movementId: crypto.randomUUID(),
    productId: product.id,
    quantity,
    unitPriceMinor: product.price_minor,
    lineTotalMinor: product.price_minor * quantity
  }));
  const totalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  const soldIds = lines.map(line => line.productId);
  const soldNames = new Map(Array.from(cart.values()).map(({ product }) => [product.id, product.name]));
  const stockBefore = await stockFor(soldIds);

  try {
    await invoke("complete_sale", { input: { saleId, payments, outboxId: crypto.randomUUID(), totalMinor, occurredAt: now, lines } });
  } catch (e) {
    showToast(`Venta no guardada: ${String(e)}`, "error", 6000);
    setStatus(`Venta rechazada · no se guardó nada: ${String(e)}`);
    return;
  }

  const receipt: Receipt = { saleId, occurredAt: now, currency: "USD", payments: describePayments(payments), totalMinor, lines: cartSnapshot };
  cart.clear();
  renderCart();
  renderReceipt(receipt);
  openSaleDone(receipt);
  setStatus("");
  warnLowStock(stockBefore, await stockFor(soldIds), soldNames);
  await renderProducts(queryInput.value);
  await renderHistory();
  await renderAudit();
  await renderNet();
  await refreshFinance();
}

async function renderAudit() {
  try {
    const r = await invoke<IntegrityReport>("audit_local_integrity");
    const complete = r.incompleteSales === 0 && r.rollbackOk;
    $("#audit").textContent = complete
      ? `Integridad OK · ventas ${r.sales} · líneas ${r.saleLines} · pagos ${r.payments} · inventario ${r.inventoryMovements} · envíos ${r.outbox}`
      : `ALERTA de integridad · ventas incompletas ${r.incompleteSales} · rollback ${r.rollbackOk ? "OK" : "FALLÓ"}`;
  } catch (e) {
    $("#audit").textContent = `Auditoría local falló: ${String(e)}`;
  }
}

async function renderHistory() {
  const sales = await db.select<Array<{ count: number }>>("SELECT COUNT(*) AS count FROM local_sales WHERE business_id=$1", [BUSINESS_ID]);
  const pending = await db.select<Array<{ count: number }>>(
    "SELECT COUNT(*) AS count FROM local_outbox WHERE business_id=$1 AND synced_at IS NULL",
    [BUSINESS_ID]
  );
  $("#history").textContent = `Ventas en este equipo: ${sales[0]?.count ?? 0} · pendientes de enviar: ${pending[0]?.count ?? 0}`;
}

// ---------- Search, scanner, HID reader ----------

queryInput.oninput = () => void renderProducts(queryInput.value);
queryInput.onkeydown = async e => {
  if (e.key !== "Enter") return;
  const code = queryInput.value.trim();
  if (!code) return;
  if (await addBarcodeToCart(code, "manual")) {
    queryInput.value = "";
    await renderProducts("");
  }
};
window.addEventListener("nexo:catalog-updated", () => void refreshCatalog().then(cachePhotos));
window.addEventListener("nexo:stock-updated", () => void renderProducts(queryInput.value));
$<HTMLButtonElement>("#scan").onclick = () => void scanProduct();

let hidBuffer = "";
let hidLastKeyAt = 0;
const HID_MAX_GAP_MS = 1500;
const HID_ENTER_GRACE_MS = 2000;

document.addEventListener("keydown", e => {
  const target = e.target as HTMLElement | null;
  const tag = target?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const now = performance.now();
  if (e.key === "Enter") {
    const code = hidBuffer;
    const recent = now - hidLastKeyAt <= HID_ENTER_GRACE_MS;
    hidBuffer = "";
    hidLastKeyAt = 0;
    if (recent && code.length >= 4) {
      e.preventDefault();
      void addBarcodeToCart(code, "hid");
    }
    return;
  }
  if (e.key.length !== 1) return;
  if (now - hidLastKeyAt > HID_MAX_GAP_MS) hidBuffer = "";
  hidBuffer += e.key;
  hidLastKeyAt = now;
});

// ---------- Start ----------

async function init() {
  db = await Database.load("sqlite:nexo-business.db");
  const now = new Date().toISOString();
  const identity = await invoke<DeviceIdentity>("device_identity");
  BUSINESS_ID = identity.businessId;
  showDeviceLabel(identity);

  // Demo products only for the pilot business (the cloud deactivates them).
  for (const p of BUSINESS_ID === PILOT_BUSINESS ? seed : []) {
    await db.execute(
      "INSERT OR IGNORE INTO local_products (id,business_id,sku,name,active,version,updated_at) VALUES ($1,$2,$3,$4,1,1,$5)",
      [p.id, BUSINESS_ID, p.sku, p.name, now]
    );
    await db.execute(
      "INSERT OR IGNORE INTO local_barcodes (id,business_id,product_id,code,format) VALUES ($1,$2,$3,$4,'EAN13')",
      [`barcode-${p.id}`, BUSINESS_ID, p.id, p.barcode]
    );
    await db.execute(
      "INSERT OR IGNORE INTO local_prices (id,business_id,product_id,currency,amount_minor,active,updated_at) VALUES ($1,$2,$3,'USD',$4,1,$5)",
      [`price-${p.id}`, BUSINESS_ID, p.id, p.price, now]
    );
  }

  await loadCachedPhotos();
  await refreshCatalog();
  renderCart();
  await renderNet();
  await renderHistory();
  await renderAudit();
  await mountFinance($(".nx.app"), db);
}

init().then(() => cachePhotos()).catch(e => {
  setStatus(`Error local: ${String(e)}`);
});
