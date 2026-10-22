#!/usr/bin/env node
// Puntos de clientes · piloto (Ernesto 22-oct-2026, D97). Copia de /root/supervisor/tareas/puntos-calcular.mjs.
// Lee los pedidos web ENTREGADOS desde «desde» (crm_settings puntos_piloto) de clientes de las gestoras del piloto
// (Dany 18, Nadielys 29, Maryta 47) y apunta en crm_puntos 1 punto por cada USD de productos de Casa Viva
// (sin líneas MK- de proveedor, sin pruebas, sin cancelados ni devueltos; las devoluciones parciales restan).
// Cliente de la gestora = el pedido es suyo O Core dice que el cliente es suyo (/bot/client-owner, regla D97:
// el cliente que trae una gestora es suyo para siempre). No cuenta lo que compra la propia gestora ni el equipo.
// Sin --hacer solo enseña lo que haría. Un pedido da puntos una sola vez (único gana+pedido).
// Si un pedido que ya dio puntos se cancela o devuelve después, se apunta un «ajuste» negativo (una vez).
// Nunca toca precios, pedidos, cupones ni comisiones. Nunca escribe a nadie.
import { createRequire } from 'module';
const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const HACER = process.argv.includes('--hacer');
const QUIET = process.argv.includes('--silencio');
const WOO = (process.env.WOO_URL || '').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(`${process.env.WOO_KEY}:${process.env.WOO_SECRET}`).toString('base64');
const HAV = 'America/Havana';
const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: HAV }).format(d);
const p8 = (s) => String(s || '').replace(/\D/g, '').slice(-8);
const meta = (o, k) => { const m = (o.meta_data || []).find((x) => x.key === k); return m ? m.value : ''; };
const log = (...a) => { if (!QUIET) console.log(...a); };

async function woo(path) {
  const r = await fetch(`${WOO}/wp-json/wc/v3/${path}`, { headers: { Authorization: AUTH }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`La web respondió ${r.status} en ${path.split('?')[0]}`);
  return r.json();
}
const ownerCache = new Map();
async function clientOwner(phone) {
  if (ownerCache.has(phone)) return ownerCache.get(phone);
  let id = null;
  try {
    const r = await fetch(`${WOO}/wp-json/casa-viva/v1/bot/client-owner?phone=${phone}&_=${Date.now()}`, { headers: { 'X-VivaBot-Key': process.env.CURRU_KEY || '' }, signal: AbortSignal.timeout(20000) });
    const j = await r.json();
    if (j?.found && j.gestora?.id) id = String(j.gestora.id);
  } catch {}
  ownerCache.set(phone, id);
  return id;
}
// Igual que CVD_Attribution::owns_customer (Core): entregado de verdad.
function delivered(o) {
  if (['cancelled', 'refunded', 'failed', 'pending', 'draft', 'checkout-draft', 'trash'].includes(o.status)) return false;
  if (o.status === 'completed') return true;
  if (meta(o, '_cvd_operation_status') === 'delivered') return true;
  if (['delivered', 'cash_returned', 'closed'].includes(meta(o, '_cvd_delivery_status'))) return true;
  return meta(o, '_cvd_cash_status') === 'verified';
}
function deliveredDay(o) {
  const at = meta(o, '_cvd_delivered_at');
  const iso = at ? String(at).replace(' ', 'T') + (/[zZ+]/.test(String(at).slice(10)) ? '' : 'Z') : (o.date_completed_gmt ? o.date_completed_gmt + 'Z' : o.date_modified_gmt + 'Z');
  return dayKey(new Date(iso));
}
function addMonths(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, d));
  return t.toISOString().slice(0, 10);
}

const { data: cfgRow, error: cfgErr } = await db.from('crm_settings').select('value').eq('business_id', BIZ).eq('key', 'puntos_piloto').maybeSingle();
if (cfgErr || !cfgRow) { console.error('Falta crm_settings puntos_piloto (supabase/030_puntos.sql).'); process.exit(3); }
const cfg = JSON.parse(cfgRow.value);
const GEST = cfg.gestoras || {};
const skip = String(cfg.excluir_sku || 'MK-').toUpperCase();

// Teléfonos que no son clientes: equipo, gestoras, mensajeros y Ernesto.
const { data: team } = await db.from('crm_contacts').select('phone,role').eq('business_id', BIZ).in('role', ['gestora', 'dependienta', 'admin', 'mensajero']);
const teamPhones = new Set((team || []).map((c) => p8(c.phone)).filter(Boolean));
teamPhones.add('54056173');

// Pedidos desde el inicio del piloto (día de Cuba → UTC, con margen de 6 h).
const after = new Date(`${cfg.desde}T00:00:00Z`).getTime() - 6 * 3600e3;
const orders = [];
for (let page = 1; page < 30; page++) {
  const list = await woo(`orders?per_page=100&page=${page}&dates_are_gmt=true&after=${encodeURIComponent(new Date(after).toISOString().slice(0, 19))}&orderby=date&order=asc`);
  orders.push(...list);
  if (list.length < 100) break;
}

