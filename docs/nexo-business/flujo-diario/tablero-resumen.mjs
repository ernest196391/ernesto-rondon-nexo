#!/usr/bin/env node
// Resumen del VPS para el tablero único del móvil (D127, 30-oct-2026). SOLO LEE Supabase y el vigilante; no manda
// mensajes a nadie. Cada 3 min hace POST /wp-json/casa-viva/v1/bot/tablero/resumen con la llave del bot.
//   */3 * * * * cd /root/vivabot && /usr/bin/flock -n /tmp/tablero-resumen.lock /usr/bin/node /root/supervisor/tareas/tablero-resumen.mjs >> /root/supervisor/logs/tablero-resumen.log 2>&1
// Prueba sin guardar nada en la web: node tablero-resumen.mjs --prueba   (imprime el resumen y la web responde «prueba»)
// Multi-negocio: --negocio <business_id> y --destino <url de la web>; si no, BUSINESS_ID y WOO_URL del .env.
// Copia en el repo: docs/nexo-business/flujo-diario/tablero-resumen.mjs (si cambias una, copia la otra).
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : ''; };
const PRUEBA = args.includes('--prueba');
const BIZ = arg('--negocio') || process.env.BUSINESS_ID || '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const DESTINO = (arg('--destino') || process.env.WOO_URL || '').replace(/\/$/, '');
const KEY = process.env.CURRU_KEY || '';
const TZ = process.env.TABLERO_TZ || 'America/Havana';
const VIGILANTE = (process.env.VIGILANTE_DIR || '/root/archivos/vigilante') + '/estado.json';
const DIAS_ERRORES = 7;

const log = (m) => console.log(`${new Date().toISOString()} ${m}`);

