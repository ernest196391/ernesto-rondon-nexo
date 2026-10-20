// 20-oct-2026 (decisión de Ernesto): publicar TODO lo vigente de Sergio y LJH «bajo pedido», sin confirmar con el proveedor
// (se confirma en cada venta con el flujo de bajo pedido). Los dos proveedores, también los repetidos (un producto por proveedor).
// Entrada: productos.json + fotos limpias (limpiar.mjs en el VPS, copiadas al servidor web en ~/electro-fotos/<id>/<n>.jpg).
// Salida: publicar.json (lo lee crear-productos.php) y fuera.txt.   Uso: node armar-publicar.mjs fotos-por-producto.json
import fs from 'fs';
const DIR = new URL('.', import.meta.url);
const prods = JSON.parse(fs.readFileSync(new URL('productos.json', DIR), 'utf8'));
const nfotos = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); // { "<market_id>": n }
const myPrice = (c) => (c < 60 ? Math.ceil(c + Math.min(17, Math.max(5, c * 0.4))) : Math.ceil((c + Math.max(17, c > 300 ? c * 0.1 : 0)) / 5) * 5);
const share = (p, c) => Math.max(0, Math.round((p - c) * 0.4 * 100) / 100);
const PROVEEDOR = /(sergio|hern[aá]ndez|ljh|ricardo|electro\s*l\s*q|nesecitas|necesitas|wintech|nika\s*solar|@\w+)/i;
const cleanText = (t = '') => String(t)
  .split('\n')
  .filter((l) => !/(usd|cup|mlc|\$|precio|transporte|mensajer|garant|factura|oferta|rebaja|ahora en|responde a|escr[ií]beme|ll[aá]mame|whats|contact|interesad|pregunt|disponible|habana|domicilio|entrega)/i.test(l))
  .filter((l) => !PROVEEDOR.test(l))
  .map((l) => l.replace(/(\d)\s*[*xX×]\s*(?=\d)/g, '$1×').replace(/(\+?53)?[\s-]*\d[\d\s-]{6,}\d/g, '').replace(/wa\.me\/\S+/gi, '').replace(/[*_~]/g, '').trim())
  .filter(Boolean).join('\n').slice(0, 1500);
const nombre = (p) => (p.tipo === 'estaciones' && !/estaci[oó]n/i.test(p.nombre) ? `Estación de energía ${p.nombre}` : p.nombre);
const out = [], fuera = [];
for (const p of prods) {
  const tag = `${p.clave_proveedor} ${p.n}. ${p.sku} ${p.nombre}`;
  if (p.antiguo) { fuera.push(`${tag}: antiguo (no se anuncia desde ${p.ultima_vez})`); continue; }
  if (p.en_web.length) { fuera.push(`${tag}: ya está en la web (${p.en_web.map((w) => w.product_id).join(', ')})`); continue; }
  if (p.moneda !== 'USD') { fuera.push(`${tag}: precio en ${p.moneda}`); continue; }
  const cost = Number(p.precio_proveedor), precio = myPrice(cost);
  if (precio !== Number(p.precio_venta)) { fuera.push(`${tag}: precio ${p.precio_venta} ≠ regla ${precio}`); continue; }
  const n = Number(nfotos[p.market_id] || 0);
  out.push({
    market_id: p.market_id, ids: p.ids, nombre: nombre(p), proveedor: p.clave_proveedor, n: p.n, tipo: p.tipo,
    precio_proveedor: cost, precio, comision: share(precio, cost), precio_manual: false, departamentos: p.departamentos,
    descripcion: cleanText(p.texto_proveedor),
    fotos: Array.from({ length: n }, (_, i) => `/home/u824654880/electro-fotos/${p.market_id}/${i + 1}.jpg`),
    confirmado: true, confirmado_por: 'Ernesto 20-oct: bajo pedido, se confirma con el proveedor en cada venta',
  });
}
fs.writeFileSync(new URL('publicar.json', DIR), JSON.stringify({ generado: new Date().toISOString(), estado: 'publish', productos: out }, null, 1));
fs.writeFileSync(new URL('fuera.txt', DIR), fuera.join('\n') + '\n');
console.log(`publicar.json: ${out.length} (Sergio ${out.filter((x) => x.proveedor === 'S').length}, LJH ${out.filter((x) => x.proveedor === 'L').length}) · sin fotos: ${out.filter((x) => !x.fotos.length).length} · fuera: ${fuera.length}`);
