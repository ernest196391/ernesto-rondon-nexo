# Fábrica diaria de la Abuela Nena

Hace cada día **1 video + 5 historias** de la Abuela Nena y se los manda a Ernesto para aprobar.
La ejecuta la skill `/nena-hoy` (y la tarea programada "Abuela Nena · contenido del día").

## Piezas
| Archivo | Qué es |
|---|---|
| `calendario.json` | Lo que dice y enseña cada día (voz, subtítulos, fotos, foto nueva, cierre, 5 historias, descripción). |
| `estado.json` | En qué día vamos y qué se envió o publicó. |
| `verificar_voz.py N` | Whisper local: comprueba que la voz del día dice el guion (≥ 90 %). |
| `enviar.py N [--padre]` | Manda el día N por WhatsApp (bot, herramienta `cv`): a Ernesto para aprobar, o con `--padre` a Ernesto Padre cuando Ernesto dice "publica". |
| `fabrica.py N` | Monta y exporta el día N: transcribe la voz, pone subtítulos palabra a palabra, cambia de foto en cada frase, añade música y silbato, pasa `hyperframes check` y exporta MP4 ligeros. |

## Formato del calendario
- `voz`: tal como se dice (números en letras). `texto`: lo mismo con números en cifras; `*palabra*` = palabra grande en rojo.
- `fotos`: nombres del `banco-fotos/` en el orden en que salen (una por frase).
- Fichas de historias: `*rojo*`, `!grande!`, `_pequeño_`, `_*pequeño rojo*_`. Más de 4 fichas → el texto sube solo.

## Coste por día
Foto nueva 2 créditos + voz ~2,3 créditos. El montaje y la exportación son gratis (HyperFrames + ffmpeg + faster-whisper, todo local).

## Necesita
Python 3.12 con numpy y faster-whisper, ffmpeg, Node y `npx hyperframes@0.8.150`. La mezcla de música usa el `node_modules` de `videos/dia01-presentacion` (no borrarlo).
