// Música de fondo original y procedural (100% libre de derechos: generada aquí, sin muestras ajenas).
// Pad cálido + arpegio suave + bajo, progresión I–vi–IV–V en Do, ~84 BPM, con reverb simple.
// Uso: node make-music.mjs <salida.wav> <segundos>
import fs from 'node:fs';

const out = process.argv[2] || 'musica.wav';
const SECS = Number(process.argv[3] || 70);
const SR = 44100;
const N = Math.floor(SR * SECS);
const L = new Float32Array(N);
const R = new Float32Array(N);

const BPM = 84;
const beat = 60 / BPM;
const bar = beat * 4;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Cmaj9, Am9, Fmaj7(9), G6/sus — voicings mid register
const chords = [
  { bass: 36, pad: [60, 64, 67, 71, 74], arp: [72, 76, 79, 83, 79, 76] },
  { bass: 33, pad: [57, 60, 64, 67, 71], arp: [69, 72, 76, 79, 76, 72] },
  { bass: 29, pad: [53, 57, 60, 64, 67], arp: [65, 69, 72, 76, 72, 69] },
  { bass: 31, pad: [55, 59, 62, 64, 69], arp: [67, 71, 74, 76, 74, 71] },
];

// deterministic pseudo-random
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function addTone(t0, dur, freq, amp, { attack = 0.01, release = 0.3, decay = 0, pan = 0, harm = [1], detune = 0 } = {}) {
  const s0 = Math.floor(t0 * SR);
  const len = Math.floor((dur + release) * SR);
  const gl = Math.cos((pan + 1) * Math.PI / 4);
  const gr = Math.sin((pan + 1) * Math.PI / 4);
  const ph = rnd() * Math.PI * 2;
  for (let i = 0; i < len; i++) {
    const n = s0 + i;
    if (n < 0 || n >= N) continue;
    const t = i / SR;
    let env = t < attack ? t / attack : 1;
    if (decay > 0) env *= Math.exp(-(t) / decay);
    if (t > dur) env *= Math.max(0, 1 - (t - dur) / release);
    let v = 0;
    for (let h = 0; h < harm.length; h++) {
      const f = freq * (h + 1) * (1 + detune);
      v += harm[h] * Math.sin(2 * Math.PI * f * t + ph * (h + 1));
    }
    v *= amp * env;
    L[n] += v * gl;
    R[n] += v * gr;
  }
}

const bars = Math.ceil(SECS / bar);
for (let b = 0; b < bars; b++) {
  const c = chords[b % chords.length];
  const t0 = b * bar;
  // pad: two slightly detuned layers, slow swell
  c.pad.forEach((m, i) => {
    const pan = (i / (c.pad.length - 1)) * 1.2 - 0.6;
    addTone(t0, bar, mtof(m), 0.028, { attack: 1.4, release: 1.6, pan, harm: [1, 0.18, 0.05], detune: 0.0012 });
    addTone(t0, bar, mtof(m), 0.022, { attack: 1.8, release: 1.6, pan: -pan, harm: [1, 0.12], detune: -0.0015 });
  });
  // soft bass
  addTone(t0, bar * 0.95, mtof(c.bass + 12), 0.07, { attack: 0.08, release: 0.6, harm: [1, 0.25] });
  // gentle arpeggio (8th notes), starts after the first 2 bars, felt-piano-ish
  if (b >= 2) {
    for (let k = 0; k < 8; k++) {
      if (k === 7 && b % 2 === 1) continue;
      const m = c.arp[k % c.arp.length];
      const tt = t0 + k * (beat / 2);
      addTone(tt, 0.05, mtof(m), 0.05 * (k % 2 === 0 ? 1 : 0.7), { attack: 0.004, decay: 0.55, release: 0.9, pan: (k % 3 - 1) * 0.35, harm: [1, 0.35, 0.12, 0.05] });
    }
  }
}

// Schroeder-ish reverb
function reverb(x, mix) {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ d, buf: new Float32Array(d), i: 0, fb: 0.78 }));
  const aps = [225, 556].map((d) => ({ d, buf: new Float32Array(d), i: 0 }));
  const y = new Float32Array(x.length);
  for (let n = 0; n < x.length; n++) {
    let s = 0;
    for (const c of combs) { const o = c.buf[c.i]; c.buf[c.i] = x[n] + o * c.fb; c.i = (c.i + 1) % c.d; s += o; }
    s /= combs.length;
    for (const a of aps) { const o = a.buf[a.i]; const v = o - 0.5 * s; a.buf[a.i] = s + 0.5 * o; a.i = (a.i + 1) % a.d; s = v; }
    y[n] = x[n] * (1 - mix) + s * mix;
  }
  return y;
}
const RL = reverb(L, 0.35);
const RR = reverb(R, 0.35);

// fades + normalize to -3 dBFS peak
const fadeIn = 2.0 * SR, fadeOut = 3.0 * SR;
let peak = 0;
for (let n = 0; n < N; n++) {
  let g = 1;
  if (n < fadeIn) g = n / fadeIn;
  if (n > N - fadeOut) g = Math.max(0, (N - n) / fadeOut);
  RL[n] *= g; RR[n] *= g;
  peak = Math.max(peak, Math.abs(RL[n]), Math.abs(RR[n]));
}
const norm = Math.pow(10, -3 / 20) / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, RL[n] * norm)) * 32767), 44 + n * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, RR[n] * norm)) * 32767), 46 + n * 4);
}
fs.writeFileSync(out, buf);
console.log('wrote', out, SECS + 's');
