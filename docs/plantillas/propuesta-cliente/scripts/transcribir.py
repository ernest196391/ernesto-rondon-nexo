# Transcribe un video en español con marcas de tiempo por palabra (faster-whisper, local).
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

video, salida = sys.argv[1], sys.argv[2]
# FFmpeg decodifica a PCM mono 16 kHz; así no dependemos de PyAV.
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(raw, dtype=np.float32)
model = WhisperModel("small", device="cpu", compute_type="int8")
segments, info = model.transcribe(audio, language="es", word_timestamps=True)
out = []
for s in segments:
    out.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                "words": [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for w in s.words]})
    print(f"{s.start:6.2f}-{s.end:6.2f}  {s.text.strip()}")
with open(salida, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
