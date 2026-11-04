# Arma capture.html = HTML limpio + bloqueo de red (al principio de <head>) + capture-inject.html (antes de </body>).
# Uso: python -I -X utf8 capture-build.py clean.html capture-inject.html capture.html
import sys
src, inj, dst = sys.argv[1:4]
h = open(src, encoding='utf-8').read()
block = ("<script>/* captura: nada sale a la web */(function(){var never=function(){return new Promise(function(){});};"
         "window.fetch=never;navigator.sendBeacon=function(){return true;};var X=XMLHttpRequest.prototype;"
         "X.send=function(){};})();</script>")
i = h.find('<head')
i = h.find('>', i) + 1
h = h[:i] + block + h[i:]
j = h.rfind('</body>')
h = h[:j] + open(inj, encoding='utf-8').read() + h[j:]
open(dst, 'w', encoding='utf-8').write(h)
print('ok', len(h))
