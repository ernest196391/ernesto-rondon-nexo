// SeFué · oferta del 22-oct-2026 (Excel «OFERTA CASA VIVA 22-10-26.xlsx» de Javier Quota) → tabla + JSON en seco.
// NO escribe en ninguna base ni en la web: solo lee oferta-cruda.json (el Excel pasado a JSON) y ../catalogo.json
// (su web del 21-oct) y deja aquí: oferta.json (las 150 filas con cálculo y decisión), publicar.json (lo que se
// propone publicar, forma de tienda-42-y-23/publicar.json: sirve para bolsa-crear.mjs y crear-productos.php) y tabla.md.
// Precio = myPrice() de vivabot/src/market-price.js (copiado tal cual abajo; comprobar que no cambió antes de publicar).
// Uso: node armar.mjs                      → propuesta (grandes al precio de su web, resto con la regla)
//      node armar.mjs --solo-regla          → todo con la regla del bot, sin igualar su web
//      node armar.mjs --con-opcionales      → también refrigeración técnica y cables (tramo de 5 m)
//      node armar.mjs --ids bolsa-ids.json  → rellena market_id con los ids de la bolsa (después de bolsa-crear «hacer»)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const SOLO_REGLA = args.includes('--solo-regla');
const CON_OPC = args.includes('--con-opcionales');
const idsFile = args.includes('--ids') ? args[args.indexOf('--ids') + 1] : null;
const bolsaIds = idsFile ? JSON.parse(fs.readFileSync(path.resolve(idsFile), 'utf8')) : {};

// ---- regla del bot (vivabot/src/market-price.js, 22-oct, commit cf7afdc) ----
const myPrice = (cost) => {
  if (cost < 60) return Math.ceil(cost + Math.min(17, Math.max(5, cost * 0.4)));
  const margin = Math.max(17, cost > 300 ? cost * 0.10 : 0);
  return Math.ceil((cost + margin) / 5) * 5;
};
const share = (price, cost) => Math.max(0, Math.round((price - cost) * 0.4 * 100) / 100);
const r2 = (x) => Math.round(x * 100) / 100;

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const codes = (s) => (norm(s).match(/\b(r\d+|modelo [a-z]\d+)\b/g) || []);
const tokens = (s) => new Set(norm(s).split(' ').filter((t) => t.length > 1));
const jacc = (a, b) => { const A = tokens(a), B = tokens(b); let i = 0; for (const t of A) if (B.has(t)) i++; return i / (A.size + B.size - i || 1); };

const cruda = JSON.parse(fs.readFileSync(path.join(DIR, 'oferta-cruda.json'), 'utf8'));
const cat = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'catalogo.json'), 'utf8'));
const byId = Object.fromEntries(cat.map((p) => [p.id_proveedor, p]));

// Parejas que el nombre exacto no encuentra (comprobadas a mano con su web del 21-oct)
const MANUAL = [
  [/^acondicionador /, 'SF-197', 'su web tiene «Acondicionador» sin sabor (1,45)'],
  [/^champu /, 'SF-196', 'su web tiene «Champú» sin sabor (1,45)'],
  [/^alcohol perfumado/, 'SF-65', 'en su web sin «300 ml»'],
  [/^bicicleta de montana huffy medida 27 5 negra/, 'SF-204', 'en su web «Huffy 27.5» sin color'],
  [/^bicicleta de montana medida 27 5 morada/, 'SF-204', 'DUDOSO: en su web solo «Huffy 27.5» (¿hay morada? ¿es Huffy?)'],
];

const LOC = {
  vedado: 'Vedado · calle N e/ 21 y 23',
  cerro: 'Cerro · Manglar y Oquendo, junto al parque La Normal',
};

