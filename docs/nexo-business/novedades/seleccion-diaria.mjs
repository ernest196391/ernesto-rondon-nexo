// Lista diaria de productos para el grupo «Actualización de productos» (Ernesto, 20-oct-2026).
// Cron 8:40 (Cuba):  40 8 * * * /usr/bin/node /root/supervisor/tareas/seleccion-diaria.mjs >> /root/supervisor/logs/seleccion-diaria.log 2>&1
// Elige hasta novedades_max_dia (30) productos DISTINTOS, con su motivo, mezclando:
//   1) noticia  — lo que pasa hoy en Cuba (titulares RSS gratis + 1 llamada barata a la IA): apagones, calor, lluvia,
//                 agua, gas, mosquitos, escuela, Navidad (desde noviembre), frío… → primero lo que lo resuelve.
//   2) pedido   — lo que clientes y gestoras preguntaron o compraron en los últimos 7–14 días y tenemos.
//   3) nuevo    — recién llegados (creados en la web en 7 días o en la cola de electrodomésticos del 20-oct).
//   4) categoría — uno por categoría para que la lista sea variada.
// Solo productos publicados en la web, con existencias (o «Bajo pedido» publicados en la bolsa), con foto decente y
// sin repetir lo anunciado en los últimos 7 días. Guarda la lista en /root/archivos/novedades/dias/AAAA-MM-DD.json y en
// crm_settings «novedades_hoy», y manda a Ernesto (privado) un resumen de 6 líneas. Si las noticias o la IA fallan,
// sigue con pedidos + nuevos + categorías (nunca se queda sin lista).
// Volver a correrla el mismo día no hace nada (ni repite el resumen) salvo con --rehacer.
// Prueba sin escribir nada ni avisar:  node seleccion-diaria.mjs --prueba [--dia 2026-10-21]
import fs from 'fs';
import crypto from 'crypto';
import {
  db, BIZ, GRUPO, GENERAL, ERNESTO, DIAS, NOTICIAS, COLA, must, cuba, addDays, say, setting, setSetting, ajustes, woo, catalogo, meta,
  esBajoPedido, categoria, marketId, limpiaNombre, vendible, pie, foto, leerEnviados, cerrojo, avisaErnesto, comoObjeto,
} from './novedades-comun.mjs';

const args = process.argv.slice(2);
const PRUEBA = args.includes('--prueba');
const REHACER = args.includes('--rehacer');
const hoyCuba = cuba().day;
const DIA = args.includes('--dia') ? args[args.indexOf('--dia') + 1] : hoyCuba;
const PLAN = `${DIAS}/${DIA}.json`;
const RESERVAS = 6;          // por si alguno se agota antes de salir
const MAX_NOTICIA = 10, MAX_PEDIDO = 8, MAX_NUEVO = 8, MAX_POR_CATEGORIA = 7, MAX_POR_TIPO = 2;

// ---------- texto ----------
const norm = (s = '') => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(('de del la las el los un una unos unas y o con sin para por en a al tipo set juego kit pack combo modelo nuevo nueva nuevos nuevas original '
  + 'grande pequeno pequena mediano mediana mini super pro plus max color colores negro negra blanco blanca gris azul rojo roja verde rosado rosa beige marron dorado plateado '
  + 'unidad unidades piezas pieza pzs pcs usd cup mlc casa viva caja incluye pulgadas litros watts voltios marca calidad premium alta doble triple portatil '
  + 'electrico electrica recargable inalambrico automatico digital multifuncional universal estilo diseno moderno moderna clasico '
  // palabras del chat que no son un producto (tarjeta = de pago, todo = «todo en uno»…)
  + 'todo toda todos tarjeta saldo recarga cuenta pago foto fotos envio entrega pedido regalo oferta precio hola buenas gracias dias hora tienda').split(' '));
const raiz = (t) => (t.length > 5 ? t.replace(/(es|s)$/, '') : t);
/** «tipo» de producto = primera palabra con sentido del nombre (ventilador, olla, sabana…). */
function tipoDe(nombre) {
  for (const t of norm(nombre).split(' ')) if (t.length >= 4 && !STOP.has(t) && !STOP.has(raiz(t)) && !/\d/.test(t)) return raiz(t);
  return null;
}
const palabras = (s) => new Set(norm(s).split(' ').filter((t) => t.length >= 4).map(raiz));
const giro = (id) => parseInt(crypto.createHash('md5').update(`${DIA}:${id}`).digest('hex').slice(0, 6), 16) / 0xffffff; // rotación diaria

