// Vuelca las respuestas de la hoja de Nana (top 20 fichas, 23-oct-2026) a la web (Core) y a crm_knowledge,
// y cierra las preguntas abiertas que quedan contestadas. NO envía ningún mensaje a nadie.
//
// Se ejecuta EN EL VPS (usa /root/vivabot/.env y las reglas del bot):
//   scp top20.json volcar-respuestas.mjs respuestas.json root@179.236.242.212:/root/archivos/fichas/top20-2026-10-23/
//   cd /root/archivos/fichas/top20-2026-10-23
//   node volcar-respuestas.mjs --respuestas respuestas.json --prueba     # EN SECO: solo dice lo que haría (por defecto)
//   node volcar-respuestas.mjs --respuestas respuestas.json --hacer      # escribe de verdad (con el SÍ de Ernesto)
// Opciones: --quien Nana (quién contestó; por defecto _quien del archivo) · --solo-sabidos (sin respuestas: solo
// escribe los datos que ya se sabían con fuente) · --json top20.json.
//
// respuestas.json = respuestas-plantilla.json rellenada: { "_quien": "Nana", "_fecha": "2026-10-24", "3714.firmeza": "media", ... }
//   sí/no → "Sí" | "No" · opciones → una de las de la hoja · texto → lo que escribió · foto → "hecha".
//   También vale pegar tal cual el texto de «Copiar respuestas» (la primera línea se ignora).
//
// Qué hace con --hacer (cada paso deja constancia en volcado-<hora>.json en esta carpeta):
//   1) Copia de la descripción actual de cada producto tocado (Woo) → backup-<id>-<hora>.json.
//   2) Web: POST /casa-viva/v1/bot/fichas/guardar {id, lineas, fuente:"tienda", quien, pregunta:"top20-2026-10-23"}.
//      Core añade el bloque «Características y medidas» sin borrar nada, no repite líneas y apunta _cvd_ficha_datos
//      y _cvd_ficha_historial. Los datos internos (p. ej. «venta directa») y los colores de hoy NO van a la web.
//   3) crm_knowledge: una fila activa por producto («¿Qué medidas y características tiene …?»), o se completa la que
//      ya exista casi igual; una fila por familia con lo que no es de un solo producto (colores de hoy, cortinero doble);
//      y las filas pendientes de la comunidad que quedan contestadas (p. ej. #271, #314) pasan a activas.
//   4) crm_settings.preguntas_abiertas: las preguntas listadas en «cerrar_preguntas» cuyo dato ya está → «respondida».
//      Al final imprime a quién habría que avisar y un borrador: NO se envía (WhatsApp con el SÍ de Ernesto).
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const opt = (k, d = null) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const HACER = has('--hacer') && !has('--prueba');
const DIR = path.dirname(new URL(import.meta.url).pathname);
const TOP = JSON.parse(fs.readFileSync(opt('--json', path.join(DIR, 'top20.json')), 'utf8'));
const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const TAG = 'top20-2026-10-23';
const die = (m) => { console.error(`✖ ${m}`); process.exit(1); };

// ---------- respuestas ----------
let R = {};
const rfile = opt('--respuestas');
if (rfile) {
  const raw = fs.readFileSync(rfile, 'utf8').trim();
  const body = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'));
  try { R = JSON.parse(body); } catch (e) { die(`No entiendo ${rfile}: ${e.message}`); }
} else if (!has('--solo-sabidos')) die('Falta --respuestas <archivo> (o --solo-sabidos).');
const QUIEN = opt('--quien', R._quien || 'Nana');
const FECHA = /^\d{4}-\d\d-\d\d$/.test(R._fecha || '') ? R._fecha : new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Havana' });
const fechaCorta = FECHA.split('-').reverse().slice(0, 2).join('/');

