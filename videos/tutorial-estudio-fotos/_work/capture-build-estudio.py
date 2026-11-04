# Arma capture.html (tutorial «Estudio de fotos»): HTML limpio + red falsa al principio de <head> (respuestas reales guardadas
# en tmp/fake.js para producto/prompt/subir/tienda; lo demás nunca responde) + capture-inject-estudio.html antes de </body>.
# La galería de la config se cambia por la foto de Gemini de Dany (copia local). Nada sale a la web.
# Uso: python -I -X utf8 capture-build-estudio.py clean.html fake.js capture-inject-estudio.html capture.html
import sys, re, json
src, fake, inj, dst = sys.argv[1:5]
h = open(src, encoding='utf-8').read()
f = open(fake, encoding='utf-8').read()
block = ("<script>" + f + "(function(){var never=function(){return new Promise(function(){});};var F=window.__FAKE;"
         "var ok=function(o){return Promise.resolve(new Response(JSON.stringify(o),{status:200,headers:{'Content-Type':'application/json'}}));};"
         "window.fetch=function(u){u=String(u&&u.url||u);if(u.indexOf('estudio/producto')>-1)return ok(F.producto);if(u.indexOf('estudio/prompt')>-1)return ok(F.prompt);"
         "if(u.indexOf('estudio/subir')>-1)return new Promise(function(r){setTimeout(function(){r(ok(F.subir));},200);}).then(function(x){return x;});"
         "if(u.indexOf('estudio/tienda')>-1)return ok(F.tienda);if(u.indexOf('estudio/base')>-1)return never();return never();};"
         "navigator.sendBeacon=function(){return true;};var X=XMLHttpRequest.prototype;X.send=function(){};})();</script>")
i = h.find('<head'); i = h.find('>', i) + 1
h = h[:i] + block + h[i:]
h = re.sub(r'("gallery":)\[.*?\](,"left")', r'\1[]\2', h, count=1)
j = h.rfind('</body>')
h = h[:j] + open(inj, encoding='utf-8').read() + h[j:]
open(dst, 'w', encoding='utf-8').write(h)
print('ok', len(h))
