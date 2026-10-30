// Anuncios diarios de productos al grupo «Actualización de productos» (Ernesto, 20-oct-2026; 28-oct: 8 con foto, 1 cada 10 min).
// Cron cada minuto (VPS):  * * * * * /usr/bin/node /root/supervisor/tareas/novedades.mjs >> /root/supervisor/logs/novedades.log 2>&1
// Manda la lista del día que preparó seleccion-diaria.mjs (8:40) → /root/archivos/novedades/dias/AAAA-MM-DD.json.
// Si a las 9:02 no hay lista, la prepara en ese momento. Cada vuelta mete COMO MUCHO 1 fila por grupo en crm_outbox
// (created_by 'novedades', kind 'archivo', to_group, file_path, body); el bot la manda.
//   Horario:   9:02–19:00 Cuba (a las 9:00 sale el mensaje diario del bot con sus 3 productos; así no se repiten).
//   PARAR:     crm_settings novedades_auto = no   (seguir: si). Sin esa fila = parado.
//   Cuántos:   crm_settings novedades_max_dia (por defecto 30). Ritmo: novedades_cada_min (por defecto 1).
//   28-oct (Ernesto, mensajes más humanos; reglas en VivaBot src/novedades-rules.js): de esa lista, como mucho 8 con
//   foto, 1 cada 10 min como mínimo (los ajustes solo pueden bajarlo), nada repetido de los 7 días anteriores, y el
//   resto en UN mensaje de texto final «Más novedades de hoy:» (una línea por producto con precio y lo que ganan).
//   Vale para los dos grupos (también el de 24 h). Prueba del mensaje final: --prueba con 8 ya mandados hoy.
// D101 (Ernesto, 23-oct): con crm_settings novedades_24h = si, «Actualización de productos» recibe SOLO productos
//   propios de Casa Viva y los de proveedor (SKU MK- / «Bajo pedido») van a «Actualización productos 24h» con su
//   propia lista (dias/AAAA-MM-DD-24h.json, hasta novedades_24h_max_dia = 30), también 1 por minuto. Cada grupo va
//   por su lado (si uno se para por un error, el otro sigue). Sin esa fila (o «no») = todo como antes.
// No manda si: queda un anuncio anterior sin salir (bot caído), el último dio error (avisa a Ernesto 1 vez al día;
// mirar con «cv outbox 10» y arreglar o borrar esa fila), o el producto ya no está publicado/con existencias/en la bolsa
// (se salta y sale el siguiente; las reservas cubren los huecos). El pie se arma en el momento con el precio de la web.
// Al terminar la lista apunta esos productos en grupo_diario_estado para que el bot no los repita a las 19:00.
// Prueba sin escribir nada:  node novedades.mjs --prueba [--24h] [--hora 9.5] [--plan /root/archivos/novedades/dias/prueba-AAAA-MM-DD.json]
//                            [--plan24 /root/archivos/novedades/dias/prueba-AAAA-MM-DD-24h.json]
import fs from 'fs';
import { execFileSync } from 'child_process';
import {
  db, BIZ, GRUPO, GRUPO_24H, DIAS, must, cuba, say, setting, setSetting, ajustes, woo, esBajoPedido, vendible, pie, leerEnviados, apunta, cerrojo, avisaErnesto, marketId, comoObjeto,
  limitesNovedades, anunciadosEn7Dias, faseNovedades, textoMasNovedades, lineaMas,
} from './novedades-comun.mjs';

const PRUEBA = process.argv.includes('--prueba');
const HORA_INI = 9 + 2 / 60, HORA_FIN = 19;
const ahora = new Date();
const { day: hoy, hora: horaReal } = cuba(ahora);
const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const hora = arg('--hora') !== null ? Number(arg('--hora')) : horaReal;
const PLAN = arg('--plan') || `${DIAS}/${hoy}.json`; // --plan solo para pruebas
const PLAN24 = arg('--plan24') || `${DIAS}/${hoy}-24h.json`;
const NOMBRE = { [GRUPO]: 'Actualización de productos', [GRUPO_24H]: 'Actualización productos 24h' };
const SELECCION = new URL('./seleccion-diaria.mjs', import.meta.url).pathname;

