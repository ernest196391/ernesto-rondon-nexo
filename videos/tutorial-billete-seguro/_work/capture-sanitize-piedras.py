# Limpia el HTML del área (cuenta de prueba 45 con el cálculo de ejemplo) para las capturas del tutorial «Las piedras».
# Fuera clientes/ventas/perfil (cvga-legacy), nombre → «Tu nombre», código → TUCODIGO, sin zona, nonces a cero, sin scripts
# de terceros, y los vales inventados (#9901xx) con productos y fechas de ejemplo.
# Uso: python -I -X utf8 capture-sanitize-piedras.py raw.html clean.html meta.tsv
import re, sys
src, dst, meta = sys.argv[1:4]
name, code, zone = (open(meta, encoding='utf-8').read().strip('\r\n').split('\t') + ['', '', ''])[:3]
h = open(src, encoding='utf-8').read()
i = h.find('<div class="cvga-legacy">'); j = h.find('</main>', i)
h = h[:i] + '<div class="cvga-legacy"></div></div>\n' + h[j:]
h = h.replace('http://casaviva.company', 'https://casaviva.company')
h = h.replace(name, 'Tu nombre').replace('Hola, ' + name.split()[0] + '<', 'Hola, Tu nombre<')
if code: h = h.replace(code, 'TUCODIGO')
h = re.sub(r'(wa\.me/\d+)\?text=Hola%2C%20soy[^"]*', r'\1', h)
h = re.sub(r'(cvga-avatar" aria-hidden="true">)[^<]', r'\1T', h)
if zone: h = h.replace(' · ' + zone + '<', '<').replace('value="' + zone + '"', 'value=""')
h = re.sub(r'_wpnonce=[a-f0-9]+', '_wpnonce=0000000000', h)
h = re.sub(r'(nonce["\']?\s*[:=]\s*["\'])[a-f0-9]{10}', r'\g<1>0000000000', h)
h = re.sub(r'(data-nonce=")[a-f0-9]+', r'\g<1>0000000000', h)
h = re.sub(r'(nonce":")[a-f0-9]{10}', r'\g<1>0000000000', h, flags=re.I)
h = re.sub(r'<script[^>]*(hostinger-reach|sourcebuster|order-attribution)[^>]*>\s*</script>', '', h)
vales = {
    '990101': ('4106', 'Olla de presión 6 L', 'Hecho el 3/10 · cobrado el 5/10'),
    '990102': ('4119', 'Juego de sábanas ×2', 'Hecho el 7/10 · cobrado el 9/10'),
    '990103': ('4142', 'Ventilador de pie, Set para baño 3 piezas', 'Hecho el 12/10 · cobrado el 14/10'),
}
for k, (num, prod, when) in vales.items():
    h = h.replace(f'<b>Vale #{k}</b><small></small>', f'<b>{prod}</b><small>{when}</small>').replace(f'#{k}<', f'#{num}<')
# quitar «Todavía no cuentan» si saliera (pedidos de la cuenta de prueba)
h = re.sub(r'<h3 class="cvga-vales-sub">Todavía no cuentan</h3>\s*<ul class="cvga-vales is-waiting">.*?</ul>', '', h, flags=re.S)
open(dst, 'w', encoding='utf-8').write(h)
checks = [('nombre', re.escape(name)), ('BORRAR', 'BORRAR'), ('codigo', re.escape(code) if code else 'ZZZZ'), ('tel', r'\b5\d{7}\b'),
          ('email', r'[\w.+-]+@[\w-]+\.[a-z]{2,}'), ('nonce', r'[a-f0-9]{10}(?=["\'&])'), ('vale99', r'99010\d')]
for lab, p in checks:
    print('queda', lab, '→', len(set(re.findall(p, h))))
