# Flujo operativo y puertas de publicación

## Estados

`detectado → investigando → requiere información | preparado → pendiente de revisión → verificado → borrador WooCommerce → publicado`

## Puertas

| Puerta | Debe comprobarse | Si falla |
|---|---|---|
| Identidad | Categoría y producto; marca/modelo cuando existan | Borrador |
| Evidencia | Procedencia y confianza por dato crítico | Borrador o dato marcado pendiente |
| Comercial | Precio base interno, regla, precio público, entrega y garantía | Borrador |
| Contenido | Resumen, descripción, beneficios, especificaciones y FAQ | Borrador |
| Imagen | Archivo abre, producto correcto, sin blanco/rotura, portada WebP | Borrador |
| Knowledge | Registro actualizado y recuperable por alias/SKU | Borrador |
| WooCommerce | Sin duplicado; descripción y atributos persistidos | Corregir |
| Móvil | Página abre, no desborda, CTA/carrito funcionan | Corregir |

## Investigación

Usar fabricante/manual para especificaciones; evidencia física para la unidad; proveedor para precio, garantía y entrega. Registrar contradicciones sin esconderlas. No copiar textos comerciales: redactar contenido original.

## Imágenes

1. Inventariar y vincular fotos al SKU.
2. Rechazar capturas, etiquetas o composiciones promocionales como portada si existe mejor alternativa.
3. Generar o editar una imagen limpia usando el producto exacto como referencia.
4. Comparar identidad, forma, controles, conectores, logotipo y accesorios con la referencia.
5. Exportar portada cuadrada WebP y probar su URL pública.

## QA final por producto

- Buscar por nombre, SKU y alias.
- Abrir ficha en ancho móvil.
- Verificar imagen, precio, descripción y al menos dos especificaciones útiles.
- Confirmar que el costo interno no aparece públicamente.
- Consultar al asistente una pregunta técnica y otra comercial.
- Añadir al carrito y comprobar atribución si existe `ref`.