// Nombres limpios para la web (sin códigos internos del proveedor; sin inventar datos)
const NOMBRE = {
  'SF-109': 'Bicicleta MTB 26 (última unidad)',
  'SF-205': 'Bicicleta de montaña Huffy 24',
  'SF-204': 'Bicicleta de montaña Huffy 27.5 negra',
  'SF-161': 'Bicicleta de paseo 26',
  'SF-90': 'Nevera Westing 7 pies',
  'SF-91': 'Colchón personal de espuma Cala 90 x 190 x 20 cm',
  'SF-92': 'Colchón camero de espuma Cala 135 x 190 x 20 cm',
  'SF-93': 'Colchón de espuma Spring 135 x 190 x 23 cm',
  'SF-94': 'Colchón de espuma Spring King 200 x 200 x 23 cm',
  'SF-95': 'Colchón personal de espuma Areca 90 x 190 x 20 cm',
  'SF-96': 'Colchón camero de espuma Low Cost IV 135 x 190 x 20 cm',
  'SF-47': 'Pistola de pintar 750 ml',
  'SF-48': 'Pistola de pintar 1000 ml',
  'SF-46': 'Amoladora / pulidora 850 W, disco de 100 mm',
  'SF-61': 'Segueta de aluminio 12" (300 mm)',
  'SF-50': 'Taladro eléctrico 550 W, 110 V, mandril 13 mm',
  'SF-45': 'Pintura vinil TOR blanco mate (cubo de 15 L)',
  'SF-214': 'Insecticida para mosquitos y cucarachas 250 ml',
  'SF-86': 'Cebo hormiguicida granulado Antex 1,5 kg',
  'SF-82': 'Gel insecticida para hormigas Magnum (paquete de 4)',
  'SF-65': 'Alcohol perfumado desinfectante 96 % 300 ml (caja de 12)',
  'SF-60': 'Desengrasante Zelnova 5 L',
  'SF-59': 'Quitagrasa para superficies Rudex 5 L',
  'SF-84': 'Dosificador automático para aromatizante 250 ml',
  'SF-83': 'Porta spray 250 ml',
  'SF-44': 'Spray aromatizante Vainilla 250 ml (caja de 12)',
  'SF-57': 'Spray aromatizante Bouquet 250 ml (caja de 12)',
  'SF-56': 'Spray aromatizante Dolce 250 ml (caja de 12)',
  'SF-58': 'Spray aromatizante Millonaire 250 ml (caja de 12)',
  'SF-55': 'Spray aromatizante Tiador 250 ml (caja de 12)',
  'SF-63': 'Loción hidroalcohólica en spray 97,8 % 100 ml (caja de 12)',
  'SF-62': 'Solución hidroalcohólica 72 % 100 ml (caja de 15)',
  'SF-64': 'Spray desinfectante de superficies Cooperbacter 200 ml (caja de 12)',
  'SF-106': 'Calculadora de escritorio 12 dígitos, solar, metal plateada',
  'SF-105': 'Calculadora de escritorio 12 dígitos, solar, blanca',
  'SF-107': 'Calculadora 14 dígitos, solar y batería (211 x 154 mm)',
  'SF-108': 'Calculadora 14 dígitos, solar y batería (218 x 146 mm)',
  'SF-119': 'Calculadora 14 dígitos, solar y batería (185 x 135 mm)',
  'SF-120': 'Calculadora de escritorio 12 dígitos, solar y batería, plateada',
  'SF-121': 'Calculadora portátil 12 dígitos, azul',
  'SF-118': 'Calculadora portátil 8 dígitos, solar y batería',
  'SF-76': 'Carpeta archivadora expansible A4 de 13 divisiones',
  'SF-99': 'Bolígrafos de tinta gel-aceite 0,7 mm azul (caja de 50)',
};

