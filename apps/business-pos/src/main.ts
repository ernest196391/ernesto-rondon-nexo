import Database from "@tauri-apps/plugin-sql";
import "./style.css";

type Product = { id: string; name: string; price_minor: number; barcode: string };
const demo: Product[] = [
  { id: "demo-001", name: "Producto Casa Viva Demo", price_minor: 25000, barcode: "850000000001" },
  { id: "demo-002", name: "Producto NEXO Demo", price_minor: 12500, barcode: "850000000002" }
];

const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = `
<section class="shell">
  <header><small>PILOTO 01 · CASA VIVA</small><h1>NEXO Business</h1><p>POS offline · Windows + Android</p></header>
  <div class="status" id="status">Preparando base local…</div>
  <label>Buscar o escanear<input id="query" autocomplete="off" inputmode="search" placeholder="Nombre, SKU o código"></label>
  <div id="products"></div>
  <aside><h2>Carrito</h2><div id="cart">Vacío</div><button id="sell" disabled>Cobrar en efectivo</button></aside>
  <footer id="history"></footer>
</section>`;

let db: Database;
let selected: Product | null = null;

async function init() {
  db = await Database.load("sqlite:nexo-business.db");
  await db.execute("CREATE TABLE IF NOT EXISTS demo_products (id TEXT PRIMARY KEY, name TEXT NOT NULL, price_minor INTEGER NOT NULL, barcode TEXT NOT NULL UNIQUE)");
  await db.execute("CREATE TABLE IF NOT EXISTS demo_sales (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, total_minor INTEGER NOT NULL, occurred_at TEXT NOT NULL)");
  await db.execute("CREATE TABLE IF NOT EXISTS demo_outbox (id TEXT PRIMARY KEY, entity_id TEXT NOT NULL, operation_type TEXT NOT NULL, synced_at TEXT)");
  for (const p of demo) await db.execute("INSERT OR IGNORE INTO demo_products (id,name,price_minor,barcode) VALUES ($1,$2,$3,$4)", [p.id,p.name,p.price_minor,p.barcode]);
  document.querySelector("#status")!.textContent = "Base local lista · Internet no requerido";
  await renderProducts("");
  await renderHistory();
}

async function renderProducts(q: string) {
  const rows = await db.select<Product[]>("SELECT id,name,price_minor,barcode FROM demo_products WHERE name LIKE $1 OR barcode LIKE $1 ORDER BY name", [`%${q}%`]);
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
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute("INSERT INTO demo_sales (id,product_id,total_minor,occurred_at) VALUES ($1,$2,$3,$4)", [id,selected.id,selected.price_minor,now]);
  await db.execute("INSERT INTO demo_outbox (id,entity_id,operation_type) VALUES ($1,$2,'sale.completed')", [id,id]);
  selected = null;
  document.querySelector("#cart")!.textContent = "Vacío";
  (document.querySelector("#sell") as HTMLButtonElement).disabled = true;
  await renderHistory();
}

async function renderHistory() {
  const rows = await db.select<Array<{id:string; occurred_at:string}>>("SELECT id,occurred_at FROM demo_sales ORDER BY occurred_at DESC LIMIT 5");
  document.querySelector("#history")!.textContent = rows.length ? `Ventas guardadas localmente: ${rows.length}` : "Aún no hay ventas locales";
}

(document.querySelector("#query") as HTMLInputElement).oninput = e => renderProducts((e.target as HTMLInputElement).value);
(document.querySelector("#sell") as HTMLButtonElement).onclick = sell;
init().catch(e => { document.querySelector("#status")!.textContent = `Error local: ${String(e)}`; });
