# Comprueba con Whisper (local) que la voz del día dice el guion del calendario.
# Uso: python -I verificar_voz.py <dia>      → imprime el parecido y sale con 0 si es >= 90 %, 1 si no.
import difflib, json, re, subprocess, sys, tempfile, unicodedata
from pathlib import Path

AQUI = Path(__file__).resolve().parent
NENA = AQUI.parent
TRANSCRIBIR = NENA.parent.parent / "plantillas/propuesta-cliente/scripts/transcribir.py"


def palabras(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", " ", s).split()


dia = int(sys.argv[1])
d = next(x for x in json.loads((AQUI / "calendario.json").read_text(encoding="utf-8"))["dias"] if x["dia"] == dia)
mp3 = NENA / "voz" / f"dia{dia:02d}.mp3"
with tempfile.TemporaryDirectory() as tmp:
    out = Path(tmp) / "t.json"
    subprocess.run([sys.executable, "-I", str(TRANSCRIBIR), str(mp3), str(out)], check=True, capture_output=True)
    oido = " ".join(s["text"] for s in json.loads(out.read_text(encoding="utf-8")))
# Se compara con 'voz' (números en letras, como se dicen) y con 'texto' (en cifras); vale el mejor.
r = max(difflib.SequenceMatcher(None, palabras(d[k]), palabras(oido)).ratio() for k in ("voz", "texto"))
print(f"Día {dia}: parecido {r:.0%}\nOído: {oido.strip()}")
sys.exit(0 if r >= 0.9 else 1)
