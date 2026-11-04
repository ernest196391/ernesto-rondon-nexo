# SEO técnico de casaviva.company — 29-oct-2026 (solo lectura)

Comprobado en el código del servidor (tema `casa-viva-storefront` 1.0.2, Core 3.14.81) y en páginas reales pedidas como móvil desde el VPS.

## Cómo se genera hoy

| Pieza | Quién la pone | Estado |
|---|---|---|
| `<title>` de producto | WordPress: «Nombre – Casa Viva». Si el producto tiene `_cvd_seo_title`, lo cambia el Core (`CVD_Fichas::seo_title`) | Solo 7 productos tienen título SEO propio |
| `<title>` de portada | Core `CVD_Launch_Polish` | Bien: «Casa Viva \| Tienda online para el hogar en La Habana» |
| Meta description de producto | Core `CVD_Site_Privacy::meta_description`: `_cvd_meta_description` → si no, descripción corta → si no, la larga (158 letras) | **Problema grave:** 688 productos bajo pedido tienen la MISMA: «Producto bajo pedido: confirmamos disponibilidad en 1 hora antes de cobrar.» Google los ve como páginas repetidas |
| Meta description de categoría | Texto de la categoría o «X para tu hogar en Casa Viva…» | Las 19 categorías tienen 0 letras de texto |
| Open Graph de producto (la vista previa de WhatsApp) | Tema (`cv_storefront_product_social_meta`): nombre, foto principal «large», descripción corta | En bajo pedido la vista previa dice solo el aviso de bajo pedido, no qué es el producto |
| Open Graph del resto | Plugin `casa-viva-marca`: texto e imagen genéricos | Bien |
| schema.org Product | WooCommerce (JSON-LD): nombre, descripción, **1 sola imagen**, SKU, precio USD, disponibilidad | Falta marca y más imágenes. Bajo pedido sale «InStock» |
| schema de tienda (LocalBusiness con dirección de Nuevo Vedado) | Nadie | No existe: es gratis y ayuda en búsquedas «tienda … La Habana» |
| Migas de pan (breadcrumb) | — | No salen en la ficha de producto |
| Canonical | WordPress en productos; Core en portada | Bien. Tienda y categorías no lo tienen (poco importante) |
| Sitemap | WordPress `wp-sitemap.xml` | Bien: 923 productos y 19 categorías. Incluye categorías basura («Sin categorizar», «Sala», «Baño, cocina») |
| robots.txt | WooCommerce estándar + Sitemap | Bien. Páginas internas con noindex (Core) |
| Caché | LiteSpeed | Bien: 2.ª visita «hit»; primera visita ~0,5–1,4 s |
| Peso de la ficha | HTML 108 KB, 15 hojas CSS y 25 scripts | Aceptable con caché; reducir scripts ayudaría en datos lentos |
| Imágenes | WebP, «lazy» en casi todas, miniaturas de 2–20 KB | Bien. 265 originales pesan más de 150 KB (se ven al ampliar) |
| Texto alt de fotos | — | 1.386 de 1.547 fotos sin alt |
| Títulos duplicados | — | 21 parejas (el mismo artículo publicado 2 veces) |
| Slugs con «-2» | — | 161 (vienen de los duplicados y de productos repetidos) |

## Recomendación sobre el plugin SEO (decisión de Ernesto, Fase 2)
**Hacerlo en el Core, sin plugin.** Motivo: el Core ya tiene los dos campos (`_cvd_seo_title`, `_cvd_meta_description`) y ya escribe la meta description; un plugin (Rank Math/Yoast) duplicaría etiquetas con el tema y el plugin de marca, y pesa más en móvil. Lo que falta son ~5 piezas pequeñas:
1. Meta description y vista previa de WhatsApp de bajo pedido = texto del producto, no el aviso (el aviso sigue en la página).
2. Títulos «Producto | Casa Viva» con la palabra clave primero, y texto en las categorías.
3. schema: varias imágenes, marca cuando se sepa, y LocalBusiness de la tienda.
4. Migas de pan en la ficha.
5. Redirecciones 301 cuando se cambie un slug malo (el Core guarda el viejo; WordPress ya redirige los slugs viejos de entradas, hay que comprobarlo con productos).

Sin Search Console no hay datos de impresiones; si Ernesto da acceso, se mide antes y después.
