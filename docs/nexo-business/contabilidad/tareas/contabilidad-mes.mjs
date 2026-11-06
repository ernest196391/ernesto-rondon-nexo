#!/usr/bin/env node
// Cierre contable del mes de Casa Viva en PDF (Ernesto 4-nov-2026, D135). Cron en el VPS el día 1 a las 9:00 (Cuba):
//   0 9 1 * * cd /root/vivabot && /usr/bin/node /root/supervisor/tareas/contabilidad-mes.mjs >> /root/supervisor/logs/contabilidad-mes.log 2>&1
// Pide a la web (Core 3.14.126, /bot/contabilidad?detalle=1) los pedidos completados del mes, con la tienda y bajo pedido
// aparte, resta gastos fijos e IA (/root/supervisor/contabilidad.json), hace el PDF estilo Hormozi (entró / salió / quedó)
// con Chrome sin pantalla (/root/supervisor/pdf) y se lo manda a Ernesto por privado para que lo reenvíe a Lennys.
// Copia en el repo: docs/nexo-business/contabilidad/tareas/contabilidad-mes.mjs
// Datos de ese mes que no salen de la web (opcional): /root/supervisor/contabilidad-mes/AAAA-MM.json
//   { "ia_usd": 282.38, "fijos_usd": 618.36, "otras_ventas": [{ "fuente": "Caja", "ventas": 282 }], "notas": ["…"] }
// Prueba (hace el PDF y no lo manda): node contabilidad-mes.mjs --prueba [--mes 2026-10]   ·   Parar: crm_settings contabilidad_mes=no
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');
const puppeteer = createRequire('/root/supervisor/pdf/package.json')('puppeteer');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BIZ = process.env.BUSINESS_ID || '8771c6ed-9dbf-497d-b3df-be6697ba2693';
const OWNER = (process.env.OWNER_PHONE || '5354056173').replace(/\D/g, '');
const BASE = String(process.env.WOO_URL || '').replace(/\/$/, '');
const KEY = process.env.CURRU_KEY;
const PRUEBA = process.argv.includes('--prueba');
// 4-nov (Ernesto): día 1 = borrador (se corrige 2 días en el panel); día 3 = final con la lista de cambios. A Ernesto y a Lennys.
const FINAL = process.argv.includes('--final');
const LENNYS = '5356885368';
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const log = (...a) => console.log(new Date().toISOString(), ...a);
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Mes: --mes AAAA-MM o, por defecto, el mes pasado (en Cuba).
const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Havana' }).format(new Date());
let mes = arg('--mes');
if (!mes) { const [y, m] = hoy.split('-').map(Number); mes = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; }
if (!/^\d{4}-\d{2}$/.test(mes)) { console.error('mes no válido:', mes); process.exit(1); }
const [Y, M] = mes.split('-').map(Number);
const diasMes = new Date(Date.UTC(Y, M, 0)).getUTCDate();
const nombreMes = MESES[M - 1];

if (!PRUEBA) {
  const { data: s } = await db.from('crm_settings').select('value').eq('business_id', BIZ).eq('key', 'contabilidad_mes').maybeSingle();
  if (String(s?.value ?? '').toLowerCase() === 'no') { log(mes, 'apagado (crm_settings contabilidad_mes=no)'); process.exit(0); }
}
if (!BASE || !KEY) { console.error('falta WOO_URL o CURRU_KEY en .env'); process.exit(1); }

const leer = (f, def) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return def; } };
const conf = leer('/root/supervisor/contabilidad.json', {});
const extra = leer(`/root/supervisor/contabilidad-mes/${mes}.json`, {});

const otras = Array.isArray(extra.otras_ventas) ? extra.otras_ventas : [];

const r = await fetch(`${BASE}/wp-json/casa-viva/v1/bot/contabilidad?desde=${mes}-01&hasta=${mes}-${String(diasMes).padStart(2, '0')}&detalle=1`, { headers: { 'X-VivaBot-Key': KEY }, signal: AbortSignal.timeout(180000) });
const W = await r.json().catch(() => ({}));
if (!r.ok || !W.ok) { console.error(mes, 'no pude leer la web:', r.status, W.error || W.message || ''); process.exit(1); }
const T = W.tienda, B = W.bajo_pedido, pct = W.porcentajes;
// Gastos del mes: el .json del mes manda; si no, los de la web (Core 3.14.127); si no, contabilidad.json.
const fijos = Number(extra.fijos_usd ?? W.gastos_mes?.fijos ?? conf.fijos_usd_mes ?? 0);
const ia = Number(extra.ia_usd ?? W.gastos_mes?.ia ?? conf.ia_usd_mes ?? 0);
// 4-nov (Core 3.14.138): «Datos del mes» que apunta Lennys en el panel (impuestos, cambio, reparaciones, ELIO, inversores).
const DM = W.datos_mes?.valores ?? {};
const dv = (k) => (DM[k] == null || DM[k] === '' ? 0 : Number(DM[k]));
const HIST = (W.datos_mes?.historial ?? []).filter((h) => h.campo);