// ---------- validar y convertir cada respuesta en línea ----------
const avisos = [];
const campos = TOP.ranking.flatMap((f) => f.campos.map((c) => ({ ...c, fam: f })));
const porClave = new Map(campos.filter((c) => c.estado === 'falta').map((c) => [c.clave, c]));
for (const k of Object.keys(R)) if (!k.startsWith('_') && R[k] != null && R[k] !== '' && !porClave.has(k)) avisos.push(`Clave desconocida, se ignora: ${k}`);
const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
function respuesta(c) {
  let v = R[c.clave];
  if (v == null || String(v).trim() === '') return null;
  v = String(v).replace(/\s+/g, ' ').trim();
  if (c.tipo === 'foto') return fold(v) === 'hecha' || fold(v) === 'si' ? { foto: true } : null;
  if (c.tipo === 'sino') {
    const s = fold(v);
    if (['si', 'sí', 's'].includes(s)) return { valor: 'Sí', linea: c.linea_si };
    if (['no', 'n'].includes(s)) return { valor: 'No', linea: c.linea_no };
    avisos.push(`${c.clave}: «${v}» no es Sí/No; se ignora.`); return null;
  }
  if (c.tipo === 'opciones') {
    const o = c.opciones.find((x) => fold(x) === fold(v) || fold(x).startsWith(fold(v)));
    if (!o) { avisos.push(`${c.clave}: «${v}» no es una de: ${c.opciones.join(' / ')}; se ignora.`); return null; }
    v = o;
  }
  if (v.length > 200) { avisos.push(`${c.clave}: texto muy largo (${v.length}); se corta a 200.`); v = v.slice(0, 200); }
  if (c.unidad) v = v.replace(new RegExp(`\\s*${c.unidad.replace(/[/.]/g, '\\$&')}\\.?$`, 'i'), ''); // «45 cm» + « cm» de la plantilla
  return { valor: v, linea: String(c.linea_web || `${c.campo}: {v}.`).replace('{v}', v).replace(/\.\.$/, '.') };
}
const contestadas = new Map();
for (const c of porClave.values()) { const r = respuesta(c); if (r) contestadas.set(c.clave, { c, ...r }); }

// ---------- plan: líneas para la web y para la memoria del bot ----------
const web = new Map();   // id → Map(quien → [líneas])
const memoria = new Map(); // id → [líneas] (todo lo que sabemos del producto)
const familia = new Map(); // key → [líneas] (lo que no es de un solo producto)
const add = (m, k, l) => { if (!m.has(k)) m.set(k, []); if (!m.get(k).includes(l)) m.get(k).push(l); };
const addWeb = (id, quien, l) => { if (!web.has(id)) web.set(id, new Map()); add(web.get(id), quien, l); };
for (const c of campos.filter((x) => x.estado === 'confirmado')) {
  const linea = c.linea_web || `${c.campo}: ${c.valor}.`;
  if (c.destino === 'escribir_en_web') addWeb(c.id, c.quien || 'tienda', linea);
  add(memoria, c.id, c.destino === 'solo_conocimiento' ? `${c.campo}: ${c.valor} (interno, no decirlo como dato de la web)` : linea);
}
const fotos = [];
for (const { c, valor, linea, foto } of contestadas.values()) {
  if (foto) { fotos.push(c); continue; }
  if (c.destino === 'escribir_en_web') for (const id of c.web_ids) { addWeb(id, QUIEN, linea); add(memoria, id, linea); }
  else add(familia, c.fam.key, `${c.campo}: ${valor} (${QUIEN}, ${fechaCorta}${/hoy/.test(c.slug) ? '; puede cambiar' : ''}).`);
}
const nombre = (id) => TOP.ranking.flatMap((f) => f.productos).find((p) => p.id === id) || { id, nombre: `#${id}`, url: '' };
const tocados = [...web.keys()];

