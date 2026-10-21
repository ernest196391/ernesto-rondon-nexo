// Tienda 42 y 23 (TRD de 42 y 23, Playa) → publicar.json (lo leen bolsa-crear.mjs en el VPS y crear-productos.php en la web).
// 20-oct-2026, Ernesto: «usa el precio de la pegatina y súmale lo que nosotros ganamos en Casa Viva … y ya ponlos publicados».
// Precio = regla del bot (vivabot/src/market-price.js, se importa tal cual); gestora = 40 % del margen (gestoraShare).
// Costo = precio de la etiqueta; donde hay pegatina negra más baja, la pegatina (cocina Royal 4 hornillas 85, ventilador Royal
// 55, GWELL 600 W 350, GWELL grande 427). Fuera: split Parker (sin precio) y cocina Arox CG-05 (foto inservible).
// Los dos paneles (#22 18 V y #23 36 V) son el mismo producto web 1146 (variable, 2 variaciones): un solo artículo de la bolsa.
// Uso: node armar-publicar.mjs [bolsa-ids.json]   (bolsa-ids.json = { "<n>": <id crm_market_items> } que deja bolsa-crear.mjs)
import fs from 'fs';
import { myPrice, gestoraShare } from '../../../../../vivabot/src/market-price.js';

const DIR = new URL('.', import.meta.url);
const prods = JSON.parse(fs.readFileSync(new URL('productos.json', DIR), 'utf8'));
const idsFile = process.argv[2];
const ids = idsFile && fs.existsSync(idsFile) ? JSON.parse(fs.readFileSync(idsFile, 'utf8')) : {};

