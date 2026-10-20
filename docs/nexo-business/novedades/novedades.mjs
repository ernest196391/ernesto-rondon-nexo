// Anuncios diarios de productos al grupo «Actualización de productos», UNO por minuto (Ernesto, 20-oct-2026).
// Cron cada minuto (VPS):  * * * * * /usr/bin/node /root/supervisor/tareas/novedades.mjs >> /root/supervisor/logs/novedades.log 2>&1
// Manda la lista del día que preparó seleccion-diaria.mjs (8:40) → /root/archivos/novedades/dias/AAAA-MM-DD.json.
// Si a las 9:02 no hay lista, la prepara en ese momento. Cada vuelta mete COMO MUCHO 1 fila en crm_outbox
// (created_by 'novedades', kind 'archivo', to_group, file_path, body); el bot la manda.
//   Horario:   9:02–19:00 Cuba (a las 9:00 sale el mensaje diario del bot con sus 3 productos; así no se repiten).
//   PARAR:     crm_settings novedades_auto = no   (seguir: si). Sin esa fila = parado.
//   Cuántos:   crm_settings novedades_max_dia (por defecto 30). Ritmo: novedades_cada_min (por defecto 1).
// No manda si: queda un anuncio anterior sin salir (bot caído), el último dio error (avisa a Ernesto 1 vez al día;
// mirar con «cv outbox 10» y arreglar o borrar esa fila), o el producto ya no está publicado/con existencias/en la bolsa
// (se salta y sale el siguiente; las reservas cubren los huecos). El pie se arma en el momento con el precio de la web.
// Al terminar la lista apunta esos productos en grupo_diario_estado para que el bot no los repita a las 19:00.
// Prueba sin escribir nada:  node novedades.mjs --prueba [--hora 9.5] [--plan /root/archivos/novedades/dias/prueba-AAAA-MM-DD.json]
import fs from 'fs';
import { execFileSync } from 'child_process';
import {
  db, BIZ, GRUPO, DIAS, must, cuba, say, setting, setSetting, ajustes, woo, esBajoPedido, vendible, pie, leerEnviados, apunta, cerrojo, avisaErnesto, marketId, comoObjeto,
} from './novedades-comun.mjs';

const PRUEBA = process.argv.includes('--prueba');
const HORA_INI = 9 + 2 / 60, HORA_FIN = 19;
const ahora = new Date();
const { day: hoy, hora: horaReal } = cuba(ahora);
const hora = process.argv.includes('--hora') ? Number(process.argv[process.argv.indexOf('--hora') + 1]) : horaReal;
const PLAN = process.argv.includes('--plan') ? process.argv[process.argv.indexOf('--plan') + 1] : `${DIAS}/${hoy}.json`; // --plan solo para pruebas

