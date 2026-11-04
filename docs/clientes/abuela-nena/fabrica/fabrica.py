# Fábrica diaria de la Abuela Nena: arma y exporta el video del día + 5 historias.
#
# Uso:   python -I fabrica.py <numero_de_dia>
# Antes: la voz del día tiene que estar en ../voz/diaNN.mp3 (la hace la rutina con Higgsfield)
#        y las fotos que pide el calendario tienen que existir en ../banco-fotos/.
# Sale:  ../videos/mp4/diaNN-video.mp4 · diaNN-historia-1..5.mp4 · diaNN-textos.txt
#        (proyectos HyperFrames en ../videos/diaNN-video y ../videos/diaNN-historias)
#
# Todo es local y gratis: transcripción con faster-whisper, montaje con HyperFrames, audio con ffmpeg.
import difflib, json, re, shutil, subprocess, sys, unicodedata
from pathlib import Path

AQUI = Path(__file__).resolve().parent
NENA = AQUI.parent
BANCO = NENA / "banco-fotos"
VOZ = NENA / "voz"
VIDEOS = NENA / "videos"
MP4 = VIDEOS / "mp4"
HF = "hyperframes@0.8.150"
CORE_DIR = VIDEOS / "dia01-presentacion"  # tiene node_modules/@hyperframes/core para mezclar la música
OFFSET = 0.6       # la voz entra después del silbatazo
CIERRE = 3.8       # segundos de la tarjeta final
HISTORIA = 7.0     # segundos por historia
WIN = sys.platform == "win32"


def sh(cmd, cwd=None, check=True):
    r = subprocess.run(cmd, cwd=cwd, shell=WIN, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if check and r.returncode != 0:
        print(r.stdout[-3000:], r.stderr[-3000:])
        raise SystemExit(f"FALLÓ: {' '.join(map(str, cmd))}")
    return r.stdout + r.stderr


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)


def duracion(path):
    out = sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(out.strip().splitlines()[-1])


# ---------- 1. tiempos de cada palabra del texto en pantalla ----------
def transcribir(mp3, salida):
    sh([sys.executable, "-I", str(NENA.parent.parent / "plantillas/propuesta-cliente/scripts/transcribir.py"), str(mp3), str(salida)])
    words = []
    for s in json.loads(Path(salida).read_text(encoding="utf-8")):
        words += [(w["w"], w["s"], w["e"]) for w in s["words"]]
    return words


def alinear(texto, words):
    """Pone a cada palabra del texto (bien escrito) el tiempo de la palabra que oyó Whisper."""
    toks = []
    for raw in texto.split():
        big = raw.startswith("*") and raw.rstrip(".,;:?!…").endswith("*")
        toks.append({"t": raw.replace("*", ""), "big": big, "s": None, "e": None})
    A = [norm(t["t"]) for t in toks]
    B = [norm(w[0]) for w in words]
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, A, B, autojunk=False).get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                toks[i1 + k]["s"], toks[i1 + k]["e"] = words[j1 + k][1], words[j1 + k][2]
        elif op == "replace":
            s0, e0 = words[j1][1], words[j2 - 1][2]
            n = i2 - i1
            for k in range(n):
                toks[i1 + k]["s"] = s0 + (e0 - s0) * k / n
                toks[i1 + k]["e"] = s0 + (e0 - s0) * (k + 1) / n
    # huecos (palabras que Whisper no oyó): repartir entre las vecinas
    for i, t in enumerate(toks):
        if t["s"] is None:
            prev = next((toks[j]["e"] for j in range(i - 1, -1, -1) if toks[j]["e"] is not None), 0.0)
            nxt = next((toks[j]["s"] for j in range(i + 1, len(toks)) if toks[j]["s"] is not None), prev + 0.3)
            t["s"], t["e"] = prev, max(prev + 0.05, (prev + nxt) / 2)
    for t in toks:
        t["s"] += OFFSET
        t["e"] += OFFSET
    return toks


def agrupar(toks):
    grupos, g = [], []
    for i, t in enumerate(toks):
        corta = bool(g) and (
            len(g) >= 3 or t["big"] or g[-1]["big"]
            or re.search(r"[.,;:?!…]$", g[-1]["t"])
            or t["s"] - g[-1]["e"] > 0.45
            or sum(len(x["t"]) + 1 for x in g) + len(t["t"]) > 24
        )
        if corta:
            grupos.append(g)
            g = []
        g.append(t)
    if g:
        grupos.append(g)
    return grupos