// ---------- entorno del VPS ----------
const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env' });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const { filaConocimiento } = await import('/root/vivabot/src/fichas-rules.js');
const { findDuplicateKnowledge } = await import('/root/vivabot/src/preguntas-rules.js');
const base = (process.env.WOO_URL || '').replace(/\/$/, '');
async function core(p, body) {
  const res = await fetch(`${base}/wp-json/casa-viva/v1${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-VivaBot-Key': process.env.CURRU_KEY || '' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Core ${res.status}: ${data?.message || data?.code || 'error'}`);
  return data;
}
async function wooGet(id) {
  const auth = 'Basic ' + Buffer.from(`${process.env.WOO_KEY}:${process.env.WOO_SECRET}`).toString('base64');
  const res = await fetch(`${base}/wp-json/wc/v3/products/${id}?_=${Date.now()}`, { headers: { Authorization: auth } });
  if (!res.ok) throw new Error(`Woo ${res.status} en ${id}`);
  return res.json();
}
const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const log = { tag: TAG, hacer: HACER, quien: QUIEN, fecha: FECHA, at: new Date().toISOString(), web: [], conocimiento: [], pendientes: [], preguntas: [], fotos: fotos.map((c) => c.clave), avisos };
const stamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);

console.log(`${HACER ? '✍️  ESCRIBE DE VERDAD' : '🧪 EN SECO (--prueba): no se escribe nada'} · respuestas de ${QUIEN} (${FECHA}) · ${contestadas.size} contestadas de ${porClave.size}`);
for (const a of avisos) console.log(`⚠️  ${a}`);

// 1) + 2) web
console.log(`\n── Web (${tocados.length} productos) ──`);
for (const [id, grupos] of web) {
  const p = nombre(id);
  if (HACER) {
    const w = await wooGet(id);
    fs.writeFileSync(path.join(DIR, `backup-${id}-${stamp}.json`), JSON.stringify({ id, name: w.name, description: w.description, meta_datos: (w.meta_data || []).find((m) => m.key === '_cvd_ficha_datos')?.value || '', at: new Date().toISOString() }, null, 1));
  }
  for (const [quien, lineas] of grupos) {
    for (let i = 0; i < lineas.length; i += 12) {
      const trozo = lineas.slice(i, i + 12);
      console.log(`#${id} ${p.nombre} ← ${quien}:\n   - ${trozo.join('\n   - ')}`);
      if (!HACER) continue;
      try {
        const r = await core('/bot/fichas/guardar', { id, lineas: trozo, fuente: 'tienda', quien, pregunta: TAG });
        console.log(`   ✓ añadidas ${r.added?.length || 0} (ficha: ${r.ficha?.estado || '?'}${r.ficha?.faltas?.length ? ', faltan ' + r.ficha.faltas.join(', ') : ''})`);
        log.web.push({ id, quien, lineas: trozo, added: r.added || [], ficha: r.ficha?.estado, faltas: r.ficha?.faltas || [] });
      } catch (e) { console.log(`   ✖ ${e.message}`); log.web.push({ id, quien, lineas: trozo, error: e.message }); }
    }
  }
}

