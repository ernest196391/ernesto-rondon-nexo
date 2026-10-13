// Segunda opinión para las fotos de INTERNET que pasaron «auditar --web» + «normalizar»:
// compara cada foto final con la foto del proveedor (las dos en alta resolución) y exige diferencias concretas.
// Uso: node verificar.mjs --ids 577,542 [--modelo gpt-4.1-mini] [--marcar]
//   --marcar: las fotos «mal» se marcan en <id>/web/fuentes.json como estado «rechazada» (copia en fuentes-antes-verificar.json),
//             para repetir «auditar --web --otra» + «normalizar --otra» sin ellas.
import fs from 'fs';
import path from 'path';
import { sharp, leer, guardar, P, PW, tapar } from './comun.mjs';
import { gastoPiloto, TOPE } from './gasto.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const MODELO = opt('modelo', 'gpt-4.1-mini');
const IDS = String(opt('ids', '')).split(',').map(Number).filter(Boolean);
const MARCAR = args.includes('--marcar');
const PRECIO = { 'gpt-4.1-mini': { in: 0.40, cached: 0.10, out: 1.60 }, 'gpt-6-luna': { in: 0.10, cached: 0.01, out: 0.50 }, 'gpt-6-sol': { in: 2.0, cached: 0.2, out: 10.0 }, 'gpt-5.6-luna': { in: 0.20, cached: 0.02, out: 1.20 } };
const items = new Map(leer(P('items.json'), []).map((x) => [x.id, x]));

const SISTEMA = `Eres el control de calidad de fotos de producto de una tienda online. La foto REFERENCIA es del proveedor: es lo que de verdad se vende.
Las fotos CANDIDATAS (numeradas desde 1) vienen de internet. Para cada candidata compara con la referencia, con mucho cuidado:
- forma, número de piezas (aspas, patas, botones, puertos, cámaras, mandos), posición de puertos y botones, tipo de enchufe, base, rejilla, pantalla;
- color de cada parte.
- texto_o_logo_anadido: copia cualquier texto, logo, marca de agua, sello o rótulo que esté FUERA del producto o pegado encima de la foto. El nombre o logo impreso en el propio producto NO cuenta. Si no hay, "".
- objetos_de_mas: nombra todo lo que se ve y NO es el producto ni lo que la descripción dice que viene: caja, embalaje, televisor, móvil, mano, persona, otros productos. Si no hay, "".
- solo_caja: true si la foto enseña la caja o el embalaje en vez del producto.
- diferencias: lista corta de diferencias visibles con la referencia ("" si no ves ninguna).
mismo_modelo = "si" solo si no hay ninguna diferencia de diseño; "no" si hay alguna; "dudoso" si no se puede saber.
Responde solo con el JSON pedido, en español sencillo.`;
const ESQUEMA = { type: 'json_schema', name: 'verificacion', strict: true, schema: { type: 'object', additionalProperties: false, required: ['candidatas'], properties: { candidatas: { type: 'array', items: { type: 'object', additionalProperties: false,
  required: ['n', 'diferencias', 'mismo_modelo', 'mismo_color', 'texto_o_logo_anadido', 'objetos_de_mas', 'solo_caja', 'motivo'],
  properties: { n: { type: 'integer' }, diferencias: { type: 'string' }, mismo_modelo: { type: 'string', enum: ['si', 'no', 'dudoso'] }, mismo_color: { type: 'string', enum: ['si', 'no', 'dudoso'] },
    texto_o_logo_anadido: { type: 'string' }, objetos_de_mas: { type: 'string' }, solo_caja: { type: 'boolean' }, motivo: { type: 'string' } } } } } } };