// Qué hacer con cada grupo (criterio del PLAN del 21-oct + notas de voz de Javier del 22-oct)
function decidir(f, p, cost) {
  const n = norm(f.nombre);
  if (f.hoja === 'HUMIDORES' && cost < 60) return ['fuera', 'herraje de humidor: no tienen existencia, se piden; pedido mínimo 500 USD en producto'];
  if (f.hoja === 'HUMIDORES') return ['aparte', 'humidor de 760–3.990 USD: venta especial (clientes de tabaco), no en la web normal'];
  if (/inyectores/.test(n)) return ['aparte', 'material profesional de fumigación (111–126 USD)'];
  if (f.hoja === 'CABLES COBRE') return ['opcional', 'se vende por metro: publicarlo como tramo de 5 m (costo × 5) solo si Ernesto quiere'];
  if (f.hoja === 'REFRIGERACIÓN' && !/nevera/.test(n)) return ['opcional', 'producto para técnicos de refrigeración (no es de hogar)'];
  if (/morada/.test(n)) return ['revisar', 'no está en su web: preguntar a Javier marca y foto antes de publicar'];
  if (cost < 5) return ['fuera', 'suelto de menos de 5 USD: con la regla saldría a 2–17 veces su precio'];
  if (!p) return ['revisar', 'no está en su web del 21-oct (sin foto ni ficha)'];
  if (f.hoja === 'OFICINA' && !/calculadora|carpeta|50 caja/.test(n)) return ['fuera', 'útil de oficina suelto: no merece una venta con mensajería'];
  return ['publicar', ''];
}

function dept(f, n) {
  if (f.hoja === 'COLCHONES') return ['habitacion'];
  if (f.hoja === 'BICIS') return ['movilidad'];
  if (/nevera/.test(n)) return ['electrodomesticos'];
  if (['FERRETERÍA', 'CABLES COBRE', 'REFRIGERACIÓN'].includes(f.hoja)) return ['ferreteria'];
  if (f.hoja === 'INSECTICIDA') return ['cocina'];
  if (f.hoja === 'HUMIDORES') return ['sala-y-muebles'];
  if (f.hoja === 'OFICINA') return ['organizacion'];
  if (/aromatizante|porta spray|dosificador/.test(n)) return ['bano'];
  if (/alcohol|hidroalcoholica|champu|acondicionador/.test(n)) return ['cuidado-personal'];
  return ['cocina'];
}
const catBolsa = (f, n) => (f.hoja === 'COLCHONES' ? 'colchón' : f.hoja === 'BICIS' ? 'bicicleta' : /nevera/.test(n) ? 'nevera'
  : f.hoja === 'HUMIDORES' ? 'humidor' : f.hoja === 'INSECTICIDA' ? 'insecticida' : f.hoja === 'OFICINA' ? 'oficina'
  : f.hoja === 'ASEO-LIMP' ? 'limpieza' : f.hoja === 'CABLES COBRE' ? 'cable' : f.hoja === 'REFRIGERACIÓN' ? 'refrigeración' : 'ferretería');
const grande = (f, n) => ['COLCHONES', 'BICIS', 'HUMIDORES'].includes(f.hoja) || /nevera|15l|20l|30lb/.test(n.replace(/ /g, ''));