// ---------- 1) noticias ----------
const FEEDS = [
  ['14ymedio', 'https://www.14ymedio.com/rss/'], ['Cubadebate', 'http://www.cubadebate.cu/feed/'], ['OnCuba', 'https://oncubanews.com/feed/'],
  ['elTOQUE', 'https://eltoque.com/feed'], ['Diario de Cuba', 'https://www.diariodecuba.com/rss.xml'], ['Granma', 'https://www.granma.cu/feed'],
  ['CiberCuba', 'https://www.cibercuba.com/rss.xml'],
];
// Necesidad → titulares que la disparan, productos que la resuelven y la línea de gancho del pie de foto.
const NECESIDADES = {
  // apagones: en Cuba son de todos los días → siempre cuenta (temporada fija)
  apagones: { gancho: '⚡ Para los apagones', temporada: () => true, noticia: /apag[oó]n|apagones|d[eé]ficit de (generaci|capacidad)|sin (corriente|electricidad)|termoel[eé]ctric|uni[oó]n el[eé]ctrica|\bUNE\b|sistema el[eé]ctrico|desconexi[oó]n|servicio el[eé]ctrico|guiteras|felton|generaci[oó]n el[eé]ctrica/i,
    producto: /estaci[oó]n de energ|power ?station|inversor|bater[ií]a|panel(es)? solar|solar|linterna|l[aá]mpara|bombillo recargable|power ?bank|bater[ií]a externa|planta el[eé]ctrica|generador|\bups\b|protector de voltaje|ventilador recargable/i },
  calor: { gancho: '🥵 Para este calor', noticia: /calor|temperaturas? (alta|m[aá]xima|elevad)|sensaci[oó]n t[eé]rmica|caluros/i, producto: /ventilador|aire acondicionado|\bsplit\b|climatizador|enfriador|nevera port[aá]til|cooler/i },
  lluvia: { gancho: '🌧️ Por si llueve fuerte', noticia: /cicl[oó]n|hurac[aá]n|tormenta tropical|depresi[oó]n tropical|lluvias? (intensa|fuerte)|inundaci|aguacero|alerta (cicl|meteor|temprana)|onda tropical|vaguada/i, producto: /linterna|l[aá]mpara|power ?bank|estaci[oó]n de energ|impermeable|sombrilla|paraguas|capa de agua|\bradio\b/i },
  agua: { gancho: '💧 Para cuando falta el agua', noticia: /(falta|escasez|abasto|suministro|sin servicio) de agua|acueducto|pipas? de agua|sequ[ií]a|bombeo de agua|agua potable/i, producto: /bomba de agua|turbina|motor de agua|tanque|cisterna|\bcubo\b|bid[oó]n|filtro de agua|purificador/i },
  gas: { gancho: '🔥 Para cocinar sin gas', noticia: /gas licuado|\bGLP\b|balita|balones? de gas|(falta|escasez|sin) de? ?gas|le[nñ]a|carb[oó]n vegetal/i, producto: /cocina (el[eé]ctrica|de inducci)|inducci[oó]n|hornilla|fog[oó]n|arrocera|olla (de presi|reina|el[eé]ctrica|multi|arrocera)|freidora|horno|hervidor/i, excluye: /gas|quemador/i },
  mosquitos: { gancho: '🦟 Contra los mosquitos', noticia: /dengue|chikungu|oropouche|mosquito|arbovir|fumigaci/i, producto: /mosquitero|repelente|mata ?mosquito|raqueta|insect/i },
  comida: { gancho: '🧊 Para guardar la comida', noticia: /canasta (familiar )?b[aá]sica|escasez de (alimentos|comida|pollo|carne)|precios? de (los )?alimentos|libreta de abastec/i, producto: /refrigerador|nevera|freezer|congelador|frigor/i },
  escuela: { gancho: '🎒 Para la escuela', noticia: /curso escolar|inicio (del|de) (curso|clases)|vuelta a clases|uniformes? escolar/i, producto: /mochila|escolar|cuaderno|estuche|lonchera/i },
  navidad: { gancho: '🎄 Para Navidad', noticia: /navidad|nochebuena|fin de a[nñ]o/i, producto: /navid|[aá]rbol de navidad|luces de navidad|decoraci[oó]n navide/i, cat: /navidad/i, temporada: (d) => { const [, m, dd] = d.split('-').map(Number); return m >= 11 || (m === 1 && dd <= 6); } },
  frio: { gancho: '🧣 Para el frío', noticia: /fr[ií]o intenso|frente fr[ií]o|bajas temperaturas|masa de aire fr[ií]o/i, producto: /cobija|frazada|edred[oó]n|manta|colcha|calentador/i, temporada: (d) => { const m = Number(d.split('-')[1]); return m === 12 || m <= 2; } },
};
const decode = (s) => String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
async function titulares() {
  const desde = Date.now() - 36 * 3600e3;
  const out = [];
  await Promise.all(FEEDS.map(async ([fuente, url]) => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0 (Casa Viva novedades)' } });
      if (!res.ok) return;
      const xml = await res.text();
      for (const it of xml.split(/<item[\s>]/i).slice(1, 40)) {
        const titulo = decode(it.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
        const fecha = Date.parse(decode(it.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] || it.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i)?.[1] || ''));
        const resumen = decode(it.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]).slice(0, 160);
        if (titulo && Number.isFinite(fecha) && fecha >= desde) out.push({ fuente, titulo, resumen, fecha: new Date(fecha).toISOString() });
      }
    } catch { /* fuente caída: se sigue con las demás */ }
  }));
  const vistos = new Set();
  return out.sort((a, b) => b.fecha.localeCompare(a.fecha)).filter((t) => { const k = norm(t.titulo); if (vistos.has(k)) return false; vistos.add(k); return true; });
}
/** Lectura de las noticias: regla fija (gratis) + 1 llamada barata a la IA. Se guarda por día (no se paga dos veces). */
async function leerNoticias() {
  const cache = `${NOTICIAS}/${hoyCuba}.json`;
  if (fs.existsSync(cache) && !args.includes('--noticias-otra-vez')) return JSON.parse(fs.readFileSync(cache, 'utf8'));
  const lista = await titulares();
  const fuerzaRegla = {};
  const titularesDe = {};
  for (const [id, n] of Object.entries(NECESIDADES)) {
    const hits = lista.filter((t) => n.noticia.test(`${t.titulo} ${t.resumen}`));
    if (hits.length) { fuerzaRegla[id] = hits.length >= 4 ? 3 : hits.length >= 2 ? 2 : 1; titularesDe[id] = hits.slice(0, 3).map((t) => `${t.titulo} (${t.fuente})`); }
  }
  let ia = null, gasto = null;
  const muestra = lista.slice(0, 45);
  if (muestra.length) {
    try {
      const { client } = await import('/root/vivabot/src/ai.js');
      const user = `Titulares de Cuba (últimas 36 h):\n${muestra.map((t, i) => `${i + 1}. ${t.titulo}`).join('\n')}\n\n`
        + `Necesidades posibles: ${Object.keys(NECESIDADES).join(', ')}.\n`
        + 'Di qué necesidades del hogar de la gente en Cuba HOY reflejan estos titulares y que una tienda resuelve con productos '
        + '(apagones → baterías, estaciones de energía, lámparas; agua → bombas, tanques; gas → cocinas eléctricas, ollas; calor → ventiladores; '
        + 'comida → neveras y congeladores; mosquitos → mosquiteros, repelente…). Solo titulares sobre la situación general del país, '
        + 'no casos de una persona. fuerza: 1 = se menciona, 2 = tema fuerte, 3 = crisis del día. En «titulares» pon primero el más claro. '
        + 'Responde SOLO JSON: {"necesidades":[{"id":"apagones","fuerza":3,"titulares":[1,4]}]}';
      const res = await client.messages.create({
        label: 'novedades-noticias', max_tokens: 300, temperature: 0,
        system: 'Analizas noticias de Cuba para una tienda de artículos del hogar. Respondes solo JSON válido, sin texto extra.',
        messages: [{ role: 'user', content: user }],
      });
      const txt = res.content.map((c) => c.text || '').join('');
      ia = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
      const u = res.usage || {};
      const ent = u.prompt_tokens ?? u.input_tokens ?? 0, sal = u.completion_tokens ?? u.output_tokens ?? 0;
      gasto = { entrada: ent, salida: sal, usd_aprox: Math.round(((ent * 0.4 + sal * 1.6) / 1e6) * 1e5) / 1e5 }; // gpt-4.1-mini (ai-prices.js)
    } catch (e) { say(`IA de noticias no disponible (${e.message.slice(0, 120)}): sigo con la regla fija`); }
  }
  const fuerza = {};
  if (ia?.necesidades) {
    for (const n of ia.necesidades) {
      if (!NECESIDADES[n.id] || !(Number(n.fuerza) > 0)) continue;
      fuerza[n.id] = Math.min(3, Number(n.fuerza));
      const regla = NECESIDADES[n.id].noticia;
      const deIa = (n.titulares || []).map((i) => muestra[Number(i) - 1]).filter(Boolean);
      const t = [...deIa.filter((x) => regla.test(`${x.titulo} ${x.resumen}`)), ...lista.filter((x) => regla.test(`${x.titulo} ${x.resumen}`)), ...deIa]
        .map((x) => `${x.titulo} (${x.fuente})`).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
      if (t.length) titularesDe[n.id] = t;
    }
    // La regla fija solo suma si la IA no lo vio y hay 2+ titulares claros.
    for (const [id, f] of Object.entries(fuerzaRegla)) if (!fuerza[id] && f >= 2) fuerza[id] = f - 1;
  } else Object.assign(fuerza, fuerzaRegla);
  const r = { dia: hoyCuba, titulares: lista.length, fuentes: [...new Set(lista.map((t) => t.fuente))], fuerza, titularesDe, ia: Boolean(ia), gasto };
  fs.writeFileSync(cache, JSON.stringify(r, null, 1)); // la lectura de hoy (la prueba de mañana usa las noticias de hoy)
  return r;
}