const COCINA = ['electrodomesticos', 'cocina'];
const ENERGIA = ['apagones-y-energia'];
// n → título, descripción (solo datos de la etiqueta o la caja), departamentos, foto, producto web a actualizar.
const P = {
  2: { t: 'Motobomba periférica Thebe TP-70 Junior', d: 'Motobomba periférica Thebe (Ebara Corporation), modelo TP-70 Junior.\nUsos que indica la caja: casa, agricultura, fincas y obras.\nNueva, en su caja.', dep: ['ferreteria'], cat: 'ferretería', size: 'pequeno' },
  3: { t: 'Bomba de agua periférica Hyundai 1/2 HP (370 W)', d: 'Bomba de agua periférica Hyundai, modelo HY-CH05HP.\nPotencia: 1/2 HP (370 W).\nNueva, en su caja.', dep: ['ferreteria'], cat: 'ferretería', size: 'pequeno' },
  4: { t: 'Batidora Hamilton Beach blanca de 5 botones', d: 'Batidora Hamilton Beach.\nJarra plástica transparente con tapa.\nBase blanca con 5 botones al frente.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno', web: 1015 },
  5: { t: 'Batidora Hamilton Beach negra con jarra de vidrio', d: 'Batidora Hamilton Beach.\nJarra de vidrio.\n5 velocidades y pulso.\nBase negra.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  6: { t: 'Batidora Kenwood gris', d: 'Batidora Kenwood.\nJarra transparente.\nBase gris con perilla naranja.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  7: { t: 'Batidora Philco blanca con jarra de 1,5 L', d: 'Batidora Philco.\nJarra plástica de 1,5 litros.\n2 velocidades y pulso.\nBase blanca.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  8: { t: 'Batidora Continental blanca', d: 'Batidora Continental.\nJarra transparente.\n2 velocidades y pulso.\nBase blanca.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  9: { t: 'Cocina de gas Royal REG404BK de 4 hornillas', d: 'Cocina de gas de mesa Royal, modelo REG404BK.\n4 hornillas.\nAcero inoxidable.', dep: COCINA, cat: 'electrodomésticos', size: 'grande' },
  10: { t: 'Cocina de gas Royal de 2 hornillas con tope de vidrio', d: 'Cocina de gas de mesa Royal.\n2 hornillas.\nTope de vidrio negro con diseño azul.\nPerillas al frente.', dep: COCINA, cat: 'electrodomésticos', size: 'grande', foto: 'fotos-pro/10b-cocina-de-gas-royal-2-hornillas-logo-corregido.jpg' },
  12: { t: 'Olla arrocera Kenwood gris con vaporera', d: 'Olla arrocera Kenwood.\nCon vaporera y tapa de vidrio.\nColor gris.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  13: { t: 'Olla arrocera Kenwood blanca con vaporera', d: 'Olla arrocera Kenwood.\nCon vaporera y tapa de vidrio.\nColor blanco.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  14: { t: 'Olla arrocera Continental blanca', d: 'Olla arrocera Continental.\nTapa de vidrio.\nFunciones cocinar y calentar.\nColor blanco.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  15: { t: 'Olla arrocera Philco blanca', d: 'Olla arrocera Philco.\nTapa de acero.\nFunciones cocinar y mantener caliente.\nColor blanco.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  16: { t: 'Olla arrocera Hamilton Beach negra', d: 'Olla arrocera Hamilton Beach.\nColor negro.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  17: { t: 'Olla arrocera Hamilton Beach roja', d: 'Olla arrocera Hamilton Beach.\nColor rojo.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  18: { t: 'Olla de presión eléctrica RCA', d: 'Olla de presión eléctrica RCA.\nCuerpo de acero inoxidable.\nPerilla de programas.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  19: { t: 'Olla de presión eléctrica Philco', d: 'Olla de presión eléctrica Philco.\nCuerpo de acero inoxidable.\nPerilla de programas.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  20: { t: 'Olla de presión eléctrica GWELL roja', d: 'Olla de presión eléctrica GWELL.\nPerilla de tiempo.\nColor rojo.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  21: { t: 'Olla de presión eléctrica Ariete digital', d: 'Olla de presión eléctrica Ariete.\nPanel digital con 9 programas.\nCuerpo de acero inoxidable.', dep: COCINA, cat: 'electrodomésticos', size: 'pequeno' },
  22: { t: 'Panel solar plegable 120 W (18 V o 36 V)', d: 'Panel solar plegable y portátil de 120 W.\nDos versiones: 18 V o 36 V (elige la tuya).\nComprueba que tu estación o controlador acepta ese voltaje antes de conectarlo.', dep: ENERGIA, cat: 'cargadores portátiles y baterías', size: 'grande', web: 1146, juntos: [23] },
  24: { t: 'Ventilador recargable Royal RA12RSL de 12" con panel solar y 2 bombillos', d: 'Ventilador de mesa recargable Royal, modelo RA12RSL, de 12 pulgadas.\nIncluye panel solar para cargarlo y 2 bombillos LED.', dep: ['apagones-y-energia', 'electrodomesticos'], cat: 'ventilador', size: 'pequeno', web: 1019 },
  25: { t: 'Estación de energía GWELL 600 W / 672 Wh', d: 'Estación de energía portátil GWELL.\nPotencia 600 W.\nCapacidad 672 Wh.', dep: ENERGIA, cat: 'cargadores portátiles y baterías', size: 'grande' },
  26: { t: 'Estación de energía GWELL con 3 tomas de 110 V', d: 'Estación de energía portátil GWELL (modelo grande).\n3 tomas de 110 V.\nEntrada de carga de 24 a 50 V.\nIncluye cargador.', dep: ENERGIA, cat: 'cargadores portátiles y baterías', size: 'grande' },
};
const FUERA = { 1: 'split Parker: sin precio (y el 1013 se deja como está)', 11: 'cocina Arox CG-05: la foto no sirve, hay que pedir otra', 23: 'panel 36 V: va junto con el 18 V en el producto web 1146 (una sola ficha con las 2 versiones)' };
// Pegatina negra más baja = costo (Ernesto 20-oct). productos.json ya trae esos costos; se comprueba aquí.
const PEGATINA = { 9: 85, 24: 55, 25: 350, 26: 427 };

const fotoPro = (n) => {
  const f = fs.readdirSync(new URL('fotos-pro/', DIR)).find((x) => x.startsWith(String(n).padStart(2, '0') + '-'));
  if (!f) throw new Error(`sin foto pro para #${n}`);
  return `fotos-pro/${f}`;
};

const out = [], fuera = [];
for (const p of prods) {
  if (FUERA[p.n]) { fuera.push(`#${p.n} ${p.nombre}: ${FUERA[p.n]}`); continue; }
  const o = P[p.n];
  if (!o) throw new Error(`#${p.n} sin datos de publicación`);
  if (p.moneda !== 'USD') throw new Error(`#${p.n} no está en USD`);
  const cost = Number(p.precio_proveedor);
  if (PEGATINA[p.n] != null && PEGATINA[p.n] !== cost) throw new Error(`#${p.n} costo ${cost} ≠ pegatina ${PEGATINA[p.n]}`);
  const precio = myPrice(cost, 'USD');
  const comision = gestoraShare(precio, cost);
  if (precio !== Number(p.precio_venta)) console.warn(`aviso #${p.n}: la lista decía ${p.precio_venta}, la regla da ${precio}`);
  const foto = o.foto || fotoPro(p.n);
  if (!fs.existsSync(new URL(foto, DIR))) throw new Error(`#${p.n} no existe ${foto}`);
  out.push({
    n: p.n, juntos: o.juntos || [], market_id: ids[p.n] || null, nombre: o.t, descripcion: o.d,
    precio_proveedor: cost, precio, comision, precio_manual: false, departamentos: o.dep,
    categoria_bolsa: o.cat, tamano: o.size, actualizar: o.web || null,
    foto_local: foto, fotos: [`/home/u824654880/42y23-fotos/${p.n}.jpg`],
    etiqueta: p.texto_proveedor, garantia_meses: p.garantia_meses ?? null,
    confirmado: true, confirmado_por: 'Ernesto 20-oct: publicar con el precio de la pegatina; bajo pedido, se confirma al recoger',
  });
}
fs.writeFileSync(new URL('publicar.json', DIR), JSON.stringify({ generado: new Date().toISOString(), estado: 'publish', productos: out }, null, 1));
fs.writeFileSync(new URL('fuera.txt', DIR), fuera.join('\n') + '\n');
console.log(`publicar.json: ${out.length} productos web (${out.filter((x) => x.actualizar).length} se actualizan: ${out.filter((x) => x.actualizar).map((x) => x.actualizar).join(', ')}) · con id de bolsa: ${out.filter((x) => x.market_id).length} · fuera: ${fuera.length}`);
for (const x of out) console.log(`#${x.n}\t${x.precio_proveedor}\t→ ${x.precio}\tgestora ${x.comision}\t${x.departamentos.join('+')}\t${x.nombre}`);
