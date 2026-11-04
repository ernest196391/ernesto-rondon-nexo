# Limpia la ficha de producto (bajada con curl, con o sin ?ref=) para el tutorial «Tu precio».
# Uso: python -I capture-sanitize-prod.py raw.html clean.html "Nombre Completo" CODIGOREF TELEFONO
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
src, dst, name, code, phone = sys.argv[1:6]
h = open(src, encoding='utf-8').read()
for n in [name] + name.split():
    if len(n) > 3: h = h.replace(n, 'Tu nombre')
if code: h = h.replace(code, 'TUCODIGO')
if phone:
    local = phone[2:] if phone.startswith('53') else phone
    h = h.replace(phone, '5300000000').replace(local, '00000000').replace(local[:4] + ' ' + local[4:], '0000 0000')
h = re.sub(r'(nonce["\']?\s*[:=]\s*["\'])[a-f0-9]{10}', r'\g<1>0000000000', h, flags=re.I)
h = re.sub(r'_wpnonce=[a-f0-9]+', '_wpnonce=0000000000', h)
h = re.sub(r'(name="[\w-]*nonce[\w-]*" value=")[a-f0-9]+', r'\g<1>0000000000', h)
h = re.sub(r'<script[^>]*(hostinger-reach|sourcebuster|order-attribution|gtag|googletagmanager)[^>]*>\s*</script>', '', h)
open(dst, 'w', encoding='utf-8').write(h)
for p in name.split() + ([code] if code else []) + ([phone] if phone else []) + [r'[\w.+-]+@[\w-]+\.[\w]+']:
    print('queda', p, '->', sorted(set(re.findall(p, h)))[:6])
