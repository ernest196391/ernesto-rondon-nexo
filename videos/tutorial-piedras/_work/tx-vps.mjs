// Transcribe con Whisper (Groq) uno o varios audios y enseña texto, confianza por segmento y palabras. No imprime claves.
// Uso en el VPS: cd /root/vivabot && node --env-file=.env /tmp/piedras/tx-vps.mjs <archivo> [más archivos]
import fs from 'node:fs/promises';
for (const f of process.argv.slice(2)) {
  await new Promise((r) => setTimeout(r, 2500)); // sin pasar el límite de Groq
  const buf = await fs.readFile(f);
  const form = new FormData();
  form.append('file', new Blob([buf]), f.split('/').pop());
  form.append('model', 'whisper-large-v3'); form.append('language', 'es'); form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'segment'); form.append('timestamp_granularities[]', 'word');
  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form });
  if (!r.ok) { console.log(f, 'groq error', r.status); continue; }
  const j = await r.json();
  console.log(`== ${f.split('/').pop()} | ${j.text.trim()}`);
  (j.segments || []).forEach((s) => console.log(`   seg ${s.start.toFixed(2)}-${s.end.toFixed(2)} logprob ${s.avg_logprob.toFixed(3)} nospeech ${s.no_speech_prob.toFixed(3)} | ${s.text.trim()}`));
}
process.exit(0);
