// Anuncios de productos nuevos al grupo «Actualización de productos», UNO cada vez y con pausa (contra el bloqueo de WhatsApp).
// Decisión de Ernesto, 20-oct-2026: una foto + pie por producto, como mucho 1 cada 3 min, solo de 9:00 a 19:00 (Cuba),
// empezando el 21-oct a las 9:00. Sin nombre ni precio del proveedor.
//
// Lo ejecuta cron cada 3 minutos (VPS):  */3 * * * * /usr/bin/node /root/supervisor/tareas/novedades.mjs >> /root/supervisor/logs/novedades.log 2>&1
// Cada vuelta mete COMO MUCHO 1 fila en crm_outbox (created_by 'novedades'); el bot la manda.
//   Cola:      /root/archivos/novedades/cola.json      { desde: "AAAA-MM-DD", grupo, items: [{ sku, market_id, product_id, file_path, body }] }
//   Enviados:  /root/archivos/novedades/enviados.jsonl (una línea por anuncio: sku, outbox id, hora) → nunca se repite uno.
//   PARAR:     crm_settings novedades_auto = no   (seguir: si). Sin esa fila = parado.
//   Ritmo:     crm_settings novedades_cada_min (opcional, mínimo 3).
// No manda si: fuera de horario, antes de «desde», queda un anuncio anterior sin salir (bot caído) o el último dio error
// (hay que mirarlo: cv outbox 10), o el artículo de la bolsa ya no está «publicado» (agotado, retirado…: se salta).
// Prueba sin escribir nada:  node novedades.mjs --prueba
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const DIR = '/root/archivos/novedades';
const COLA = process.env.NOVEDADES_COLA || `${DIR}/cola.json`; // otra cola solo para probar
const ENVIADOS = `${DIR}/enviados.jsonl`;
const LOCK = `${DIR}/.lock`;
const PRUEBA = process.argv.includes('--prueba');
const HORA_INI = 9, HORA_FIN = 19; // [9:00, 19:00)

const ahora = new Date();
const cuba = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Havana', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  .formatToParts(ahora).map((p) => [p.type, p.value]));
const hoy = `${cuba.year}-${cuba.month}-${cuba.day}`;
const hora = Number(cuba.hour) + Number(cuba.minute) / 60;
const say = (s) => console.log(`${ahora.toISOString()} [${hoy} ${cuba.hour}:${cuba.minute} Cuba] ${s}`);
const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

async function main() {
  const setting = async (k) => (must(await db.from('crm_settings').select('value').eq('business_id', BIZ).eq('key', k).maybeSingle()) || {}).value;
  const modo = String((await setting('novedades_auto')) || 'no').trim().toLowerCase();
  if (modo !== 'si' && !PRUEBA) return; // parado: ni log, para no llenar el archivo
  const cola = JSON.parse(fs.readFileSync(COLA, 'utf8'));
  if (hoy < cola.desde) return;
  if (hora < HORA_INI || hora >= HORA_FIN) return;

  const enviados = fs.existsSync(ENVIADOS) ? fs.readFileSync(ENVIADOS, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  const hechos = new Set(enviados.map((e) => e.sku));
  const pendientes = cola.items.filter((it) => !hechos.has(it.sku));
  if (!pendientes.length) return;

  // ¿El anterior salió? ¿Cuánto hace?
  const ult = must(await db.from('crm_outbox').select('id,status,error,created_at').eq('business_id', BIZ).eq('created_by', 'novedades').order('id', { ascending: false }).limit(1))[0];
  if (ult && ['pendiente', 'enviando'].includes(ult.status)) return say(`espero: el anuncio #${ult.id} sigue «${ult.status}»`);
  if (ult && ult.status === 'error') return say(`PARADO: el anuncio #${ult.id} dio error (${ult.error}). Míralo con «cv outbox 10»; para seguir, borra o arregla esa fila.`);
  const cada = Math.max(3, Number(await setting('novedades_cada_min')) || 3);
  if (ult && ahora - Date.parse(ult.created_at) < cada * 60e3 - 15e3) return;

  for (const it of pendientes) {
    const item = must(await db.from('crm_market_items').select('status').eq('business_id', BIZ).eq('id', it.market_id).maybeSingle());
    if (item?.status !== 'publicado') {
      say(`salto ${it.sku}: en la bolsa está «${item?.status || 'no existe'}»`);
      if (!PRUEBA) fs.appendFileSync(ENVIADOS, JSON.stringify({ sku: it.sku, saltado: item?.status || 'no existe', at: ahora.toISOString() }) + '\n');
      continue;
    }
    if (!fs.existsSync(it.file_path)) { say(`salto ${it.sku}: no está la foto ${it.file_path}`); continue; }
    if (PRUEBA) return say(`PRUEBA: mandaría ${it.sku} → ${cola.grupo}\n${it.body}`);
    const [ins] = must(await db.from('crm_outbox').insert({
      business_id: BIZ, to_group: cola.grupo, kind: 'archivo', file_path: it.file_path, body: it.body, status: 'pendiente', created_by: 'novedades',
    }).select('id'));
    fs.appendFileSync(ENVIADOS, JSON.stringify({ sku: it.sku, product_id: it.product_id, outbox: ins.id, at: ahora.toISOString() }) + '\n');
    return say(`anuncio ${it.sku} → buzón #${ins.id} (quedan ${pendientes.length - 1})`);
  }
}

// Un solo proceso a la vez.
let fd;
try { fd = fs.openSync(LOCK, 'wx'); } catch {
  if (Date.now() - fs.statSync(LOCK).mtimeMs < 10 * 60e3) process.exit(0);
  fs.unlinkSync(LOCK); fd = fs.openSync(LOCK, 'wx');
}
try { await main(); } catch (e) { say(`ERROR ${e.message}`); process.exitCode = 1; } finally { fs.closeSync(fd); fs.unlinkSync(LOCK); }
