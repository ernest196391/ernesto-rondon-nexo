# Contrato de estilo · «el café de los distraídos» (v2 = reel `De_iWd6IxX2`)

> Analizado a 4 fotogramas por segundo (no a 1). v1 (`DcfJp5EgVQw`) es otro estilo: un dron que vuela por una obra hasta el edificio terminado; queda para otro día.

**Referencia:** muñecos de plastilina estirados (cuenta @Ms_Stretchy), 17,8 s, 720×1280, **un solo plano sin cortes**, canción romántica con letra (con derechos: NO se usa).
**El chiste:** están tan embobados mirándose que lo hacen todo mal. El café cae fuera de la taza dos veces, la leche se derrama en la mesa y al final él levanta la taza vacía feliz.

## Cámara (igual en todo el video)
- Baja, **apoyada en la encimera de madera**, a la altura de la taza, con angular. Muy poco movimiento de mano.
- En primer plano: la **taza roja** en el centro-izquierda y un **frasco de café** a la derecha.
- Fondo: cocina con armarios verdes, plantas colgantes y luz cálida de tarde. Desenfoque suave.
- Los personajes se acercan a la cámara (la cara de él llena la parte de arriba) y se alejan: ese «respirar» da vida al plano.

## Lista de golpes (segundos del original → en 15 s)
| Original | 15 s | Qué pasa |
|---|---|---|
| 0,0–1,7 | 0,0–1,4 | Él coge café con la cuchara del frasco y lo lleva hacia la taza **mirándola a ella**; se inclina hacia la cámara. Ella coge la cafetera. |
| 1,7–2,0 | 1,4–1,7 | El café cae **en la mesa, al lado de la taza**. Montoncito oscuro. |
| 2,0–4,3 | 1,7–3,6 | Ella sirve de la cafetera **mirándolo a él**, sonriendo; él la mira. |
| 4,3–7,0 | 3,6–5,9 | Él coge otra cucharada, se acerca otra vez a la cámara, y cae otra vez fuera. |
| 7,0–9,0 | 5,9–7,6 | Ella remueve; los dos se miran, embobados. |
| 9,0–11,5 | 7,6–9,7 | Ella se aparta; él le acerca la taza. |
| 11,5–12,9 | 9,7–10,9 | Ella echa la **leche de una jarrita en la mesa**: salpicadura blanca enorme. |
| 13,0–17,8 | 10,9–15,0 | Él agarra la taza (vacía), la levanta feliz; los dos se miran enamorados hasta el final. |

## Versión Casa Viva (decidido con Ernesto, 4-nov)
- **Mamá e hijo**, realistas: **Cúrru** con la cafetera italiana, **Prosko** subido a un taburete con la cuchara y el azucarero (el amor de mamá e hijo es la distracción: se sonríen y lo derraman todo).
- Cocina cubana cálida; la misma cámara, la misma taza roja en primer plano y los mismos golpes y tiempos.
- **Sin producto**: al final, logo de Casa Viva y una frase.
- **Música:** la canción de Casa Viva (sin la del original).

## Cómo se produce (para que salga «tal cual»)
1. **Imagen de arranque** que copie el primer fotograma del original (encuadre, taza, frasco, luz) con Cúrru y Prosko: `gpt_image_2_5`, **calidad alta, 2k** (no la de por defecto, que es baja y 1k).
2. **Video:** Seedance 2.0 con `start_image` = esa imagen, **`video_references` = el original recortado a 15 s** (sin audio y sin la marca de agua: `referencias/ref15.mp4`, media `6a760f0f…`) y las hojas de los dos personajes. Así copia el movimiento, la cámara y el ritmo.
3. **Comprobar lado a lado**: hoja del original frente a la nuestra en los mismos segundos, antes de entregar.
4. Montaje: canción de Casa Viva, sonidos del café y de la leche, cierre con el logo.

**Costos (4-nov):** Seedance 15 s en 720p = **67,5 créditos**; en 1080p con calidad alta = **180**. Imagen 2k alta, unos pocos créditos.
