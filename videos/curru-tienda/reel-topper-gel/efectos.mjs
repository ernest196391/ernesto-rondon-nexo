// Efectos propios del reel «Súper Prosko» (14-oct), sintetizados aquí (gratis, sin derechos de nadie):
//  - coro.wav: «¡Aaah!» de coro dramático corto (1,3 s) para el gancho congelado: acorde menor con voces
//    (formantes de «a»), vibrato y crescendo rápido; termina en seco para que entre el «10 segundos antes».
//  - puff.wav: «puff» suave del colchón (ruido grave filtrado con caída rápida + un golpe sordo).
//  - clac.wav: «clac» metálico de la cama al abrirse (dos clics de metal + resonancia corta).
// Uso: node efectos.mjs → piezas/coro.wav, piezas/puff.wav, piezas/clac.wav (48 kHz, estéreo)
import fs from 'fs';

const SR = 48000;
let seed = 11;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const wav = (file, L, R = L) => {
  let pk = 0;
  for (let i = 0; i < L.length; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  const g = 0.89 / pk, data = Buffer.alloc(L.length * 4);
  for (let i = 0; i < L.length; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, data]));
};
// Filtro resonante de 2 polos (formante).
const resonador = (f, bw) => {
  const r = Math.exp(-Math.PI * bw / SR), c = 2 * r * Math.cos(2 * Math.PI * f / SR);
  let y1 = 0, y2 = 0;
  return (x) => { const y = (1 - r) * x + c * y1 - r * r * y2; y2 = y1; y1 = y; return y; };
};
fs.mkdirSync('piezas', { recursive: true });

// ── Coro: re menor (D3 F3 A3 D4 F4 A4) cantado «aaa» por 12 voces desafinadas un pelín.
{
  const DUR = 1.3, N = Math.round(DUR * SR), L = new Float32Array(N), R = new Float32Array(N);
  const notas = [50, 53, 57, 62, 65, 69];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  for (let v = 0; v < 12; v++) {
    const f0 = hz(notas[v % notas.length]) * (1 + (rnd() - 0.5) * 0.008), pan = (rnd() - 0.5) * 1.4;
    const vibF = 5 + rnd() * 1.2, vibD = 0.006 + rnd() * 0.004, ph0 = rnd();
    const F = [resonador(800, 90), resonador(1150, 110), resonador(2900, 160)];   // formantes de «a»
    let ph = ph0;
    for (let i = 0; i < N; i++) {
      const t = i / SR;
      ph += f0 * (1 + vibD * Math.sin(2 * Math.PI * vibF * t)) / SR;
      const saw = 2 * (ph - Math.floor(ph + 0.5));                             // diente de sierra = cuerdas vocales
      const x = F[0](saw) + 0.6 * F[1](saw) + 0.25 * F[2](saw);
      const env = Math.min(1, Math.pow(t / 0.35, 1.6)) * (t > DUR - 0.12 ? (DUR - t) / 0.12 : 1);
      L[i] += x * env * (1 - pan) * 0.5; R[i] += x * env * (1 + pan) * 0.5;
    }
  }
  // reverberación corta (3 ecos) para que suene a sala grande
  for (const [d, a] of [[0.043, 0.35], [0.071, 0.25], [0.113, 0.18]]) {
    const k = Math.round(d * SR);
    for (let i = N - 1; i >= k; i--) { L[i] += a * R[i - k]; R[i] += a * L[i - k]; }
  }
  wav('piezas/coro.wav', L, R);
}

// ── Puff: golpe sordo (seno 70 Hz que baja) + ruido grave filtrado.
{
  const DUR = 0.55, N = Math.round(DUR * SR), L = new Float32Array(N);
  let lp = 0, lp2 = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, x = rnd() * 2 - 1;
    lp += 0.06 * (x - lp); lp2 += 0.06 * (lp - lp2);
    const ruido = lp2 * 6 * Math.exp(-t * 9) * Math.min(1, t / 0.01);
    const golpe = Math.sin(2 * Math.PI * (70 - 30 * t) * t) * Math.exp(-t * 14) * Math.min(1, t / 0.004);
    L[i] = 0.8 * ruido + 0.7 * golpe;
  }
  wav('piezas/puff.wav', L);
}

// ── Clac: dos clics metálicos (seguro de la cama) con resonancia corta de tubo.
{
  const DUR = 0.35, N = Math.round(DUR * SR), L = new Float32Array(N);
  for (const [t0, a] of [[0, 1], [0.045, 0.7]]) {
    const i0 = Math.round(t0 * SR);
    for (let i = 0; i < N - i0; i++) {
      const t = i / SR, e = Math.exp(-t * 60);
      const metal = Math.sin(2 * Math.PI * 2350 * t) + 0.6 * Math.sin(2 * Math.PI * 3720 * t) + 0.4 * Math.sin(2 * Math.PI * 5110 * t);
      const tubo = 0.5 * Math.sin(2 * Math.PI * 420 * t) * Math.exp(-t * 22);
      const chas = (rnd() * 2 - 1) * Math.exp(-t * 400);
      L[i0 + i] += a * (e * metal * 0.5 + tubo + chas * 0.8);
    }
  }
  wav('piezas/clac.wav', L);
}
console.log('piezas/coro.wav, piezas/puff.wav, piezas/clac.wav listos');