# ---------- 2. video del día ----------
def escenas(toks, fotos, fin_voz):
    """Cambia de foto al empezar cada frase; si una escena dura más de 4,5 s la parte en una coma."""
    cortes = [0.0]
    for i in range(1, len(toks)):
        if re.search(r"[.?!:…]$", toks[i - 1]["t"]) and toks[i]["s"] - cortes[-1] >= 1.6:
            cortes.append(toks[i]["s"] - 0.06)
    finales = []
    for a, b in zip(cortes, cortes[1:] + [fin_voz]):
        finales.append(a)
        if b - a > 4.5:
            medio = [t["s"] - 0.06 for i, t in enumerate(toks) if i and a + 1.6 < t["s"] < b - 1.6 and toks[i - 1]["t"].endswith(",")]
            if medio:
                finales.append(min(medio, key=lambda x: abs(x - (a + b) / 2)))
    finales = sorted(set(finales))
    # Nunca más escenas que fotos: se quedan los cortes más cercanos a un reparto parejo
    n = len(fotos)
    if len(finales) > n:
        candidatos = finales[1:]
        elegidos = []
        for k in range(1, n):
            ideal = fin_voz * k / n
            libres = [c for c in candidatos if c not in elegidos and (not elegidos or c > elegidos[-1])]
            if libres:
                elegidos.append(min(libres, key=lambda c: abs(c - ideal)))
        finales = [0.0] + elegidos
    out = []
    for k, a in enumerate(finales):
        b = finales[k + 1] if k + 1 < len(finales) else fin_voz
        out.append((fotos[k % len(fotos)], round(a, 2), round(b - a, 2)))
    return out


CSS_VIDEO = """
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #1B2A41; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #1B2A41; }
      .clip { position: absolute; inset: 0; }
      .shot { overflow: hidden; }
      .shot .frame { position: absolute; inset: 0; transform-origin: 50% 40%; }
      .shot img { display: block; width: 100%; height: 100%; object-fit: cover; transform-origin: 50% 35%; }
      #shade { background: radial-gradient(ellipse 130% 42% at 50% 100%, rgba(27, 42, 65, 0.62) 0%, rgba(27, 42, 65, 0.25) 55%, rgba(27, 42, 65, 0) 80%); }
      #tags { display: flex; justify-content: flex-start; align-items: flex-start; padding: 220px 70px 0; }
      .tag { font-family: "Space Mono", monospace; font-weight: 700; font-size: 34px; letter-spacing: 0.06em; padding: 14px 24px; border-radius: 14px; background: #1B2A41; color: #F6F1E4; border: 3px solid #F6F1E4; }
      .cap { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 16px 14px; padding: 1230px 150px 0 70px; }
      .w { display: inline-block; font-family: "Archivo Black", sans-serif; font-size: 92px; line-height: 1.08; letter-spacing: -0.02em; text-transform: uppercase; color: #F6F1E4; background: #1B2A41; padding: 8px 22px 12px; border-radius: 18px; }
      .cap.big .w { font-size: 116px; padding: 10px 28px 16px; border-radius: 24px; }
      #end { background: #F6F1E4; overflow: hidden; }
      #end .glow { position: absolute; width: 1400px; height: 1400px; left: -160px; top: 120px; border-radius: 50%; background: radial-gradient(circle, rgba(139, 168, 137, 0.55) 0%, rgba(139, 168, 137, 0) 65%); }
      #ring { position: absolute; left: 240px; top: 240px; width: 600px; height: 600px; }
      #end .body { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 300px 70px 0; gap: 40px; }
      #avatar { width: 520px; height: 520px; border-radius: 50%; overflow: hidden; border: 12px solid #C8372B; }
      #avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
      #name { font-family: "Archivo Black", sans-serif; font-size: 128px; line-height: 0.95; letter-spacing: -0.03em; color: #1B2A41; text-align: center; }
      #label { font-family: "Space Mono", monospace; font-weight: 700; font-size: 32px; letter-spacing: 0.05em; color: #1B2A41; text-align: center; }
      #tagline { font-family: "Space Mono", monospace; font-size: 40px; color: #1B2A41; text-align: center; max-width: 900px; }
      #cta { margin-top: 20px; background: #C8372B; color: #F6F1E4; border-radius: 28px; padding: 30px 46px; text-align: center; width: 900px; }
      #cta b { display: block; font-family: "Archivo Black", sans-serif; font-weight: 400; font-size: 64px; letter-spacing: -0.02em; }
      #cta span { display: block; font-family: "Space Mono", monospace; font-size: 34px; margin-top: 8px; }
"""

