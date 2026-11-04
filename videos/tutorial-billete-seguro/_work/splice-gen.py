# Arma _work/gen-scenes.mjs del tutorial «Las piedras» a partir del generador del tutorial «Estudio de fotos» (cabecera y final)
# y de _work/scenes-piedras.part.mjs (escenas). Uso: python -I -X utf8 _work/splice-gen.py  (desde la carpeta del proyecto)
import re
NL = chr(10)
src = open('_work/gen-scenes-base-estudio.mjs', encoding='utf-8').read()
part = open('_work/scenes-piedras.part.mjs', encoding='utf-8').read()
top = src[:src.index('// ---------------- timing (absolute seconds) ----------------')]
rest = src[src.index('for (const id of ids) fs.writeFileSync'):]
top = re.sub(r'^// Genera index\.html.*?\n// Adaptado.*?\n', '// Genera index.html + compositions para tutorial-piedras (tutorial «Las piedras», programa de gestoras).\n// Adaptado del generador de tutorial-estudio-fotos. Todas las capturas en el marco 750x1624 (375x812 @2x).\n', top, count=1, flags=re.S)
i0 = rest.index('const CUES = [')
i1 = rest.index('];', i0) + 2
cues = """const CUES = [
  [0, 'Ahora vender y traer a otras gestoras'],
  [0, '[te da más].'],
  [1, 'Cada venta tuya, [entregada y cobrada],'],
  [1, 'te da puntos.'],
  [1, 'Un punto es [un dólar]'],
  [1, 'que le queda limpio a la tienda.'],
  [2, 'En el menú toca [Mi piedra].'],
  [2, 'Ahí ves [cada vale] con sus puntos.'],
  [3, 'Con los puntos de [tu equipo]'],
  [3, 'cada mes subes de piedra.'],
  [3, 'Bronce con 65 puntos'],
  [3, 'son [5.000 pesos].'],
  [3, 'Plata con 130 puntos'],
  [3, '[10.000 pesos].'],
  [3, 'Oro con 195 puntos'],
  [3, '[15.000 pesos].'],
  [3, 'Y así hasta [Corona].'],
  [4, 'Para invitar, abre [Mi equipo].'],
  [4, 'En Invita a otra gestora,'],
  [4, 'toca [Mandar por WhatsApp].'],
  [5, 'Ganas el [1%] de lo que vendan'],
  [5, 'tus invitadas durante [12 meses],'],
  [5, 'y si eres Plata, el [medio por ciento]'],
  [5, 'de las invitadas de ellas.'],
  [5, 'Para cobrarlo, entrega al menos'],
  [5, '[una venta tuya] ese mes.'],
  [6, 'Te lo decimos claro,'],
  [6, 'el bono [depende de lo que gane el equipo].'],
  [6, 'Sale de un fondo,'],
  [6, 'del [15%] de la ganancia.'],
  [6, 'Si no alcanza, ese mes'],
  [6, '[se paga una parte]'],
  [6, 'y lo cobras en [Pedir mi pago].'],
  [7, 'Está [en prueba].'],
  [7, 'Dinos [qué no entiendes].'],
];"""
rest = rest[:i0] + cues + rest[i1:]
j0 = rest.index(r"words.forEach((w) => { if (/^\s*Dani"); old_fix = rest[j0:rest.index(NL, j0) + 1]
rest = rest.replace(old_fix, r"words.forEach((w) => { if (/^\s*Bronze$/.test(w.word)) w.word = w.word.replace('Bronze', 'Bronce'); }); // Whisper escribe «Bronze» con contexto; aislada se oye «bronce» (comprobado)" + NL)
rest = rest.replace("'<title>Tutorial: Mi estudio de fotos</title>'", "'<title>Tutorial: Las piedras</title>'")
rest = rest.replace('const phoneDur = f2(cuts[8] - cuts[1]);', 'const phoneDur = f2(cuts[7] - cuts[1]);')
rest = rest.replace("bg.replace(/Gestoras · [^<]+</, 'Gestoras · Estudio de fotos<')", "bg.replace(/Gestoras · [^<]+</, 'Gestoras · Las piedras<')")
i2 = rest.index('// marco del teléfono: se va en el antes/después')
i3 = rest.index('fs.writeFileSync(`${P}/compositions/phone-shell.html`, shell);')
rest = rest[:i2] + r"""// marco del teléfono: entra en S2 y se va al final de S7
const shellTl = `          tl.fromTo("#ps-body", { opacity: 0, y: 160 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0);
          tl.fromTo("#ps-body", { opacity: 1, y: 0 }, { opacity: 0, y: 110, duration: 0.42, ease: "power2.in", immediateRender: false }, ${shellExit});
`;
let shell = fs.readFileSync(`${P}/compositions/phone-shell.html`, 'utf8');
shell = shell.replace(/( {10}tl\.fromTo\("#ps-body"[^\n]*\n)+/, shellTl);
""" + rest[i3:]
open('_work/gen-scenes.mjs', 'w', encoding='utf-8').write(top + part + rest)
print('ok')
