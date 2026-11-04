# Manda el día N por WhatsApp (bot de Casa Viva, herramienta `cv` del VPS).
# Uso: python -I enviar.py <dia>            → a Ernesto (chat "Tú") para aprobar
#      python -I enviar.py <dia> --padre    → a Ernesto Padre (solo cuando Ernesto dijo "publica el día N")
# Sale con 0 si WhatsApp aceptó todos los envíos.
import json, subprocess, sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
MP4 = AQUI.parent / "videos" / "mp4"
SSH = ["ssh", "-i", str(Path.home() / ".ssh/vivabot_vps"), "-o", "BatchMode=yes", "root@179.236.242.212"]
SCP = ["scp", "-q", "-i", str(Path.home() / ".ssh/vivabot_vps")]
ERNESTO, PADRE = "5354056173", "5358222088"


def run(cmd, stdin=None):
    r = subprocess.run(cmd, input=stdin, capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = (r.stdout + r.stderr).strip()
    print(out[-600:])
    return r.returncode == 0 and "error" not in out.lower()


dia = int(sys.argv[1])
padre = "--padre" in sys.argv
nn = f"{dia:02d}"
d = next(x for x in json.loads((AQUI / "calendario.json").read_text(encoding="utf-8"))["dias"] if x["dia"] == dia)
archivos = [MP4 / f"dia{nn}-video.mp4"] + [MP4 / f"dia{nn}-historia-{k}.mp4" for k in range(1, 6)]
faltan = [a.name for a in archivos if not a.exists()]
if faltan:
    raise SystemExit(f"Faltan: {faltan}")

remoto = f"/root/archivos/nena/dia{nn}"
ok = run(SSH + [f"mkdir -p {remoto}"]) and run(SCP + [str(a) for a in archivos] + [f"root@179.236.242.212:{remoto}/"])
destino = PADRE if padre else ERNESTO
extra = " --ok" if padre else ""
pies = [f"Abuela Nena · Día {dia} · VIDEO (Instagram/Facebook)"] + [f"Día {dia} · historia {k} de 5" for k in range(1, 6)]
for a, pie in zip(archivos, pies):
    ok = run(SSH + [f'cv enviar-archivo {destino} {remoto}/{a.name} "{pie}"{extra}']) and ok

if padre:
    texto = (f"Pa, esto es lo de hoy: el video para Facebook e Instagram y las 5 historias para tu estado.\n\n"
             f"Texto para poner debajo del video:\n\n{d['descripcion']}\n\nAl publicar, activa la etiqueta de contenido IA.")
else:
    texto = (f"🎬 Abuela Nena · Día {dia}: {d['tema']}\n\nTexto para el post:\n\n{d['descripcion']}\n\n"
             f"Si te gusta, dime en Claude «publica el día {dia}» y se lo mando a tu papá. "
             f"Si quieres cambiar algo, dímelo también allí.")
ok = run(SSH + [f"cv enviar {destino} -{extra}"], stdin=texto) and ok
print("ENVIADO" if ok else "HUBO FALLOS")
sys.exit(0 if ok else 1)
