#!/bin/bash
# Une video (HyperFrames) + mezcla, audio a -14 LUFS (loudnorm en dos pasadas) y saca las 3 versiones.
set -e
cd "$(dirname "$0")"
R=hf/renders; N=casa-viva-llamada-2026-10-25
M=$(ffmpeg -hide_banner -i $R/mezcla.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g () { echo "$M" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s)['$1']))"; }
LN="loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
ffmpeg -v error -y -i $R/mezcla.wav -af "$LN" -ar 48000 $R/mezcla-14.wav
ffmpeg -v error -y -i $R/crudo.mp4 -i $R/mezcla-14.wav -map 0:v -map 1:a -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest $N.mp4
ffmpeg -v error -y -i $R/crudo.mp4 -i $R/mezcla-14.wav -map 0:v -map 1:a -c:v libx264 -b:v 2800k -maxrate 3200k -bufsize 6000k -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart -shortest $N-fb.mp4
ffmpeg -v error -y -i $R/crudo-gestoras.mp4 -i $R/mezcla-14.wav -map 0:v -map 1:a -c:v libx264 -b:v 2800k -maxrate 3200k -bufsize 6000k -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart -shortest $N-gestoras.mp4
for f in $N.mp4 $N-fb.mp4 $N-gestoras.mp4; do echo "$f $(du -h $f | cut -f1) $(ffprobe -v error -show_entries format=duration -of csv=p=0 $f)s"; done
ffmpeg -hide_banner -i $N.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+I:|Peak:" | tail -2