async function main() {
  if (hora < HORA_INI || hora >= HORA_FIN) return; // fuera de horario: ni consulta ni log
  const { auto, maxDia, cadaMin, split, max24 } = await ajustes();
  if (auto !== 'si' && !PRUEBA) return; // parado: ni log, para no llenar el archivo

  if (!fs.existsSync(PLAN) && !PRUEBA) {
    say('no hay lista de hoy: la preparo ahora');
    try { execFileSync('/usr/bin/node', [SELECCION], { stdio: 'inherit', timeout: 8 * 60e3 }); } catch (e) { say(`la selección falló: ${e.message}`); }
  }
  // D101: la lista de proveedores (24 h). Si la de la mañana se hizo antes de encenderlo, se prepara ahora (una vez).
  if (split && !fs.existsSync(PLAN24) && !PRUEBA) {
    const marca = `${DIAS}/${hoy}-24h.intentado`;
    if (!fs.existsSync(marca)) {
      fs.writeFileSync(marca, new Date().toISOString());
      say('no hay lista de 24 h de hoy: la preparo ahora');
      try { execFileSync('/usr/bin/node', [SELECCION, '--solo-24h'], { stdio: 'inherit', timeout: 8 * 60e3 }); } catch (e) { say(`la selección de 24 h falló: ${e.message}`); }
    }
  }
  const destinos = [];
  if (fs.existsSync(PLAN)) destinos.push({ grupo: GRUPO, file: PLAN, max: maxDia, soloPropios: split });
  else say(PRUEBA ? `PRUEBA: no hay lista de ${hoy} (córrela con: node seleccion-diaria.mjs --prueba)` : `no hay lista de ${hoy}`);
  if (split && fs.existsSync(PLAN24)) destinos.push({ grupo: GRUPO_24H, file: PLAN24, max: max24, soloProveedor: true });
  else if (split && PRUEBA) say(`PRUEBA: no hay lista de 24 h de ${hoy} (córrela con: node seleccion-diaria.mjs --prueba --24h)`);
  const enviados = leerEnviados();
  for (const d of destinos) {
    try { await uno(d, enviados, cadaMin); } catch (e) { say(`ERROR (${NOMBRE[d.grupo]}) ${e.message}`); process.exitCode = 1; }
  }
}

/**
 * Un grupo: como mucho 1 mensaje por vuelta. Los registros viejos (sin «grupo») son de «Actualización de productos».
 * 28-oct (Ernesto, mensajes más humanos): hasta 8 con foto (1 cada 10 min como mínimo, aunque los ajustes digan
 * 30 y 1) y, al acabar, UN mensaje «Más novedades de hoy:» con el resto de la lista (una línea por producto con
 * precio y lo que ganan). Nada que haya salido en los 7 días anteriores (con foto o en el mensaje final).
 */