async function main() {
  if (hora < HORA_INI || hora >= HORA_FIN) return; // fuera de horario: ni consulta ni log
  const { auto, maxDia, cadaMin } = await ajustes();
  if (auto !== 'si' && !PRUEBA) return; // parado: ni log, para no llenar el archivo

  if (!fs.existsSync(PLAN) && !PRUEBA) {
    say('no hay lista de hoy: la preparo ahora');
    try { execFileSync('/usr/bin/node', [new URL('./seleccion-diaria.mjs', import.meta.url).pathname], { stdio: 'inherit', timeout: 8 * 60e3 }); } catch (e) { say(`la selección falló: ${e.message}`); }
    if (!fs.existsSync(PLAN)) return;
  }
  if (!fs.existsSync(PLAN)) return say(`PRUEBA: no hay lista de ${hoy} (córrela con: node seleccion-diaria.mjs --prueba)`);
  const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8'));
  const objetivo = Math.min(maxDia, plan.objetivo);

  const deHoy = leerEnviados().filter((e) => e.day === hoy);
  const mandados = deHoy.filter((e) => e.outbox);
  const tratados = new Set(deHoy.map((e) => Number(e.product_id)));
  if (mandados.length >= objetivo) return cerrar(plan, mandados);

  // ¿El anterior salió? ¿Cuánto hace?
  const ult = must(await db.from('crm_outbox').select('id,status,error,created_at').eq('business_id', BIZ).eq('created_by', 'novedades').eq('to_group', GRUPO).order('id', { ascending: false }).limit(1))[0];
  if (ult && ['pendiente', 'enviando'].includes(ult.status)) {
    if (ahora - Date.parse(ult.created_at) > 10 * 60e3) say(`espero: el anuncio #${ult.id} sigue «${ult.status}» desde hace más de 10 min (¿bot caído?)`);
    return;
  }
  if (ult && ult.status === 'error') {
    say(`PARADO: el anuncio #${ult.id} dio error (${ult.error}). Míralo con «cv outbox 10»; para seguir, borra o arregla esa fila.`);
    const marca = `${DIAS}/${hoy}.aviso-error`;
    if (!PRUEBA && !fs.existsSync(marca)) {
      fs.writeFileSync(marca, String(ult.id));
      await avisaErnesto(`⚠️ Novedades paradas: el anuncio #${ult.id} al grupo «Actualización de productos» dio error (${String(ult.error || '').slice(0, 120)}). Las demás esperan. Díselo a Claude para revisarlo.`, 'novedades-aviso');
    }
    return;
  }
  if (ult && ahora - Date.parse(ult.created_at) < cadaMin * 60e3 - 15e3) return;

  // Lo que el bot ya mandó hoy en su mensaje de las 9:00 (mismo grupo): no se repite.
  let gdHoy = new Set();
  try { const gd = comoObjeto(await setting('grupo_diario_estado')); gdHoy = new Set(Object.entries(gd.productos || {}).filter(([, d]) => d === hoy).map(([id]) => Number(id))); } catch { /* sin estado */ }

  for (const it of plan.items) {
    if (tratados.has(Number(it.product_id))) continue;
    const salta = (por) => { say(`salto ${it.nombre} (#${it.product_id}): ${por}`); if (!PRUEBA) apunta({ day: hoy, product_id: it.product_id, sku: it.sku, saltado: por, at: ahora.toISOString() }); };
    if (gdHoy.has(Number(it.product_id))) { salta('ya salió hoy en el mensaje de las 9:00'); continue; }
    let p;
    try { p = await woo(`products/${it.product_id}`); } catch (e) {
      if (/404/.test(e.message)) { salta('ya no existe en la web'); continue; }
      return say(`la web no responde (${e.message}); pruebo en el próximo minuto`);
    }
    let estadoBolsa = null;
    if (esBajoPedido(p)) {
      const mid = marketId(p);
      estadoBolsa = mid ? (must(await db.from('crm_market_items').select('status').eq('business_id', BIZ).eq('id', mid).maybeSingle())?.status || 'no existe') : 'no existe';
    }
    const no = vendible(p, estadoBolsa);
    if (no) { salta(no); continue; }
    if (!it.foto || !fs.existsSync(it.foto)) { salta('falta la foto'); continue; }
    const body = pie(p, it);
    if (PRUEBA) return say(`PRUEBA: mandaría ${it.nombre} (${it.motivo}: ${it.razon}) → ${GRUPO}\n[foto ${it.foto}]\n${body}`);
    const [ins] = must(await db.from('crm_outbox').insert({
      business_id: BIZ, to_group: GRUPO, kind: 'archivo', file_path: it.foto, body, status: 'pendiente', created_by: 'novedades',
    }).select('id'));
    apunta({ day: hoy, product_id: it.product_id, sku: it.sku, market_id: it.market_id, motivo: it.motivo, outbox: ins.id, at: ahora.toISOString() });
    return say(`anuncio ${mandados.length + 1}/${objetivo}: ${it.nombre} (${it.motivo}) → buzón #${ins.id}`);
  }
  say(`lista de hoy agotada con ${mandados.length}/${objetivo} (los demás se saltaron)`);
  return cerrar(plan, mandados);
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
