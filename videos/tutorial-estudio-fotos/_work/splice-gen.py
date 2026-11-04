# Arma _work/gen-scenes.mjs del tutorial «Estudio de fotos» a partir del generador de NEXO Busca (cabecera y final)
# y de _work/scenes-estudio.part.mjs (escenas). Uso: python -I -X utf8 _work/splice-gen.py  (desde la carpeta del proyecto)
import re
src = open('_work/gen-scenes.mjs', encoding='utf-8').read()
part = open('_work/scenes-estudio.part.mjs', encoding='utf-8').read()
top = src[:src.index('// ---------------- timing (absolute seconds) ----------------')]
rest = src[src.index('for (const id of ids) fs.writeFileSync'):]
top = top.replace('// Genera index.html + compositions para tutorial-nexo-busca (tutorial «NEXO Busca», gestoras).\n// Adaptado del generador de tutorial-tu-precio. Capturas de NEXO Busca en el marco 780x1688 (390x844 @2x); el menú, 750x1624.',
                  '// Genera index.html + compositions para tutorial-estudio-fotos (tutorial «Mi estudio de fotos», gestoras).\n// Adaptado del generador de tutorial-nexo-busca. Todas las capturas en el marco 750x1624 (375x812 @2x).')
top = top.replace('const geo = (w = 780) =>', 'const geo = (w = 750) =>')
top = top.replace("data-layout-allow-overlap>Hoy</div>", "data-layout-allow-overlap>${opts.day || 'Hoy'}</div>")
i0 = rest.index('const CUES = [')
i1 = rest.index('];', i0) + 2
cues = """const CUES = [
  [0, '¿Tu foto sale [oscura],'],
  [0, 'o el producto sale [en su caja]?'],
  [1, 'Nos lo dijeron.'],
  [1, 'Nana: la tienda está oscura,'],
  [1, 'mi teléfono [no tira buenas fotos].'],
  [1, 'Dayami: fotos de todas las cortinas'],
  [1, 'de baño, [para enviar a un cliente].'],
  [1, '[Las escuchamos].'],
  [2, 'Ahora tienes tu [estudio de fotos].'],
  [2, 'De una foto normal, sale'],
  [2, 'una [foto bonita] para vender.'],
  [2, 'Mira esta, la hizo [Dany].'],
  [3, 'Está en tu área.'],
  [3, 'Abre el menú, y en Herramientas,'],
  [3, 'toca: [Mi estudio de fotos].'],
  [4, 'Busca [tu producto],'],
  [4, 'y elige cómo la quieres.'],
  [4, 'Por ejemplo: [en un baño bonito].'],
  [5, 'Copia [la instrucción],'],
  [5, 'y guarda la foto del producto.'],
  [5, 'Abre [Gemini], que es gratis'],
  [5, 'con tu Gmail.'],
  [5, 'En Cuba [necesita VPN].'],
  [5, 'Adjunta la foto, pega la instrucción,'],
  [5, 'y [envía].'],
  [6, 'Descarga la foto que te hizo Gemini.'],
  [6, 'Apaga la VPN, y toca:'],
  [6, '[Subir mi foto de Gemini].'],
  [7, 'Ya está en [tu galería].'],
  [7, 'Descárgala, compártela con tu cliente,'],
  [7, 'o [ponla en tu tienda].'],
  [8, 'Es [gratis].'],
  [8, '¿Dudas? [Escríbeme].'],
];"""
rest = rest[:i0] + cues + rest[i1:]
rest = re.sub(r"for \(let i = 0; i < words\.length - 1; i\+\+\) if \(/\^\\s\*Nadie\$/.*?\n", '', rest)
rest = re.sub(r"words\.forEach\(\(w\) => \{ if \(/Calabasar/.*?\n", "words.forEach((w) => { if (/^\\\\s*Dani\\\\.?$/.test(w.word)) w.word = w.word.replace('Dani', 'Dany'); });\n", rest)
rest = rest.replace("'<title>Tutorial: NEXO Busca</title>'", "'<title>Tutorial: Mi estudio de fotos</title>'")
rest = rest.replace('const phoneDur = f2(cuts[9] - cuts[1]);', 'const phoneDur = f2(cuts[8] - cuts[1]);')
rest = rest.replace('Gestoras · NEXO Busca<', 'Gestoras · Estudio de fotos<')
old = "fs.writeFileSync(`${P}/compositions/phone-shell.html`, fs.readFileSync(`${P}/compositions/phone-shell.html`, 'utf8').replace(/immediateRender: false \\}, [\\d.]+\\);/, `immediateRender: false }, ${shellExit});`));"
assert old in rest, 'no encuentro la línea del marco del teléfono'
new = """// marco del teléfono: se va en el antes/después (S3) y vuelve en S4
const hideAt = f2(cuts[2] - cuts[1] - 0.05), showAt = f2(cuts[3] - cuts[1]);
const shellTl = `          tl.fromTo("#ps-body", { opacity: 0, y: 160 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0);
          tl.fromTo("#ps-body", { opacity: 1, y: 0 }, { opacity: 0, y: 110, duration: 0.4, ease: "power2.in", immediateRender: false }, ${hideAt});
          tl.fromTo("#ps-body", { opacity: 0, y: 160 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", immediateRender: false }, ${showAt});
          tl.fromTo("#ps-body", { opacity: 1, y: 0 }, { opacity: 0, y: 110, duration: 0.42, ease: "power2.in", immediateRender: false }, ${shellExit});
`;
let shell = fs.readFileSync(`${P}/compositions/phone-shell.html`, 'utf8');
shell = shell.replace(/( {10}tl\\.fromTo\\("#ps-body"[^\\n]*\\n)+/, shellTl);
fs.writeFileSync(`${P}/compositions/phone-shell.html`, shell);"""
rest = rest.replace(old, new)
open('_work/gen-scenes.mjs', 'w', encoding='utf-8').write(top + part + rest)
print('ok')
