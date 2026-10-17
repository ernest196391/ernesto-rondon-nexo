# Arma tmp/capture.html (tutorial «Las piedras»): HTML limpio + bloqueo de red al principio de <head> (fetch/XHR/sendBeacon
# nunca responden: nada se guarda en la web) + capture-inject-piedras.html antes de </body>.
# Uso: python -I -X utf8 capture-build-piedras.py clean.html capture-inject-piedras.html capture.html
import sys
src, inj, dst = sys.argv[1:4]
h = open(src, encoding='utf-8').read()
block = ("<script>(function(){window.fetch=function(){return new Promise(function(){});};"
         "navigator.sendBeacon=function(){return true;};XMLHttpRequest.prototype.send=function(){};})();</script>")
i = h.find('<head'); i = h.find('>', i) + 1
h = h[:i] + block + h[i:]
j = h.rfind('</body>')
h = h[:j] + open(inj, encoding='utf-8').read() + h[j:]
open(dst, 'w', encoding='utf-8').write(h)
print('ok', len(h))
