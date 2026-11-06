# Auditoría por dentro del panel de Zayri — 4-nov-2026

**Cómo se hizo:** Ernesto entró con el usuario `zayri` en el navegador de la app; Claude recorrió el panel real (casaviva.company/?cvd_contenido=1) en tamaño móvil (375 px). **Solo lectura:** no se guardó, subió, generó ni publicó nada (comprobado en el registro de peticiones: solo GET). Lo que escribe en la web se probó antes en la tienda desechable (PR #171, #172, #173).
**Comparado con:** el video «GPT-6 Astra Changed Meta Ads Forever!» (transcripción en `C:\Users\Ernesto\.codex\attachments\75685904-…\Texto pegado.txt`) y el pedido de Ernesto: fotos para la web optimizadas (WebP) y fotos para redes en la mejor calidad.

## Lo que ya funciona (visto con la cuenta real)
- Al entrar con `zayri` va directo a «Mi catálogo y fotos» (arreglo #173).
- Buscar y abrir fichas; el cortinero 3747 muestra la opción aprobada con el aviso «La ficha cambió desde que guardaste esta opción. Compárala…» y los botones bloqueados hasta marcar «Ya la comparé» (#172).
- Plantilla «Características señaladas» en 1080×1920 con las características guardadas en la ficha; números que se colocan tocando la foto.
- Proveedor gratis (Cloudflare) activo; OpenAI e Higgsfield sin configurar (desactivados en la lista).

## Pasos del video frente al panel
| Paso del video | ¿Lo hace el panel? | Detalle |
|---|---|---|
| 1. Investigar los anuncios que ya funcionan en tu nicho (Biblioteca de anuncios de Meta: cuánto tiempo y alcance) | **No** | Solo hay campos a mano (comprador, duda, evidencia). La instrucción para IA dice «investiga», pero el panel no investiga. |
| 2. Texto con el método PROOF | **A medias** | La instrucción para IA nombra PROOF; «Mejorar descripción» usa el Taller (Gemini o plantilla), no PROOF paso a paso. |
| 3a. Diagrama de características (líneas finas a cada detalle + para qué te sirve en el día a día) | **A medias** | Hay números en círculo, sin líneas; el producto sale pequeño con mucho espacio vacío; lista de datos, no de beneficios. |
| 3b. Tarjeta de reseña (cita real, nombre, estrellas) | **No** | Bien que no se inventen; falta una fuente de reseñas reales (clientes por WhatsApp, con permiso). |
| 3c. Tarjeta de oferta | **A medias** | «Producto y precio» solo pone el precio; no hay oferta (regalo, entrega, plazo) ni garantía. |
| 4. Adaptar a historias / reels | **Sí** | 9:16 y 1:1 en un clic. |
| 5. Versión en video (producto funcionando, estilo UGC) | **No** | Existe fuera del panel (HyperFrames / reels), no desde la ficha. |
| 6. Probar primero como reels orgánicos, ver cuál trae mensajes, hacer variaciones | **No** | No hay registro de qué anuncio trajo preguntas o ventas. |
| 7. Medir: retención del gancho, clics, costo por cliente | **No** | Sin métricas en el panel. |
| Extra de Casa Viva: ficha técnica y uso cotidiano | Sí | Vienen de los 4 prompts de Higgsfield. |

## Fotos: formato y calidad (pedido de Ernesto)
- **Web: no hay WebP.** LiteSpeed tiene WebP apagado y WordPress no convierte (el servidor sí puede). Las fotos suben como JPG o PNG tal cual; hay PNG de 1–1,3 MB en la biblioteca. **Mejora:** convertir a WebP al subir (máx. ~1600 px, calidad ~82) desde el panel o el servidor.
- **Redes: no es la mejor calidad.** La opción con fondo IA se compone en **576×1024** (vertical) o 1024×1024 y la foto real se reduce para caber; luego se estira en la plantilla 1080×1920 y se baja en JPG calidad 0,92. «Elegir como foto principal» sube esa misma imagen de 576 px a la web. **Mejora:** componer directamente a 1080×1920 / 1080×1080 con la foto real a su resolución (solo se estira el fondo, que es liso) y descargar en PNG o JPG 0,95+.
- OpenAI (si se activa) está en calidad «low».

## Cosas de uso en el móvil
1. La descripción se edita con código HTML a la vista (`<p>`, `<h3>`, `<li>`): fácil de romper.
2. Abajo sale la barra de compras de la tienda (Comprar, Carrito, Pedidos), que no es para Zayri.
3. El aviso de estado («Producto abierto.») se queda fijo arriba y tapa contenido.
4. La página de entrada lleva el logo de WordPress, no el de Casa Viva.
5. Al colocar números en la foto es fácil fallar el punto; no hay forma de mover uno ya puesto (solo vuelve a empezar al dar la vuelta).

## Orden recomendado de mejoras
1. **Fotos:** redes a 1080 px en máxima calidad + web en WebP (pequeño, sube la calidad de todo lo demás).
2. **Diagrama como el del video:** producto grande, línea fina del número al detalle, y «para qué te sirve» en cada punto.
3. **Descripción sin código** (párrafos y lista con botones) y quitar la barra de la tienda en el panel.
4. **Oferta real** (precio + entrega/regalo vigente) y **reseñas reales** de clientes con permiso.
5. **Medir:** qué reel/anuncio trajo mensajes al bot, para repetir los buenos (paso 6–7 del video).
6. Investigación de anuncios del sector y video UGC: proyectos aparte, más grandes.

## No comprobado
iPhone real, conexión lenta, generación nueva con Cloudflare (se probó en una prueba anterior), descargas reales a la PC desde la cuenta de Zayri, «Mejorar título/descripción» en vivo.
