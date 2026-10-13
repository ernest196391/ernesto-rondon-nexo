// Foto con IA (OpenAI, la clave del bot) cuando no hay foto real: cambiar el color de un producto, poner fondo blanco…
// NO publica nada: deja la foto en un archivo para revisarla. La foto generada es «de referencia»: el tono puede no ser exacto.
//
// En el VPS:
//   cd /root/vivabot && node scripts/fotos-bolsa/foto-ia.mjs --entrada /ruta/foto.jpg \
//     --pedido "el mismo edredón pero de color blanco liso" --salida /root/archivos/fotos-ia/edredon-blanco.jpg
//   Opciones: --modelo gpt-image-1-mini (por defecto, el más barato) · --calidad low|medium|high (por defecto low)
//             --tope 1 (USD de esta sesión; para si se pasa) · --mirar (solo dice qué haría, sin gastar)
// Registro de gasto: /root/archivos/fotos-ia/uso.jsonl
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const opt = (k, d = '') => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const entrada = opt('entrada'), pedido = opt('pedido'), salida = opt('salida');
const modelo = opt('modelo', 'gpt-image-1-mini'), calidad = opt('calidad', 'low');
const tope = Number(opt('tope', '1'));
const LOG = '/root/archivos/fotos-ia/uso.jsonl';

if (!entrada || !pedido || !salida) {
  console.log('Uso: --entrada <foto> --pedido "<qué cambiar>" --salida <foto.jpg> [--modelo …] [--calidad low|medium|high] [--tope 1] [--mirar]');
  process.exit(1);
}
if (!fs.existsSync(entrada)) { console.log('No existe la foto de entrada:', entrada); process.exit(1); }
if (!process.env.OPENAI_API_KEY) { console.log('Falta OPENAI_API_KEY en el .env'); process.exit(1); }

// Gasto ya hecho hoy con esta herramienta (para no pasarse del tope sin querer)
const hoy = new Date().toISOString().slice(0, 10);
const gastadoHoy = fs.existsSync(LOG)
  ? fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.at.startsWith(hoy)).reduce((s, r) => s + (r.usd || 0), 0)
  : 0;
if (gastadoHoy >= tope) { console.log(`Tope alcanzado: hoy ya se gastaron ${gastadoHoy.toFixed(3)} USD (tope ${tope}).`); process.exit(1); }

// Siempre las mismas reglas: mismo producto, sin inventar piezas, fondo blanco y sin texto
const prompt = `${pedido}. Es una foto de producto para una tienda online: conserva exactamente la misma forma, tamaño, materiales, costuras y detalles del producto; no añadas ni quites piezas ni accesorios. Fondo blanco puro y liso, luz de estudio suave, producto entero y centrado, sin texto, sin logos, sin marcas de agua y sin personas.`;

if (args.includes('--mirar')) { console.log({ modelo, calidad, entrada, salida, prompt, gastadoHoy }); process.exit(0); }

const img = await sharp(entrada).resize(1024, 1024, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
const form = new FormData();
form.append('model', modelo);
form.append('prompt', prompt);
form.append('quality', calidad);
form.append('size', '1024x1024');
if (opt('fidelidad')) form.append('input_fidelity', opt('fidelidad')); // high = respeta más la forma del producto (cuesta algo más)
form.append('image', new Blob([img], { type: 'image/png' }), 'entrada.png');

const res = await fetch('https://api.openai.com/v1/images/edits', {
  method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form, signal: AbortSignal.timeout(180e3),
});
const d = await res.json().catch(() => ({}));
if (!res.ok || !d.data?.[0]?.b64_json) { console.log('OpenAI no devolvió la foto:', res.status, d.error?.message || ''); process.exit(1); }

fs.mkdirSync(path.dirname(salida), { recursive: true });
await sharp(Buffer.from(d.data[0].b64_json, 'base64')).flatten({ background: '#ffffff' }).resize(1200, 1200, { fit: 'contain', background: '#ffffff' }).jpeg({ quality: 88 }).toFile(salida);

// Coste aproximado con los tokens que devuelve OpenAI (si no los da, se apunta 0 y se avisa)
const u = d.usage || {};
const PRECIO = { 'gpt-image-1-mini': { in: 2.5e-6, inImg: 2.5e-6, out: 8e-6 }, 'gpt-image-1': { in: 5e-6, inImg: 10e-6, out: 40e-6 } }[modelo];
const usd = PRECIO && u.input_tokens != null
  ? (u.input_tokens_details?.text_tokens || 0) * PRECIO.in + (u.input_tokens_details?.image_tokens || 0) * PRECIO.inImg + (u.output_tokens || 0) * PRECIO.out
  : 0;
fs.mkdirSync(path.dirname(LOG), { recursive: true });
fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), modelo, calidad, entrada, salida, usd: Math.round(usd * 1e4) / 1e4, usage: u }) + '\n');
console.log(`Foto lista: ${salida} · ${modelo} ${calidad} · ≈ ${usd ? usd.toFixed(4) + ' USD' : 'coste no informado'} (hoy ≈ ${(gastadoHoy + usd).toFixed(3)} USD)`);