const usados = {};
const filas = cruda.filas.map((f, i) => {
  const n = norm(f.nombre);
  const alertas = [];
  // --- pareja en su web ---
  let p = null; let match = 'sin pareja'; let matchNota = '';
  const exact = cat.filter((c) => norm(c.nombre) === n);
  if (exact.length) {
    p = exact.find((c) => !usados[c.id_proveedor]) || exact[0];
    match = 'exacta';
  } else {
    const m = MANUAL.find(([re]) => re.test(n));
    if (m) { p = byId[m[1]]; match = /DUDOSO/.test(m[2]) ? 'dudosa' : 'a mano'; matchNota = m[2]; } else {
      const cs = codes(f.nombre);
      let best = null; let bs = 0;
      for (const c of cat) {
        const cc = codes(c.nombre);
        if (cs.length && cc.length && cs.join() !== cc.join()) continue;
        const s = jacc(f.nombre, c.nombre) - (cs.length && !cc.length ? 0.2 : 0);
        if (s > bs) { bs = s; best = c; }
      }
      if (best && bs >= 0.75) { p = best; match = 'parecida'; matchNota = `parecida (${bs.toFixed(2)}) a «${best.nombre}»`; }
    }
  }
  if (p && usados[p.id_proveedor] && match !== 'a mano' && match !== 'dudosa') alertas.push(`misma ficha de su web que la fila ${usados[p.id_proveedor]}`);
  if (p) usados[p.id_proveedor] = usados[p.id_proveedor] || `${f.hoja}:${f.fila}`;

  // --- locación ---
  let loc = null;
  if (f.locacion && /vedado/i.test(f.locacion)) {
    loc = LOC.vedado;
    const m = f.locacion.match(/N\/21 y (\d+)/);
    if (m && m[1] !== '23') alertas.push(`locación «${f.locacion}»: arrastre de Excel (debe ser N/21 y 23)`);
  } else if (f.locacion && /cerro/i.test(f.locacion)) loc = LOC.cerro;
  else if (f.locacion) loc = f.locacion;

  // --- dinero ---
  const cost = r2(Number(f.precio));
  const web = p ? Number(p.precio_proveedor) : null;
  const desc = web ? r2((1 - cost / web) * 100) : null;
  const regla = myPrice(cost);
  if (web != null) {
    if (cost > web + 0.001) alertas.push(`su precio para nosotros (${cost}) es MAYOR que el de su web (${web})`);
    else if (f.hoja === 'COLCHONES' && /200x200/.test(n) && Math.abs(desc - 3) > 0.6) alertas.push(`King: dijo −3 % y sale −${desc} %`);
    else if (f.hoja === 'COLCHONES' && !/200x200/.test(n)) { if (desc < 4) alertas.push(`colchón «mayorista»: solo −${desc} % sobre su web`); }
    else if (f.hoja === 'HUMIDORES' && cost >= 60 && Math.abs(desc - 5) > 0.6) alertas.push(`humidor: dijo −5 % y sale −${desc} %`);
    else if (f.hoja === 'HUMIDORES' && cost < 60 && Math.abs(desc - 3) < 0.6) alertas.push('herraje: −3 % (dijo −5 % en «humidores»; solo lo aplicó a los humidores)');
    else if (!['COLCHONES', 'HUMIDORES'].includes(f.hoja) && Math.abs(desc - 3) > 0.6) alertas.push(`descuento −${desc} % (lo pactado es −3 %): confirmar`);
  }
  if (/^champu miel/.test(n)) alertas.push('0,35 USD cuando los otros champús/acondicionadores valen 1,35: ¿error de tecleo?');
  if (/3 paq/.test(n) && /4/.test(f.unidad || '')) alertas.push(`el nombre dice 3/paq y la unidad «${f.unidad}»`);
  if (/solo 1 disponible/.test(n)) alertas.push('dicen «solo 1 disponible»');
  if (f.hoja === 'HUMIDORES' && cost >= 60 && !p) alertas.push('modelo B4 nuevo: no estaba en su web del 21-oct (su web ≈ 1.500)');

  let [estado, motivo] = decidir(f, p, cost);
  if (estado === 'opcional' && CON_OPC) estado = 'publicar';

  // Propuesta de precio: lo grande (≥ 60 USD) que la regla deja POCO por encima de su web (≤ 10 %) → igualar su web.
  // Lo demás → la regla del bot (sale 36–65 % por encima de su web; su web no sale en Google: robots «Disallow: /»).
  let precio = regla; let manual = false; let motivoPrecio = 'regla del bot';
  const peorQueWeb = web != null && regla > web;
  if (!SOLO_REGLA && peorQueWeb && cost >= 60 && regla <= web * 1.10) {
    precio = web; manual = true; motivoPrecio = `igualar su web (la regla daba ${regla})`;
  }
  // Cables: tramo de 5 m
  let webPub = web; let costoPub = cost; let nombrePub = (match !== 'dudosa' && NOMBRE[p?.id_proveedor]) || f.nombre.replace(/[-,\s]+r\d+\s*$/i, '').replace(/\s+/g, ' ').trim();
  if (f.hoja === 'CABLES COBRE') {
    costoPub = r2(Number(f.precio) * 5); precio = myPrice(costoPub); webPub = web != null ? r2(web * 5) : null; nombrePub = `${f.nombre.replace(/,/, '')} (tramo de 5 m)`;
    motivoPrecio = `tramo de 5 m: regla sobre ${costoPub}`;
  }
  const com = share(precio, costoPub);
  const fila = {
    n: i + 1, hoja: f.hoja, fila_excel: f.fila, nombre_sefue: f.nombre, nombre: nombrePub,
    unidad: f.unidad, categoria_sefue: f.categoria, locacion: loc,
    entrega: ['COLCHONES', 'HUMIDORES'].includes(f.hoja) ? 'la pone SeFué' : 'recogemos en su local (transporte nuestro)',
    id_sefue: p?.id_proveedor || null, url_sefue: p?.url_proveedor || null, pareja: match, pareja_nota: matchNota,
    precio_web_sefue: webPub, descuento_pct: desc,
    precio_proveedor: costoPub, precio_regla: f.hoja === 'CABLES COBRE' ? myPrice(costoPub) : regla,
    peor_que_su_web: peorQueWeb, diferencia_web_pct: webPub ? Math.round(((f.hoja === 'CABLES COBRE' ? myPrice(costoPub) : regla) / webPub - 1) * 100) : null,
    precio, precio_manual: manual, motivo_precio: motivoPrecio, comision: com, ganancia_casa_viva: r2(precio - costoPub - com),
    estado, motivo, alertas,
    fotos_sefue: p?.fotos || [], nota_foto: p?.nota || null,
    departamentos: dept(f, n), categoria_bolsa: catBolsa(f, n), tamano: grande(f, n) ? 'grande' : 'pequeno',
    descripcion_sefue: p?.descripcion_limpia || '',
  };
  return fila;
});

