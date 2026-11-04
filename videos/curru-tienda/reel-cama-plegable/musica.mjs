// Música propia para el reel (gratis y sin derechos de nadie: se sintetiza aquí, nota a nota).
// Son cubano suave y juguetón: guitarra punteada (Karplus-Strong) en guajeo, bajo de tumbao (en el «y» del 2 y en
// el 4), clave 2-3 y maracas muy bajitas. 100 BPM, 5 compases = 12,0 s exactos: C | F | G | C | G7 → vuelve a C,
// así el bucle del reel cierra también en la música.
// (14-oct, cama plegable: se le pasa también el tempo para que 5 compases duren lo que dura el reel desde «10 segundos antes».)
// Uso: node musica.mjs [segundos=12] [bpm=100] → piezas/musica.wav (48 kHz, estéreo)
import fs from 'fs';

const SR = 48000, DUR0 = Number(process.argv[2] ?? 12), BPM = Number(process.argv[3] ?? 100), BEAT = 60 / BPM, BAR = 4 * BEAT, E8 = BEAT / 2;
const DUR = DUR0;
const N = Math.round(DUR * SR);
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 7;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const add = (buf, t0, gain, pan = 0) => {
  const i0 = Math.round(t0 * SR), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < buf.length; i++) { const j = (i0 + i) % N; L[j] += buf[i] * gl; R[j] += buf[i] * gr; }  // % N: lo que sobra al final vuelve al principio (bucle limpio)
};

// Guitarra: Karplus-Strong con ruido suavizado (cuerda de nylon) y decaimiento corto.
const pulsa = (f, dur = 0.9, brillo = 0.5, decae = 0.994) => {
  const P = Math.max(2, Math.round(SR / f)), b = new Float32Array(P);
  let prev = 0;
  for (let i = 0; i < P; i++) { const x = rnd() * 2 - 1; prev = prev + brillo * (x - prev); b[i] = prev; }
  const out = new Float32Array(Math.round(dur * SR));
  let k = 0;
  for (let i = 0; i < out.length; i++) {
    const a = b[k], c = b[(k + 1) % P];
    out[i] = a; b[k] = decae * 0.5 * (a + c); k = (k + 1) % P;
  }
  for (let i = 0; i < 64 && i < out.length; i++) out[i] *= i / 64;                       // ataque sin clic
  for (let i = 0; i < 2400 && i < out.length; i++) out[out.length - 1 - i] *= i / 2400;  // final sin clic
  return out;
};
// Bajo: seno + 2.º armónico con caída.
const bajo = (f, dur = 0.5) => {
  const out = new Float32Array(Math.round(dur * SR));
  for (let i = 0; i < out.length; i++) {
    const t = i / SR, env = Math.min(1, t / 0.008) * Math.exp(-t * 5);
    out[i] = env * (Math.sin(2 * Math.PI * f * t) + 0.55 * Math.sin(4 * Math.PI * f * t) + 0.2 * Math.sin(6 * Math.PI * f * t));
  }
  return out;
};
// Clave: golpe de madera corto (dos senos agudos con caída muy rápida).
const clave = () => {
  const out = new Float32Array(Math.round(0.08 * SR));
  for (let i = 0; i < out.length; i++) { const t = i / SR, e = Math.exp(-t * 70); out[i] = e * (Math.sin(2 * Math.PI * 2500 * t) + 0.5 * Math.sin(2 * Math.PI * 3700 * t)); }
  return out;
};
// Maraca: ruido filtrado (paso alto) muy corto.
const maraca = (fuerza) => {
  const out = new Float32Array(Math.round(0.07 * SR));
  let p = 0;
  for (let i = 0; i < out.length; i++) { const t = i / SR, x = rnd() * 2 - 1, hp = x - p; p = x; out[i] = hp * Math.exp(-t * 55) * Math.min(1, t / 0.004) * fuerza; }
  return out;
};

// Acordes (MIDI): raíz del bajo, quinta, y notas de la guitarra para el guajeo.
const ACORDES = [
  { bajo: 48, q: 55, g: [60, 64, 67, 72] },   // C
  { bajo: 53, q: 48, g: [60, 65, 69, 72] },   // F
  { bajo: 55, q: 50, g: [59, 62, 67, 71] },   // G
  { bajo: 48, q: 55, g: [60, 64, 67, 72] },   // C
  { bajo: 55, q: 50, g: [59, 62, 65, 67] },   // G7
];
// Guajeo por compás en corcheas (8 posiciones): índice de nota de la guitarra o null (silencio = síncopa).
const GUAJEO = [0, 2, null, 1, 3, null, 2, 1];
const FUERZA = [0.9, 0.55, 0, 0.7, 0.8, 0, 0.6, 0.5];
const CLAVE_23 = [[2, 4], [0, 3, 6]];          // 2-3: compás «2» (corcheas 2 y 4), compás «3» (0, 3 y 6)

const compases = Math.round(DUR / BAR);
for (let b = 0; b < compases; b++) {
  const a = ACORDES[b % ACORDES.length], t0 = b * BAR;
  GUAJEO.forEach((idx, k) => {
    if (idx === null) return;
    const swing = k % 2 ? 0.018 : 0;          // un pelín de swing en los contratiempos
    add(pulsa(hz(a.g[idx]), 0.8, 0.45), t0 + k * E8 + swing, 0.32 * FUERZA[k], (idx - 1.5) * 0.25);
  });
  // tumbao: «y» del 2 (corchea 3) con la quinta, y el 4 (corchea 6) con la raíz
  add(bajo(hz(a.q - 12), 0.55), t0 + 3 * E8, 0.2);
  add(bajo(hz(a.bajo - 12), 0.6), t0 + 6 * E8, 0.24);
  for (const k of CLAVE_23[b % 2]) add(clave(), t0 + k * E8, 0.12, 0.3);
  for (let k = 0; k < 8; k++) add(maraca(k % 2 ? 0.9 : 0.5), t0 + k * E8, 0.07, -0.3);
}

// Normalizar a pico −3 dBFS y escribir WAV 16 bits estéreo.
let pk = 0;
for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.708 / pk;
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), i * 4 + 2);
}
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
fs.mkdirSync('piezas', { recursive: true });
fs.writeFileSync('piezas/musica.wav', Buffer.concat([h, data]));
console.log(`piezas/musica.wav: ${DUR} s, ${compases} compases a ${BPM} BPM`);