async function uno({ grupo, file, max, soloPropios = false, soloProveedor = false }, enviados, cadaMinAjuste) {
  const plan = JSON.parse(fs.readFileSync(file, 'utf8'));
  const total = Math.min(Math.max(0, Number(max) || 0), plan.objetivo); // fotos + mensaje final
  const { fotos: maxFotos, cadaMin } = limitesNovedades({ maxDia: max, cadaMin: cadaMinAjuste });
  const objetivo = Math.min(maxFotos, total);
  const etiqueta = grupo === GRUPO ? '' : ' [24 h]';
  const deHoy = enviados.filter((e) => e.day === hoy && (e.grupo || GRUPO) === grupo);
  const mandados = deHoy.filter((e) => e.outbox);
  const conFoto = mandados.filter((e) => !e.resumen);
  const resumenHecho = mandados.some((e) => e.resumen) || fs.existsSync(`${DIAS}/${hoy}${grupo === GRUPO ? '' : '-24h'}.resumen`);
  const tratados = new Set(deHoy.map((e) => Number(e.product_id)));
  const hace7 = anunciadosEn7Dias(enviados, hoy);
  const quedan = plan.items.filter((it) => !tratados.has(Number(it.product_id))).length;
  const fase = faseNovedades({ fotosHoy: conFoto.length, fotosMax: objetivo, resumenHecho, quedan: Math.min(quedan, Math.max(0, total - conFoto.length)) });
  if (fase === 'fin') return grupo === GRUPO ? cerrar(plan, mandados) : null;

  // ¿El anterior salió? ¿Cuánto hace?
  const ult = must(await db.from('crm_outbox').select('id,status,error,created_at').eq('business_id', BIZ).eq('created_by', 'novedades').eq('to_group', grupo).order('id', { ascending: false }).limit(1))[0];
  if (ult && ['pendiente', 'enviando'].includes(ult.status)) {
    if (ahora - Date.parse(ult.created_at) > 10 * 60e3) say(`espero${etiqueta}: el anuncio #${ult.id} sigue «${ult.status}» desde hace más de 10 min (¿bot caído?)`);
    return;
  }
  if (ult && ult.status === 'error') {
    say(`PARADO${etiqueta}: el anuncio #${ult.id} dio error (${ult.error}). Míralo con «cv outbox 10»; para seguir, borra o arregla esa fila.`);
    const marca = `${DIAS}/${hoy}${grupo === GRUPO ? '' : '-24h'}.aviso-error`;
    if (!PRUEBA && !fs.existsSync(marca)) {
      fs.writeFileSync(marca, String(ult.id));
      await avisaErnesto(`⚠️ Novedades paradas: el anuncio #${ult.id} al grupo «${NOMBRE[grupo]}» dio error (${String(ult.error || '').slice(0, 120)}). Las demás esperan. Díselo a Claude para revisarlo.`, 'novedades-aviso');
    }
    return;
  }
  if (ult && ahora - Date.parse(ult.created_at) < cadaMin * 60e3 - 15e3) return;

  // Lo que el bot ya mandó hoy en su mensaje de las 9:00 (grupo de Actualización): no se repite.
  let gdHoy = new Set();
  try { const gd = comoObjeto(await setting('grupo_diario_estado')); gdHoy = new Set(Object.entries(gd.productos || {}).filter(([, d]) => d === hoy).map(([id]) => Number(id))); } catch { /* sin estado */ }
  // Lo que ya salió hoy en el OTRO grupo tampoco se repite.
  const enOtro = new Set(enviados.filter((e) => e.day === hoy && e.outbox && (e.grupo || GRUPO) !== grupo).map((e) => Number(e.product_id)));

  /** El producto de la web si se puede anunciar; null si se salta (queda apuntado); undefined si la web no responde. */
  const revisa = async (it, { conFotoNecesaria }) => {
    const salta = (por) => { say(`salto${etiqueta} ${it.nombre} (#${it.product_id}): ${por}`); if (!PRUEBA) apunta({ day: hoy, grupo, product_id: it.product_id, sku: it.sku, saltado: por, at: ahora.toISOString() }); return null; };
    if (gdHoy.has(Number(it.product_id))) return salta('ya salió hoy en el mensaje de las 9:00');
    if (enOtro.has(Number(it.product_id))) return salta('ya salió hoy en el otro grupo');
    if (hace7.has(Number(it.product_id))) return salta('ya se anunció en los últimos 7 días');
    let p;
    try { p = await woo(`products/${it.product_id}`); } catch (e) {
      if (/404/.test(e.message)) return salta('ya no existe en la web');
      say(`la web no responde (${e.message}); pruebo en el próximo minuto`);
      return undefined;
    }
    // D101: Actualización = solo propios; 24 h = solo de proveedor. (La lista de la mañana pudo hacerse antes de encenderlo.)
    if (soloPropios && esBajoPedido(p)) return salta('de proveedor: va al grupo «Actualización productos 24h»');
    if (soloProveedor && !esBajoPedido(p)) return salta('producto propio: va a «Actualización de productos»');
    let estadoBolsa = null;
    if (esBajoPedido(p)) {
      const mid = marketId(p);
      estadoBolsa = mid ? (must(await db.from('crm_market_items').select('status').eq('business_id', BIZ).eq('id', mid).maybeSingle())?.status || 'no existe') : 'no existe';
    }
    const no = vendible(p, estadoBolsa);
    if (no) return salta(no);
    // Sin foto no sale con foto, pero puede ir en el mensaje final (por eso no se apunta como salto).
    if (conFotoNecesaria && (!it.foto || !fs.existsSync(it.foto))) { say(`sin foto${etiqueta}: ${it.nombre} (#${it.product_id}) queda para «Más novedades de hoy»`); return false; }
    return p;
  };

  if (fase === 'resumen') return resumen({ plan, grupo, etiqueta, tratados, cupo: Math.max(0, total - conFoto.length), mandados, revisa });

  for (const it of plan.items) {
    if (tratados.has(Number(it.product_id))) continue;
    const p = await revisa(it, { conFotoNecesaria: true });
    if (p === undefined) return;
    if (!p) continue; // null = saltado (apuntado) · false = sin foto (queda para el mensaje final)
    const body = pie(p, it);
    if (PRUEBA) { say(`PRUEBA: mandaría ${it.nombre} (${it.motivo}: ${it.razon}) → ${NOMBRE[grupo]} ${grupo}\n[foto ${it.foto}]\n${body}`); return; }
    const [ins] = must(await db.from('crm_outbox').insert({
      business_id: BIZ, to_group: grupo, kind: 'archivo', file_path: it.foto, body, status: 'pendiente', created_by: 'novedades',
    }).select('id'));
    apunta({ day: hoy, ...(grupo === GRUPO ? {} : { grupo }), product_id: it.product_id, sku: it.sku, market_id: it.market_id, motivo: it.motivo, outbox: ins.id, at: ahora.toISOString() });
    say(`anuncio${etiqueta} ${conFoto.length + 1}/${objetivo} con foto: ${it.nombre} (${it.motivo}) → buzón #${ins.id}`);
    return;
  }
  // No quedan productos con foto: lo que falte va en el mensaje final.
  if (!resumenHecho) return resumen({ plan, grupo, etiqueta, tratados, cupo: Math.max(0, total - conFoto.length), mandados, revisa });
  if (PRUEBA) { say(`PRUEBA${etiqueta}: la lista no tiene nada más que mandar (${mandados.length}/${total})`); return; }
  // Una sola línea por día (no cada minuto): marca en disco.
  const fin = `${DIAS}/${hoy}${grupo === GRUPO ? '' : '-24h'}.agotada`;
  if (!fs.existsSync(fin)) { fs.writeFileSync(fin, String(mandados.length)); say(`lista${etiqueta} de hoy agotada con ${mandados.length}/${total} (los demás se saltaron)`); }
  if (grupo === GRUPO) return cerrar(plan, mandados);
}

