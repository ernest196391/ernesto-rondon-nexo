# Copia las demos (calendario + tienda) a la carpeta del cliente y cambia lo mecánico desde cliente.json:
# colores, fuentes, nombre del negocio, dueño y local. Las listas SERVICES / productos las ajusta Claude a mano.
#   python kit_demo.py docs/clientes/<slug>
import json, re, shutil, sys
from pathlib import Path

PLANT = Path(__file__).resolve().parent.parent
cli = Path(sys.argv[1])
c = json.loads((cli / "cliente.json").read_text(encoding="utf-8"))
m = c["marca"]

# Valores de la plantilla (caso Yonar) -> valores del cliente
textos = {
    "Rey de Alisados": c["negocio"],
    "Yonar": c["dueno"],
    "Salón Capadocia, Vedado": c.get("local", "Salón Capadocia, Vedado"),
    "Gloock": m["fuente_titulo"],
    "Instrument Sans": m["fuente_texto"],
}
colores = {"--ebano": m["color_fondo"], "--ambar": m["color_acento"]}
for k in ("perla", "canela", "humo", "linea"):
    if m.get(f"color_{k}"):
        colores[f"--{k}"] = m[f"color_{k}"]

for demo in ("calendario", "tienda"):
    dst = cli / demo
    if dst.exists():
        sys.exit(f"Ya existe {dst}; bórrala o renómbrala antes.")
    shutil.copytree(PLANT / "demos" / demo, dst)
    f = dst / "index.html"
    html = f.read_text(encoding="utf-8")
    for viejo, nuevo in textos.items():
        if viejo != nuevo:
            html = html.replace(viejo, nuevo)
    for var, val in colores.items():
        html = re.sub(rf"{var}:#[0-9A-Fa-f]{{3,8}}", f"{var}:{val}", html)
    html = html.replace("#E0A957", m["color_acento"])  # acento usado en los SVG
    f.write_text(html, encoding="utf-8")
    print("OK", f)

print("\nFalta a mano: SERVICES/STYLISTS (calendario) y productos/GIFTS/textos (tienda) según cliente.json.")
if "Google" not in m.get("nota_fuentes", "") and m["fuente_titulo"] != "Gloock":
    print("Ojo: añade el <link> de Google Fonts para", m["fuente_titulo"], "y", m["fuente_texto"])