// ---------- 2) demanda: chats, grupo General, búsquedas y pedidos ----------
async function demanda() {
  const desde7 = new Date(Date.now() - 7 * 86400e3).toISOString();
  const contactos = must(await db.from('crm_contacts').select('id,role,bot_mode,phone').eq('business_id', BIZ).in('role', ['gestora', 'cliente']).neq('bot_mode', 'ignorar'));
  const ok = new Map(contactos.map((c) => [c.id, c]));
  const textos = []; // { quien, texto }
  for (let from = 0; from < 5000; from += 1000) {
    const rows = must(await db.from('crm_messages').select('contact_id,body').eq('business_id', BIZ).eq('direction', 'in').gte('created_at', desde7).range(from, from + 999));
    for (const r of rows) if (ok.has(r.contact_id) && r.body) textos.push({ quien: `c${r.contact_id}`, texto: r.body });
    if (rows.length < 1000) break;
  }
  const grupo = must(await db.from('crm_wa_messages').select('sender_phone,sender_jid,body').eq('business_id', BIZ).eq('chat_jid', GENERAL).eq('from_me', false).gte('sent_at', desde7).limit(3000));
  for (const r of grupo) if (r.body && !String(r.sender_phone || '').endsWith(ERNESTO.slice(-8))) textos.push({ quien: `g${r.sender_phone || r.sender_jid}`, texto: r.body });
  const busq = must(await db.from('crm_market_searches').select('product').eq('business_id', BIZ).gte('created_at', desde7).limit(200));
  for (const r of busq) if (r.product) textos.push({ quien: `b${r.product}`, texto: r.product });
  // Pedidos de la web de los últimos 14 días (sin cancelados ni fallidos)
  const vendidos = new Map();
  try {
    const after = new Date(Date.now() - 14 * 86400e3).toISOString().slice(0, 19);
    for (let page = 1; page <= 5; page++) {
      const os = await woo(`orders?after=${after}&per_page=100&page=${page}&status=any`);
      for (const o of os) {
        if (['cancelled', 'failed', 'trash', 'checkout-draft'].includes(o.status)) continue;
        for (const li of o.line_items || []) vendidos.set(li.product_id, (vendidos.get(li.product_id) || 0) + 1);
      }
      if (os.length < 100) break;
    }
  } catch (e) { say(`pedidos de la web no disponibles: ${e.message}`); }
  return { textos: textos.map((t) => ({ quien: t.quien, p: palabras(t.texto) })), vendidos, mensajes: textos.length };
}