/**
 * 28-oct: UN mensaje de texto «Más novedades de hoy:» con lo que queda de la lista (hasta `cupo`, como mucho 25
 * líneas), cada producto revisado en la web en el momento (publicado, con existencias, precio de hoy). Cada producto
 * se apunta con el mismo buzón y resumen: true (cuenta como anunciado: no se repite en 7 días ni a las 19:00).
 */
async function resumen({ plan, grupo, etiqueta, tratados, cupo, mandados, revisa }) {
  const marca = `${DIAS}/${hoy}${grupo === GRUPO ? '' : '-24h'}.resumen`;
  const lineas = [], items = [];
  for (const it of plan.items) {
    if (items.length >= Math.min(cupo, 25)) break;
    if (tratados.has(Number(it.product_id))) continue;
    const p = await revisa(it, { conFotoNecesaria: false });
    if (p === undefined) return; // la web no responde: se reintenta entero en la próxima vuelta
    if (!p) continue;
    lineas.push(lineaMas(p));
    items.push(it);
  }
  const body = textoMasNovedades(lineas);
  if (PRUEBA) { say(`PRUEBA${etiqueta}: mandaría el mensaje final (${items.length}) → ${NOMBRE[grupo]} ${grupo}\n${body || '(nada: no queda ningún producto)'}`); return; }
  if (!body) {
    fs.writeFileSync(marca, '0');
    say(`mensaje final${etiqueta}: no queda ningún producto que se pueda anunciar`);
    return grupo === GRUPO ? cerrar(plan, mandados) : null;
  }
  const [ins] = must(await db.from('crm_outbox').insert({
    business_id: BIZ, to_group: grupo, kind: 'texto', body, status: 'pendiente', created_by: 'novedades',
  }).select('id'));
  fs.writeFileSync(marca, String(ins.id));
  for (const it of items) apunta({ day: hoy, ...(grupo === GRUPO ? {} : { grupo }), product_id: it.product_id, sku: it.sku, market_id: it.market_id, motivo: it.motivo, outbox: ins.id, resumen: true, at: ahora.toISOString() });
  say(`mensaje final${etiqueta} «Más novedades de hoy» con ${items.length} productos → buzón #${ins.id}`);
}

/** Una vez al día: apunta lo anunciado en grupo_diario_estado.productos (el bot no lo repite a las 19:00 ni en 7 días). */
async function cerrar(plan, mandados) {
  const marca = `${DIAS}/${hoy}.cerrado`;
  if (PRUEBA || fs.existsSync(marca)) return;
  try {
    const raw = await setting('grupo_diario_estado');
    const gd = comoObjeto(raw);
    if (raw && gd.enviados) {
      gd.productos ||= {};
      for (const m of mandados) if (!gd.productos[String(m.product_id)] || gd.productos[String(m.product_id)] < hoy) gd.productos[String(m.product_id)] = hoy;
      await setSetting('grupo_diario_estado', typeof raw === 'string' ? JSON.stringify(gd) : gd);
    }
    fs.writeFileSync(marca, new Date().toISOString());
    say(`lista de hoy terminada: ${mandados.length} anuncios; apuntados en grupo_diario_estado`);
  } catch (e) { say(`no pude apuntar en grupo_diario_estado: ${e.message}`); }
}

const libre = cerrojo(`${DIAS}/.novedades.lock`, 10);
if (libre) {
  try { await main(); } catch (e) { say(`ERROR ${e.message}`); process.exitCode = 1; } finally { libre(); }
}
