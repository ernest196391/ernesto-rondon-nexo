// D101 (Ernesto, 23-oct-2026) · Aplicar lo de los grupos cuando vuelva WhatsApp (bot parado el 23-oct por la restricción).
//   1. Nombre: «Actualización productos 48h⏲️» → «Actualización productos 24h⏲️» (fila grupo_nombre del buzón).
//   2. Fotos de grupo con la marca (estilo VIP: petróleo, aro ámbar, isotipo CV crema), 640×640:
//        comunidad «CASA VIVA» · 24 h · Recogida en tienda  (+ «Actualización de productos» solo con --con-actualizacion:
//        ya tiene la del 18-oct).  Archivos: /root/archivos/marca/grupos-20261023/*.jpg
//   3. Anuncios: instala las versiones nuevas de novedades.mjs / seleccion-diaria.mjs / novedades-comun.mjs (staging en
//        /root/supervisor/tareas/grupos-24h/, copia .bak-AAAAMMDD-antes-24h) y enciende crm_settings novedades_24h = si
//        (propios → «Actualización de productos»; de proveedor MK- → «24 h», hasta 30 al día).
//   4. Vales: crm_settings bajo_pedido_grupo = si (o «prueba» con --vales-prueba): los vales de bajo pedido salen también en
//        el grupo 24 h, sin datos del cliente. Necesita VivaBot con feat/grupos-24h desplegado.
// Antes de nada comprueba: bot en marcha (pm2 vivabot online), código desplegado con grupo_nombre, fotos y staging.
// Uso:  node /root/supervisor/tareas/grupos-24h-aplicar.mjs --prueba        (no escribe nada: dice lo que haría)
//       node /root/supervisor/tareas/grupos-24h-aplicar.mjs                 (lo hace y espera hasta 2 min el resultado)
//       opciones: --con-actualizacion · --vales-prueba · --sin-nombre · --sin-anuncios · --sin-vales · --forzar (bot parado)
// Si WhatsApp contesta not-authorized (el número no es admin de ese grupo), manda la foto/el nombre a Ernesto («Tú»)
// para ponerlo a mano. Nunca escribe en los grupos (solo nombre y foto). Nunca imprime claves.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const ERNESTO = '5354056173';
const FOTOS = '/root/archivos/marca/grupos-20261023';
const TAREAS = '/root/supervisor/tareas';
const STAGING = `${TAREAS}/grupos-24h`;
const LOG = '/root/supervisor/logs/grupos-24h-aplicar.log';
const G24 = '120363425123846351@g.us';
const NOMBRE_24H = 'Actualización productos 24h⏲️';
const GRUPOS = [
  { key: 'comunidad', jid: '120363302056147831@g.us', nombre: 'CASA VIVA (comunidad)', foto: `${FOTOS}/comunidad.jpg` },
  { key: '24h', jid: G24, nombre: NOMBRE_24H, foto: `${FOTOS}/24h.jpg` },
  { key: 'recogida', jid: '120363394650616711@g.us', nombre: 'Recogida en tienda', foto: `${FOTOS}/recogida.jpg` },
  { key: 'actualizacion', jid: '120363283827702479@g.us', nombre: 'Actualización de productos', foto: `${FOTOS}/actualizacion.jpg`, opcional: true },
];
const SCRIPTS = ['novedades-comun.mjs', 'novedades.mjs', 'seleccion-diaria.mjs'];

const A = process.argv.slice(2);
const PRUEBA = A.includes('--prueba');
const op = (k) => A.includes(k);
const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Havana' }).format(new Date()).replaceAll('-', '');
const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const lines = [];
const say = (s) => { console.log(s); lines.push(s); };
const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');

async function setting(key) { return (must(await db.from('crm_settings').select('value').eq('business_id', BIZ).eq('key', key).maybeSingle()) || {}).value ?? null; }
async function put(key, value) {
  if (PRUEBA) return say(`   (prueba) crm_settings ${key} = ${value}`);
  must(await db.from('crm_settings').upsert({ business_id: BIZ, key, value, updated_at: new Date().toISOString() }, { onConflict: 'business_id,key' }).select('key'));
  say(`   crm_settings ${key} = ${value}`);
}

