// Auditoría Whisper (Groq) del audio del MP4 final (voz + música). Uso en el VPS: cd /root/vivabot && node --env-file=.env /tmp/piedras/audit-vps.mjs
import fs from 'node:fs/promises';
const buf = await fs.readFile('/tmp/piedras/mp4-audio.ogg');
const form = new FormData();
form.append('file', new Blob([buf], { type: 'audio/ogg' }), 'voz.ogg');
form.append('model', 'whisper-large-v3'); form.append('language', 'es'); form.append('response_format', 'verbose_json');
const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form });
if (!r.ok) { console.log('ERR', r.status); process.exit(1); }
const j = await r.json();
await fs.writeFile('/tmp/piedras/whisper-mp4-final.json', JSON.stringify(j, null, 1));
console.log(j.text); console.log('dur', j.duration);
