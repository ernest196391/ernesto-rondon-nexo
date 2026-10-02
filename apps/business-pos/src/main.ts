import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import { scan, Format, checkPermissions, requestPermissions } from "@tauri-apps/plugin-barcode-scanner";
import "./style.css";

type Product = { id: string; name: string; price_minor: number; barcode: string | null };
type CartLine = { product: Product; quantity: number };
type ReceiptLine = {
  name: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};
type Receipt = {
  saleId: string;
  occurredAt: string;
  currency: "USD";
  paymentMethod: "cash";
  totalMinor: number;
  lines: ReceiptLine[];
};
type IntegrityReport = {
  sales: number;
  saleLines: number;
  payments: number;
  inventoryMovements: number;
  outbox: number;
  incompleteSales: number;
  rollbackOk: boolean;
};

const seed = [
  { id: "casa-viva-demo-001", sku: "CV-DEMO-001", name: "Producto Casa Viva Demo", price: 25000, barcode: "850000000001" },
  { id: "nexo-demo-002", sku: "NX-DEMO-002", name: "Producto NEXO Demo", price: 12500, barcode: "850000000002" }
];

const BUSINESS_ID = "casa-viva";
const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = `
<section class="shell">
  <header><small>PILOTO 01 · CASA VIVA</small><h1>NEXO Business</h1><p>POS offline · Windows + Android</p></header>
  <div class="status" id="status">Preparando base local…</div>
  <label>Buscar o escanear<input id="query" autocomplete="off" inputmode="search" placeholder="Nombre, SKU o código"></label>
  <button id="scan" type="button">Escanear con cámara</button>
  <div id="products"></div>
  <aside>
    <h2>Carrito</h2>
    <div id="cart">Vacío</div>
    <div class="cart-summary"><span>Total</span><strong id="cart-total">$0.00</strong></div>
    <button id="sell" disabled>Cobrar en efectivo</button>
  </aside>
  <section id="receipt-panel" class="receipt-panel" hidden>
    <div class="receipt-heading">
      <div><small>RECIBO DIGITAL</small><h2>Venta completada</h2></div>
      <strong id="receipt-total">$0.00</strong>
    </div>
    <div id="receipt-content"></div>
    <div class="receipt-actions">
      <button id="share-receipt" type="button">Compartir recibo</button>
      <button id="copy-receipt" type="button">Copiar texto</button>
    </div>
  </section>
  <footer id="history"></footer>
  <div class="status" id="audit">Auditoría local pendiente…</div>
</section>`;

let db: Database;
const cart = new Map<string, CartLine>();
let lastReceipt: Receipt | null = null;

function money(minor: number) {
  return `$${(minor / 100).toFixed(2)}`;
}

function receiptText(receipt: Receipt) {
  const lines = receipt.lines.map(line =>
    `${line.quantity} x ${line.name} · ${money(line.lineTotalMinor)}`
  );
  return [
    "Casa Viva · NEXO Business",
    "Recibo digital",
    `Venta: ${receipt.saleId}`,
    `Fecha: ${new Date(receipt.occurredAt).toLocaleString()}`,
    "",
    ...lines,
    "",
    `Total: ${money(receipt.totalMinor)} USD`,
    "Pago: Efectivo"
  ].join("\n");
}

function renderReceipt(receipt: Receipt) {
  lastReceipt = receipt;
  const panel = document.querySelector("#receipt-panel") as HTMLElement;
  const content = document.querySelector("#receipt-content")!;
  const total = document.querySelector("#receipt-total")!;

  total.textContent = money(receipt.totalMinor);
  content.innerHTML = `
    <div class="receipt-meta">
      <span>${new Date(receipt.occurredAt).toLocaleString()}</span>
      <span>Pago · Efectivo</span>
    </div>
    <div class="receipt-lines">
      ${receipt.lines.map(line => `
        <div class="receipt-line">
          <div><strong>${line.name}</strong><span>${line.quantity} × ${money(line.unitPriceMinor)}</span></div>
          <strong>${money(line.lineTotalMinor)}</strong>
        </div>
      `).join("")}
    </div>
    <div class="receipt-id">ID ${receipt.saleId}</div>
  `;
  panel.hidden = false;
}

async function copyReceipt() {
  if (!lastReceipt) return;
  const text = receiptText(lastReceipt);
  try {
    await navigator.clipboard.writeText(text);
    document.querySelector("#status")!.textContent = "Recibo copiado · listo para pegar en WhatsApp u otra app";
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    document.querySelector("#status")!.textContent = "Recibo copiado";
  }
}

async function shareReceipt() {
  if (!lastReceipt) return;
  const text = receiptText(lastReceipt);

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Recibo Casa Viva",
        text
      });
      document.querySelector("#status")!.textContent = "Recibo compartido";
      return;
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return;
    }
  }

  await copyReceipt();
  document.querySelector("#status")!.textContent =
    "Compartir no está disponible aquí · recibo copiado para pegarlo";
}