JS_VIDEO = """
      const RED = "#C8372B", NAVY = "#1B2A41";
      const tl = gsap.timeline({ paused: true });
      document.querySelectorAll(".shot").forEach((shot, i) => {
        const start = parseFloat(shot.dataset.start), dur = parseFloat(shot.dataset.duration);
        tl.fromTo(shot.querySelector(".frame"), { scale: 1.07 }, { scale: 1, duration: 0.35, ease: "power3.out" }, start);
        tl.fromTo(shot.querySelector("img"), { scale: 1.0, yPercent: 0, xPercent: 0 },
          { scale: 1.09, yPercent: i % 2 ? -1.5 : 1.5, xPercent: i % 2 ? 1 : -1, duration: dur, ease: "none" }, start);
      });
      tl.fromTo("#tag-day", { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 0.3);
      document.querySelectorAll(".cap").forEach((cap) => {
        const words = [...cap.querySelectorAll(".w")];
        const capEnd = parseFloat(cap.dataset.start) + parseFloat(cap.dataset.duration);
        const big = cap.classList.contains("big");
        words.forEach((w, j) => {
          const t = parseFloat(w.dataset.t);
          const next = j + 1 < words.length ? parseFloat(words[j + 1].dataset.t) : capEnd;
          tl.fromTo(w, { opacity: 0, y: 22, scale: big ? 0.6 : 0.88, rotation: big ? -6 : 0 },
            { opacity: 1, y: 0, scale: 1, rotation: big ? -3 : 0, duration: big ? 0.3 : 0.16, ease: big ? "back.out(2.4)" : "back.out(2)" }, t);
          tl.set(w, { backgroundColor: RED }, t);
          tl.set(w, { backgroundColor: big ? RED : NAVY }, next);
        });
      });
      const E = parseFloat(document.getElementById("end").dataset.start);
      tl.fromTo("#end-glow", { scale: 0.85, opacity: 0.6 }, { scale: 1.08, opacity: 1, duration: CIERRE, ease: "sine.inOut" }, E);
      tl.fromTo("#ring", { rotation: 0, opacity: 0 }, { rotation: 90, opacity: 1, duration: CIERRE, ease: "none" }, E);
      tl.fromTo("#avatar", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.8)" }, E + 0.05);
      tl.fromTo("#name", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, E + 0.3);
      tl.fromTo("#label", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, E + 0.55);
      tl.fromTo("#tagline", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, E + 0.7);
      tl.fromTo("#cta", { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, E + 0.95);
      tl.to("#cta", { scale: 1.03, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" }, E + 1.6);
      window.__timelines["main"] = tl;
      tl.seek(0);
"""