// ---- publicar.json (forma de tienda-42-y-23/publicar.json) ----
const CONF = 'Lista de precios de Javier Quota (SeFué) 22-oct 16:06; existencia se consulta en cada venta';
const pub = filas.filter((x) => x.estado === 'publicar').map((x) => ({
  n: x.n, id_sefue: x.id_sefue, market_id: bolsaIds[x.n] || null, ids: [],
  nombre: x.nombre,
  descripcion: [x.descripcion_sefue || x.nombre, x.unidad && !/^unidades|cantidad$/i.test(x.unidad) ? `Se vende por: ${x.unidad.toLowerCase()}.` : '']
    .filter(Boolean).join('\n'),
  precio_proveedor: x.precio_proveedor, precio: x.precio, comision: x.comision, precio_manual: x.precio_manual,
  departamentos: x.departamentos, categoria_bolsa: x.categoria_bolsa, tamano: x.tamano,
  foto_url: x.fotos_sefue[0] || null, foto_local: `fotos/${x.n}.jpg`, fotos: [`/home/u824654880/sefue-fotos/${x.n}.jpg`],
  etiqueta: `SeFué ${x.id_sefue} · ${x.unidad} · ${x.locacion} · entrega: ${x.entrega} · su web ${x.precio_web_sefue} USD, a nosotros ${x.precio_proveedor}`,
  confirmado: true, confirmado_por: CONF, alertas: x.alertas,
}));
fs.writeFileSync(path.join(DIR, 'oferta.json'), JSON.stringify({ generado: new Date().toISOString(), solo_regla: SOLO_REGLA, con_opcionales: CON_OPC, filas }, null, 1));
fs.writeFileSync(path.join(DIR, 'publicar.json'), JSON.stringify({ generado: new Date().toISOString(), estado: 'draft', proveedor: 'SeFué', productos: pub }, null, 1));