function cartTotalMinor() {
  return Array.from(cart.values()).reduce(
    (total, line) => total + line.product.price_minor * line.quantity,
    0
  );
}

function renderCart() {
  const el = document.querySelector("#cart")!;
  const sellButton = document.querySelector("#sell") as HTMLButtonElement;
  const totalEl = document.querySelector("#cart-total")!;

  if (!cart.size) {
    el.textContent = "Vacío";
    totalEl.textContent = "$0.00";
    sellButton.disabled = true;
    return;
  }

  el.innerHTML = Array.from(cart.values()).map(({ product, quantity }) => `
    <div class="cart-line" data-id="${product.id}">
      <div class="cart-line-info">
        <strong>${product.name}</strong>
        <span>${money(product.price_minor)} c/u · ${money(product.price_minor * quantity)}</span>
      </div>
      <div class="cart-controls">
        <button type="button" class="qty-minus" aria-label="Quitar uno">−</button>
        <strong class="qty">${quantity}</strong>
        <button type="button" class="qty-plus" aria-label="Agregar uno">+</button>
        <button type="button" class="remove-line">Eliminar</button>
      </div>
    </div>
  `).join("");

  el.querySelectorAll<HTMLElement>(".cart-line").forEach(row => {
    const id = row.dataset.id!;
    row.querySelector<HTMLButtonElement>(".qty-minus")!.onclick = () => changeQuantity(id, -1);
    row.querySelector<HTMLButtonElement>(".qty-plus")!.onclick = () => changeQuantity(id, 1);
    row.querySelector<HTMLButtonElement>(".remove-line")!.onclick = () => removeFromCart(id);
  });

  totalEl.textContent = money(cartTotalMinor());
  sellButton.disabled = false;
}

function addToCart(product: Product) {
  const current = cart.get(product.id);
  cart.set(product.id, {
    product,
    quantity: (current?.quantity ?? 0) + 1
  });
  renderCart();
}

function changeQuantity(productId: string, delta: number) {
  const current = cart.get(productId);
  if (!current) return;

  const next = current.quantity + delta;
  if (next <= 0) {
    cart.delete(productId);
  } else {
    cart.set(productId, { ...current, quantity: next });
  }
  renderCart();
}

function removeFromCart(productId: string) {
  cart.delete(productId);
  renderCart();
}

