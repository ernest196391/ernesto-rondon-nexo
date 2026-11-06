# Cambios respecto al panel actual · para implementar sin perder funciones

**Base:** `class-cvd-content-studio.php` (función `page()`), `content-studio.js` y `content-studio.css` de la rama `mejora/medir-anuncios`.
**Regla:** las rutas del servidor (`contenido/products`, `save`, `upload`, `review`, `resena`, `anuncio`, `suggest`, `password`, `ia/generate`, `ia/poll`) **no cambian**. Solo cambia la pantalla.
**Leyenda:** Conserva = mismo `id` y función · Mueve = otra pantalla o menú · Fusiona = se junta con otro · Quita = sale de la vista.

## Navegación nueva
Lista → Producto con pestañas **Ficha · Anuncio · Resultados** → hojas que suben desde abajo (cuenta, foto, reseña, fondo IA, opción, pie del anuncio, menú ⋯). Un botón principal fijo abajo por pestaña.

## Lista y cuenta
| `id` actual | Qué pasa | Dónde queda |
|---|---|---|
| `cv-search` (campo `search`) | Conserva · busca al escribir (con espera corta) | Lista, arriba |
| botón «Buscar» (sin id) | **Quita** | Enter del teclado sigue buscando |
| `cv-items`, `cv-more` | Conserva · filas con foto, precio y estado; filtro Todos/Publicados/Borradores (nuevo, en el navegador) | Lista |
| `cv-new` | Conserva · botón flotante «Nueva mercancía» | Lista, abajo a la derecha |
| `cv-password`, `cv-current-password`, `cv-next-password` | Mueve | Icono de cuenta → «Cambiar contraseña» |
| enlace «← Mi cuenta» | Mueve | Icono de cuenta → «Mi cuenta» |
| `cv-message` | Conserva · aviso abajo, encima de la barra | Todas |

## Ficha
| `id` actual | Qué pasa | Dónde queda |
|---|---|---|
| `cv-name` | Conserva | Ficha |
| `cv-title-suggest` | Mueve + cambia · ya no reescribe el título directo: muestra la sugerencia con «Usar / Descartar» | Botón «Mejorar» junto a «Título» |
| `cv-suggest` + `cv-suggestion` + `cv-use-suggestion` | **Fusiona** en un botón «Mejorar» y una tarjeta de sugerencia con «Usar / Descartar» | Junto a «Descripción» |
| `cv-description`, `cv-short` | Conserva (texto normal) · se añaden botones «• Punto» y «Subtítulo» | Ficha |
| párrafo de formato («Escribe normal…») | **Quita** | Lo hacen los dos botones |
| `cv-text-note` | Conserva solo cuando aplica, como etiqueta corta «Texto con formato especial» | Encima de la descripción |
| `cv-commercial` | Cambia · fila «Precio · Desde US$14.00» con candado; el estado va en la píldora de arriba | Ficha + cabecera |
| párrafo «Conservamos precios y existencias…» | **Quita** | El candado y «Falta precio» lo dicen |
| `cv-save` + `cv-publish` | **Fusiona** según estado: publicado → un botón «Guardar cambios» (se ve en la tienda); borrador → «Guardar» + «Publicar» con «Falta foto/descripción/precio» | Barra fija de la Ficha |
| `cv-view` | Mueve | Menú ⋯ → «Ver en la tienda» |
| `cv-facts` (textarea, «dato — beneficio») | Cambia a hasta 3 filas con 2 casillas: **Dato** y **Para qué sirve**. Se guarda igual en `brief.facts` (`dato — beneficio`, una por línea) | Ficha → «Características» |
| `cv-photo` + `cv-upload` | **Fusiona** · «Cambiar foto» → tomar o elegir → vista previa → «Subir a la web» (WebP igual que hoy) | Ficha, sobre la foto |
| `cv-original` | Conserva | Ficha, foto grande |
| párrafo «La foto anterior se conserva…» | Cambia a una línea en la confirmación | Hoja «¿Usar esta foto?» |
| `cv-review-text`, `cv-review-name`, `cv-review-save` | Mueve | Ficha → «Añadir reseña real» (hoja) |
| `cv-review-rating` (select) | Cambia a 5 estrellas que se tocan; tocar la misma = sin estrellas | Hoja de reseña |
| `cv-review-permission` (casilla) | Cambia a interruptor grande; «Guardar reseña» bloqueado sin él | Hoja de reseña |
| párrafos de reseña («Añadir una reseña real…», «Se guarda como reseña…») | **Quita** | Placeholder «Pégalo tal cual del WhatsApp» y aviso al guardar |
| Mercancía nueva: error «Guarda primero el borrador» | Cambia · al subir la primera foto se guarda el borrador solo; Anuncio y Resultados bloqueados hasta que exista | Ficha |

