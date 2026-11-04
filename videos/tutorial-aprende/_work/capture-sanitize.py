# Limpia el HTML del área de gestora antes de capturarlo. Uso: python -I capture-sanitize.py raw.html clean.html "Nombre Completo" CODIGOREF "Zona"
import re, sys
src, dst, name, code, zone = sys.argv[1:6]
h = open(src, encoding='utf-8').read()
i = h.find('<div class="cvga-legacy">'); j = h.find('</main>', i)
h = h[:i] + '<div class="cvga-legacy"></div></div>\n' + h[j:]  # fuera clientes, ventas, perfil
h = h.replace('http://casaviva.company', 'https://casaviva.company')
h = h.replace(name, 'Tu nombre').replace(name.split()[0], 'Tu nombre').replace(code, 'TUCODIGO')
h = re.sub(r'(cvga-avatar" aria-hidden="true">)[^<]', r'\1T', h)
if zone: h = h.replace(' · ' + zone + '<', '<').replace('value="' + zone + '"', 'value=""')
h = re.sub(r'_wpnonce=[a-f0-9]+', '_wpnonce=0000000000', h)
h = re.sub(r'(nonce["\']?\s*[:=]\s*["\'])[a-f0-9]{10}', r'\g<1>0000000000', h)
h = re.sub(r'(data-nonce=")[a-f0-9]+', r'\g<1>0000000000', h)
h = re.sub(r'<script[^>]*(hostinger-reach|sourcebuster|order-attribution)[^>]*>\s*</script>', '', h)
open(dst, 'w', encoding='utf-8').write(h)
for p in [name.split()[0], code, r'\b5\d{7}\b', r'[\w.+-]+@[\w-]+\.[\w.]+']:
    print('queda', p, '→', sorted(set(re.findall(p, h)))[:5])