// ---- tabla.md ----
const money = (v) => (v == null ? '—' : String(Math.round(v * 100) / 100).replace('.', ','));
const cuenta = (e) => filas.filter((x) => x.estado === e).length;
const enWebNoOferta = cat.filter((c) => !Object.keys(usados).includes(c.id_proveedor));
const L = [];
L.push('# SeFué · oferta del 22-oct-2026 → Casa Viva (en seco)', '');
L.push('> Generado por `armar.mjs` desde el Excel de Javier Quota («OFERTA CASA VIVA 22-10-26.xlsx», 16:06) y su web del 21-oct (`../catalogo.json`). **Nada publicado, nada en la bolsa ni en la web, nadie contactado.**', '');
L.push(`- **Filas en el Excel:** ${filas.length} (9 hojas). Con pareja en su web: ${filas.filter((x) => x.id_sefue).length}; sin pareja: ${filas.filter((x) => !x.id_sefue).length}.`);
L.push(`- **Propuesta:** publicar **${cuenta('publicar')}** · opcionales ${cuenta('opcional')} (técnicos: refrigeración y cables) · aparte ${cuenta('aparte')} (humidores e inyectores) · revisar ${cuenta('revisar')} · fuera ${cuenta('fuera')}.`);
L.push(`- **Precio para nosotros** = el del Excel (ya con su descuento). **Regla** = \`myPrice\` del bot. **Gestora** = 40 % del margen. Precios en USD.`);
L.push(`- **Con la regla del bot, ${filas.filter((x) => x.peor_que_su_web).length} de ${filas.filter((x) => x.precio_web_sefue != null).length} productos con pareja saldrían MÁS CAROS que en su web** (solo el colchón Spring 135 queda igual). Ver «Qué hacer con el precio».`, '');

L.push('## Qué hacer con el precio (propuesta; decide Ernesto)', '');
L.push('1. **Grandes (colchones, nevera, bicis):** la regla los deja 2–10 % por encima de su web → **igualar su web** (ya puesto en `publicar.json` con `precio_manual`). Colchones: 10–20 USD de margen (gestora 4–8). Nevera: 9 (gestora 3,60). Bicis: 4,50–5,40 (gestora ≈ 2): **flaco → pedir a Javier precio de mayorista como en colchones.**');
L.push('2. **Medianos (ferretería, aseo en caja, insecticidas, calculadoras):** la regla los pone **36–65 % por encima** de su web (5–17 USD de margen). Su web no sale en Google (robots «Disallow: /»), pero sus propios gestores venden a ese precio. Opciones: (a) publicar con la regla (lo puesto); (b) pedir a Javier −10/−15 % en estas líneas; (c) no publicarlos.');
L.push('3. **Por qué pasa:** −3 % no deja sitio para nuestro margen (mínimo +5 USD o +17 USD). Sus gestores cobran 5 %: **pedirle al menos ese 5 % en todo** sería lo justo.', '');

L.push('## Alertas del Excel', '');
const al = filas.filter((x) => x.alertas.length);
const arrastre = al.filter((x) => x.alertas.some((a) => /arrastre/.test(a)));
L.push(`- **Locación arrastrada en Excel:** ${arrastre.length} filas (hojas OFICINA y ASEO) dicen «Vedado, calle N/21 y 24 … 97»; el número sube de 1 en 1. Se toma **N e/ 21 y 23** (como en el resto). Confirmar con Javier.`);
const herr = al.filter((x) => x.alertas.some((a) => /^herraje/.test(a)));
if (herr.length) L.push(`- **Herrajes de humidor (${herr.length}, #${herr.map((x) => x.n).join(', #')}):** −3 % (dijo −5 % «en los humidores»: solo lo aplicó a los humidores). Sin local: se piden, mínimo 500 USD.`);
for (const x of al) {
  const otras = x.alertas.filter((a) => !/arrastre|^herraje/.test(a));
  if (otras.length) L.push(`- #${x.n} ${x.nombre_sefue}: ${otras.join(' · ')}`);
}
for (const x of filas.filter((y) => !y.id_sefue || y.pareja === 'dudosa')) L.push(`- #${x.n} ${x.nombre_sefue}: ${x.id_sefue ? x.pareja_nota : 'no está en su web del 21-oct (sin foto)'}`);
L.push(`- **Ningún precio del Excel es mayor que el de su web.** Descuentos: −3 % casi todo; humidores −5 %; colchones −5/−8 % («mayorista»), King −3 %; toalla −14 %, detergente −10 %, acondicionador/champú −7 % (comparado con 1,45 de su web).`);
L.push(`- **En su web pero no en la oferta (${enWebNoOferta.length}):** ${enWebNoOferta.map((c) => `${c.id_proveedor} ${c.nombre} (${c.precio_proveedor})`).join(' · ')}.`, '');