## Anuncio
| `id` actual | Qué pasa | Dónde queda |
|---|---|---|
| `cv-canvas` | Conserva para la imagen final 1080 px; la **vista previa** se ve siempre arriba y se redibuja sola | Anuncio, arriba |
| `cv-render` («Preparar imagen») | **Quita** | Redibujo automático al cambiar plantilla, formato, foto o textos |
| `cv-format` (select) | Cambia a botón doble «Historia 9:16 / Post 1:1» | Debajo de la vista previa |
| `cv-layout` (select) | Cambia a 5 tarjetas con dibujo (Características, Ficha técnica, Oferta, Uso diario, Reseña) | Anuncio → Plantilla |
| `cv-headline` | Conserva como «Frase» | Anuncio |
| `cv-use` | Conserva · solo visible con la plantilla Uso diario | Anuncio |
| `cv-offer` | Conserva · solo visible con la plantilla Oferta, junto al precio con candado | Anuncio |
| párrafo «El precio y la rebaja salen de la tienda…» | **Quita** | Candado + «solo si es real» |
| `cv-review-pick` (select) | Cambia a tarjetas para elegir · solo con la plantilla Reseña; si no hay, enlace «Añadir en Ficha» | Anuncio |
| colocar números (tocar el lienzo en ciclo) | Cambia · se elige el punto 1/2/3 y se toca la foto; cualquiera se puede recolocar | Anuncio → «Puntos en la foto» |
| párrafo «Después del guion…» | **Quita** | Casilla «Para qué sirve» en la Ficha |
| `cv-generate` | Conserva · tarjeta «Fondo IA» → hoja → «Crear opción» | Anuncio → carrusel «Foto» |
| `cv-provider` | **Quita de la vista** · se usa el gratis activo; si el administrador activa uno de pago, aparece la elección en la hoja «Fondo con IA» (con la confirmación de saldo que ya existe) | Hoja «Fondo con IA» |
| `cv-ai-setup` | Cambia · la tarjeta «Fondo IA» sale apagada | Carrusel |
| `cv-protect-whole` | Conserva como interruptor «Foto entera, sin recortar» | Hoja «Fondo con IA» |
| párrafo «La IA prepara solo el fondo…» | **Quita** | — |
| `cv-ai-status` | Conserva como tarjeta «Creando…» y aviso abajo | Carrusel |
| `cv-variants` | Cambia a carrusel único de fotos: Foto web · opciones IA · guardada · del móvil | Anuncio → «Foto» |
| «Usar opción N en la plantilla» | **Quita** | Tocar la tarjeta = usarla en la vista previa |
| «Elegir opción N como foto principal» | Mueve | ⋯ de la tarjeta → «Poner como foto de la web» (con confirmación) |
| «Guardar para revisar después» | Mueve | ⋯ de la tarjeta → «Guardar para revisar» |
| «Descargar esta opción» | Mueve | ⋯ de la tarjeta → «Descargar sin textos» |
| aviso de opción vieja + casilla «Ya la comparé» | Conserva · etiqueta «Revisar», aviso corto e interruptor; vista previa tapada y «Terminar» bloqueado hasta compararla | Debajo del carrusel |
| `cv-import-ai` + `cv-import-preview` + `cv-import-button` | **Fusiona** con la foto «solo para el anuncio» en la tarjeta «Del móvil»; la imagen importada entra al carrusel y desde su ⋯ se puede poner en la web | Carrusel |
| `cv-publish-layout` («Elegir el anuncio preparado como imagen principal») | **Quita** · la foto de la web no debe llevar textos ni la franja «VER EN CASA VIVA»; para la web se usa la opción IA limpia | — |
| `cv-buyer`, `cv-objection`, `cv-evidence` («¿A quién le sirve…?») | **Quita de la vista** · lo ya guardado en `brief` se conserva y sigue entrando en la instrucción para IA | — |
| «Usar mi suscripción en su web» (detalles) | Mueve | Menú ⋯ → «Copiar instrucción para ChatGPT»; el resultado vuelve por «Del móvil» |
| `cv-prompt` (caja de solo lectura) + su detalles | **Fusiona** con lo anterior (se copia, no se muestra) | Menú ⋯ |

