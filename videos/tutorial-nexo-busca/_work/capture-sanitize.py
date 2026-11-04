# Limpia el HTML del área de gestora para la captura del menú (tutorial «NEXO Busca»): fuera clientes, ventas, perfil,
# nombre → «Tu nombre», código → TUCODIGO, sin zona, nonces a cero, sin scripts de terceros.
# Uso: python -I -X utf8 capture-sanitize.py raw.html clean.html meta.tsv   (meta.tsv = nombre<TAB>código<TAB>zona; no se imprime)
import re, sys
src, dst, meta = sys.argv[1:4]
name, code, zone = (open(meta, encoding='utf-8').read().strip('\r\n').split('\t') + ['', '', ''])[:3]
h = open(src, encoding='utf-8').read()
i = h.find('<div class="cvga-legacy">'); j = h.find('</main>', i)
h = h[:i] + '<div class="cvga-legacy"></div></div>\n' + h[j:]
h = h.replace('http://casaviva.company', 'https://casaviva.company')
for n in [name] + name.split():
    if len(n) > 3: h = h.replace(n, 'Tu nombre')
if code: h = h.replace(code, 'TUCODIGO')
h = re.sub(r'(wa\.me/\d+)\?text=Hola%2C%20soy[^"]*', r'\1', h)
h = re.sub(r'(cvga-avatar" aria-hidden="true">)[^<]', r'\1T', h)
if zone: h = h.replace(' · ' + zone + '<', '<').replace('value="' + zone + '"', 'value=""')
h = re.sub(r'_wpnonce=[a-f0-9]+', '_wpnonce=0000000000', h)
h = re.sub(r'(nonce["\']?\s*[:=]\s*["\'])[a-f0-9]{10}', r'\g<1>0000000000', h)
h = re.sub(r'(data-nonce=")[a-f0-9]+', r'\g<1>0000000000', h)
h = re.sub(r'(nonce":")[a-f0-9]{10}', r'\g<1>0000000000', h, flags=re.I)
h = re.sub(r'<script[^>]*(hostinger-reach|sourcebuster|order-attribution)[^>]*>\s*</script>', '', h)
open(dst, 'w', encoding='utf-8').write(h)
for lab, p in [('nombre', '|'.join(re.escape(x) for x in name.split() if len(x) > 3) or 'ZZZZ'), ('codigo', re.escape(code) if code else 'ZZZZ'), ('tel', r'\b5\d{7}\b'), ('email', r'[\w.+-]+@[\w-]+\.[a-z]{2,}'), ('nonce', r'[a-f0-9]{10}(?=["\'&])')]:
    print('queda', lab, '→', len(set(re.findall(p, h))))
