// Locución del tutorial «Tu precio», perfil B «cercano», y auditoría Whisper (Groq). No imprime claves.
import fs from 'node:fs/promises';
import { tts, defaultVoice } from '/root/vivabot/src/voice.js';
const D = '/tmp/tu-precio';
const text = (await fs.readFile(`${D}/guion.txt`, 'utf8')).trim();
const take = process.argv[2] || '1';
const voice = await defaultVoice('8771c6ed-9dbf-497d-b3df-be6697ba2693');
console.log('voice set:', Boolean(voice));
const buf = await tts(text, voice, 'cercano');
await fs.writeFile(`${D}/take${take}.opus`, buf);
const form = new FormData();
form.append('file', new Blob([buf], { type: 'audio/ogg' }), 'voz.ogg');
form.append('model', 'whisper-large-v3'); form.append('language', 'es'); form.append('response_format', 'verbose_json');
form.append('timestamp_granularities[]', 'word'); form.append('timestamp_granularities[]', 'segment');
const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form });
if (!r.ok) { console.log('groq error', r.status); process.exit(1); }
const j = await r.json();
await fs.writeFile(`${D}/whisper-${take}.json`, JSON.stringify(j, null, 1));
console.log('TRANSCRIPT:', j.text); console.log('duration', j.duration);
process.exit(0);
