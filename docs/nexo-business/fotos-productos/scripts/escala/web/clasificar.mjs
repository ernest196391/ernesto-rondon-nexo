// Clasifica los artículos bloqueados por foto (solo lee; no escribe en Supabase)
import fs from 'fs';
import { filasDS, leer, P, PW, guardar } from './comun.mjs';
const filas = await filasDS();
const items = new Map(leer(P('items.json'), []).map((x) => [x.id, x]));
const bloq = filas.filter((r) => /"bloqueado"/.test(r.photos_quality || ''));
const est = {}; for (const r of filas) est[r.status] = (est[r.status] || 0) + 1;
const res = [];
for (const r of bloq) {
  const q = JSON.parse(r.photos_quality);
  const it = items.get(r.id) || {};
  const n = leer(P(r.id, 'norm.json')) || {};
  const fotos = leer(P(r.id, 'fotos.json'), []) || [];
  const ok = fotos.filter((f) => f.estado === 'ok').length;
  const ev = (n.evaluadas || []).slice().sort((a, b) => b.nota - a.nota);
  const fallosTop = ev.slice(0, 3).flatMap((e) => e.fallos || []);
  const anuncio = fallosTop.some((f) => /texto encima|collage|logo o marca/.test(f));
  const ambiente = fallosTop.some((f) => /fondo (escena|color|negro)|borrosa/.test(f));
  const mejor = ev[0]?.nota ?? null;
  let clase;
  if (q.bloqueado === 'falta foto buena') clase = 'A_marca_modelo';
  else if (q.rechazo_revision || q.rechazo) clase = 'R_rechazo_revision';
  else if (!ok || n.evaluadas?.length === 0) clase = 'C_sin_foto';
  else if (n.marca && !n.modelo) clase = 'B_solo_marca';
  else clase = 'B_generico_con_foto';
  res.push({ id: r.id, status: r.status, clase, bloqueado: q.bloqueado, rechazo: q.rechazo_revision || q.rechazo || null, nombre: it.nombre || r.title, sub: it.subcategoria, precio: r.my_price,
    prioridad: it.prioridad, marca: n.marca || null, modelo: n.modelo || null, es_generico: n.es_generico ?? null, fotos_total: fotos.length, fotos_ok: ok, mejor_nota: mejor,
    pista: anuncio ? 'anuncio (texto/collage/logo)' : ambiente ? 'ambiente o casera' : mejor != null && mejor < 5 ? 'nota baja' : 'otra', fallos_top: [...new Set(fallosTop)].slice(0, 6), web_probada: fs.existsSync(P(r.id, 'web/fuentes.json')) });
}
const cuenta = {}; for (const x of res) { const k = x.clase; cuenta[k] = cuenta[k] || { total: 0, pistas: {} }; cuenta[k].total++; cuenta[k].pistas[x.pista] = (cuenta[k].pistas[x.pista] || 0) + 1; }
guardar(PW + '/clasificacion.json', { fecha: new Date().toISOString(), estados: est, bloqueados: bloq.length, cuenta, items: res });
console.log(JSON.stringify({ estados: est, bloqueados: bloq.length, cuenta }, null, 1));
const r0 = bloq.find((r) => /rechazo/.test(r.photos_quality)); if (r0) console.log('ejemplo rechazo:', r0.id, r0.photos_quality.slice(0, 400));