def html_video(dia, d, toks, grupos, scenes, fin_voz, voz_dur):
    total = round(fin_voz + CIERRE, 2)
    shots = "\n".join(
        f'      <div id="p{k+1}" class="clip shot" data-start="{a}" data-duration="{dur}" data-track-index="0"><div class="frame">'
        f'<img src="assets/{foto}.png" alt="Abuela Nena" /></div></div>' for k, (foto, a, dur) in enumerate(scenes))
    caps = []
    for k, g in enumerate(grupos):
        a = round(g[0]["s"] - 0.05, 2)
        b = round(grupos[k + 1][0]["s"] - 0.05, 2) if k + 1 < len(grupos) else round(min(g[-1]["e"] + 0.35, fin_voz), 2)
        big = " big" if g[0]["big"] else ""
        spans = "".join(f'<span class="w" data-t="{round(t["s"], 2)}">{esc(t["t"])}</span>' for t in g)
        caps.append(f'      <div id="c{k+1}" class="clip cap{big}" data-start="{a}" data-duration="{round(b - a, 2)}" data-track-index="3">{spans}</div>')
    cierre = d["cierre"]
    return f"""<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      /* Abuela Nena · Día {dia} · {esc(d["tema"])} — hecho por fabrica.py */{CSS_VIDEO}    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1080" data-height="1920">
{shots}
      <div id="shade" class="clip" data-start="0" data-duration="{fin_voz}" data-track-index="1"></div>
      <div id="tags" class="clip" data-start="0" data-duration="{fin_voz}" data-track-index="2"><div id="tag-day" class="tag">DÍA {dia}</div></div>
{chr(10).join(caps)}
      <section id="end" class="clip" data-start="{fin_voz}" data-duration="{CIERRE}" data-track-index="0">
        <div class="glow" id="end-glow" data-layout-allow-overflow></div>
        <svg id="ring" viewBox="0 0 600 600" aria-hidden="true"><circle cx="300" cy="300" r="290" fill="none" stroke="#C8372B" stroke-width="6" stroke-dasharray="4 22" stroke-linecap="round" /></svg>
        <div class="body">
          <div id="avatar"><img src="assets/N17-perfil-1x1.png" alt="Foto de perfil de la Abuela Nena" /></div>
          <div id="name">ABUELA NENA</div>
          <div id="label">68 AÑOS · SANTOS SUÁREZ, LA HABANA</div>
          <div id="tagline">{esc(cierre["frase"])}</div>
          <div id="cta"><b>{esc(cierre["boton"])}</b><span>{esc(cierre["debajo"])}</span></div>
        </div>
      </section>
      <audio id="silbato" src="assets/silbato.mp3" data-start="0.05" data-duration="0.5" data-track-index="5" data-volume="0.55"></audio>
      <audio id="voz" src="assets/voz.mp3" data-start="{OFFSET}" data-duration="{round(voz_dur, 2)}" data-track-index="6" data-volume="1"></audio>
      <audio id="musica" src="assets/musica.mp3" data-start="0" data-duration="{total}" data-track-index="7" data-volume="0.16"></audio>
    </div>
    <script>
      const CIERRE = {CIERRE};{JS_VIDEO}    </script>
  </body>
</html>
""", total


# ---------- 3. historias ----------
CSS_HIST = """
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #1B2A41; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #1B2A41; }
      .clip { position: absolute; inset: 0; }
      .shot { overflow: hidden; }
      .shot .frame { position: absolute; inset: 0; transform-origin: 50% 40%; }
      .shot img { display: block; width: 100%; height: 100%; object-fit: cover; transform-origin: 50% 35%; }
      .shot .shade { position: absolute; inset: 0; background: radial-gradient(ellipse 130% 48% at 50% 100%, rgba(27, 42, 65, 0.7) 0%, rgba(27, 42, 65, 0.3) 55%, rgba(27, 42, 65, 0) 82%); }
      .day { position: absolute; left: 70px; top: 220px; font-family: "Space Mono", monospace; font-weight: 700; font-size: 34px; letter-spacing: 0.06em; padding: 14px 24px; border-radius: 14px; background: #1B2A41; color: #F6F1E4; border: 3px solid #F6F1E4; }
      .txt { position: absolute; left: 70px; right: 120px; top: 960px; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 16px 14px; }
      .txt.alto { top: 880px; }
      .t { display: inline-block; font-family: "Archivo Black", sans-serif; font-size: 96px; line-height: 1.06; letter-spacing: -0.02em; text-transform: uppercase; color: #F6F1E4; background: #1B2A41; padding: 8px 22px 12px; border-radius: 18px; }
      .t.red { background: #C8372B; }
      .t.xl { font-size: 128px; background: #C8372B; }
      .t.sm { font-size: 70px; }
      .sub { flex-basis: 100%; margin-top: 18px; }
      .sub span { display: inline-block; font-family: "Space Mono", monospace; font-weight: 700; font-size: 40px; line-height: 1.3; color: #1B2A41; background: #F6F1E4; padding: 14px 22px; border-radius: 14px; }
"""

