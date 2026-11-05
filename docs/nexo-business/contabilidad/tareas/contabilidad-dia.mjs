#!/usr/bin/env node
// Cierre contable diario de Casa Viva (Ernesto 4-nov-2026, D135). Cron en el VPS a las 21:30 (Cuba):
//   30 21 * * * cd /root/vivabot && /usr/bin/node /root/supervisor/tareas/contabilidad-dia.mjs >> /root/supervisor/logs/contabilidad-dia.log 2>&1
// 4-nov: va a Ernesto y a Lennys. Pide a la web (Core 3.14.125, /bot/contabilidad) los pedidos completados hoy y en el mes hasta hoy, con la tienda y
// bajo pedido por separado, resta la parte del día de gastos fijos e IA (/root/supervisor/contabilidad.json) y le manda
// a Ernesto por privado 5–6 líneas. Copia en el repo: docs/nexo-business/contabilidad/tareas/contabilidad-dia.mjs
// Prueba sin enviar: node contabilidad-dia.mjs --prueba   ·   Otro día: --dia 2026-11-03
// Parar: crm_settings contabilidad_dia=no
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BIZ = process.env.BUSINESS_ID || '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const OWNER = (process.env.OWNER_PHONE || '5354056173').replace(/\D/g, '');
const BASE = String(process.env.WOO_URL || '').replace(/\/$/, '');
const KEY = process.env.CURRU_KEY;
const CONF = '/root/supervisor/contabilidad.json';
const PRUEBA = process.argv.includes('--prueba');
const i = process.argv.indexOf('--dia');
const dia = i > 0 ? process.argv[i + 1] : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Havana' }).format(new Date());
const log = (...a) => console.log(new Date().toISOString(), ...a);

if (!PRUEBA) {
  const { data: s } = await db.from('crm_settings').select('value').eq('business_id', BIZ).eq('key', 'contabilidad_dia').maybeSingle();
  if (String(s?.value ?? '').toLowerCase() === 'no') { log(dia, 'apagado (crm_settings contabilidad_dia=no)'); process.exit(0); }
}
if (!BASE || !KEY) { console.error('falta WOO_URL o CURRU_KEY en .env'); process.exit(1); }

// Gastos del mes que no salen de los pedidos: { "fijos_usd_mes": 618.36, "ia_usd_mes": 270 } (D135). Sin archivo: 0 y se avisa.
let conf = { fijos_usd_mes: 0, ia_usd_mes: 0 };
try { conf = { ...conf, ...JSON.parse(fs.readFileSync(CONF, 'utf8')) }; } catch { log('sin', CONF, ': gastos fijos e IA en 0'); }

async function pedir(desde, hasta) {
  const r = await fetch(`${BASE}/wp-json/casa-viva/v1/bot/contabilidad?desde=${desde}&hasta=${hasta}`, { headers: { 'X-VivaBot-Key': KEY }, signal: AbortSignal.timeout(90000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(`web ${r.status} ${j.error || j.message || ''}`.trim());
  return j;
}

const [y, m, d] = dia.split('-').map(Number);
const diasMes = new Date(Date.UTC(y, m, 0)).getUTCDate();
const inicioMes = `${dia.slice(0, 8)}01`;
// Gastos del mes: los de la web (Core 3.14.127, gastos_mes); contabilidad.json solo si la web no los da.
let gastoDia = (Number(conf.fijos_usd_mes) + Number(conf.ia_usd_mes)) / diasMes;
const usd = (x) => String(Math.round(Number(x) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const usd1 = (x) => (Math.round((Number(x) || 0) * 10) / 10).toLocaleString('es-ES');

let hoy, mes;
try { [hoy, mes] = await Promise.all([pedir(dia, dia), pedir(inicioMes, dia)]); }
catch (e) { console.error(dia, 'no pude leer la web:', e.message); process.exit(1); }
if (mes.gastos_mes) gastoDia = (Number(mes.gastos_mes.fijos) + Number(mes.gastos_mes.ia)) / diasMes;

const queda = (r, dias) => r.tienda.margen - gastoDia * dias;
const lineas = [`📊 *Cierre del ${d}/${m}*`];
if (!hoy.pedidos) lineas.push('• Hoy no se completó ningún pedido.');
else {
  lineas.push(`• Tienda: ${hoy.tienda.pedidos} pedidos · vendió ${usd(hoy.tienda.ventas)} USD · queda ≈ ${usd(queda(hoy, 1))} USD`);
  if (hoy.bajo_pedido.pedidos) lineas.push(`• Bajo pedido: ${hoy.bajo_pedido.pedidos} · ${usd(hoy.bajo_pedido.ventas)} USD · margen ${usd1(hoy.bajo_pedido.margen)} USD`);
}
lineas.push(`• Mes hasta hoy: tienda ${usd(mes.tienda.ventas)} USD → queda ≈ ${usd(queda(mes, d))} USD${mes.bajo_pedido.pedidos ? ` · bajo pedido margen ${usd(mes.bajo_pedido.margen)} USD` : ''}`);
const sinCosto = mes.tienda.lineas_sin_costo + mes.bajo_pedido.lineas_sin_costo;
if (sinCosto) lineas.push(`• ⚠️ ${sinCosto} productos vendidos sin costo este mes (${usd(mes.tienda.ventas_sin_costo + mes.bajo_pedido.ventas_sin_costo)} USD): su ganancia sale inflada`);
lineas.push(`«Queda» = tras mercancía, comisiones, 0,5 % y 1,5 %, y ${usd1(gastoDia)} USD/día de fijos e IA.`);
const body = lineas.join('\n');
log(PRUEBA ? '[PRUEBA]' : '', '\n' + body);
if (PRUEBA) process.exit(0);
// 4-nov (Ernesto): el mismo resumen a Ernesto y a Lennys.
const LENNYS = '5356885368';
const { error } = await db.from('crm_outbox').insert([OWNER, LENNYS].map((to_phone) => ({ business_id: BIZ, to_phone, body, status: 'pendiente', kind: 'texto', created_by: 'contabilidad-dia' })));
if (error) { console.error('outbox', error.message); process.exit(1); }
log(dia, 'enviado al buzón');