## Pie del anuncio y resultados
| `id` actual | Qué pasa | Dónde queda |
|---|---|---|
| `cv-copy-build` («Preparar textos para redes») | **Quita** · el pie se arma solo al abrir la hoja | — |
| `cv-copy` | Conserva, editable | Hoja «Pie del anuncio» (botón «Terminar anuncio») |
| `cv-ad-link` | **Fusiona** con la descarga: «Descargar imagen y copiar pie» crea el enlace A + número, lo pone en el pie, baja la imagen y copia el texto | Hoja «Pie del anuncio» |
| `cv-download` | **Fusiona** con lo anterior | Hoja «Pie del anuncio» |
| párrafo «Un enlace por anuncio…» | Cambia a una línea: «Enlace A13 · cuenta quién escribe y compra» | Hoja «Pie del anuncio» |
| `cv-copy-save` («Descargar textos») | Mueve | Menú ⋯ → «Descargar textos (.txt)» |
| `cv-copy-prompt` (casilla) | **Quita** · la instrucción se copia aparte desde el menú ⋯ | — |
| `cv-ads` | Mueve y cambia a pestaña **Resultados**: totales, una tarjeta por anuncio con números grandes, el mejor marcado; botón **«Repetir»** (nuevo, solo en el navegador: abre Anuncio con la misma plantilla y formato) | Resultados |

## Estilo
| Hoy | Propuesta |
|---|---|
| `system-ui` | `"Helvetica Neue", Helvetica, Arial, sans-serif` (también en el lienzo, hoy `Arial`) |
| Foco naranja `#b66b3d`, bordes `#aaa` | Foco verde `#173e35`, bordes neutros `#d9d8d4` |
| Todos los botones verdes llenos | 1 lleno por pantalla; contorno, tarjetas y menú ⋯ para el resto |
| Cabecera con «CASA VIVA», título y frase | Barra verde con el logo crema y el icono de cuenta |
| Colores sueltos | Variables: `#173e35`, `#f6f2e9`, `#F6F1E6`, `#e4eee8`, `#c99a1e` + neutros |

## Resumen de lo que sale de la vista
Quitados: botón «Buscar», `cv-render`, `cv-copy-build`, `cv-publish-layout`, `cv-copy-prompt`, «Usar opción N en la plantilla» y unos 14 párrafos de explicación.
Ocultos sin perder datos: `cv-provider` (sale solo si hay uno de pago activo), `cv-buyer`, `cv-objection`, `cv-evidence`.
Fusionados: `cv-save`+`cv-publish` · `cv-photo`+`cv-upload` · `cv-suggest`+`cv-suggestion`+`cv-use-suggestion` · `cv-ad-link`+`cv-download`+copiar · `cv-import-*`+foto solo para el anuncio · `cv-prompt`+«Usar mi suscripción».
Nuevo (solo pantalla, sin servidor): filtro de la lista, «Repetir» en Resultados, guardado automático del borrador al subir la primera foto.