JS_HIST = """
      const tl = gsap.timeline({ paused: true });
      document.querySelectorAll(".shot").forEach((shot, i) => {
        const s = parseFloat(shot.dataset.start), d = parseFloat(shot.dataset.duration);
        tl.fromTo(shot.querySelector(".frame"), { scale: 1.08 }, { scale: 1, duration: 0.45, ease: "power3.out" }, s);
        tl.fromTo(shot.querySelector("img"), { scale: 1, yPercent: 0 }, { scale: 1.1, yPercent: i % 2 ? -2 : 2, duration: d, ease: "none" }, s);
        tl.fromTo(shot.querySelector(".day"), { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, s + 0.2);
        shot.querySelectorAll(".t").forEach((t, j) => {
          const big = t.classList.contains("xl");
          tl.fromTo(t, { opacity: 0, y: 26, scale: big ? 0.6 : 0.88, rotation: big ? -6 : 0 },
            { opacity: 1, y: 0, scale: 1, rotation: big ? -2 : 0, duration: big ? 0.35 : 0.2, ease: big ? "back.out(2.4)" : "back.out(2)" },
            s + 0.5 + j * (big ? 0.45 : 0.28));
        });
        tl.fromTo(shot.querySelector(".sub span"), { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, s + 3.2);
      });
      window.__timelines["main"] = tl;
      tl.seek(0);
"""


def ficha(txt):
    """'*rojo*'  '!grande!'  '_pequeño_'  'normal'"""
    cls = "t"
    if txt.startswith("!") and txt.endswith("!") and len(txt) > 2:
        cls, txt = "t xl", txt[1:-1]
    elif txt.startswith("*") and txt.endswith("*"):
        cls, txt = "t red", txt[1:-1]
    elif txt.startswith("_") and txt.endswith("_"):
        cls, txt = "t sm", txt[1:-1]
        if txt.startswith("*") and txt.endswith("*"):
            cls, txt = "t sm red", txt[1:-1]
    return f'<span class="{cls}">{esc(txt)}</span>'


def html_historias(dia, d):
    secs = []
    for k, h in enumerate(d["historias"]):
        alto = " alto" if len(h["fichas"]) > 4 else ""
        fichas = "".join(ficha(f) for f in h["fichas"])
        secs.append(f"""      <section id="h{k+1}" class="clip shot" data-start="{k * HISTORIA}" data-duration="{HISTORIA}" data-track-index="0">
        <div class="frame"><img src="assets/{h['foto']}.png" alt="Abuela Nena" /></div>
        <div class="shade"></div>
        <div class="day">DÍA {dia}</div>
        <div class="txt{alto}">{fichas}<div class="sub"><span>{esc(h['debajo'])}</span></div></div>
      </section>""")
    total = HISTORIA * len(d["historias"])
    return f"""<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      /* Abuela Nena · Día {dia} · historias — hecho por fabrica.py */{CSS_HIST}    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1080" data-height="1920">
{chr(10).join(secs)}
      <audio id="musica" src="assets/musica.mp3" data-start="0" data-duration="{total}" data-track-index="5" data-volume="0.35"></audio>
    </div>
    <script>{JS_HIST}    </script>
  </body>
</html>
""", total


# ---------- 4. proyectos, comprobación y exportación ----------
def proyecto(nombre, fotos):
    p = VIDEOS / nombre
    if p.exists():
        shutil.rmtree(p)
    (p / "assets").mkdir(parents=True)
    for f in ("hyperframes.json", "package.json", "CLAUDE.md", "AGENTS.md"):
        shutil.copy(CORE_DIR / f, p / f)
    pk = json.loads((p / "package.json").read_text(encoding="utf-8"))
    pk["name"] = nombre
    (p / "package.json").write_text(json.dumps(pk, indent=2), encoding="utf-8")
    (p / "meta.json").write_text(json.dumps({"id": nombre, "name": nombre}), encoding="utf-8")
    for f in set(fotos):
        src = BANCO / f"{f}.png"
        if not src.exists():
            raise SystemExit(f"Falta la foto {src.name} en banco-fotos")
        shutil.copy(src, p / "assets" / src.name)
    return p


def comprobar(p):
    out = sh(["npx", "--yes", HF, "check"], cwd=p, check=False)
    ok = "Check passed" in out
    print(f"  check {p.name}: {'OK' if ok else 'FALLÓ'}")
    if not ok:
        print(out[-4000:])
        raise SystemExit("La comprobación de HyperFrames falló; no se exporta.")


def exportar(p, mp4):
    sh(["npx", "--yes", HF, "render", "-o", str(mp4)], cwd=p)


