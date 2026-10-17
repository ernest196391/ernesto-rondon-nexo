// Locución del tutorial «Las piedras» POR ESCENAS (perfil B «cercano», voz por defecto del negocio) + auditoría Whisper (Groq) de cada una.
// Uso en el VPS: cd /root/vivabot && node --env-file=.env /tmp/piedras/gen-voz-vps.mjs <toma> [escenas, p. ej. 0,3,5]. No imprime claves.
import fs from 'node:fs/promises';
import { tts, defaultVoice } from '/root/vivabot/src/voice.js';
const D = '/tmp/piedras';
const g = JSON.parse(await fs.readFile(`${D}/guion.json`, 'utf8'));
const take = process.argv[2] || '1';
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : g.map((_, i) => i);
const voice = await defaultVoice('8771c6ed-9dbf-497d-b3df-be6697ba2693');
console.log('voice set:', Boolean(voice));
for (const k of only) {
  const buf = await tts(g[k], voice, 'cercano');
  await fs.writeFile(`${D}/s${k}-t${take}.opus`, buf);
  const form = new FormData();
  form.append('file', new Blob([buf], { type: 'audio/ogg' }), 'voz.ogg');
  form.append('model', 'whisper-large-v3'); form.append('language', 'es'); form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form });
  if (!r.ok) { console.log(k, 'groq error', r.status); continue; }
  const j = await r.json();
  await fs.writeFile(`${D}/s${k}-t${take}.json`, JSON.stringify(j, null, 1));
  console.log(`[${k}] ${j.duration?.toFixed(2)}s | ${j.text.trim()}`);
}
process.exit(0);
