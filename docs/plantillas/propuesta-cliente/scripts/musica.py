# Base musical original y suave (estilo R&B lento / lounge) para los videos de Rey de Alisados.
# Colchón cálido + piano eléctrico con acordes de séptima + bajo suave + pulso ligero. Sin samples externos.
import sys, wave
import numpy as np

SR = 44100
BPM = 78
beat = 60 / BPM
dur = float(sys.argv[2]) if len(sys.argv) > 2 else 40.0
n = int(SR * dur)
t = np.arange(n) / SR
mix = np.zeros(n)

def note(freq, start, length, amp, kind):
    i0, i1 = int(start * SR), min(n, int((start + length) * SR))
    if i0 >= n:
        return
    tt = np.arange(i1 - i0) / SR
    if kind == "pad":
        w = sum(np.sin(2 * np.pi * freq * d * tt) for d in (0.997, 1.0, 1.003)) / 3
        env = np.minimum(1, tt / 1.2) * np.minimum(1, (length - tt) / 1.2)
    elif kind == "keys":  # piano eléctrico: fundamental + armónicos que decaen
        w = (np.sin(2 * np.pi * freq * tt) + 0.35 * np.sin(2 * np.pi * freq * 2 * tt) * np.exp(-tt * 3)
             + 0.12 * np.sin(2 * np.pi * freq * 3 * tt) * np.exp(-tt * 5))
        env = np.exp(-tt * 1.6) * np.minimum(1, tt / 0.01)
    else:  # bajo
        w = np.sin(2 * np.pi * freq * tt) + 0.2 * np.sin(2 * np.pi * freq * 2 * tt)
        env = np.exp(-tt * 1.2) * np.minimum(1, tt / 0.02)
    mix[i0:i1] += amp * w * env

def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)

# Progresión: Fmaj7 – Em7 – Dm7 – Cmaj7 (4 tiempos cada uno)
chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
bar = 4 * beat
k = 0
start = 0.0
while start < dur:
    ch = chords[k % 4]
    for m in ch:
        note(hz(m), start, bar + 0.6, 0.05, "pad")
    for j, off in enumerate((0, 1.5, 2.5)):  # acordes sincopados
        for m in ch[1:]:
            note(hz(m + 12), start + off * beat, beat * 1.5, 0.045 if j == 0 else 0.03, "keys")
    note(hz(ch[0] - 12), start, beat * 2, 0.16, "bass")
    note(hz(ch[0] - 12 + 7), start + 2 * beat, beat * 1.5, 0.11, "bass")
    start += bar
    k += 1

# Pulso ligero tipo "shaker" (ruido filtrado, semilla fija = determinista)
rng = np.random.default_rng(7)
for b in np.arange(0, dur, beat / 2):
    i0 = int(b * SR); L = int(0.05 * SR)
    if i0 + L < n:
        hiss = rng.standard_normal(L) * np.exp(-np.arange(L) / (0.012 * SR))
        mix[i0:i0 + L] += 0.012 * np.diff(hiss, prepend=0)

fade = int(1.5 * SR)
mix[:fade] *= np.linspace(0, 1, fade)
mix[-fade:] *= np.linspace(1, 0, fade)
mix /= np.max(np.abs(mix)) * 1.15
stereo = np.stack([mix, np.roll(mix, int(0.012 * SR))], axis=1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print("ok", dur, "s")