def ligero(src, dst, extra=None):
    cmd = ["ffmpeg", "-loglevel", "error", "-y"] + (extra or []) + ["-i", str(src)]
    af = "loudnorm=I=-16:TP=-1.5:LRA=11"
    if extra and "-t" in extra:
        t = float(extra[extra.index("-t") + 1])
        af = f"afade=t=in:d=0.25,afade=t=out:st={t - 0.5}:d=0.5," + af
    cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", "25", "-pix_fmt", "yuv420p", "-af", af,
            "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(dst)]
    sh(cmd)


def main():
    dia = int(sys.argv[1])
    cal = json.loads((AQUI / "calendario.json").read_text(encoding="utf-8"))
    d = next((x for x in cal["dias"] if x["dia"] == dia), None)
    if not d:
        raise SystemExit(f"El día {dia} no está en calendario.json")
    nn = f"{dia:02d}"
    voz = VOZ / f"dia{nn}.mp3"
    if not voz.exists():
        raise SystemExit(f"Falta la voz {voz}")
    MP4.mkdir(parents=True, exist_ok=True)
    sonidos = CORE_DIR / "scripts" / "sonidos.py"

    # Video
    print(f"Día {dia}: {d['tema']}")
    pv = proyecto(f"dia{nn}-video", d["fotos"] + ["N17-perfil-1x1"])
    shutil.copy(voz, pv / "assets" / "voz.mp3")
    words = transcribir(voz, pv / "transcript.json")
    toks = alinear(d["texto"], words)
    voz_dur = duracion(voz)
    fin_voz = round(OFFSET + voz_dur + 0.1, 2)
    grupos = agrupar(toks)
    sc = escenas(toks, d["fotos"], fin_voz)
    html, total = html_video(dia, d, toks, grupos, sc, fin_voz, voz_dur)
    (pv / "index.html").write_text(html, encoding="utf-8")
    sh([sys.executable, "-I", str(sonidos), str(pv / "assets"), str(total + 0.5)])
    for n in ("musica", "silbato"):
        sh(["ffmpeg", "-loglevel", "error", "-y", "-i", str(pv / "assets" / f"{n}.wav"), "-b:a", "160k", str(pv / "assets" / f"{n}.mp3")])
        (pv / "assets" / f"{n}.wav").unlink()
    carve = Path.home() / ".claude/skills/hyperframes-audio/scripts/carve.mjs"
    sh(["node", str(carve), "--comp", "index.html", "--bed", "musica", "--voice", "voz", "--core", str(CORE_DIR)], cwd=pv)
    print(f"  {len(grupos)} subtítulos, {len(sc)} fotos, {total} s")
    comprobar(pv)

    # Historias
    ph = proyecto(f"dia{nn}-historias", [h["foto"] for h in d["historias"]])
    hh, htotal = html_historias(dia, d)
    (ph / "index.html").write_text(hh, encoding="utf-8")
    sh([sys.executable, "-I", str(sonidos), str(ph / "assets"), str(htotal)])
    sh(["ffmpeg", "-loglevel", "error", "-y", "-i", str(ph / "assets" / "musica.wav"), "-b:a", "160k", str(ph / "assets" / "musica.mp3")])
    for n in ("musica.wav", "silbato.wav"):
        (ph / "assets" / n).unlink()
    comprobar(ph)

    # Exportar
    print("  exportando video…")
    crudo = MP4 / f"dia{nn}-video-crudo.mp4"
    exportar(pv, crudo)
    ligero(crudo, MP4 / f"dia{nn}-video.mp4")
    crudo.unlink()
    print("  exportando historias…")
    crudo = MP4 / f"dia{nn}-historias-crudo.mp4"
    exportar(ph, crudo)
    for k in range(len(d["historias"])):
        ligero(crudo, MP4 / f"dia{nn}-historia-{k+1}.mp4", ["-ss", str(k * HISTORIA), "-t", str(HISTORIA)])
    crudo.unlink()

    # Textos para publicar
    (MP4 / f"dia{nn}-textos.txt").write_text(
        f"DÍA {dia} · {d['tema']}\n\nDESCRIPCIÓN (Instagram / Facebook):\n{d['descripcion']}\n\n"
        f"Recuerda: activar la etiqueta de contenido IA al publicar.\n", encoding="utf-8")
    print("LISTO", *(p.name for p in sorted(MP4.glob(f"dia{nn}-*"))))


if __name__ == "__main__":
    main()
