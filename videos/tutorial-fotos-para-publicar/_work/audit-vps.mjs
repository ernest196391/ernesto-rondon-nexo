// Auditoría Whisper (Groq) de la voz montada. Uso en el VPS: node --env-file=.env /tmp/tut5/audit-vps.mjs
import fs from 'node:fs/promises';
const buf = await fs.readFile('/tmp/tut5/voz-final.ogg');
const form = new FormData();
form.append('file', new Blob([buf], { type: 'audio/ogg' }), 'voz.ogg');
form.append('model', 'whisper-large-v3'); form.append('language', 'es'); form.append('response_format', 'verbose_json');
form.append('timestamp_granularities[]', 'word'); form.append('timestamp_granularities[]', 'segment');
const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form });
if (!r.ok) { console.log('ERR', r.status); process.exit(1); }
const j = await r.json();
await fs.writeFile('/tmp/tut5/whisper-final.json', JSON.stringify(j, null, 1));
console.log(j.text); console.log('dur', j.duration);