const b64 = async (f) => (await sharp(f).rotate().flatten({ background: '#ffffff' }).resize(768, 768, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer()).toString('base64');
const veredicto = (c) => c.mismo_modelo === 'si' && c.mismo_color === 'si' && !c.texto_o_logo_anadido.trim() && !c.objetos_de_mas.trim() && !c.solo_caja ? 'ok' : 'mal';

const salida = {};
for (const id of IDS) {
  const n = leer(P(id, 'norm.json'));
  if (!n || n.estado !== 'listo' || n.fuente !== 'web') { salida[id] = { saltado: n?.estado || 'sin norm' }; continue; }
  if (gastoPiloto().total_usd >= TOPE - 0.15) { salida[id] = { error: 'tope' }; break; }
  const viejo = leer(P(id, 'norm-1012.json')) || n;
  // referencia: la mejor foto del proveedor; si ninguna se evaluó (pequeñas o repetidas), la primera que haya en orig/
  const ref = (viejo.evaluadas || []).filter((e) => e.archivo && fs.existsSync(P(id, e.archivo))).sort((a, b) => b.nota - a.nota)[0]
    || (leer(P(id, 'fotos.json'), []) || []).filter((f) => f.archivo && fs.existsSync(P(id, f.archivo))).map((f) => ({ archivo: f.archivo }))[0];
  if (!ref) { salida[id] = { error: 'sin foto del proveedor para comparar' }; continue; }
  const it = items.get(id) || {};
  const content = [{ type: 'input_text', text: `PRODUCTO: ${it.nombre}\nDESCRIPCIÓN: ${String(it.descripcion || '').slice(0, 500)}\nREFERENCIA (proveedor):` },
    { type: 'input_image', image_url: `data:image/jpeg;base64,${await b64(P(id, ref.archivo))}`, detail: 'high' }, { type: 'input_text', text: `CANDIDATAS: ${n.fotos.length}` }];
  for (const [k, f] of n.fotos.entries()) content.push({ type: 'input_text', text: `Candidata ${k + 1}:` }, { type: 'input_image', image_url: `data:image/jpeg;base64,${await b64(f.salida)}`, detail: 'high' });
  const body = { model: MODELO, input: [{ role: 'system', content: SISTEMA }, { role: 'user', content }], text: { format: ESQUEMA }, max_output_tokens: 2500 };
  if (/^gpt-[56]/.test(MODELO)) body.reasoning = { effort: 'low' }; else body.temperature = 0;
  const res = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(200e3) });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { salida[id] = { error: tapar(d?.error?.message || String(res.status)).slice(0, 300) }; continue; }
  const u = d.usage || {}; const pr = PRECIO[MODELO]; const cached = u.input_tokens_details?.cached_tokens || 0;
  const usd = ((u.input_tokens - cached) * pr.in + cached * pr.cached + u.output_tokens * pr.out) / 1e6;
  fs.appendFileSync(PW + '/uso-piloto.jsonl', JSON.stringify({ t: new Date().toISOString(), id, tipo: 'verificar', modelo: MODELO, in: u.input_tokens, cached, out: u.output_tokens, llamadas_web: 0, usd: +usd.toFixed(5) }) + '\n');
  const msg = (d.output || []).find((o) => o.type === 'message');
  const r = JSON.parse(msg.content.find((c) => c.type === 'output_text').text);
  const cand = r.candidatas.map((c) => ({ ...c, archivo: n.fotos[c.n - 1]?.archivo, pagina: n.fotos[c.n - 1]?.pagina, veredicto: veredicto(c) }));
  const v = { modelo: MODELO, fecha: new Date().toISOString(), referencia: ref.archivo, principal: cand.find((c) => c.n === 1)?.veredicto || 'mal', candidatas: cand, usd: +usd.toFixed(5) };
  const previos = leer(P(id, 'verificacion.json'), {}) || {};
  previos[MODELO] = v;
  guardar(P(id, 'verificacion.json'), previos);
  if (MARCAR) {
    const fu = P(id, 'web', 'fuentes.json');
    if (!fs.existsSync(P(id, 'web', 'fuentes-antes-verificar.json'))) fs.copyFileSync(fu, P(id, 'web', 'fuentes-antes-verificar.json'));
    const lista = leer(fu, []);
    for (const c of cand) if (c.veredicto === 'mal') { const f = lista.find((x) => x.archivo === c.archivo); if (f) { f.estado = 'rechazada'; f.motivo = 'verificación: ' + [c.diferencias, c.texto_o_logo_anadido && 'texto/logo: ' + c.texto_o_logo_anadido, c.objetos_de_mas && 'de más: ' + c.objetos_de_mas, c.solo_caja && 'solo la caja'].filter(Boolean).join(' · ').slice(0, 200); } }
    guardar(fu, lista);
  }
  salida[id] = { principal: v.principal, fotos: cand.map((c) => `${c.n}:${c.veredicto} ${c.mismo_modelo}/${c.mismo_color} ${(c.diferencias + ' ' + c.texto_o_logo_anadido + ' ' + c.objetos_de_mas + (c.solo_caja ? ' CAJA' : '')).trim().slice(0, 140)}`), usd: v.usd };
  console.log(id, JSON.stringify(salida[id]));
}
console.log(JSON.stringify(gastoPiloto()));