// ---------- cuentas ----------
const n = (x) => Number(x) || 0;
const otrasVentas = otras.reduce((s, o) => s + n(o.ventas), 0);
const rc = T.ventas ? T.costo / T.ventas : 0; // otras ventas sin costo: la proporción de la web
const otrasCosto = otras.reduce((s, o) => s + (o.costo != null ? n(o.costo) : n(o.ventas) * rc), 0);
const otrasCom = otras.reduce((s, o) => s + n(o.comision), 0);
// Ingresos de bajo pedido = total de sus líneas en los pedidos (como las ventas por día); proveedor y reparto, de cada pedido (D69).
const rep = (W.reparto_bajo_pedido || []).map((p) => ({ ...p, rate: n(p.rate) || 1 }));
const sumRep = (f) => rep.reduce((s, p) => s + f(p), 0);
const bp = rep.length ? {
  ingresos: B.ventas, proveedor: sumRep((p) => n(p.costUsd)), gestoras: sumRep((p) => n(p.gestoraUsd)),
  mensajeros: sumRep((p) => n(p.messengerCup) / p.rate), dependientas: sumRep((p) => n(p.clerkCup) / p.rate), tienda: sumRep((p) => n(p.storeCup) / p.rate),
} : { ingresos: B.ventas, proveedor: B.proveedor, gestoras: B.comision, mensajeros: 0, dependientas: 0, tienda: 0 };
bp.margen = bp.ingresos - bp.proveedor;
bp.ernesto = bp.margen - bp.gestoras - bp.mensajeros - bp.dependientas - bp.tienda;

const ventas = T.ventas + otrasVentas;
const base = T.base_porcentajes + otrasVentas;
const costo = T.costo + otrasCosto;
const com = T.comision + otrasCom;
const dep = base * n(pct.dependientas) / 100, ern = base * n(pct.ernesto) / 100;
const queda = ventas - costo - com - dep - ern - fijos - ia + bp.tienda - dv('impuestos_usd') - dv('fluctuacion_usd') - dv('reparaciones_usd') - dv('otros_gastos_usd') + dv('elio_usd');
const invPct = dv('inversores_pct');
const inv = queda > 0 ? queda * invPct / 100 : 0;
const cuenta = [
  ['Ventas de la tienda', ventas, otras.length ? 'Web (sin bajo pedido) y ' + otras.map((o) => o.fuente).join(', ') : 'Pedidos de la web completados (sin bajo pedido)'],
  ['Mercancía', -costo, 'Costo guardado en cada venta'],
  ['Comisiones de gestoras', -com, 'Las del mes, pagadas o no'],
  [`Dependientas (${String(pct.dependientas).replace('.', ',')} %)`, -dep, `Sobre ${fm0(base)} USD (sin la subida de las gestoras)`],
  [`Ernesto (${String(pct.ernesto).replace('.', ',')} %)`, -ern, 'Sobre la misma base'],
  ['Gastos fijos', -fijos, 'Renta, luz, teléfono, salarios y demás'],
  ['IA y herramientas', -ia, 'Bot, Claude, Higgsfield, servidor y dominio'],
  ['Lo que deja bajo pedido a la tienda', bp.tienda, 'Parte «tienda» del reparto de cada pedido MK-'],
  ...[['Impuestos', -dv('impuestos_usd')], ['Fluctuación del cambio', -dv('fluctuacion_usd')], ['Reparaciones', -dv('reparaciones_usd')], ['Otros gastos', -dv('otros_gastos_usd')], ['Parte de ELIO para Casa Viva', dv('elio_usd')]].filter((r) => r[1]).map((r) => [...r, 'Datos del mes (panel)']),
  ['Ganancia de Casa Viva', queda, 'Lo que queda'],
  ...(inv ? [[`Para inversores (${String(invPct).replace('.', ',')} %)`, -inv, 'Datos del mes (panel)'], ['Queda para Casa Viva', queda - inv, 'Después de inversores']] : []),
];
const cbp = [
  ['Ingresos', bp.ingresos, 'Lo que pagaron los clientes'], ['Pagado a proveedores', -bp.proveedor, 'Precio real del proveedor'],
  ['Margen', bp.margen, 'Ingresos menos proveedores'], ['Gestoras', -bp.gestoras, 'Comisión de cada pedido'],
  ['Mensajeros', -bp.mensajeros, 'Por traer el producto'], ['Dependientas', -bp.dependientas, 'Por recibirlo y revisarlo'],
  ['Tienda Casa Viva', -bp.tienda, 'Pasa a la cuenta de la tienda'], ['Ernesto (gestor especial)', bp.ernesto, 'Lo que queda del margen'],
];