// 3) crm_knowledge
console.log('\n── Memoria del bot (crm_knowledge) ──');
const filas = must(await db.from('crm_knowledge').select('id,question,answer,status,active').eq('business_id', BIZ).limit(2000));
const activas = filas.filter((r) => r.active);
const kIds = {};
async function guardarK({ question, answer, clave }) {
  const dup = findDuplicateKnowledge(activas, question, 0.7);
  const source = `ficha ${QUIEN} ${FECHA} (${TAG})`;
  if (dup) {
    const nuevo = answer.split(/(?<=\.)\s+/).filter((l) => l && !String(dup.answer || '').includes(l.replace(/\s*\(Confirmado por[^)]*\)\.?$/, '')));
    const resp = nuevo.length ? `${dup.answer || ''} ${nuevo.join(' ')}`.trim().slice(0, 1500) : dup.answer;
    console.log(`${clave}: actualiza #${dup.id} «${dup.question.slice(0, 70)}»${nuevo.length ? '' : ' (ya lo tenía todo)'}`);
    if (HACER && nuevo.length) must(await db.from('crm_knowledge').update({ answer: resp, source, status: 'activa' }).eq('id', dup.id));
    log.conocimiento.push({ clave, id: dup.id, accion: nuevo.length ? 'actualiza' : 'igual' });
    return dup.id;
  }
  console.log(`${clave}: nueva «${question.slice(0, 80)}» → ${answer.slice(0, 160)}…`);
  let id = null;
  if (HACER) id = must(await db.from('crm_knowledge').insert({ business_id: BIZ, question, answer, source, audience: 'todos', topic: 'producto', status: 'activa', active: true }).select('id').single()).id;
  log.conocimiento.push({ clave, id, accion: 'nueva' });
  return id;
}
for (const [id, lineas] of memoria) {
  const contestado = [...contestadas.values()].some(({ c }) => c.web_ids?.includes(id));
  if (!contestado && !(web.get(id)?.size)) continue; // nada nuevo de este producto
  const p = nombre(id);
  const quienK = contestado ? QUIEN : (campos.find((c) => c.id === id && c.quien)?.quien || 'la tienda');
  const row = filaConocimiento({ id, nombre: p.nombre, url: p.url }, lineas.map((l) => l.replace(/\.$/, '')), { quien: quienK, fecha: fechaCorta });
  kIds[id] = await guardarK({ ...row, clave: `#${id}` });
}
for (const [key, lineas] of familia) {
  const f = TOP.ranking.find((x) => x.key === key);
  kIds[key] = await guardarK({ question: `¿Qué hay hoy de ${f.nombre} (colores, modelos)?`, answer: `${lineas.join(' ')} Fichas: ${f.productos.map((p) => p.url).join(' ')}`.slice(0, 1500), clave: key });
}
for (const f of TOP.ranking) for (const pk of f.conocimiento_pendiente || []) {
  const row = filas.find((r) => r.id === pk.k);
  if (!row || (row.status === 'activa' && row.answer)) continue; // las de la comunidad están active=true, status «pendiente», sin respuesta
  if (!pk.requiere.every((k) => contestadas.has(k))) continue;
  const lineas = [...new Set(f.ids.flatMap((id) => memoria.get(id) || []).concat(familia.get(f.key) || []))].filter((l) => !/interno/.test(l));
  const answer = `${lineas.join(' ')} (Ficha: ${f.productos.map((p) => p.url).join(' ')})`.slice(0, 1500);
  console.log(`pendiente #${pk.k} «${row.question.slice(0, 80)}» → activa`);
  if (HACER) must(await db.from('crm_knowledge').update({ answer, status: 'activa', active: true, source: `ficha ${QUIEN} ${FECHA} (${TAG})` }).eq('id', pk.k));
  log.pendientes.push({ id: pk.k });
}

