#!/bin/bash
# Uso: bash shot.sh <estado> <salida.png> [extra-query]   (captura 750x1624 del marco 375x812 @2x)
cd "$(dirname "$0")/tmp"
UD="$(cygpath -m /c/Users/Ernesto/AppData/Local/Temp/claude/C--Users-Ernesto-ernesto-rondon-nexo/c0dcc046-dc29-4c38-a4f1-1bc4ffe68052/scratchpad/chrome-prof)"
URL="file:///$(cygpath -m "$PWD")/frame.html?s=$1$3#estudio"
[ "$1" = menu ] && URL="file:///$(cygpath -m "$PWD")/frame.html?s=menu$3#inicio"; [ "$1" = home ] && URL="file:///$(cygpath -m "$PWD")/frame.html?s=home$3#inicio"
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --user-data-dir="$UD" --allow-file-access-from-files --force-device-scale-factor=2 --window-size=600,900 --hide-scrollbars --virtual-time-budget=12000 --screenshot="$(cygpath -m "$PWD")/full-$1$4.png" "$URL" 2>/dev/null
ffmpeg -loglevel error -y -i "full-$1$4.png" -vf crop=750:1624:0:0 "$2"
