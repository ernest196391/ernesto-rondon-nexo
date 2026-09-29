import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import "./style.css";

type Product = { id: string; name: string; price_minor: number; barcode: string | null };
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
  <div id="products"></div>
  <aside><h2>Carrito</h2><div id="cart">Vacío</div><button id="sell" disabled>Cobrar en efectivo</button></aside>
  <footer id="history"></footer>
  <div class="status" id="audit">Auditoría local pendiente…</div>
</section>`;

let db: Database;
let selected: Product | null = null;

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
  el.innerHTML = rows.map(p => `<button class="product" data-id="${p.id}"><strong>${p.name}</strong><span>${(p.price_minor/100).toFixed(2)}</span></button>`).join("");
  el.querySelectorAll<HTMLButtonElement>(".product").forEach(b => b.onclick = () => choose(rows.find(p => p.id === b.dataset.id)!));
}

function choose(p: Product) {
  selected = p;
  document.querySelector("#cart")!.textContent = `${p.name} · ${(p.price_minor/100).toFixed(2)}`;
  (document.querySelector("#sell") as HTMLButtonElement).disabled = false;
}

async function sell() {
  if (!selected) return;
  const p = selected;
  const saleId = crypto.randomUUID();
  const now = new Date().toISOString();
  const button = document.querySelector("#sell") as HTMLButtonElement;
  button.disabled = true;
  document.querySelector("#status")!.textContent = "Guardando venta atómica…";

  try {
    await invoke("complete_sale", {
      input: {
        saleId,
        lineId: crypto.randomUUID(),
        paymentId: crypto.randomUUID(),
        movementId: crypto.randomUUID(),
        outboxId: crypto.randomUUID(),
        productId: p.id,
        totalMinor: p.price_minor,
        occurredAt: now
      }
    });
    selected = null;
    document.querySelector("#cart")!.textContent = "Vacío";
    document.querySelector("#status")!.textContent = "Venta guardada completa · pendiente de sincronizar";
    await renderHistory();
    await renderAudit();
  } catch (e) {
    document.querySelector("#status")!.textContent = `Venta rechazada · no se guardó parcialmente: ${String(e)}`;
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

(document.querySelector("#query") as HTMLInputElement).oninput = e => renderProducts((e.target as HTMLInputElement).value);
(document.querySelector("#sell") as HTMLButtonElement).onclick = sell;
init().catch(e => { document.querySelector("#status")!.textContent = `Error local: ${String(e)}`; });
