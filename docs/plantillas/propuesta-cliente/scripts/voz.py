# Genera voz con ElevenLabs (voz clonada de Ernesto) y la comprueba con Whisper antes de darla por buena.
#   python voz.py "texto a decir" salida.mp3
# Necesita en C:\Users\Ernesto\ernesto-rondon-nexo\.env (lo pone Ernesto, nunca Claude):
#   ELEVENLABS_API_KEY=...
#   ELEVENLABS_VOICE_ID=...
import json, os, re, subprocess, sys, tempfile, urllib.request
from pathlib import Path

ENV = Path(r"C:\Users\Ernesto\ernesto-rondon-nexo\.env")
for line in ENV.read_text(encoding="utf-8").splitlines() if ENV.exists() else []:
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1); os.environ.setdefault(k.strip(), v.strip())
key, voice = os.environ.get("ELEVENLABS_API_KEY"), os.environ.get("ELEVENLABS_VOICE_ID")
if not key or not voice:
    sys.exit("Falta ELEVENLABS_API_KEY o ELEVENLABS_VOICE_ID en .env")

texto, salida = sys.argv[1], Path(sys.argv[2])
req = urllib.request.Request(
    f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
    data=json.dumps({"text": texto, "model_id": "eleven_multilingual_v2"}).encode(),
    headers={"xi-api-key": key, "Content-Type": "application/json"})
salida.write_bytes(urllib.request.urlopen(req).read())

# Comprobación con Whisper
tmp = Path(tempfile.mkdtemp()) / "t.json"
subprocess.run([sys.executable, str(Path(__file__).with_name("transcribir.py")), str(salida), str(tmp)],
               check=True, capture_output=True)
oido = " ".join(s["text"] for s in json.loads(tmp.read_text(encoding="utf-8")))
norm = lambda s: set(re.findall(r"\w+", s.lower()))
a, b = norm(texto), norm(oido)
parecido = len(a & b) / max(1, len(a))
print(f"Escrito: {texto}\nOído:    {oido}\nParecido: {parecido:.0%}")
if parecido < 0.85:
    sys.exit("REVISAR: el audio no dice lo mismo que el texto. No usar sin escucharlo.")
print("OK", salida)
