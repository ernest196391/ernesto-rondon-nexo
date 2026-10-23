#!/bin/bash
# Mezcla de audio de «La llamada» (25 s). Tiempos = los del montaje de hf/index.html.
set -e
cd "$(dirname "$0")/hf"
A=assets/hf/escena-a-v1.mp4; C=assets/hf/escena-c-v1.mp4; V=assets/voz; X=assets/sfx
RING="aevalsrc=exprs='(sin(2*PI*820*t)+0.7*sin(2*PI*1090*t)+0.25*sin(2*PI*2460*t))*(0.55+0.45*sin(2*PI*20*t))*0.22':s=48000:d=1.3"
TEL="aresample=44100,asetrate=44100*0.92,aresample=48000,highpass=f=300,lowpass=f=3400,acompressor=threshold=0.08:ratio=4:makeup=2,aecho=0.8:0.55:35:0.18,volume=3.2"
ffmpeg -v error -y -i $A -i $C -i $V/v1-pelicula.mp3 -i $V/v2-escondes.mp3 -i $V/v3-calor.mp3 -i $V/v4-movil.mp3 -i $V/v5-cuesta.mp3 \
  -i assets/suspense.mp3 -f lavfi -i "$RING" -f lavfi -i "$RING" \
  -i $X/whoosh-short.mp3 -i $X/pop.mp3 -i $X/riser.mp3 -i $X/impact-bass-1.mp3 -i $X/sparkle.mp3 \
  -filter_complex "
  [0:a]aresample=48000,asplit=4[A1][A3][A5][A6];
  [A1]atrim=0:2.6,asetpts=PTS-STARTPTS,afade=t=out:st=2.5:d=0.1[a1];
  [A3]atrim=3.85:5.25,asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=1.33:d=0.07,adelay=5267:all=1[a3];
  [A5]atrim=6.8:7.667,asetpts=PTS-STARTPTS,afade=t=in:d=0.03,adelay=10200:all=1[a5];
  [A6]atrim=8.45:10.05,asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=1.5:d=0.1,adelay=15750:all=1[a6];
  [1:a]aresample=48000,atrim=0:4.467,asetpts=PTS-STARTPTS,volume='if(lt(t,3.1),3.2,0.9)':eval=frame,afade=t=out:st=4.3:d=0.16,adelay=17350:all=1[c];
  [2:a]$TEL,adelay=2620:all=1[v1];
  [3:a]$TEL,adelay=6750:all=1[v2];
  [4:a]$TEL,adelay=11350:all=1[v3];
  [5:a]atrim=0:0.85,$TEL,adelay=12700:all=1[v4];
  [6:a]$TEL,adelay=13850:all=1[v5];
  [a1][a3][a5][a6][c][v1][v2][v3][v4][v5]amix=inputs=10:normalize=0,aformat=channel_layouts=stereo,apad=whole_dur=25[voces];
  [voces]asplit=2[vz][sc];
  [7:a]aresample=48000,atrim=0:25,volume=0.55,afade=t=out:st=24.6:d=0.4,aformat=channel_layouts=stereo[mus];
  [mus][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[musd];
  [8:a]volume=0.35,afade=t=out:st=1.1:d=0.2[r0];
  [9:a]atrim=0:0.55,afade=t=in:d=0.05,adelay=24450:all=1[r1];
  [10:a]aresample=48000,volume=0.5,adelay=10950:all=1[w1];
  [11:a]aresample=48000,asplit=3[p1][p2][p3];
  [p1]volume=0.55,adelay=11620:all=1[pp1];
  [p2]volume=0.55,adelay=13000:all=1[pp2];
  [p3]volume=0.5,adelay=22100:all=1[pp3];
  [12:a]aresample=48000,atrim=0:1.6,volume=0.3,afade=t=in:d=0.4,adelay=18880:all=1[ri];
  [13:a]aresample=48000,atrim=0:1.2,afade=t=out:st=0.8:d=0.4,volume=0.3,adelay=20475:all=1[im];
  [14:a]aresample=48000,volume=0.4,adelay=22400:all=1[sp];
  [r0][r1][w1][pp1][pp2][pp3][ri][im][sp]amix=inputs=9:normalize=0,aformat=channel_layouts=stereo,apad=whole_dur=25[fx];
  [vz][musd][fx]amix=inputs=3:normalize=0,atrim=0:25,alimiter=limit=0.89[out]" \
  -map "[out]" -ar 48000 -c:a pcm_s16le renders/mezcla.wav
ffmpeg -hide_banner -i renders/mezcla.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