const tabla = (lista, conDecision = true) => {
  L.push('| # | Producto (web Casa Viva) | Unidad | Local | Su web | Para nosotros | Regla bot | Precio propuesto | Gestora gana | Casa Viva | ¿Más caro que su web con la regla? |' + (conDecision ? ' Nota |' : ''));
  L.push('|---|---|---|---|---|---|---|---|---|---|---|' + (conDecision ? '---|' : ''));
  for (const x of lista) {
    const loc = x.locacion ? (x.locacion.startsWith('Vedado') ? 'Vedado' : x.locacion.startsWith('Cerro') ? 'Cerro' : x.locacion) : 'se pide';
    const peor = x.precio_web_sefue == null ? '—' : x.peor_que_su_web ? `sí, +${x.diferencia_web_pct} %` : 'no';
    L.push(`| ${x.n} | ${x.nombre} | ${x.unidad || ''} | ${loc} | ${money(x.precio_web_sefue)} | ${money(x.precio_proveedor)} | ${money(x.precio_regla)} | **${money(x.precio)}**${x.precio_manual ? ' (=su web)' : ''} | ${money(x.comision)} | ${money(x.ganancia_casa_viva)} | ${peor} |` + (conDecision ? ` ${[x.motivo, ...x.alertas.filter((a) => !/arrastre/.test(a))].filter(Boolean).join(' · ')} |` : ''));
  }
  L.push('');
};
L.push(`## 1. Publicar (${cuenta('publicar')}) — bajo pedido, con mensajería`, '');
tabla(filas.filter((x) => x.estado === 'publicar'));
L.push(`## 2. Opcionales (${cuenta('opcional')}) — para técnicos (refrigeración, electricistas)`, '');
tabla(filas.filter((x) => x.estado === 'opcional'));
L.push(`## 3. Aparte (${cuenta('aparte')}) — humidores y fumigación profesional`, '');
tabla(filas.filter((x) => x.estado === 'aparte'));
L.push(`## 4. Revisar (${cuenta('revisar')})`, '');
tabla(filas.filter((x) => x.estado === 'revisar'));
L.push(`## 5. Fuera de la web (${cuenta('fuera')}) — sueltos de menos de 5 USD, útiles de oficina y herrajes de humidor`, '');
tabla(filas.filter((x) => x.estado === 'fuera'));
// ---- consignación (tienda física): cosas baratas que rotan; se cobran por unidad y solo lo vendido ----
const CONSIG = [
  [/^insecticida para mosquitos/, 1], [/^gel insecticida/, 4], [/^desengrasante zelnova/, 1], [/^detergente para superficies quitagrasa/, 1],
  [/^detergente liquido/, 1], [/^champu coco/, 1], [/^acondicionador/, 1], [/^toalla 140x70/, 1], [/^alcohol perfumado/, 12],
  [/^spray aromatizante de vainilla/, 12], [/^solucion hidroalcoholica/, 15], [/^calculadora portatil 12 digitos/, 1],
  [/^calculadora de escritorio solar 12 digitos plastico/, 1], [/^caja lapiz con goma 12 u x caja r352/, 1], [/^crayolas pastel/, 1],
];
const cons = [];
for (const [re, per] of CONSIG) for (const x of filas.filter((y) => re.test(norm(y.nombre_sefue)))) cons.push({ x, per });
L.push(`## 6. Para consignación en la tienda física (propuesta, ${cons.length})`, '');
L.push('Baratos y de mucha salida (limpieza, insecticidas, aseo, escolares): en la web no valen la mensajería, pero en la tienda sí. Se pagan solo los vendidos. **Precio en tienda: lo deciden Lennys/Ernesto**; la columna «referencia» es costo por unidad + 40 % (sin el mínimo de 5 USD), solo como guía. Falta que Javier diga si en consignación respeta este precio y si deja abrir las cajas (venta por unidad).', '');
L.push('| # | Producto | Se vende en tienda por | Costo por unidad | Su web por unidad | Referencia +40 % |');
L.push('|---|---|---|---|---|---|');
for (const { x, per } of cons) {
  const cu = x.precio_proveedor / per; const wu = x.precio_web_sefue != null ? x.precio_web_sefue / per : null;
  const ref = Math.ceil(cu * 1.4 * 20) / 20;
  L.push(`| ${x.n} | ${x.nombre_sefue} | ${per > 1 ? `unidad (caja de ${per})` : 'unidad'} | ${money(cu)} | ${money(wu)} | ${money(ref)} |`);
}
L.push('');
L.push('## Para publicar (solo con el SÍ de Ernesto)', '');
L.push('1. **Ernesto decide:** precio (igualar su web en lo grande / regla en lo demás / pedir más descuento), opcionales y consignación.');
L.push('2. **Preguntar a Javier** (lo hace Ernesto o con su sí): locación de oficina y aseo (¿todo en N e/ 21 y 23?), champú miel 0,35, bici morada (marca y foto), bolígrafo R305 (3 o 4 por paquete), quién paga y cuándo, horario de los 2 locales, y si da −5 % (como a sus gestores) o mayorista en bicis, nevera, ferretería y aseo.');
L.push('3. **Bolsa (VPS, `/root/archivos/sefue-2026-10-22/`):** `node bolsa-crear.mjs proveedor hacer` (ficha en `crm_suppliers`) → `node bolsa-crear.mjs hacer` (artículos «aprobado» + foto de su web a Storage) → `bolsa-ids.json`.');
L.push('4. Aquí: `node armar.mjs --ids bolsa-ids.json` (pone los `market_id`). Copiar `publicar.json` a la web `~/sefue-2026-10-22/` y `fotos/*.jpg` a `~/sefue-fotos/`.');
L.push('5. **Web:** `wp eval-file ~/sefue-2026-10-22/crear-productos.php ~/sefue-2026-10-22/publicar.json` (seco) → `… hacer` (borradores) → Ernesto revisa → publicar → `node bolsa-crear.mjs marcar <creados>.json hacer`.');
L.push('6. Anuncio a «Actualización de productos» con la comisión, con el sí de Ernesto. A los 21 días el bot los da por «quizá agotados»: refrescar con su lista nueva.', '');
L.push('Pruebas en seco hechas el 22-oct: VPS `node bolsa-crear.mjs` → 43 nuevos, 0 repetidos, todos con foto, falta la ficha de proveedor; web `wp eval-file … publicar.json` → «se crearían 43; 0 ya existen; 0 saltados» (fotos 0 porque aún no están en el servidor).', '');
fs.writeFileSync(path.join(DIR, 'tabla.md'), L.join('\n') + '\n');

console.log(JSON.stringify({ filas: filas.length, publicar: pub.length, opcional: cuenta('opcional'), aparte: cuenta('aparte'), revisar: cuenta('revisar'), fuera: cuenta('fuera'),
  peor_que_web: filas.filter((x) => x.peor_que_su_web).length, con_pareja: filas.filter((x) => x.precio_web_sefue != null).length, manual: pub.filter((x) => x.precio_manual).length }));
