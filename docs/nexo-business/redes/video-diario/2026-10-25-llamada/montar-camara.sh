#!/bin/bash
# Prepara los planos de cámara (sin audio) para HyperFrames, 1080x1920 30 fps.
# A = escena-a-v1.mp4 (Cúrru, Seedance 7a310121) · C = escena-c-v1.mp4 (Prosko, Seedance 40254fc8)
set -e
cd "$(dirname "$0")/hf/assets/hf"
V="scale=1080:1920:flags=lanczos,setsar=1"
seg () { # entrada inicio fin velocidad salida [filtro extra]
  local f="$V"; [ -n "$6" ] && f="$f,$6"
  if [ "$4" = "1" ]; then
    ffmpeg -v error -y -ss $2 -to $3 -i $1 -an -vf "$f,fps=30" -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p $5
  else
    ffmpeg -v error -y -ss $2 -to $3 -i $1 -an -vf "setpts=(PTS-STARTPTS)/$4,$f,framerate=fps=30" -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p $5
  fi
}
seg escena-a-v1.mp4 0    2.55 1   p1.mp4
seg escena-a-v1.mp4 2.55 3.85 0.5 p2.mp4
seg escena-a-v1.mp4 3.85 5.25 1   p3.mp4
seg escena-a-v1.mp4 5.25 6.8  0.45 p4.mp4
seg escena-a-v1.mp4 6.8  7.65 1   p5.mp4
printf "file p1.mp4\nfile p2.mp4\nfile p3.mp4\nfile p4.mp4\nfile p5.mp4\n" > lista.txt
ffmpeg -v error -y -f concat -safe 0 -i lista.txt -c copy camA.mp4
seg escena-a-v1.mp4 8.45 10.04 1 camA6.mp4
# C: la parte oscura más oscura (silueta) hasta que se enciende la luz (3,125 s)
seg escena-c-v1.mp4 0 4.45 1 camC.mp4 "eq=brightness=-0.10:gamma=0.62:saturation=0.7:enable='lt(t,3.11)'"
ffmpeg -v error -y -ss 0 -i escena-a-v1.mp4 -frames:v 1 -vf "$V" a-primer.jpg
for f in p1.mp4 p2.mp4 p3.mp4 p4.mp4 p5.mp4; do echo "$f $(ffprobe -v error -show_entries format=duration -of csv=p=0 $f)"; done; rm -f p1.mp4 p2.mp4 p3.mp4 p4.mp4 p5.mp4 lista.txt
for f in camA.mp4 camA6.mp4 camC.mp4; do echo "$f $(ffprobe -v error -show_entries format=duration -of csv=p=0 $f)"; done