// Inicio del día de hoy en la zona del negocio, en UTC (sirve con o sin horario de verano).
function inicioHoy(tz) {
  const now = new Date();
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    .formatToParts(now).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const offset = asUtc - now.getTime(); // zona − UTC
  return new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - offset);
}
const hhmm = (iso) => new Intl.DateTimeFormat('es-ES', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
const diaLocal = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
// Sin teléfonos en la página: cualquier tira de 4+ cifras se tapa.
const limpio = (t, n = 90) => { const s = String(t || '').replace(/…?\+?\d[\d\s-]{3,}\d/g, '…').replace(/…\d{3,}/g, '…').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const tel8 = (p) => String(p || '').replace(/\D/g, '').slice(-8);

async function todas(q, max = 5000) {
  const out = [];
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await q().range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

function salud() {
  try {
    const st = JSON.parse(fs.readFileSync(VIGILANTE, 'utf8'));
    const mtime = fs.statSync(VIGILANTE).mtimeMs;
    const nombres = { web: 'Web', bot: 'Bot', buzon: 'Buzón', datos: 'Base de datos', tasa: 'Tasa del día' };
    const checks = Object.entries(nombres).filter(([k]) => st.checks?.[k]).map(([k, nombre]) => {
      const c = st.checks[k];
      return { nombre, ok: !c.fallos, grave: !!c.grave, detalle: limpio(c.detalle, 60) };
    });
    return { min: Math.floor((Date.now() - mtime) / 60000), checks, alerta: st.alerta ? limpio(st.alerta, 90) : null };
  } catch (e) {
    return { min: null, checks: [{ nombre: 'Vigilante', ok: false, grave: false, detalle: 'sin lectura del vigilante' }] };
  }
}

async function errores(hoy) {
  const desde = new Date(Date.now() - DIAS_ERRORES * 864e5).toISOString();
  const rows = await todas(() => db.from('crm_errores').select('id,created_at,tipo,gravedad,estado,que_paso').eq('business_id', BIZ).gte('created_at', desde).order('id', { ascending: false }));
  const abiertos = rows.filter((r) => ['abierto', 'decidir'].includes(r.estado));
  const g = { alta: 0, media: 0, baja: 0 };
  for (const r of abiertos) if (g[r.gravedad] !== undefined) g[r.gravedad]++;
  const porTipo = {};
  for (const r of rows) porTipo[r.tipo || 'otro'] = (porTipo[r.tipo || 'otro'] || 0) + 1;
  const hoyDia = diaLocal(hoy);
  const ultimos = abiertos.slice(0, 4).map((r) => ({
    id: r.id, tipo: r.tipo || 'otro', gravedad: r.gravedad || '', estado: r.estado,
    cuando: diaLocal(new Date(r.created_at)) === hoyDia ? hhmm(r.created_at) : new Intl.DateTimeFormat('es-ES', { timeZone: TZ, day: '2-digit', month: '2-digit' }).format(new Date(r.created_at)),
    texto: limpio(r.que_paso, 90),
  }));
  return {
    dias: DIAS_ERRORES, total: rows.length,
    para_decidir: rows.filter((r) => r.estado === 'decidir').length,
    corregidos: rows.filter((r) => r.estado === 'corregido').length,
    abiertos_por_gravedad: g, por_tipo: porTipo,
    graves_hoy_sin_decidir: abiertos.filter((r) => r.gravedad === 'alta' && new Date(r.created_at) >= hoy).length,
    ultimos,
  };
}

async function mensajes(hoy) {
  const desde = hoy.toISOString();
  const msgs = await todas(() => db.from('crm_messages').select('contact_id').eq('business_id', BIZ).eq('direction', 'out').eq('author', 'bot').gte('created_at', desde), 20000);
  const porContacto = {};
  for (const m of msgs) if (m.contact_id) porContacto[m.contact_id] = (porContacto[m.contact_id] || 0) + 1;
  const ids = Object.keys(porContacto);
  const contactos = {};
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await db.from('crm_contacts').select('id,name,phone,role,bot_mode').in('id', ids.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const c of data) contactos[c.id] = c;
  }
  const out = await todas(() => db.from('crm_outbox').select('to_phone,to_group,status,created_by').eq('business_id', BIZ).gte('created_at', desde), 20000);
  const fallidosPorTel = {};
  for (const o of out) if (o.status === 'error' && o.to_phone) fallidosPorTel[tel8(o.to_phone)] = (fallidosPorTel[tel8(o.to_phone)] || 0) + 1;
  const personas = []; let clientes = 0; let clientesN = 0;
  for (const [id, n] of Object.entries(porContacto)) {
    const c = contactos[id];
    if (!c || c.bot_mode === 'ignorar') continue; // contactos privados de Ernesto: ni se nombran
    if (!c.role || c.role === 'cliente') { clientes += n; clientesN++; continue; }
    personas.push({ nombre: limpio(c.name || 'Sin nombre', 40), rol: c.role, tel8: tel8(c.phone), n, fallidos: fallidosPorTel[tel8(c.phone)] || 0 });
  }
  personas.sort((a, b) => b.n - a.n);
  if (clientes) personas.push({ nombre: `Clientes (${clientesN})`, rol: 'cliente', tel8: '', n: clientes, fallidos: 0 });
  const origen = {};
  for (const o of out) origen[o.created_by || 'sin etiqueta'] = (origen[o.created_by || 'sin etiqueta'] || 0) + 1;
  return {
    total_bot: msgs.length, por_persona: personas,
    outbox: { total: out.length, grupos: out.filter((o) => o.to_group).length, fallidos: out.filter((o) => o.status === 'error').length, por_origen: Object.entries(origen).sort((a, b) => b[1] - a[1]).slice(0, 8) },
  };
}

// Interruptores del bot que Ernesto quiere ver (D126: modo tranquilo; sin fila = apagado, como lo lee el bot).
async function modos() {
  const nombres = { modo_tranquilo: 'Modo tranquilo', modo_tranquilo_palla: 'Modo tranquilo en Pa\'llá' };
  const { data, error } = await db.from('crm_settings').select('key,value').eq('business_id', BIZ).in('key', Object.keys(nombres));
  if (error) throw new Error(error.message);
  const val = Object.fromEntries((data || []).map((r) => [r.key, String(r.value ?? '').trim().toLowerCase()]));
  return Object.entries(nombres).map(([k, nombre]) => ({ nombre, encendido: ['si', 'sí', 'true', '1', 'on'].includes(val[k] || '') }));
}

// Reglas que fija Lennys (Vigía 3-nov, aprobado por Ernesto): tope de salidas del cajón. Sin fila = sin poner (0).
async function reglas() {
  const keys = ['salidas_tope_usd', 'salidas_tope_cup'];
  const { data, error } = await db.from('crm_settings').select('key,value').eq('business_id', BIZ).in('key', keys);
  if (error) throw new Error(error.message);
  const val = Object.fromEntries((data || []).map((r) => [r.key, Number(String(r.value ?? '').replace(',', '.')) || 0]));
  return Object.fromEntries(keys.map((k) => [k, val[k] || 0]));
}

async function contar(tabla, campo, valor) {
  const { count, error } = await db.from(tabla).select('id', { count: 'exact', head: true }).eq('business_id', BIZ).eq(campo, valor);
  if (error) throw new Error(error.message);
  return count || 0;
}

async function main() {
  if (!DESTINO || !KEY) throw new Error('falta WOO_URL o CURRU_KEY en el .env');
  const hoy = inicioHoy(TZ);
  const partes = await Promise.allSettled([errores(hoy), mensajes(hoy), contar('crm_supervisor', 'status', 'pendiente'), contar('crm_escalations', 'status', 'abierta'), modos(), reglas()]);
  const [e, m, sup, esc, mod, reg] = partes.map((p) => (p.status === 'fulfilled' ? p.value : null));
  partes.forEach((p, i) => { if (p.status === 'rejected') log(`parte ${i} falló: ${p.reason?.message || p.reason}`); });
  const resumen = { v: 1, business_id: BIZ, generado_at: new Date().toISOString(), salud: salud() };
  if (e) resumen.errores = e; // si una parte falla, no se manda: el tablero dice «sin dato», nunca un cero falso
  if (m) resumen.mensajes = m;
  if (sup !== null) resumen.supervisor = { pendientes: sup };
  if (esc !== null) resumen.escalaciones = { abiertas: esc };
  if (mod) resumen.modos = mod;
  if (reg) resumen.reglas = reg;
  const body = JSON.stringify(resumen);
  if (PRUEBA) console.log(JSON.stringify(resumen, null, 1).slice(0, 6000));
  const url = `${DESTINO}/wp-json/casa-viva/v1/bot/tablero/resumen${PRUEBA ? '?prueba=1' : ''}`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-VivaBot-Key': KEY }, body, signal: AbortSignal.timeout(20000) });
  const txt = await res.text();
  if (!res.ok) throw new Error(`web ${res.status}: ${txt.slice(0, 200)}`);
  log(`ok ${body.length} bytes${PRUEBA ? ' (prueba, no guardado)' : ''} · ${txt.slice(0, 120)}`);
}

main().catch((err) => { log(`ERROR ${err.message}`); process.exit(1); });
