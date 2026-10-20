// Cola de anuncios (novedades.mjs): un producto por mensaje, foto limpia + pie sin proveedor ni su precio.
// Orden: alternando tipos (no 30 baterías seguidas); los repetidos más caros (el mismo producto del otro proveedor) al final.
import fs from 'fs';
const creados = JSON.parse(fs.readFileSync(new URL('bak-20261020-electro-creados.json', import.meta.url), 'utf8'));
const prods = JSON.parse(fs.readFileSync(new URL('productos.json', import.meta.url), 'utf8'));
const bySku = new Map(prods.map((p) => [p.sku, p]));
const money = (x) => { const n = Math.round(Number(x) * 100) / 100; return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ','); };
const body = (c) => `🆕 *${c.nombre}*\nPrecio: *${money(c.precio)} USD*\nGanas: *${money(c.comision)} USD* por cada uno\nBajo pedido (24 h)`;
const item = (c) => ({ sku: c.sku, market_id: c.market_id, product_id: c.id, file_path: `/root/archivos/novedades/fotos/${c.sku}.jpg`, body: body(c) });
const main = [], tarde = [];
for (const c of creados) {
  const p = bySku.get(c.sku); const par = p?.par;
  const otroPublicado = par && creados.some((x) => x.sku === par.sku);
  if (otroPublicado && (Number(par.precio_venta) < c.precio || (Number(par.precio_venta) === c.precio && p.clave_proveedor === 'L'))) tarde.push({ c, tipo: p.tipo });
  else main.push({ c, tipo: p?.tipo || 'otros' });
}
const porTipo = new Map();
for (const x of main) { if (!porTipo.has(x.tipo)) porTipo.set(x.tipo, []); porTipo.get(x.tipo).push(x.c); }
const listas = [...porTipo.values()];
const orden = [];
while (listas.some((l) => l.length)) for (const l of listas) if (l.length) orden.push(l.shift());
const items = [...orden.map(item), ...tarde.map((x) => item(x.c))];
fs.writeFileSync(new URL('cola.json', import.meta.url), JSON.stringify({ desde: '2026-10-21', grupo: '120363283827702479@g.us', repetidos_desde: orden.length + 1, items }, null, 1));
console.log(`cola: ${items.length} (primero ${orden.length} distintos; desde el n.º ${orden.length + 1}, ${tarde.length} repetidos más caros del otro proveedor)`);
console.log(items[0].body); console.log(items[1].body);
