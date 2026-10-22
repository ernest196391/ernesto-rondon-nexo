#!/bin/sh
# Captura la infografía con Chrome headless (gratis, perfil temporal). Uso: sh captura.sh
cd "$(dirname "$0")"
PERFIL="$(mktemp -d)"
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --user-data-dir="$(cd "$PERFIL" && pwd -W)" --window-size=1280,853 --virtual-time-budget=8000 \
  --screenshot="$(pwd -W)/tmp.png" "file:///$(pwd -W)/ganadores-septiembre.html" 2>/dev/null
node -e "require('C:/Users/Ernesto/ernesto-rondon-nexo/node_modules/sharp')('tmp.png').jpeg({quality:93,chromaSubsampling:'4:4:4'}).toFile('ganadores-septiembre.jpg').then(i=>console.log(i.width+'x'+i.height))"
rm -rf tmp.png "$PERFIL"