const { data: prev } = await db.from('crm_puntos').select('pedido,tipo,puntos').eq('business_id', BIZ).in('tipo', ['gana', 'ajuste']);
const ganados = new Map((prev || []).filter((r) => r.tipo === 'gana').map((r) => [r.pedido, r.puntos]));
const ajustados = new Set((prev || []).filter((r) => r.tipo === 'ajuste' && r.pedido).map((r) => r.pedido));

const nuevos = [], ajustes = [], saltados = {}, conflictos = [];
const salta = (why) => { saltados[why] = (saltados[why] || 0) + 1; };
for (const o of orders) {
  const created = dayKey(new Date(o.date_created_gmt + 'Z'));
  if (created < cfg.desde) { salta('antes del piloto'); continue; }
  const phone = p8(o.billing?.phone);
  const yaTiene = ganados.has(o.id);
  const anulado = ['cancelled', 'refunded', 'failed', 'trash'].includes(o.status) || Boolean(meta(o, '_cvd_test_order'));
  if (yaTiene && anulado && !ajustados.has(o.id)) {
    ajustes.push({ business_id: BIZ, cliente_tel: phone, cliente_nombre: [o.billing?.first_name, o.billing?.last_name].filter(Boolean).join(' ') || null,
      tipo: 'ajuste', puntos: -ganados.get(o.id), pedido: o.id, fecha: dayKey(new Date()), nota: `pedido #${o.id} ${o.status} después de dar puntos`, creado_por: 'script' });
    continue;
  }
  if (yaTiene) { salta('ya apuntado'); continue; }
  if (meta(o, '_cvd_test_order')) { salta('prueba'); continue; }
  if (!delivered(o)) { salta(anulado ? 'cancelado' : 'sin entregar'); continue; }
  if (!phone || phone.length < 8) { salta('sin teléfono'); continue; }
  if (teamPhones.has(phone)) { salta('equipo o gestora'); continue; }
  let gid = String(meta(o, '_cvd_owner_user_id') || '0');
  if (!GEST[gid]) {
    // Regla D97: si el pedido entró sin gestora (o con otra), manda la dueña del cliente en Core.
    const owner = await clientOwner(phone);
    if (!owner || !GEST[owner]) { salta('no es del piloto'); continue; }
    // El cliente es de una gestora del piloto pero el pedido se apuntó a otra persona o a nadie: aviso (D97).
    conflictos.push(`#${o.id} …${phone.slice(-4)}: cliente de ${GEST[owner]} y el pedido está a nombre de ${meta(o, 'gestora_nombre') || 'nadie (venta directa)'}`);
    gid = owner;
  }
  let base = 0;
  for (const l of o.line_items || []) if (!String(l.sku || '').toUpperCase().startsWith(skip)) base += Number(l.total) || 0;
  const devuelto = (o.refunds || []).reduce((s, r) => s + Math.abs(Number(r.total) || 0), 0);
  base = Math.max(0, base - devuelto);
  const puntos = Math.floor(base / (Number(cfg.usd_por_punto) || 1));
  if (puntos <= 0) { salta('0 USD de Casa Viva'); continue; }
  const fecha = deliveredDay(o);
  nuevos.push({ business_id: BIZ, cliente_tel: phone, cliente_nombre: [o.billing?.first_name, o.billing?.last_name].filter(Boolean).join(' ') || null,
    gestora_user_id: Number(gid), gestora_nombre: GEST[gid], tipo: 'gana', puntos, pedido: o.id, usd_base: Math.round(base * 100) / 100,
    fecha, caduca_el: addMonths(fecha, Number(cfg.meses) || 6), nota: devuelto ? `devuelto ${devuelto.toFixed(2)} USD` : null, creado_por: 'script' });
}

log(`Puntos de clientes (piloto desde ${cfg.desde}): ${orders.length} pedidos mirados · ${nuevos.length} nuevos con puntos · ${ajustes.length} ajustes${HACER ? '' : ' · (vista previa: usa --hacer para guardar)'}`);
for (const r of nuevos) log(`  + #${r.pedido} ${r.cliente_nombre || ''} …${r.cliente_tel.slice(-4)} (${r.gestora_nombre}) ${r.usd_base} USD → ${r.puntos} pts, caduca ${r.caduca_el}`);
for (const r of ajustes) log(`  − #${r.pedido} …${r.cliente_tel.slice(-4)} ${r.puntos} pts (${r.nota})`);
if (Object.keys(saltados).length) log('  Sin puntos: ' + Object.entries(saltados).map(([k, v]) => `${k} ${v}`).join(' · '));
// Los conflictos de la regla D97 salen siempre (también con --silencio): son comisión que quizá no se reservó.
for (const c of conflictos) console.log('  ⚠ D97 ' + c + ' (revisar la comisión con Ernesto; el script no la toca)');
if (HACER && (nuevos.length || ajustes.length)) {
  const { error } = await db.from('crm_puntos').insert([...nuevos, ...ajustes]);
  if (error) { console.error('Error al guardar: ' + error.message); process.exit(3); }
  log('Guardado.');
}
process.exit(0);
