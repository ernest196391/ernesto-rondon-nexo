# /menu-360 · prompts y comandos que funcionaron (Panda26, 3-nov-2026)

Cambia solo lo que va entre <ángulos>. Todo en Higgsfield (MCP), con el SÍ de Ernesto al coste.

## 1. Foto de estudio por producto · `gpt_image_2_5`, 1:1 · 0,25 créditos
Referencia (`image_references`): la foto real del producto (subida con `media_upload` + curl PUT + `media_confirm`).
```
Premium food studio product photo, square. Exactly the <producto> from the reference: <qué se ve: pan, relleno, envoltorio con su logo>.
No hands, no <lo que sobre en la foto: bebida, persona, botella>. The product sits centered, three-quarter view, on a small low round
matte black turntable pedestal with a very thin glowing <color de acento en hex> ring on its edge. Pure deep black seamless background.
Warm <color> rim light from behind, soft golden key light from front-left, faint steam, glossy appetizing realism, sharp focus.
Product fills about 60% of the frame, generous empty black margin all around. No text added, no other props.
```
- Bebidas: «cold condensation droplets», «Cup fills about 60% of the frame height».
- Si NO hay foto real del producto, se puede inventar con la foto del envoltorio de referencia, pero se marca `"foto_ia": true` en el JSON.
- Guardar como `docs/clientes/<slug>/generado/estudio/<id>.png` (el id del producto en el JSON).

## 2. Giro 360° · `kling3_0`, mode `pro`, 5 s, 1:1, sound `off` · 8,75 créditos
`start_image` y `end_image` = el MISMO job id de la foto de estudio (así el giro cierra en bucle).
```
Product turntable shot. The black pedestal is a motorized turntable that rotates the <producto> one full 360-degree turn at a slow
constant speed, ending exactly where it started. The camera is completely locked off, no zoom, no camera movement. Lighting stays fixed,
background stays pure black, the thin <color> ring on the pedestal glows steadily, faint steam rises. The <partes> keep exactly the
same shape throughout.
```
- Revisa SIEMPRE una tira de 8 fotogramas antes de usarlo:
  `ffmpeg -i <id>.mp4 -vf "fps=8/5,scale=180:180,tile=8x1" -frames:v 1 tira.jpg`
- En Panda26: 3 de 5 giraron completos, el pan con croquetas medio giro (vale) y el hot dog mixto casi nada (cosas inclinadas en
  bandeja giran poco). Repetir uno cuesta otros 8,75: solo con SÍ.
- Guardar como `docs/clientes/<slug>/generado/giros/<id>.mp4`.

## 3. Video gancho (opcional) · imagen de inicio + video
Imagen de inicio · `gpt_image_2_5`, 9:16 · 0,25 · referencias: foto del local + foto del producto estrella + el cartel/logo.
```
Vertical photorealistic shot, first-person view sitting at a table in front of the <NOMBRE> <tipo de local> shown in reference 1
(<cómo es: madera, colores, logo>, sunny Havana afternoon, warm golden light). On the table a small black tablet stand shows the
'<NOMBRE> MENÚ' screen. In the center of the table floats a softly glowing holographic <producto estrella> exactly like reference 2,
with a small translucent glass label above it reading '<NOMBRE DEL PRODUCTO EN MAYÚSCULAS>' and below '<precio> CUP'. Under it,
subtle translucent holographic controls etched on the wood: the logo, the word 'MENÚ', and three round buttons (previous, pause, next).
A man's hand with a wristwatch enters from bottom right, index finger about to tap the 'next' button. Clean, premium, cinematic food
ad look, shallow depth of field. Text must be spelled exactly.
```
Video · 10 s, 9:16, sin audio:
- **Primero prueba `kling3_0` std (15 créditos).** Seedance 2.5 omni_reference (70 créditos) solo si Ernesto quiere la versión buena.
```
Static locked-off first-person camera, same scene as the start image. The glowing holographic <producto 1> floats and slowly rotates
for the first 2 seconds. At 2s the finger taps the glowing 'next' button: a soft ripple, it dissolves into golden light particles and
a holographic <producto 2> appears in the same spot, slowly rotating, with its glass label '<NOMBRE 2>' '<precio 2> CUP'. At 6s the
finger taps 'next' again and a holographic <producto 3> appears, label '<NOMBRE 3>' '<precio 3> CUP'. Realistic food, premium
cinematic food advertising look, smooth transitions, no camera shake, no extra text.
```
- La IA a veces se salta una etiqueta (en Panda26, la del frappé): ponla tú con una imagen PNG encima y ffmpeg `overlay` + `fade`.
- Sonidos gratis (`docs/nexo-business/redes/recursos/sfx/`): `click` en cada toque, `whoosh-short` + `sparkle` al aparecer, `chime` al final.
  Mezcla con `adelay` y `amix=normalize=0` (ver el comando en el historial de Panda26, ESTADO 3-nov).
- Guardar como `docs/clientes/<slug>/generado/video-gancho-<slug>.mp4` y la imagen de inicio como `generado/video-inicio.png`.

## Bajar lo que hace Higgsfield (internet lento)
Nunca en primer plano: `curl -s -C - --retry 3 --max-time 300 -o <archivo> <url>` en segundo plano, varios a la vez con `&` + `wait`.
Comprobar los .glb/.mp4 completos (tamaño) antes de usarlos.
