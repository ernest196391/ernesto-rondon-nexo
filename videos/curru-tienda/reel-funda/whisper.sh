#!/bin/bash
# Transcribe el audio de un video con Whisper (Groq, whisper-large-v3) en el VPS; deja <video>.whisper.json con
# palabras y tiempos. La clave no sale del VPS. Uso: bash whisper.sh 10-escena-v1.mp4
set -e
V="$1"; B="${V%.mp4}"
FF=/c/Users/Ernesto/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe
SSH="ssh -i $HOME/.ssh/vivabot_vps -o BatchMode=yes root@179.236.242.212"
"$FF" -hide_banner -nostdin -v error -y -i "$V" -vn -ac 1 -ar 16000 -c:a libopus -b:a 32k "$B.ogg"
$SSH 'mkdir -p /root/archivos/curru-tienda/reel-funda'
scp -q -i "$HOME/.ssh/vivabot_vps" -o BatchMode=yes "$B.ogg" root@179.236.242.212:/root/archivos/curru-tienda/reel-funda/
$SSH "K=\$(grep '^GROQ_API_KEY=' /root/vivabot/.env | cut -d= -f2- | tr -d '\"'); curl -s https://api.groq.com/openai/v1/audio/transcriptions -H \"Authorization: Bearer \$K\" -F file=@/root/archivos/curru-tienda/reel-funda/$B.ogg -F model=whisper-large-v3 -F language=es -F response_format=verbose_json -F 'timestamp_granularities[]=word' -F 'timestamp_granularities[]=segment'" > "$B.whisper.json"
node -e "const j=require('./$B.whisper.json'); if(!j.text){console.log(JSON.stringify(j).slice(0,400)); process.exit(1)} console.log(j.text); console.log((j.words||[]).map(w=>w.word+'@'+w.start.toFixed(2)).join(' '))"
