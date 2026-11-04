# Pasa las demos y videos de la marca "Hebra Recta" a la marca real de Yonar
# (letrero REY DE ALISADOS: corona, serif con remates, negro + dorado cálido).
import re, sys, pathlib

COLORS = {
    "#1B1416": "#141210",  # ébano -> negro pared
    "#C8812E": "#E0A957",  # ámbar -> dorado luz
    "#9C5B3C": "#A67C3D",  # canela -> dorado oscuro
    "#F3F1EF": "#F6EEE2",  # perla -> crema
    "#8A817C": "#9A8F80",  # humo -> gris cálido
    "#2a2124": "#24201c", "#2A2124": "#24201C",
}
CROWN = ('<svg viewBox="0 0 300 150" width="{w}" aria-hidden="true">'
         '<path d="M20 120 L10 30 L80 80 L150 10 L220 80 L290 30 L280 120 Z" fill="#E0A957"/>'
         '<rect x="20" y="124" width="260" height="20" fill="#E0A957"/>'
         '<path d="M130 92 L150 70 L170 92 L150 114 Z" fill="#141210"/></svg>')
STRANDS = re.compile(r'<svg[^>]*viewBox="0 0 200 180"[^>]*?(?:width="(\d+)%?")?[^>]*>.*?</svg>', re.S)

def crown(m):
    w = m.group(1) or "60"
    try:
        w = str(int(int(w) * 1.4)) if not m.group(0).split('width="')[1].split('"')[0].endswith('%') else "70%"
    except Exception:
        w = "84"
    return CROWN.format(w=w)

for f in sys.argv[1:]:
    p = pathlib.Path(f)
    s = p.read_text(encoding="utf-8")
    for a, b in COLORS.items():
        s = s.replace(a, b)
    s = STRANDS.sub(crown, s)
    s = s.replace("family=Italiana&", "family=Gloock&").replace("family=Italiana", "family=Gloock")
    s = s.replace('"Italiana"', '"Gloock"').replace("Italiana,", "Gloock,").replace("Italiana-Regular.ttf", "Gloock-Regular.ttf")
    s = s.replace("font-family:Italiana", "font-family:Gloock").replace("font-family: Italiana", "font-family: Gloock")
    p.write_text(s, encoding="utf-8")
    print("ok", p.name, "estrellas restantes:", s.count('viewBox="0 0 200 180"'), "Italiana restante:", s.count("Italiana"))