async function init() {
  db = await Database.load("sqlite:nexo-business.db");
  const now = new Date().toISOString();

  for (const p of seed) {
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

  document.querySelector("#status")!.textContent = "Base local formal lista · Internet no requerido";
  await renderProducts("");
  renderCart();
  await renderHistory();
  await renderAudit();
}

async function renderProducts(q: string) {
  const rows = await db.select<Product[]>(
    `SELECT p.id,p.name,pr.amount_minor AS price_minor,b.code AS barcode
     FROM local_products p
     JOIN local_prices pr ON pr.product_id=p.id AND pr.business_id=p.business_id AND pr.active=1
     LEFT JOIN local_barcodes b ON b.product_id=p.id AND b.business_id=p.business_id
     WHERE p.business_id=$1 AND p.active=1
       AND (p.name LIKE $2 OR COALESCE(p.sku,'') LIKE $2 OR COALESCE(b.code,'') LIKE $2)
     ORDER BY p.name`,
    [BUSINESS_ID, `%${q}%`]
  );
  const el = document.querySelector("#products")!;
  el.innerHTML = rows.map(p =>
    `<button class="product" data-id="${p.id}"><strong>${p.name}</strong><span>${money(p.price_minor)}</span></button>`
  ).join("");
  el.querySelectorAll<HTMLButtonElement>(".product").forEach(
    b => b.onclick = () => addToCart(rows.find(p => p.id === b.dataset.id)!)
  );
}

async function addBarcodeToCart(code: string, source: "camera" | "hid" | "manual") {
  const normalized = code.trim();
  if (!normalized) return false;

  const rows = await db.select<Product[]>(
    `SELECT p.id,p.name,pr.amount_minor AS price_minor,b.code AS barcode
     FROM local_barcodes b
     JOIN local_products p
       ON p.id=b.product_id AND p.business_id=b.business_id
     JOIN local_prices pr
       ON pr.product_id=p.id
      AND pr.business_id=p.business_id
      AND pr.active=1
     WHERE b.business_id=$1
       AND b.code=$2
       AND p.active=1
     LIMIT 1`,
    [BUSINESS_ID, normalized]
  );

  const status = document.querySelector("#status")!;
  if (!rows.length) {
    status.textContent = `Código no registrado: ${normalized}`;
    return false;
  }

  addToCart(rows[0]);
  const sourceLabel =
    source === "camera" ? "Cámara" :
    source === "hid" ? "Lector USB/Bluetooth" :
    "Código";
  status.textContent = `${sourceLabel} · ${rows[0].name} añadido al carrito`;
  return true;
}

async function scanProduct() {
  const status = document.querySelector("#status")!;
  const button = document.querySelector("#scan") as HTMLButtonElement;

  try {
    button.disabled = true;
    status.textContent = "Preparando cámara...";

    let permission = await checkPermissions();
    if (permission !== "granted") permission = await requestPermissions();

    if (permission !== "granted") {
      status.textContent = "Permiso de cámara no concedido · puedes buscar manualmente";
      return;
    }

    status.textContent = "Escanea el código del producto...";

    const result = await scan({
      cameraDirection: "back",
      formats: [Format.QRCode, Format.UPC_A, Format.UPC_E, Format.EAN8, Format.EAN13]
    });

    await addBarcodeToCart(result.content, "camera");
  } catch (e) {
    status.textContent = `Escaneo cancelado o no disponible: ${String(e)}`;
  } finally {
    button.disabled = false;
  }
}

async function sell() {
  if (!cart.size) return;

  const saleId = crypto.randomUUID();
  const now = new Date().toISOString();
  const button = document.querySelector("#sell") as HTMLButtonElement;
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

  button.disabled = true;
  document.querySelector("#status")!.textContent = "Guardando venta atómica…";

  try {
    await invoke("complete_sale", {
      input: {
        saleId,
        paymentId: crypto.randomUUID(),
        outboxId: crypto.randomUUID(),
        totalMinor,
        occurredAt: now,
        lines
      }
    });

    const receipt: Receipt = {
      saleId,
      occurredAt: now,
      currency: "USD",
      paymentMethod: "cash",
      totalMinor,
      lines: cartSnapshot
    };

    cart.clear();
    renderCart();
    renderReceipt(receipt);
    document.querySelector("#status")!.textContent = "Venta guardada completa · recibo listo para compartir";
    await renderHistory();
    await renderAudit();
  } catch (e) {
    document.querySelector("#status")!.textContent =
      `Venta rechazada · no se guardó parcialmente: ${String(e)}`;
    button.disabled = false;
  }
}

async function renderAudit() {
  try {
    const r = await invoke<IntegrityReport>("audit_local_integrity");
    const complete = r.incompleteSales === 0 && r.rollbackOk;
    document.querySelector("#audit")!.textContent = complete
      ? `Integridad OK · ventas ${r.sales} · líneas ${r.saleLines} · pagos ${r.payments} · inventario ${r.inventoryMovements} · outbox ${r.outbox} · rollback OK`
      : `ALERTA de integridad · ventas incompletas ${r.incompleteSales} · rollback ${r.rollbackOk ? "OK" : "FALLÓ"}`;
  } catch (e) {
    document.querySelector("#audit")!.textContent = `Auditoría local falló: ${String(e)}`;
  }
}

async function renderHistory() {
  const sales = await db.select<Array<{ id: string }>>(
    "SELECT id FROM local_sales WHERE business_id=$1 ORDER BY occurred_at DESC LIMIT 50",
    [BUSINESS_ID]
  );
  const pending = await db.select<Array<{ count: number }>>(
    "SELECT COUNT(*) AS count FROM local_outbox WHERE business_id=$1 AND synced_at IS NULL",
    [BUSINESS_ID]
  );
  document.querySelector("#history")!.textContent = sales.length
    ? `Ventas formales locales: ${sales.length} · Pendientes de sincronizar: ${pending[0]?.count ?? 0}`
    : "Aún no hay ventas formales locales";
}

const queryInput = document.querySelector("#query") as HTMLInputElement;
queryInput.oninput = e => renderProducts((e.target as HTMLInputElement).value);
queryInput.onkeydown = async e => {
  if (e.key !== "Enter") return;
  const code = queryInput.value.trim();
  if (!code) return;
  const added = await addBarcodeToCart(code, "manual");
  if (added) {
    queryInput.value = "";
    await renderProducts("");
  }
};

let hidBuffer = "";
let hidLastKeyAt = 0;
const HID_MAX_GAP_MS = 1500;
const HID_ENTER_GRACE_MS = 2000;

document.addEventListener("keydown", e => {
  const target = e.target as HTMLElement | null;
  const tag = target?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
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

  if (now - hidLastKeyAt > HID_MAX_GAP_MS) {
    hidBuffer = "";
  }

  hidBuffer += e.key;
  hidLastKeyAt = now;
});

(document.querySelector("#scan") as HTMLButtonElement).onclick = scanProduct;
(document.querySelector("#sell") as HTMLButtonElement).onclick = sell;
(document.querySelector("#share-receipt") as HTMLButtonElement).onclick = shareReceipt;
(document.querySelector("#copy-receipt") as HTMLButtonElement).onclick = copyReceipt;

init().catch(e => {
  document.querySelector("#status")!.textContent = `Error local: ${String(e)}`;
});
