// Energía del audio cada 100 ms (dB), para ver dónde caen golpes («clac», «puff») y pausas. Uso: node energia.mjs <video> [desde] [hasta]
import { spawnSync } from 'child_process';
const [, , f, de = '0', a = '99'] = process.argv;
const r = spawnSync('C:/Users/Ernesto/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe', ['-v', 'error', '-i', f, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
const b = r.stdout, n = b.length / 2, W = 1600;
let out = '';
for (let i = 0; i + W <= n; i += W) {
  const t = i / 16000; if (t < +de || t > +a) continue;
  let s = 0, pk = 0; for (let k = 0; k < W; k++) { const v = b.readInt16LE((i + k) * 2) / 32768; s += v * v; pk = Math.max(pk, Math.abs(v)); }
  const db = 10 * Math.log10(s / W + 1e-12);
  out += `${t.toFixed(1)} ${db.toFixed(0).padStart(4)} pk${(20 * Math.log10(pk + 1e-9)).toFixed(0).padStart(4)} ${'#'.repeat(Math.max(0, Math.round((db + 60) / 2)))}\n`;
}
console.log(out);