// ---------- 3) lo ya anunciado (7 días) ----------
async function yaAnunciados() {
  const desde = addDays(DIA, -7);
  const ids = new Set(), skus = new Set();
  for (const e of leerEnviados()) {
    if (!e.outbox) continue;                                  // los saltos no cuentan como anuncio
    if (String(e.at || '').slice(0, 10) < desde && String(e.day || '') < desde) continue;
    if (e.product_id) ids.add(Number(e.product_id));
    if (e.sku) skus.add(String(e.sku));
  }
  try {
    const gd = comoObjeto(await setting('grupo_diario_estado'));
    for (const [id, d] of Object.entries(gd.productos || {})) if (d > desde) ids.add(Number(id));
  } catch { /* sin estado */ }
  // Lo que otras sesiones mandaron a mano al grupo (por nombre, en el texto de las fotos).
  const rows = must(await db.from('crm_outbox').select('body').eq('business_id', BIZ).eq('to_group', GRUPO).gte('created_at', `${desde}T00:00:00Z`).limit(2000));
  const cuerpos = rows.map((r) => norm(r.body)).filter(Boolean);
  return { ids, skus, cuerpos };
}
function nombreYaSalio(p, cuerpos) {
  const t = norm(p.name).split(' ').filter((x) => x.length >= 3 && !STOP.has(x)).slice(0, 3);
  if (t.length < 2) return false;
  return cuerpos.some((b) => t.every((x) => b.includes(x)));
}