// ---------- formato ----------
function fm(x, d = 2) { const v = Math.abs(n(x)).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); return (n(x) < 0 ? '−' : '') + v; }
function fm0(x) { return fm(x, 0); }
const e = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const table = (head, rows, nums, totals = []) => `<table><tr>${head.map((h, i) => `<th class="${nums.includes(i) ? 'r' : ''}">${e(h)}</th>`).join('')}</tr>${rows.map((row) => `<tr${totals.includes(row[0]) ? ' class="t"' : ''}>${row.map((c, i) => `<td class="${nums.includes(i) ? 'r' : ''}${nums.includes(i) && typeof c === 'number' && c < 0 ? ' neg' : ''}">${e(typeof c === 'number' ? fm(c) : c)}</td>`).join('')}</tr>`).join('')}</table>`;
const cada = cuenta.filter(([p]) => !['Ventas de la tienda', 'Lo que deja bajo pedido a la tienda'].includes(p)).map(([p, v]) => [p === 'Ganancia de Casa Viva' ? 'Queda para Casa Viva' : p, ventas ? Math.abs(v) / ventas * 100 : 0]);
const mx = Math.max(1, ...cada.map(([, v]) => v));
const bars = cada.map(([p, v]) => `<div class="bar"><span class="bl">${e(p)}</span><span class="bt"><i style="width:${(v / mx * 100).toFixed(1)}%" class="${p === 'Queda para Casa Viva' ? 'ok' : ''}"></i></span><span class="bv">${fm(v)}</span></div>`).join('');
const dias = W.por_dia || [];
const dmx = Math.max(1, ...dias.map((d) => n(d.tienda) + n(d.bajo_pedido)));
const diasHtml = `<div class="days">${dias.map((d) => `<div class="day" title="${e(d.dia)}"><span class="col"><i class="bp" style="height:${(n(d.bajo_pedido) / dmx * 100).toFixed(1)}%"></i><i style="height:${(n(d.tienda) / dmx * 100).toFixed(1)}%"></i></span><span class="dl">${Number(String(d.dia).slice(8))}</span></div>`).join('')}</div>`;
const C = W.comisiones || { tienda: {}, bajo_pedido: {} };
const sinCosto = T.lineas_sin_costo + B.lineas_sin_costo;
const notas = [
  ...(sinCosto ? [`${sinCosto} productos se vendieron sin costo (${fm0(T.ventas_sin_costo + B.ventas_sin_costo)} USD): su ganancia sale inflada. Ponles costo en el panel.`] : []),
  ...(T.lineas_costo_de_hoy + B.lineas_costo_de_hoy ? [`${T.lineas_costo_de_hoy + B.lineas_costo_de_hoy} productos usan el costo de hoy porque se vendieron antes de que la web guardara el costo de cada venta.`] : []),
  ...(rep.some((p) => !p.saved) ? [`${rep.filter((p) => !p.saved).length} pedidos de bajo pedido tienen el reparto «sugerido»: nadie lo guardó a mano.`] : []),
  ...(otras.length ? [] : ['Las ventas y los gastos de la caja de la tienda todavía no entran en esta cuenta.']),
  ...(Array.isArray(extra.notas) ? extra.notas : []),
  ...(DM.nota ? [String(DM.nota)] : []),
];

