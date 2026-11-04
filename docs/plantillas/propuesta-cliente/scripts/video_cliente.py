# Edición de video de cliente en 2 fases.
#   preparar <url|archivo> <carpeta_cliente> <nombre>  -> descarga, transcribe y copia la plantilla edicion-muestra
#   final    <carpeta_proyecto>                         -> check + render + versión WhatsApp (crf 26)
# Entre las dos fases Claude edita solo las tarjetas de index.html usando transcripcion.json.
import os, shutil, subprocess, sys, json
from pathlib import Path

AQUI = Path(__file__).resolve().parent
PLANTILLA = AQUI.parent / "videos" / "edicion-muestra"
os.environ["PATH"] = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Links") + os.pathsep + os.environ["PATH"]

def run(*cmd, **kw):
    print(">", " ".join(map(str, cmd)))
    return subprocess.run(list(map(str, cmd)), check=True, **kw)

def duracion(f):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                       capture_output=True, text=True, check=True)
    return round(float(r.stdout.strip()), 2)

def preparar(fuente, cliente, nombre):
    proy = Path(cliente) / "videos" / nombre
    if proy.exists():
        sys.exit(f"Ya existe {proy}; elige otro nombre.")
    shutil.copytree(PLANTILLA, proy, ignore=shutil.ignore_patterns("snapshots", "renders", "node_modules"))
    orig = proy / "assets" / "original.mp4"
    if Path(fuente).exists():
        shutil.copy(fuente, orig)
    else:
        run(sys.executable, "-m", "yt_dlp", "-f", "mp4/best", "-o", orig, fuente)
    run(sys.executable, AQUI / "transcribir.py", orig, proy / "transcripcion.json")
    info = {"fuente": fuente, "duracion": duracion(orig)}
    (proy / "edicion.json").write_text(json.dumps(info, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nLISTO {proy}  ({info['duracion']} s). Ahora: ajustar tarjetas en index.html y data-duration.")

def final(proy):
    proy = Path(proy)
    out = proy / "renders"; out.mkdir(exist_ok=True)
    mp4, wa = out / f"{proy.name}.mp4", out / f"{proy.name}-whatsapp.mp4"
    run("npx", "hyperframes", "check", cwd=proy, shell=True)
    run("npx", "hyperframes", "render", "-o", mp4, cwd=proy, shell=True)
    run("ffmpeg", "-y", "-v", "error", "-i", mp4, "-c:v", "libx264", "-crf", "26", "-preset", "medium",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", wa)
    print(f"\nLISTO {wa}  ({wa.stat().st_size / 1e6:.1f} MB)")

if __name__ == "__main__":
    {"preparar": lambda: preparar(*sys.argv[2:5]), "final": lambda: final(sys.argv[2])}[sys.argv[1]]()
