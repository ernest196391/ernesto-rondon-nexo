# Video A · 24-oct-2026 · «El billete»

- **Archivos:** `casa-viva-billete-2026-10-24.mp4` (1080×1920, 30 fps, 25,0 s, −14 LUFS, 21 MB) · `-fb.mp4` (8,0 MB, para Business Suite) · `-gestoras.mp4` (8,0 MB, igual + «Te lo llevamos a casa» en el cierre).
- **Público:** clientes nuevos (lo reenvían gestores y gestoras con su enlace). **Palabra clave:** CIEN. **Regalo del CTA:** respuesta personal: alguien de Casa Viva le dice a cada persona qué le resuelve más con 100 USD (hay que contestar los comentarios el mismo día).
- **Hecho con:** Higgsfield (Cúrru y Prosko, 48 créditos) + HyperFrames 0.8.185 (proyecto `hf/`) + fotos reales del equipo + escenarios fijos de la tienda + «Casa Viva Song» y efectos.
- **Estado:** listo para que Ernesto lo apruebe. No se ha publicado ni enviado a nadie.

## Datos comprobados (23-oct, 13:20, `cv producto` + API de la web)
| # | Problema | Producto | Id web | Precio | Existencia | Foto |
|---|---|---|---|---|---|---|
| 1 | APAGÓN | Lámparas recargables con panel solar | 2469 | 25 USD | 2 | Lennys 14-oct |
| 2 | CALOR | Juego de 2 cortinas blackout Ceasar Palace 140 × 240 | 3726 | 31 USD | muchas (6/11/12 por color) → no se dice | Lennys 17-oct |
| 3 | MÓVIL SIN BATERÍA | Power bank LADAPU 10 000 mAh | 2551 | 30 USD | 2 | Lennys 14-oct |
| 4 | LA NEVERA EN PELIGRO | Protector de voltaje para refrigerador y nevera | 3905 | 20 USD | 1 | Lennys 17-oct |
| 5 | SIN AGUA FRÍA | Termo térmico 1 L (azul) | 746 | 17 USD | 1 (azul; rojo agotado) | Lennys 14-oct |
| 6 | EL PORTAL A OSCURAS | Farol solar con sensor de movimiento | 2463 | 11 USD | 32 → no se dice | Lennys 14-oct |

Todos son de Casa Viva y están en la tienda (ninguno MK-).
**Ventilador:** el guion pedía un ventilador, pero hoy **no hay ninguno propio en existencia** (los que salen en la web son bajo pedido de proveedor: MK-120 Milexus recargable 105 USD, etc.). Para CALOR puse las cortinas blackout, que sí están y la ficha dice «ayuda a mantenerlo más fresco».

## Guion (como quedó)
| Seg | Paso | Lo que se ve | Texto en pantalla | Voz | Sonido |
|---|---|---|---|---|---|
| 0–2,9 | Tensión | Plano a ras del suelo frente a la entrada de la tienda; billete verde doblado; la mano del cliente baja en cámara lenta. A los 2,3 s la mano de Cúrru (reloj plateado, uñas french) le coge la mano. | **¿Lo cogerías?** | — | subida, golpe grave |
| 2,9–6,7 | Promesa | Corte a plano medio: Cúrru lo levanta de la mano, sonrisa pícara, señala la puerta. | Eso no es · **SUERTE** · Ven, · te enseño · lo que sí · te **resuelve** | Cúrru: «Eso no es suerte… ven, que te enseño lo que sí te resuelve.» | whoosh |
| 6,7–7,6 | Entrada | Acercamiento rápido a la puerta abierta → dentro, el pasillo de la tienda. | — | — | whoosh |
| 7,6–14,85 | Recorrido | Ráfaga de 6 productos, cada vez más rápida (1,6 → 0,9 s). | problema · foto real · precio · «Quedan N» · nombre corto | — | whoosh + pop en cada uno |
| 14,85–18,9 | Giro | Prosko recoge el billete del suelo y se lo devuelve al cliente (solo se ve su mano). | ¡Señor, · se le cayó! · **Aquí lo que brilla / es real** | Prosko: «¡Señor, se le cayó!» | clic, brillo |
| 18,9–21,6 | Prueba | Paseo por la tienda: pasillo, desde el mostrador, mostrador (3 × 0,9 s). | **Lo revisas delante del mensajero** | — | whoosh |
| 21,6–24,5 | CTA | Fondo petróleo, logo vertical crema oficial. | ¿Y tú, con 100 USD? · **Comenta CIEN** · y te decimos qué te resuelve más | — | pop, brillo |
| 24,5–25 | Bucle | Fundido al billete en el suelo del segundo 0. | — | — | — |

## Higgsfield (trabajos)
- Imágenes de arranque `gpt_image_2_5` (1 crédito cada una): suelo con billete `6308dec2-6b46-4c6e-b68b-98beae40eeb3` · Cúrru con el cliente `a639f4a6-2040-4ec8-b78b-eaa07b70374b` · Prosko recogiendo el billete `1e5cb95e-a27a-46ca-bb3f-df440a034912`.
- Escena A, Seedance 2.0, 6 s, 720p, `start_image` + `end_image` + hoja de Cúrru: `9b153728-2581-45f8-b555-0fef0ca33478` (27 créditos).
- Escena B, Seedance 2.0, 4 s, 720p, `start_image` + hoja de Prosko: `5c608d6a-f6e8-4086-837d-b0478ea7fe36` (18 créditos).
- Preset sugerido «IN THE DARK» (`24bae836…`): rechazado con `declined_preset_id`. Ninguna repetición. **Total 48 créditos** (702,4 → 654,4).

## Revisión hecha
- 1 fotograma por segundo del mp4 final (25 fotogramas en 3 hojas 3×3) más 0,0 · 6,9 · 7,3 · 16,5 · 17,8 · 18,5 · 24,6 · 24,95 s: misma cara de Cúrru y de Prosko en todos los planos, manos con 5 dedos, el cliente nunca enseña la cara, camiseta del niño lisa, sin texto basura. Ningún enlace, teléfono, QR, «IA» ni sorteo.
- Corregido tras la primera revisión: la caja «Aquí lo que brilla es real» tapaba la cara del niño (bajada a la altura del pecho), el acercamiento le cortaba la cabeza (menos zoom), «¿Y tú, con 100 / USD?» se partía mal (ahora 2 líneas fijas) y el gancho no se veía en el fotograma 0 (ahora sí).
- Whisper (Groq large-v3, VPS, temporales borrados): escena A «Eso no es suerte. Ven, que te enseño lo que sí te resuelve.» y escena B «¡Señor, se le cayó!», **iguales al guion**. En la mezcla final se oyen las dos voces; el resto que transcribe es la letra de la «Casa Viva Song». La API no devolvió probabilidad por palabra, así que la pronunciación no la puedo comprobar del todo: **Ernesto, óyelo una vez**.
- Audio: −14,0 LUFS, pico −1,4 dBFS. Música baja bajo las voces y sube en la ráfaga.

## Para que lo apruebe Ernesto
- **«Comenta CIEN»:** alguien tiene que contestar los comentarios ese día. Conviene enseñar al bot la palabra CIEN (qué contestar) antes de publicarlo.
- **«Queda 1 / Quedan 2»** es lo que había el 23-oct a las 13:20. Si se publica otro día, mirar antes `cv producto 2469`, `2551`, `3905`, `746`.
- El billete es genérico (no se lee ninguna cifra), para no tener problemas con billetes reales.