const CSS = `@page{size:A4;margin:16mm 14mm}:root{--ink:#1d2321;--mut:#5d6b66;--line:#d9e1dd;--ok:#1f7a4d;--bad:#b3362c;--pan:#f4f7f5;--acc:#2f6f5e;--acc2:#c9a227}
body{font-family:"DejaVu Sans","Liberation Sans",Arial,sans-serif;color:var(--ink);font-size:10pt;margin:0}section{page-break-after:always}section:last-child{page-break-after:auto}
.eye{text-transform:uppercase;letter-spacing:.08em;color:var(--mut);font-size:8pt;margin:0 0 4pt}h1{font-family:"DejaVu Serif",Georgia,serif;font-weight:400;font-size:24pt;margin:0 0 6pt}
h2{font-family:"DejaVu Serif",Georgia,serif;font-weight:400;font-size:16pt;margin:12pt 0 6pt}p{line-height:1.5;margin:0 0 8pt}.three{display:flex;gap:8pt;margin:12pt 0}
.big{flex:1;background:var(--pan);border:1px solid var(--line);border-radius:6pt;padding:10pt}.big .k{color:var(--mut);font-size:8.5pt}.big .v{font-family:"DejaVu Serif",Georgia,serif;font-size:22pt;margin:4pt 0}
.big.out .v{color:var(--bad)}.big.keep{border-color:var(--ok)}.big.keep .v{color:var(--ok)}.big .n{color:var(--mut);font-size:8pt}
table{width:100%;border-collapse:collapse;margin:4pt 0 10pt;font-size:9pt}th,td{text-align:left;padding:3.5pt 5pt;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--mut);font-weight:600;font-size:8pt}.r{text-align:right;white-space:nowrap}tr.t td{font-weight:700}td.neg{color:var(--bad)}
.bar{display:flex;align-items:center;gap:6pt;margin:5pt 0}.bl{width:52mm;font-size:9pt}.bt{flex:1;background:var(--pan);height:11pt;border-radius:3pt}.bt i{display:block;height:100%;background:#9fb3ab;border-radius:3pt}.bt i.ok{background:var(--ok)}.bv{width:16mm;text-align:right}
.days{display:flex;align-items:flex-end;gap:2pt;height:46mm;margin:6pt 0 2pt}.day{flex:1;display:flex;flex-direction:column;align-items:center;height:100%}.col{flex:1;width:100%;display:flex;flex-direction:column-reverse}
.col i{display:block;width:100%;background:var(--acc)}.col i.bp{background:var(--acc2)}.dl{font-size:6.5pt;color:var(--mut);margin-top:2pt}.leg{font-size:8pt;color:var(--mut)}.sw{display:inline-block;width:8pt;height:8pt;margin:0 3pt 0 8pt;vertical-align:-1pt}
.foot{color:var(--mut);font-size:8pt}ul,ol{line-height:1.6;margin-top:0}`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${FINAL ? 'Cierre final' : 'Borrador del cierre'} de ${nombreMes} · Casa Viva</title><style>${CSS}</style></head><body>
<section><p class="eye">Casa Viva · cierre de ${nombreMes} de ${Y}</p><h1>${FINAL ? 'Cierre final' : 'Borrador del cierre'} de ${nombreMes}</h1>
<p>En ${nombreMes} la tienda vendió <b>${fm0(ventas)} USD</b> y le quedaron <b>${fm0(queda)} USD</b> limpios (${ventas ? fm(queda / ventas * 100, 1) : '0'} % de lo vendido). Bajo pedido va aparte: vendió <b>${fm0(bp.ingresos)} USD</b> y dejó <b>${fm0(bp.margen)} USD</b> de margen.</p>
<div class="three"><div class="big"><div class="k">Entró · ventas de la tienda</div><div class="v">${fm0(ventas)}</div><div class="n">USD · ${T.pedidos} pedidos de la web · sin bajo pedido</div></div>
<div class="big out"><div class="k">Salió · mercancía, comisiones y gastos</div><div class="v">${fm0(ventas - queda)}</div><div class="n">USD</div></div>
<div class="big keep"><div class="k">Quedó · ganancia de Casa Viva</div><div class="v">${fm0(queda)}</div><div class="n">USD</div></div></div>
<h2>Ventas por día</h2>${diasHtml}<p class="leg"><i class="sw" style="background:var(--acc)"></i>Tienda<i class="sw" style="background:var(--acc2)"></i>Bajo pedido · cuenta el día en que el pedido se entregó y se cobró</p>
<h2>De cada 100 USD que vendió la tienda</h2>${bars}</section>
<section><p class="eye">La cuenta</p><h2>La cuenta de la tienda</h2>${table(['Partida', 'USD', 'De dónde sale'], cuenta, [1], ['Ganancia de Casa Viva', 'Queda para Casa Viva'])}
<h2>Bajo pedido, aparte</h2>${table(['Partida', 'USD', 'De dónde sale'], cbp, [1], ['Margen', 'Ernesto (gestor especial)'])}
${rep.length ? table(['Pedido', 'Producto', 'Gestora', 'Venta', 'Proveedor', 'Gestora USD', 'Reparto'], rep.map((p) => [p.number, p.products, p.gestora, n(p.webUsd), n(p.costUsd), n(p.gestoraUsd), p.saved ? 'guardado' : 'sugerido']), [3, 4, 5]) : ''}</section>
<section><p class="eye">Personas y pagos</p><h2>Lo que le toca a cada uno</h2>${table(['Quién', 'USD', 'Por qué'], [['Gestoras', com + bp.gestoras, 'Tienda + bajo pedido'], ['Dependientas', dep + bp.dependientas, `${String(pct.dependientas).replace('.', ',')} % de la tienda + su parte de bajo pedido`], ['Ernesto', ern + bp.ernesto, `${String(pct.ernesto).replace('.', ',')} % de la tienda + lo que queda de bajo pedido`], ['Mensajeros (bajo pedido)', bp.mensajeros, 'Por traer productos de proveedores']], [1])}
<h2>Comisiones pagadas y por pagar</h2>${table(['Concepto', 'USD', 'Estado'], [['Comisiones de la tienda', n(C.tienda.pagado), 'Pagado'], ['Comisiones de la tienda', n(C.tienda.por_pagar), 'Por pagar'], ['Comisiones de bajo pedido', n(C.bajo_pedido.pagado), 'Pagado'], ['Comisiones de bajo pedido', n(C.bajo_pedido.por_pagar), 'Por pagar']], [1])}
<h2>Para revisar</h2><ul>${notas.map((x) => `<li>${e(x)}</li>`).join('') || '<li>Nada pendiente.</li>'}</ul>
${HIST.length ? `<h2>Cambios en los datos del mes</h2>${table(['Cuándo', 'Quién', 'Dato', 'Antes', 'Después'], HIST.map((h) => [String(h.at).slice(0, 16).replace('T', ' '), h.by, W.datos_mes.campos?.[h.campo] ?? h.campo, String(h.antes ?? '—'), String(h.despues ?? '—')]), [])}` : ''}
<p class="foot">Hecho solo el ${hoy} con los pedidos de la web casaviva.company y los gastos del mes apuntados en el servidor del bot. Cada número se puede comprobar en el panel → Pedidos.</p></section></body></html>`;

const dir = '/root/archivos/cierres';
fs.mkdirSync(dir, { recursive: true });
const pdf = `${dir}/cierre-${mes}-casa-viva-${FINAL ? 'final' : 'borrador'}.pdf`;
fs.writeFileSync(`${dir}/cierre-${mes}-casa-viva.html`, html);
const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
try { const page = await browser.newPage(); await page.setContent(html, { waitUntil: 'load' }); await page.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true }); }
finally { await browser.close(); }
const caption = [
  `📒 *${FINAL ? 'Cierre final' : 'Borrador del cierre'} de ${nombreMes}* (Casa Viva)`,
  `• Tienda: vendió ${fm0(ventas)} USD → ganancia ${fm0(queda)} USD${inv ? ` · para Casa Viva ${fm0(queda - inv)} tras inversores` : ''}`,
  `• Bajo pedido: ${fm0(bp.ingresos)} USD → margen ${fm0(bp.margen)} USD`,
  FINAL ? `Cambios en los datos del mes: ${HIST.length}. Este es el definitivo.` : 'Revísenlo en el panel → Resumen → Cierre → Mes. Si falta algo (impuestos, cambio, reparaciones, ELIO, inversores), apúntenlo en «Datos del mes» antes del día 3.',
].join('\n');
log(PRUEBA ? '[PRUEBA]' : '', pdf, '\n' + caption);
if (PRUEBA) process.exit(0);
const { error } = await db.from('crm_outbox').insert([OWNER, LENNYS].map((to_phone) => ({ business_id: BIZ, to_phone, body: caption, kind: 'archivo', file_path: pdf, status: 'pendiente', created_by: 'contabilidad-mes' })));
if (error) { console.error('outbox', error.message); process.exit(1); }
log(mes, 'PDF enviado al buzón');
