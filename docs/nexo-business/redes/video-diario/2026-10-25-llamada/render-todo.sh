#!/bin/bash
# Renderiza la versión principal y la de gestores y gestoras (la de gestoras se copia encima de hf/index.html y luego se restaura).
set -e
cd "$(dirname "$0")/hf"
npx --yes hyperframes@0.8.185 render -o renders/crudo.mp4 -f 30 --crf 16 > renders/render.log 2>&1
cp index.html renders/index-principal-copia.html
cp ../index-gestoras.html index.html
npx --yes hyperframes@0.8.185 render -o renders/crudo-gestoras.mp4 -f 30 --crf 16 > renders/render-g.log 2>&1 || true
cp renders/index-principal-copia.html index.html
echo LISTO
