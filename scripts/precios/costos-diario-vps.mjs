// Costos y precio mínimo, cada mañana a las 8:50 (Ernesto, 14-oct; Core 3.14.0).
// 1) Copia a la web el precio del proveedor (crm_market_items.supplier_price) de lo publicado bajo pedido → _cvd_cost_usd (origen proveedor).
// 2) Pide a Core cuántos productos publicados están bajo el mínimo y cuántos sin costo.
// 3) Deja la línea en /root/supervisor/costos-hoy.txt: el supervisor la pone en el resumen de las 9:00 a Ernesto (check.mjs la pasa en el motivo).
// No escribe a nadie por WhatsApp. Uso: node /root/supervisor/tareas/costos-diario.mjs [--sin-sync]
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env' });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const WEB = (process.env.WOO_URL || '').replace(/\/$/, '');
const KEY = process.env.CURRU_KEY || '';
const OUT = '/root/supervisor/costos-hoy.txt';

async function web(method, path, body) {
  const res = await fetch(`${WEB}/wp-json/casa-viva/v1${path}${path.includes('?') ? '&' : '?'}_=${Date.now()}`, {
    method, headers: { 'x-vivabot-key': KEY, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || d.ok === false) throw new Error(d.error || d.message || `HTTP ${res.status} en ${path}`);
  return d;
}

const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Havana' });
try {
  let sync = '';
  if (!process.argv.includes('--sin-sync')) {
    let items = [];
    for (let f = 0; ; f += 1000) {
      const { data, error } = await db.from('crm_market_items').select('id,supplier_price,currency').eq('status', 'publicado').range(f, f + 999);
      if (error) throw new Error(error.message);
      items = items.concat(data);
      if (data.length < 1000) break;
    }
    const list = items.filter((i) => i.currency === 'USD' && Number(i.supplier_price) > 0).map((i) => ({ item_id: i.id, cost: Number(i.supplier_price), source: 'proveedor' }));
    const r = await web('POST', '/bot/costs', { items: list });
    sync = `proveedor: ${r.changed} cambiados, ${r.same} iguales, ${r.missing.length} no encontrados`;
  }
  const s = await web('GET', '/bot/costs/summary');
  // Core 3.14.5: la línea la arma Core (pierden / con costo provisional / sin costo / comisiones fuera de la regla).
  const line = s.line ? `💰 Precios: ${s.line}` : `💰 Precios: ${s.counts.bajo} productos bajo el mínimo · ${s.counts.sin_costo} sin costo`;
  writeFileSync(OUT, `${hoy}\n${line}\n`);
  console.log(new Date().toISOString(), line, sync ? `· ${sync}` : '');
} catch (e) {
  writeFileSync(OUT, `${hoy}\n💰 Precios: no se pudo calcular hoy (${e.message})\n`);
  console.error(new Date().toISOString(), 'ERROR', e.message);
  process.exit(1);
}
