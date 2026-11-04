# Música original de la Abuela Nena (aire de son mañanero: clave 3-2, tumbao suave, montuno de piano)
# y un silbatazo de maestra. Todo sintetizado aquí, sin samples externos. Determinista (semilla fija).
# Uso: python -I sonidos.py <carpeta_salida> <duracion_musica_s>
import sys, wave
import numpy as np

SR = 44100
out_dir = sys.argv[1]
dur = float(sys.argv[2]) if len(sys.argv) > 2 else 30.0
BPM = 104
beat = 60 / BPM
bar = 4 * beat
n = int(SR * dur)
mix = np.zeros(n)


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def add(sig, start, amp):
    i0 = int(start * SR)
    if i0 >= n:
        return
    i1 = min(n, i0 + len(sig))
    mix[i0:i1] += amp * sig[: i1 - i0]


def tone(freq, length, kind):
    tt = np.arange(int(length * SR)) / SR
    if kind == "piano":  # fundamental + armónicos que se apagan rápido
        w = (np.sin(2 * np.pi * freq * tt) + 0.4 * np.sin(2 * np.pi * freq * 2 * tt) * np.exp(-tt * 4)
             + 0.15 * np.sin(2 * np.pi * freq * 3 * tt) * np.exp(-tt * 6))
        return w * np.exp(-tt * 3.2) * np.minimum(1, tt / 0.004)
    if kind == "bass":
        w = np.sin(2 * np.pi * freq * tt) + 0.25 * np.sin(2 * np.pi * freq * 2 * tt)
        return w * np.exp(-tt * 2.2) * np.minimum(1, tt / 0.015)
    if kind == "pad":
        w = sum(np.sin(2 * np.pi * freq * d * tt) for d in (0.996, 1.0, 1.004)) / 3
        return w * np.minimum(1, tt / 0.8) * np.minimum(1, (length - tt) / 0.8)
    if kind == "clave":  # golpe de madera corto
        w = np.sin(2 * np.pi * 2500 * tt) + 0.5 * np.sin(2 * np.pi * 1700 * tt)
        return w * np.exp(-tt * 60)
    raise ValueError(kind)


# Progresión alegre: C – F – G7 – C (un compás cada acorde)
chords = [[60, 64, 67], [60, 65, 69], [59, 62, 65, 67], [60, 64, 67]]
roots = [48, 53, 55, 48]
clave_32 = [0, 1.5, 3, 5, 6]  # clave de son 3-2 en tiempos de 2 compases
k, start = 0, 0.0
while start < dur:
    ch, root = chords[k % 4], roots[k % 4]
    for m in ch:  # colchón
        add(tone(hz(m), bar + 0.4, "pad"), start, 0.035)
    for off in (0.5, 1.5, 2, 3, 3.5):  # montuno sincopado
        for m in ch:
            add(tone(hz(m + 12), 0.35, "piano"), start + off * beat, 0.028)
    # tumbao: anticipa en el "y" del 2 y en el 4
    add(tone(hz(root - 12), beat * 1.2, "bass"), start + 1.5 * beat, 0.16)
    add(tone(hz(root - 12 + 7), beat * 1.0, "bass"), start + 3 * beat, 0.12)
    if k % 2 == 0:
        for c in clave_32:
            add(tone(0, 0.08, "clave"), start + c * beat, 0.05)
    start += bar
    k += 1

# Shaker suave en corcheas
rng = np.random.default_rng(11)
for b in np.arange(0, dur, beat / 2):
    L = int(0.045 * SR)
    hiss = rng.standard_normal(L) * np.exp(-np.arange(L) / (0.01 * SR))
    add(np.diff(hiss, prepend=0), b, 0.01)

fade = int(1.2 * SR)
mix[:fade] *= np.linspace(0, 1, fade)
mix[-int(2.0 * SR):] *= np.linspace(1, 0, int(2.0 * SR))
mix /= np.max(np.abs(mix)) * 1.15


def save(path, mono):
    stereo = np.stack([mono, np.roll(mono, int(0.010 * SR))], axis=1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(stereo, -1, 1) * 32767).astype(np.int16).tobytes())


save(f"{out_dir}/musica.wav", mix)

# Silbatazo de maestra: tono ~2,9 kHz con el "trino" de la bolita (modulación ~32 Hz), 0,5 s
L = 0.5
tt = np.arange(int(L * SR)) / SR
trill = 1 + 0.035 * np.sin(2 * np.pi * 32 * tt)
phase = 2 * np.pi * np.cumsum(2900 * trill) / SR
w = np.sin(phase) * (0.75 + 0.25 * np.sin(2 * np.pi * 32 * tt))
w += 0.15 * rng.standard_normal(len(tt)) * np.exp(-tt * 8)  # soplido
env = np.minimum(1, tt / 0.02) * np.minimum(1, (L - tt) / 0.08)
w = w * env
w /= np.max(np.abs(w)) * 1.4
save(f"{out_dir}/silbato.wav", w)
print("ok musica", dur, "s + silbato", L, "s")