// ---------- armar la lista ----------
async function main() {
  if (fs.existsSync(PLAN) && !REHACER && !PRUEBA) return say(`la lista de ${DIA} ya existe (${PLAN}); para rehacerla: --rehacer`);
  const { maxDia } = await ajustes();
  const objetivo = maxDia;
  const [productos, noticias, dem, ya] = await Promise.all([catalogo(), leerNoticias(), demanda(), yaAnunciados()]);
  // Estado en la bolsa de los «Bajo pedido»
  const mids = [...new Set(productos.map(marketId).filter(Boolean))];
  const bolsa = new Map();
  for (let k = 0; k < mids.length; k += 300) for (const r of must(await db.from('crm_market_items').select('id,status').eq('business_id', BIZ).in('id', mids.slice(k, k + 300)))) bolsa.set(r.id, r.status);
  const cola = fs.existsSync(COLA) ? JSON.parse(fs.readFileSync(COLA, 'utf8')) : { items: [] };
  const enCola = new Map(cola.items.map((it, i) => [Number(it.product_id), { ...it, orden: i }]));

  const descartes = {};
  const cand = [];
  for (const p of productos) {
    const mid = marketId(p);
    const no = vendible(p, esBajoPedido(p) ? (bolsa.get(mid) ?? null) || 'no existe' : null)
      || (ya.ids.has(p.id) || ya.skus.has(String(p.sku)) ? 'anunciado en 7 días' : null)
      || (nombreYaSalio(p, ya.cuerpos) ? 'mismo nombre ya enviado al grupo en 7 días' : null);
    if (no) { descartes[no] = (descartes[no] || 0) + 1; continue; }
    const creado = String(p.date_created || '').slice(0, 10);
    const nuevo = creado > addDays(DIA, -7) || enCola.has(p.id);
    const propio = !esBajoPedido(p);
    const vend = dem.vendidos.get(p.id) || 0;
    const score = (propio ? 3 : 0) + (nuevo ? 1.5 : 0) + (vend ? 2 : 0) + (p.on_sale ? 1 : 0) + (meta(p)._cvd_nexo_image_url ? 1 : 0) + giro(p.id) * 2;
    cand.push({ p, id: p.id, cat: categoria(p), tipo: tipoDe(p.name) || `id${p.id}`, texto: `${p.name} ${(p.categories || []).map((c) => c.name).join(' ')}`, nuevo, propio, vend, score, cola: enCola.get(p.id) || null });
  }

  const elegidos = [];
  const usados = new Set(), nombres = new Set(), porCat = {}, porTipo = {};
  const cabe = (c) => !usados.has(c.id) && !nombres.has(norm(c.p.name)) && (porCat[c.cat] || 0) < MAX_POR_CATEGORIA && (porTipo[c.tipo] || 0) < MAX_POR_TIPO;
  async function toma(c, motivo, razon, gancho = null, reserva = false) {
    if (!cabe(c)) return false;
    usados.add(c.id); // aunque falle la foto, no se vuelve a probar
    const f = await foto(c.p, { preferida: c.cola?.file_path || null });
    if (!f) { descartes['sin foto decente'] = (descartes['sin foto decente'] || 0) + 1; return false; }
    nombres.add(norm(c.p.name)); porCat[c.cat] = (porCat[c.cat] || 0) + 1; porTipo[c.tipo] = (porTipo[c.tipo] || 0) + 1;
    elegidos.push({ c, motivo, razon, gancho, reserva, foto: f });
    return true;
  }
  const llenos = () => elegidos.filter((e) => !e.reserva).length >= objetivo;
  const orden = (a, b) => b.score - a.score;

  // 1) noticias: cupo repartido por fuerza (máx. 10; 2+ por necesidad activa); temporada suma fuerza 1.
  const fuerza = { ...noticias.fuerza };
  const deTemporada = new Set();
  for (const [id, n] of Object.entries(NECESIDADES)) if (n.temporada?.(DIA) && !fuerza[id]) { fuerza[id] = 1; deTemporada.add(id); }
  const activas = Object.entries(fuerza).filter(([, f]) => f > 0).sort((a, b) => b[1] - a[1]);
  const total = activas.reduce((s, [, f]) => s + f, 0);
  const porNecesidad = {};
  const tit = (id) => noticias.titularesDe?.[id]?.[0];
  const deNoticia = () => elegidos.filter((e) => e.motivo === 'noticia').length;
  // Pasada 1: cupo por fuerza. Pasada 2: lo que sobre del total se reparte de uno en uno (la más fuerte primero), máx. 5 por necesidad.
  const listaDe = (id) => { const n = NECESIDADES[id]; return cand.filter((c) => (n.producto.test(c.texto) || (n.cat && n.cat.test(c.cat))) && !(n.excluye && n.excluye.test(c.texto))).sort(orden); };
  const razonDe = (id) => `${id}${deTemporada.has(id) ? (id === 'apagones' ? ' (de todos los días)' : ' (temporada)') : tit(id) ? `: «${tit(id)}»` : ' (noticias de hoy)'}`;
  async function unoMas(id, tope) {
    if ((porNecesidad[id] || 0) >= tope || deNoticia() >= MAX_NOTICIA || llenos()) return false;
    const lista = listaDe(id);
    const ya = new Set(elegidos.filter((e) => e.motivo === 'noticia').map((e) => e.c.tipo));
    for (const c of [...lista.filter((c) => !ya.has(c.tipo)), ...lista]) { // variedad: primero tipos que aún no salieron
      if (await toma(c, 'noticia', razonDe(id), NECESIDADES[id].gancho)) { porNecesidad[id] = (porNecesidad[id] || 0) + 1; return true; }
    }
    return false;
  }
  for (const [id, f] of activas) {
    const cupo = Math.min(5, Math.max(2, Math.round((MAX_NOTICIA * f) / Math.max(total, 1))));
    while (await unoMas(id, cupo));
  }
  for (let alguno = true; alguno && deNoticia() < MAX_NOTICIA && !llenos();) {
    alguno = false;
    for (const [id] of activas) if (await unoMas(id, 5)) alguno = true;
  }

  // 2) pedidos: tipos que más personas pidieron (2+ personas) y lo más vendido en la web.
  const gente = {};
  const tiposCat = [...new Set(cand.map((c) => c.tipo))];
  for (const t of dem.textos) for (const tipo of tiposCat) if (t.p.has(tipo)) (gente[tipo] ||= new Set()).add(t.quien);
  const pedidos = [
    ...Object.entries(gente).filter(([, s]) => s.size >= 2).map(([tipo, s]) => ({ tipo, n: s.size, como: 'chat' })),
    ...cand.filter((c) => c.vend > 0).map((c) => ({ id: c.id, n: c.vend, como: 'venta' })),
  ].sort((a, b) => b.n - a.n);
  for (const d of pedidos) {
    if (elegidos.filter((e) => e.motivo === 'pedido').length >= MAX_PEDIDO || llenos()) break;
    const c = d.id ? cand.find((x) => x.id === d.id) : cand.filter((x) => x.tipo === d.tipo && cabe(x)).sort(orden)[0];
    if (!c) continue;
    const razon = d.como === 'venta' ? `se vendió ${d.n} ${d.n === 1 ? 'vez' : 'veces'} en 14 días` : `${d.n} personas preguntaron por «${d.tipo}» esta semana`;
    await toma(c, 'pedido', razon, '🔥 Lo están pidiendo');
  }

  // 3) recién llegados: primero los de la tienda, luego la cola de electrodomésticos en su orden.
  const nuevos = cand.filter((c) => c.nuevo).sort((a, b) => (b.propio - a.propio) || ((a.cola?.orden ?? 1e9) - (b.cola?.orden ?? 1e9)) || orden(a, b));
  for (const c of nuevos) {
    if (elegidos.filter((e) => e.motivo === 'nuevo').length >= MAX_NUEVO || llenos()) break;
    await toma(c, 'nuevo', c.cola ? 'recién llegado (electrodomésticos del 20-oct)' : `nuevo en la web (${String(c.p.date_created).slice(0, 10)})`);
  }

  // 4) categorías: una vuelta por categoría (las que aún no salen primero) hasta llenar; luego reservas.
  const cats = [...new Set(cand.map((c) => c.cat))].sort((a, b) => (porCat[a] || 0) - (porCat[b] || 0) || cand.filter((c) => c.cat === b).length - cand.filter((c) => c.cat === a).length);
  for (let vuelta = 0; vuelta < 12 && elegidos.length < objetivo + RESERVAS; vuelta++) {
    let alguno = false;
    for (const cat of cats) {
      if (elegidos.length >= objetivo + RESERVAS) break;
      const c = cand.filter((x) => x.cat === cat && cabe(x)).sort(orden)[0];
      if (c && await toma(c, 'categoria', `categoría ${cat}`, null, llenos())) alguno = true;
    }
    if (!alguno) break;
  }

  // Orden de salida: noticias, pedidos, nuevos, categorías (variado), y al final las reservas.
  const peso = { noticia: 0, pedido: 1, nuevo: 2, categoria: 3 };
  const principales = elegidos.filter((e) => !e.reserva).sort((a, b) => peso[a.motivo] - peso[b.motivo]).slice(0, objetivo);
  const reservas = [...elegidos.filter((e) => e.reserva), ...elegidos.filter((e) => !e.reserva).slice(objetivo)].slice(0, RESERVAS);
  const items = [...principales, ...reservas.map((e) => ({ ...e, reserva: true }))].map((e, i) => ({
    n: i + 1, product_id: e.c.id, sku: e.c.p.sku || null, market_id: marketId(e.c.p), nombre: limpiaNombre(e.c.p.name), categoria: e.c.cat, tipo: e.c.tipo,
    motivo: e.motivo, razon: e.razon, gancho: e.gancho, reserva: e.reserva, foto: e.foto, pie: pie(e.c.p, e),
  }));
  const cuenta = (m) => principales.filter((e) => e.motivo === m).length;
  const plan = {
    dia: DIA, creado: new Date().toISOString(), objetivo: principales.length, max_dia: maxDia,
    por_motivo: { noticia: cuenta('noticia'), pedido: cuenta('pedido'), nuevo: cuenta('nuevo'), categoria: cuenta('categoria') },
    noticias: { fuentes: noticias.fuentes, titulares: noticias.titulares, ia: noticias.ia, gasto: noticias.gasto, fuerza, por_necesidad: porNecesidad, titularesDe: Object.fromEntries(Object.entries(noticias.titularesDe || {}).filter(([id]) => fuerza[id])) },
    demanda: { mensajes: dem.mensajes, vendidos_14d: dem.vendidos.size, top: pedidos.slice(0, 15).map((d) => d.tipo ? `${d.tipo} (${d.n} personas)` : `#${d.id} (${d.n} ventas)`) },
    candidatos: cand.length, descartes, items,
  };

  const resumen = resumenErnesto(plan);
  if (PRUEBA) { fs.writeFileSync(`${DIAS}/prueba-${DIA}.json`, JSON.stringify(plan, null, 1)); return imprimir(plan, resumen); }
  const libre = cerrojo(`${DIAS}/.seleccion.lock`);
  if (!libre) return say('otra selección en marcha');
  try {
    const nuevoPlan = !fs.existsSync(PLAN);
    fs.writeFileSync(PLAN, JSON.stringify(plan, null, 1));
    await setSetting('novedades_hoy', JSON.stringify({ dia: DIA, total: plan.objetivo, por_motivo: plan.por_motivo, items: items.filter((i) => !i.reserva).map((i) => ({ id: i.product_id, nombre: i.nombre, motivo: i.motivo, razon: i.razon })) }));
    say(`lista de ${DIA}: ${plan.objetivo} (+${items.length - plan.objetivo} reservas) · ${JSON.stringify(plan.por_motivo)} · IA noticias ${plan.noticias.ia ? `sí (${JSON.stringify(plan.noticias.gasto)})` : 'no'}`);
    const auto = (await ajustes()).auto;
    if (nuevoPlan && auto === 'si' && DIA === hoyCuba) say(`resumen a Ernesto → buzón #${await avisaErnesto(resumen, 'seleccion-diaria')}`);
  } finally { libre(); }
}

