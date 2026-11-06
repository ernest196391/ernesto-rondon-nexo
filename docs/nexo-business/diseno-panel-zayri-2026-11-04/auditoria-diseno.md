# Auditoría de diseño · «Mi catálogo y fotos» (Zayri) · 4-nov-2026

**Qué se miró:** el código que está en producción (`Casa-Viva-guardado-fichas`, rama `mejora/medir-anuncios`): página en `class-cvd-content-studio.php`, comportamiento en `content-studio.js`, estilos en `content-studio.css`. **No** se abrió el panel en vivo para esta auditoría (la visita real con `zayri` es la de `auditoria-panel-zayri-2026-11-04.md`).

**En números hoy:** 1 página larga · 18 botones fijos (+4 por cada opción con IA) · 28 campos · unos 14 párrafos de explicación · todos los botones iguales (verde lleno).

## Problemas, del más grave al menos grave

| # | Problema | Solución en una línea |
|---|---|---|
| 1 | **Sin jerarquía.** Buscador, contraseña y los 4 pasos salen uno debajo de otro, todo abierto. No se sabe qué es lo principal ni dónde termina cada tarea. | Dos pantallas: **Lista** → **Producto** con 3 pestañas (Ficha · Anuncio · Resultados) y **un solo botón principal fijo abajo**. |
| 2 | **Todos los botones pesan igual.** 18 botones verdes llenos; «Publicar» se ve igual que «Descargar esta opción». | 1 botón lleno por pantalla; el resto en contorno, en tarjetas que se tocan o en el menú ⋯. |
| 3 | **Botones duplicados o sin valor propio.** 4 caminos para poner la foto de la web (`cv-upload`, «Elegir opción N…», `cv-publish-layout`, `cv-import-button`); «Preparar imagen» y «Usar opción N en la plantilla» solo redibujan; «Preparar textos para redes» solo rellena una caja; «Guardar cambios» y «Publicar» hacen lo mismo si el producto ya está publicado; «Buscar» sobra si busca al escribir. | Vista previa que se actualiza sola, pie que se arma solo, un botón de guardar según el estado, 2 caminos para la foto web (del móvil o desde una opción IA). |
| 4 | **Exceso de texto.** ~14 párrafos que explican reglas («Escribe normal: deja una línea…», «La IA prepara solo el fondo…», «Un enlace por anuncio…»). Zayri no los lee en el móvil. | Quitarlos. La regla la cumple la pantalla: botones «• Punto» / «Subtítulo», Publicar bloqueado que dice qué falta, interruptor de permiso obligatorio. |
| 5 | **Orden del flujo mezclado.** «Mejorar título» está en el paso 4 (debería estar junto al título); los campos de las plantillas (características, frase, uso, oferta) salen todos aunque la plantilla elegida no los use; el enlace del anuncio se crea después de descargar, en otro sitio. | **Ficha** = lo que ve el cliente en la web. **Anuncio** = imagen + pie + enlace, en ese orden. Cada plantilla muestra solo sus campos. |
| 6 | **Jerga técnica.** «Proveedor: Cloudflare · cuota gratuita con Workers Free», «API de pago», «Conservar también el fondo original dentro de la foto», «Instrucción para IA», «catálogo comercial», «PROOF». | Ocultar el proveedor (se usa el gratis; los de pago solo si el administrador los activa). Palabras de tienda: «Fondo IA», «Foto entera», «Precio de la tienda». |
| 7 | **Formato del texto por trucos.** Hay que recordar «• », línea en blanco y «:» al final; y en características, el guion «—» para separar el dato de su beneficio. | Botones «• Punto» y «Subtítulo» sobre la descripción. Cada característica = 2 casillas: **Dato** y **Para qué sirve**. |
| 8 | **Listas desplegables donde hay que ver las opciones.** Plantilla, formato, estrellas y reseña están en `<select>`: en el móvil no se ve qué hay hasta abrirlos. | Tarjetas con dibujo para plantillas, botón doble 9:16 / 1:1, estrellas que se tocan, reseñas como tarjetas. |
| 9 | **Colocar los números en la foto es torpe.** El lienzo mide como máximo 430 px, el punto siguiente va en ciclo y no se puede mover uno concreto. | Vista previa a todo el ancho; elegir el punto 1, 2 o 3 y tocar dónde va; se puede recolocar cualquiera. |
| 10 | **Resultados escondidos en una frase.** «A12 · Características 9:16 · 2026-11-02 — 9 personas escribieron · 3 pedidos…» al final del paso 4. | Pestaña **Resultados**: números grandes, el mejor anuncio marcado y botón «Repetir» para hacer otro igual (paso 6 del video). |
| 11 | **Opciones raras a la vista.** «¿A quién le sirve?» (3 campos que solo alimentan una instrucción para IA), «Usar mi suscripción en su web», casilla «Incluir la instrucción para IA en el archivo», caja de instrucción de solo lectura. | Al menú ⋯ del producto: «Instrucción para ChatGPT» (copiar) y «Descargar textos (.txt)». Los 3 campos de comprador se quitan de la vista (los datos guardados se conservan). |
| 12 | **Mercancía nueva tropieza con errores.** Subir foto, guardar reseña o crear enlace responde «Guarda primero el borrador». | Al elegir la primera foto se guarda el borrador solo. Anuncio y Resultados se activan cuando el borrador existe. |
| 13 | **Contraseña en medio de la pantalla de trabajo.** | Al menú de la cuenta (icono arriba a la derecha). |
| 14 | **Consistencia visual.** Letra `system-ui` (no Helvetica); foco naranja `#b66b3d` (no es de la marca); bordes `#aaa`; cabecera con frase de relleno «De la foto real a tu tienda»; enlace «← Mi cuenta» siempre a la vista aunque casi no se usa. | Helvetica, colores de Casa Viva como variables (verde `#173e35`, crema `#f6f2e9`, verde claro `#e4eee8`, dorado `#c99a1e`), foco verde, cabecera solo con el logo. |
| 15 | **Accesibilidad.** Casillas nativas pequeñas para «permiso» y «Ya la comparé»; la vista previa es un `canvas` sin texto alternativo; etiquetas en negrita todas iguales. | Interruptores de 44 px, vista previa en HTML con texto real (o `aria-label` con el contenido), etiquetas pequeñas y valores grandes, contraste ≥ 4,5:1. |

## Lo que está bien y se conserva
- Aviso abajo que se borra solo (no tapa el trabajo).
- Bloqueo de la opción guardada vieja hasta «Ya la comparé».
- Reseñas solo reales y con permiso; oferta solo si es real; precio leído de la tienda.
- Un enlace de WhatsApp por anuncio con su código (A + número) para medir.
- Botones de 46 px de alto.

## No comprobado
No se probó en el móvil real de Zayri ni en iPhone. La propuesta es un prototipo sin servidor: los botones muestran a dónde llevan, pero no guardan nada.
