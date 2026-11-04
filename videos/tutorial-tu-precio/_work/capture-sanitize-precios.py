# Limpia el HTML del área de gestora para el tutorial «Tu precio»: del portal clásico deja SOLO «Mis precios»
# (aumento general + precio de un producto). Uso: python -I capture-sanitize-precios.py raw.html clean.html "Nombre Completo" CODIGOREF "Zona"
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
src, dst, name, code, zone = sys.argv[1:6]
h = open(src, encoding='utf-8').read()
i = h.find('<div class="cvga-legacy">'); j = h.find('</main>', i)
leg = h[i:j]
a = leg.find('<section class="cvd-panel cvd-pricing-panel" id="precios">'); b = leg.find('</details></section>', a) + len('</details></section>')
keep = leg[a:b]
h = h[:i] + '<div class="cvga-legacy"><section class="cvd-dashboard cvd-app-shell">' + keep + '</section></div></div>\n' + h[j:]
h = h.replace('http://casaviva.company', 'https://casaviva.company')
for n in [name] + name.split():
    if len(n) > 3: h = h.replace(n, 'Tu nombre')
h = h.replace(code, 'TUCODIGO')
h = re.sub(r'(wa\.me/\d+)\?text=Hola%2C%20soy[^"]*', r'\1', h)  # Hola, soy <nombre> ... (codigo ...)
h = re.sub(r'(cvga-avatar" aria-hidden="true">)[^<]', r'\1T', h)
if zone: h = h.replace(' · ' + zone + '<', '<').replace('value="' + zone + '"', 'value=""')
h = re.sub(r'_wpnonce=[a-f0-9]+', '_wpnonce=0000000000', h)
h = re.sub(r'(name="(?:_wpnonce|cvd_gestora_prices_nonce)" value=")[a-f0-9]+', r'\g<1>0000000000', h)
h = re.sub(r'(nonce["\']?\s*[:=]\s*["\'])[a-f0-9]{10}', r'\g<1>0000000000', h)
h = re.sub(r'(data-nonce=")[a-f0-9]+', r'\g<1>0000000000', h)
h = re.sub(r'(nonce":")[a-f0-9]{10}', r'\g<1>0000000000', h, flags=re.I)  # restNonce, etc.
h = re.sub(r'<script[^>]*(hostinger-reach|sourcebuster|order-attribution)[^>]*>\s*</script>', '', h)
open(dst, 'w', encoding='utf-8').write(h)
for p in name.split() + [code, r'\b5\d{7}\b', r'[\w.+-]+@[\w-]+\.[\w.]+', r'[a-f0-9]{10}(?=["\'&])']:
    print('queda', p, '→', sorted(set(re.findall(p, h)))[:6])