// 4) preguntas abiertas
console.log('\n── Preguntas abiertas ──');
const leerPQ = async () => JSON.parse(must(await db.from('crm_settings').select('value').eq('business_id', BIZ).eq('key', 'preguntas_abiertas').maybeSingle())?.value || '[]');
const cerrar = TOP.ranking.flatMap((f) => (f.cerrar_preguntas || []).map((x) => ({ ...x, f })));
// Una foto marcada «hecha» solo cuenta si de verdad llegó a la biblioteca de fotos reales (D70) después de la pregunta.
const FOTOS = '/root/archivos/fotos-reales';
function fotoLlego(c, desde) {
  try {
    const dirs = fs.readdirSync(FOTOS).filter((d) => d.startsWith(`${c.id}-`));
    return dirs.some((d) => fs.readdirSync(path.join(FOTOS, d)).some((f) => !f.endsWith('.json') && fs.statSync(path.join(FOTOS, d, f)).mtimeMs > desde));
  } catch { return false; }
}
const pqAhora = await leerPQ();
const listas = cerrar.filter((x) => x.requiere.every((k) => {
  const a = contestadas.get(k);
  if (!a) return false;
  if (!a.foto) return true;
  const q = pqAhora.find((r) => r.id === x.q);
  const ok = fotoLlego(a.c, Date.parse(q?.created_at || 0));
  if (!ok) console.log(`${x.q}: ${QUIEN} marcó la foto (${k}) pero no está en ${FOTOS}/${a.c.id}-*: no se cierra.`);
  return ok;
}));
const avisar = [];
if (listas.length) {
  const rows = await leerPQ(); // se vuelve a leer justo antes de escribir: el bot también escribe aquí
  for (const x of listas) {
    const q = rows.find((r) => r.id === x.q);
    if (!q) { console.log(`${x.q}: ya no está`); continue; }
    if (!['abierta', 'en_cola'].includes(q.status)) { console.log(`${x.q}: ya estaba ${q.status}`); continue; }
    const datos = x.requiere.map((k) => { const a = contestadas.get(k); return a.foto ? `foto real hecha (${a.c.campo})` : `${a.c.campo}: ${a.valor}`; }).join(' · ');
    const kid = kIds[x.f.ids.find((id) => kIds[id])] || null;
    console.log(`${x.q} (${x.nota}) → respondida: ${datos}`);
    Object.assign(q, { status: 'respondida', answer: datos.slice(0, 500), answered_by: `${QUIEN} (hoja ${TAG})`, answered_at: new Date().toISOString(), closed_at: new Date().toISOString(), remind_at: null, knowledge_id: kid });
    log.preguntas.push({ id: x.q, datos });
    const ob = q.on_behalf || {};
    if (ob.sender_phone && !/^Ficha /.test(ob.sender_name || '')) avisar.push({ q: x.q, a: ob.sender_name, tel: String(ob.sender_phone).slice(-4), donde: ob.is_group ? 'General' : 'privado', borrador: `${(ob.sender_name || '').split(/\s+/)[0] || 'Hola'} 🙏 Ya tenemos lo que preguntaste: ${datos}. Está en la ficha de la web.` });
  }
  if (HACER && log.preguntas.length) must(await db.from('crm_settings').update({ value: JSON.stringify(rows), updated_at: new Date().toISOString() }).eq('business_id', BIZ).eq('key', 'preguntas_abiertas'));
} else console.log('Ninguna queda contestada con estas respuestas.');
const sinCerrar = cerrar.filter((x) => !listas.includes(x)).map((x) => `${x.q} (falta: ${x.requiere.filter((k) => !contestadas.has(k)).join(', ')})`);
if (sinCerrar.length) console.log(`Siguen abiertas: ${sinCerrar.join(' · ')}`);

// resumen
console.log(`\n── Resumen ──\nWeb: ${tocados.length} productos · memoria: ${log.conocimiento.length} filas (+${log.pendientes.length} pendientes) · preguntas cerradas: ${log.preguntas.length}`);
if (fotos.length) console.log(`Fotos marcadas como hechas (${fotos.length}): compruébalas con «cv fotos <id>»: ${fotos.map((c) => c.clave).join(', ')}`);
if (avisar.length) {
  console.log('\nAvisar a quien preguntó (NO se envía: solo con el SÍ de Ernesto, por «cv preguntar»/«cv enviar»):');
  for (const a of avisar) console.log(`  · ${a.a} …${a.tel} (${a.donde}) [${a.q}]: ${a.borrador}`);
}
if (HACER) { const f = path.join(DIR, `volcado-${stamp}.json`); fs.writeFileSync(f, JSON.stringify({ ...log, avisar }, null, 1)); console.log(`\nConstancia: ${f}`); }
else console.log('\n(En seco: para escribir de verdad, con el SÍ de Ernesto: --hacer)');
