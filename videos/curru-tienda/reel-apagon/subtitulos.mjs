// Subtítulos ASS (1080×1920) desde las palabras con tiempo de Whisper. Uso:
//   node subtitulos.mjs salida.ass "Gancho de los primeros segundos" escena1.json:0 escena2.json:15.07 ...
// Cada JSON es la respuesta verbose_json de Whisper (Groq) con words[]; el número es el desplazamiento en segundos.
import fs from 'fs';

const [out, hook, ...parts] = process.argv.slice(2);
const t = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = (s % 60).toFixed(2).padStart(5, '0'); return `${h}:${String(m).padStart(2, '0')}:${sec}`; };
const words = [];
for (const p of parts) {
  const [file, off] = p.split(':');
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const w of d.words || []) words.push({ text: String(w.word).trim(), start: w.start + Number(off || 0), end: w.end + Number(off || 0) });
}
// Frase a frase (hasta . ! ? …). Una frase de más de 7 palabras se parte por la coma más cercana al medio
// o, si no hay, a la mitad: nunca «otra vez se / fue la corriente».
const sentences = [];
let cur = [];
for (const w of words) {
  cur.push(w);
  if (/[.!?…]$/.test(w.text)) { sentences.push(cur); cur = []; }
}
if (cur.length) sentences.push(cur);
const split = (s) => {
  if (s.length <= 7) return [s];
  const mid = s.length / 2;
  const commas = s.map((w, i) => (/,$/.test(w.text) && i < s.length - 1 ? i + 1 : -1)).filter((i) => i > 0);
  const cut = commas.length ? commas.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a)) : Math.ceil(mid);
  return [...split(s.slice(0, cut)), ...split(s.slice(cut))];
};
const chunks = sentences.flatMap(split);
const esc = (s) => s.replace(/[{}]/g, '');
const lines = chunks.map((c, i) => {
  const start = c[0].start, end = Math.max(c[c.length - 1].end, start + 0.6);
  const next = chunks[i + 1]?.[0].start ?? end + 0.3;
  return `Dialogue: 0,${t(start)},${t(Math.min(end + 0.25, next))},Sub,,0,0,0,,${esc(c.map((w) => w.text).join(' '))}`;
});
const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Segoe UI Semibold,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,6,2,2,80,80,330,1
Style: Hook,Segoe UI Semibold,70,&H00FFFFFF,&H00FFFFFF,&H001F5AA3,&H00000000,-1,0,0,0,100,100,0,0,3,18,0,8,70,70,190,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${hook ? `Dialogue: 1,${t(0)},${t(2.6)},Hook,,0,0,0,,${esc(hook)}\n` : ''}${lines.join('\n')}
`;
fs.writeFileSync(out, ass, 'utf8');
console.log(`${chunks.length} subtítulos → ${out}`);