const NOMBRE_NEC = { apagones: 'apagones', calor: 'calor', lluvia: 'lluvias', agua: 'falta de agua', gas: 'falta de gas', mosquitos: 'mosquitos', comida: 'comida', escuela: 'escuela', navidad: 'Navidad', frio: 'frío' };
function resumenErnesto(plan) {
  const nec = Object.entries(plan.noticias.por_necesidad).filter(([, n]) => n > 0).map(([id, n]) => `${NOMBRE_NEC[id] || id} ${n}`).join(', ');
  const tiposPed = [...new Set(plan.items.filter((i) => !i.reserva && i.motivo === 'pedido').map((i) => i.tipo))].slice(0, 3).join(', ');
  const fuerte = Object.entries(plan.noticias.fuerza || {}).filter(([id]) => plan.noticias.por_necesidad[id] && plan.noticias.titularesDe?.[id]).sort((a, b) => b[1] - a[1])[0];
  const tit = fuerte ? plan.noticias.titularesDe[fuerte[0]][0] : null;
  return [
    `📣 *Novedades de hoy:* salen ${plan.objetivo}, 1 por minuto desde las 9:02 al grupo «Actualización de productos».`,
    `⚡ ${plan.por_motivo.noticia} por noticias${nec ? ` (${nec})` : ''}`,
    `🔥 ${plan.por_motivo.pedido} pedidos por clientes y gestoras${tiposPed ? ` (${tiposPed}…)` : ''}`,
    `🆕 ${plan.por_motivo.nuevo} recién llegados · ${plan.por_motivo.categoria} para variar categorías`,
    tit ? `📰 Noticia usada: «${tit.slice(0, 110)}»` : '📰 Hoy sin noticia clara: van pedidos, nuevos y categorías.',
    'Para parar o cambiar cuántos salen, díselo a Claude.',
  ].join('\n');
}
function imprimir(plan, resumen) {
  console.log(`\n=== PRUEBA: lista para ${plan.dia} (no se guarda ni se manda nada) ===`);
  console.log(`Candidatos: ${plan.candidatos} · descartes: ${JSON.stringify(plan.descartes)}`);
  console.log(`Noticias: ${plan.noticias.titulares} titulares de ${plan.noticias.fuentes.join(', ')} · IA: ${plan.noticias.ia ? `sí ${JSON.stringify(plan.noticias.gasto)}` : 'no (regla fija)'}`);
  console.log(`Fuerza por necesidad: ${JSON.stringify(plan.noticias.fuerza)}`);
  for (const [id, t] of Object.entries(plan.noticias.titularesDe || {})) console.log(`  · ${id}: ${t.join(' | ')}`);
  console.log(`Demanda: ${plan.demanda.mensajes} mensajes/búsquedas en 7 días · ${plan.demanda.vendidos_14d} productos vendidos en 14 días`);
  console.log(`  más pedido: ${plan.demanda.top.join(', ')}`);
  console.log(`Por motivo: ${JSON.stringify(plan.por_motivo)}\n`);
  for (const i of plan.items) console.log(`${String(i.n).padStart(2)}. ${i.reserva ? '[reserva] ' : ''}${i.nombre} · ${i.categoria} · ${i.motivo}: ${i.razon}`);
  console.log('\n--- 3 pies de ejemplo ---');
  const ej = [plan.items.find((i) => i.motivo === 'noticia'), plan.items.find((i) => i.motivo === 'pedido'), plan.items.find((i) => i.motivo === 'nuevo') || plan.items.find((i) => i.motivo === 'categoria')].filter(Boolean);
  for (const i of ej) console.log(`\n[foto ${i.foto}]\n${i.pie}`);
  console.log(`\n--- Resumen para Ernesto ---\n${resumen}\n`);
}

try { await main(); } catch (e) { say(`ERROR ${e.stack || e.message}`); process.exitCode = 1; }