function botOnline() {
  try {
    const list = JSON.parse(execFileSync('pm2', ['jlist'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
    return list.find((p) => p.name === 'vivabot')?.pm2_env?.status || 'no existe';
  } catch (e) { return `no sé (${e.message.slice(0, 60)})`; }
}

async function main() {
  say(`== Grupos 24 h (D101) · ${PRUEBA ? 'PRUEBA (no escribe nada)' : 'APLICAR'} · ${new Date().toISOString()} ==`);
  // ---------- comprobaciones ----------
  const estado = botOnline();
  say(`Bot (pm2 vivabot): ${estado}`);
  if (estado !== 'online' && !PRUEBA && !op('--forzar')) throw new Error('el bot no está en marcha: arráncalo (cv reiniciar) cuando vuelva WhatsApp y repite. Nada hecho.');
  const politica = fs.readFileSync('/root/vivabot/src/outbox-policy.js', 'utf8');
  const motor = fs.readFileSync('/root/vivabot/src/bajopedido-engine.js', 'utf8');
  const codigoNombre = politica.includes("'grupo_nombre'") && fs.readFileSync('/root/vivabot/src/index.js', 'utf8').includes('groupUpdateSubject');
  const codigoVales = motor.includes('groupTick');
  say(`Código desplegado: grupo_nombre ${codigoNombre ? 'sí' : 'NO'} · vales al grupo 24 h ${codigoVales ? 'sí' : 'NO'}${codigoNombre && codigoVales ? '' : ' → falta desplegar la rama feat/grupos-24h (ver CODEX-VPS.md «Grupos 24 h»)'}`);
  const { validateOutboxRow } = await import('/root/vivabot/src/outbox-policy.js');
  const chats = must(await db.from('crm_wa_chats').select('jid,name').eq('business_id', BIZ).in('jid', GRUPOS.map((g) => g.jid)));
  const nombreDe = new Map(chats.map((c) => [c.jid, c.name]));

  // ---------- filas del buzón ----------
  const filas = [];
  if (!op('--sin-nombre')) {
    const ahora = nombreDe.get(G24) || '?';
    if (ahora === NOMBRE_24H) say(`Nombre: el grupo ya se llama «${NOMBRE_24H}» (nada que cambiar)`);
    else if (!codigoNombre) say('Nombre: SALTADO (el bot de ahora no sabe cambiar nombres). Despliega y repite, o usa --sin-nombre.');
    else filas.push({ grupo: GRUPOS[1], row: { to_group: G24, kind: 'grupo_nombre', body: NOMBRE_24H }, que: `nombre «${ahora}» → «${NOMBRE_24H}»` });
  }
  for (const g of GRUPOS) {
    if (g.opcional && !op('--con-actualizacion')) { say(`Foto ${g.nombre}: no (ya tiene la del 18-oct; para cambiarla: --con-actualizacion)`); continue; }
    if (!fs.existsSync(g.foto)) { say(`Foto ${g.nombre}: FALTA el archivo ${g.foto}`); continue; }
    if (!nombreDe.has(g.jid)) { say(`Foto ${g.nombre}: el grupo ${g.jid} no está en crm_wa_chats (el buzón no lo encontraría)`); continue; }
    filas.push({ grupo: g, row: { to_group: g.jid, kind: 'grupo_foto', body: '', file_path: g.foto }, que: `foto ${path.basename(g.foto)} → «${nombreDe.get(g.jid)}»` });
  }
  // No repetir lo que ya salió bien (o está esperando) en los últimos 3 días.
  const desde = new Date(Date.now() - 3 * 864e5).toISOString();
  const previas = must(await db.from('crm_outbox').select('id,to_group,kind,file_path,body,status').eq('business_id', BIZ).in('kind', ['grupo_foto', 'grupo_nombre']).gte('created_at', desde));
  const ids = [];
  for (const f of filas) {
    const ya = previas.find((p) => p.to_group === f.row.to_group && p.kind === f.row.kind && (p.file_path || '') === (f.row.file_path || '') && (f.row.kind !== 'grupo_nombre' || p.body === f.row.body) && ['enviado', 'pendiente', 'enviando'].includes(p.status));
    if (ya) { say(`• ${f.que}: ya está (#${ya.id} ${ya.status})`); continue; }
    const row = { business_id: BIZ, status: 'pendiente', to_phone: null, created_by: 'claude-24h', ...f.row };
    const mal = validateOutboxRow(row, BIZ);
    if (mal) { say(`• ${f.que}: NO VÁLIDA con el código de ahora (${mal})`); continue; }
    if (PRUEBA) { say(`• (prueba) ${f.que}`); continue; }
    const [ins] = must(await db.from('crm_outbox').insert(row).select('id'));
    ids.push({ id: ins.id, f });
    say(`• ${f.que} → buzón #${ins.id}`);
  }

  // ---------- anuncios (novedades) ----------
  if (!op('--sin-anuncios')) {
    const orig = Object.fromEntries(fs.readFileSync(`${STAGING}/ORIGINAL.md5`, 'utf8').trim().split('\n').map((l) => l.trim().split(/\s+/).reverse()));
    const cambiadas = SCRIPTS.filter((s) => md5(`${TAREAS}/${s}`) !== orig[s] && md5(`${TAREAS}/${s}`) !== md5(`${STAGING}/${s}`));
    if (cambiadas.length) say(`Anuncios: NO instalo: ${cambiadas.join(', ')} cambió en el VPS desde el 23-oct (otra sesión). Revisa y mezcla a mano.`);
    else {
      for (const s of SCRIPTS) {
        if (md5(`${TAREAS}/${s}`) === md5(`${STAGING}/${s}`)) { say(`   ${s}: ya es la versión nueva`); continue; }
        if (PRUEBA) { say(`   (prueba) ${s}: copia .bak-${hoy}-antes-24h e instalo la nueva`); continue; }
        fs.copyFileSync(`${TAREAS}/${s}`, `${TAREAS}/${s}.bak-${hoy}-antes-24h`);
        fs.copyFileSync(`${STAGING}/${s}`, `${TAREAS}/${s}`);
        say(`   ${s}: instalada (copia ${s}.bak-${hoy}-antes-24h)`);
      }
      for (const s of SCRIPTS) execFileSync('node', ['--check', `${PRUEBA ? STAGING : TAREAS}/${s}`]);
      say('   node --check: OK');
      await put('novedades_24h', 'si');
      if ((await setting('novedades_24h_max_dia')) === null) await put('novedades_24h_max_dia', '30');
    }
  }
  // ---------- vales al grupo 24 h ----------
  if (!op('--sin-vales')) {
    if (!codigoVales) say('Vales: SALTADO (el bot de ahora no los publica). Despliega feat/grupos-24h y repite.');
    else await put('bajo_pedido_grupo', op('--vales-prueba') ? 'prueba' : 'si');
  }

  // ---------- resultado de las filas ----------
  if (ids.length) {
    say('Espero el resultado del bot (hasta 2 min)…');
    let res = [];
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      res = must(await db.from('crm_outbox').select('id,status,error').in('id', ids.map((x) => x.id)));
      if (res.every((r) => ['enviado', 'error'].includes(r.status))) break;
    }
    const aMano = [];
    for (const { id, f } of ids) {
      const r = res.find((x) => x.id === id) || {};
      say(`   #${id} ${f.que}: ${r.status || '?'}${r.error ? ` (${r.error})` : ''}`);
      if (r.status === 'error' && /not-authorized|forbidden|401|403/i.test(r.error || '')) aMano.push(f);
    }
    // El número no es admin de ese grupo: se lo mando a Ernesto para ponerlo a mano (a su chat «Tú»).
    for (const f of aMano) {
      const row = f.row.kind === 'grupo_foto'
        ? { kind: 'archivo', file_path: f.row.file_path, body: `🖼️ Foto nueva para «${f.grupo.nombre}». El bot no es administrador ahí: ponla tú a mano (Info del grupo → foto).` }
        : { kind: 'texto', body: `✏️ Nombre nuevo para el grupo «${nombreDe.get(f.row.to_group) || f.grupo.nombre}»: *${f.row.body}*. El bot no es administrador ahí: cámbialo tú a mano (Info del grupo → nombre).` };
      const [ins] = must(await db.from('crm_outbox').insert({ business_id: BIZ, status: 'pendiente', to_phone: ERNESTO, created_by: 'claude-24h', ...row }).select('id'));
      say(`   → a Ernesto para ponerlo a mano: buzón #${ins.id}`);
    }
  }
  say(PRUEBA ? '== Fin de la prueba: no se escribió nada ==' : '== Hecho ==');
}

try { await main(); } catch (e) { say(`ERROR: ${e.message}`); process.exitCode = 1; }
finally { if (!PRUEBA) fs.appendFileSync(LOG, lines.join('\n') + '\n\n'); }
