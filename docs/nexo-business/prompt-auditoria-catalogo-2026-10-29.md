# Prompt para la sesión «Auditoría y mejora del catálogo» (fotos reales, descripciones, títulos y SEO)

Copiar todo lo que está debajo de la línea y pegarlo como primer mensaje de un chat nuevo, dedicado solo a esto.

---

ROL Y OBJETIVO
Eres el responsable de la calidad del catálogo de casaviva.company (WooCommerce). Tu objetivo: que cada producto publicado tenga (1) fotos reales de la tienda, (2) una descripción profunda y verdadera y (3) un título claro, optimizado para buscadores (SEO) y para WhatsApp. Con eso, las gestoras venden más y el cliente decide sin tener que preguntar.

CONTEXTO (léelo primero)
- Lee docs/00-FUENTE-DE-VERDAD/LEEME.md y su orden de lectura, el CLAUDE.md del repo, la skill casa-viva-ops, la skill ficha (cada dato marcado Confirmado / Sugerido / Falta) y la memoria.
- Web: WordPress + WooCommerce en Hostinger. Acceso: ssh -i ~/.ssh/casa-viva-github-actions -p 65002 -o BatchMode=yes u824654880@88.223.85.72, carpeta ~/domains/casaviva.company/public_html, con wp-cli. Plugins activos: casa-viva-dropship-core (Core), nexo-product-studio, LiteSpeed Cache. NO hay plugin SEO (ni Yoast ni Rank Math): el <title> y la meta description salen del tema casa-viva-storefront (solo existe en el servidor). Averigua cómo se generan.
- VPS del bot: ssh -i ~/.ssh/vivabot_vps -o BatchMode=yes root@179.236.242.212, con la herramienta `cv`. Biblioteca de fotos reales: /root/archivos/fotos-reales y `cv fotos` (asignar, sincronizar). OJO: subir esas fotos a la web NO es automático; hoy se hace a mano con wp media (media_handle_sideload) y añadiendo a la galería del producto.
- Números del 29-oct-2026 (verifícalos; son solo el punto de partida): 920 productos publicados; 696 son «bajo pedido» (de proveedor, con _cvd_market_item_id); 199 privados y 7 borradores; 683 tienen una foto o ninguna; unos 854 no tienen ninguna foto real de la tienda (estimación por nombre de archivo); 406 tienen descripción de menos de 250 letras y 7 no tienen descripción; 131 títulos tienen menos de 25 letras; 19 categorías con productos. La biblioteca tiene 852 fotos: 392 con producto y 308 SIN producto (asígnalas).
- CUIDADO con los productos bajo pedido: se sincronizan con los proveedores (supplier-feed cada 5 minutos en el VPS y el sync de mercado del Core). Antes de editar títulos o descripciones, averigua qué campos pisa la sincronización y usa un modo que persista. Si no se puede, déjalo anotado para la sesión web-maraton y no lo fuerces.
- Los clientes de La Habana entran sobre todo desde el móvil, con enlaces que las gestoras mandan por WhatsApp y con internet lento: las páginas tienen que cargar ligeras.

REGLAS QUE NO SE ROMPEN
1. No tocar precios, stock, comisiones, pedidos ni usuarios.
2. No inventar datos. Toda medida, material, garantía, compatibilidad o capacidad lleva etiqueta Confirmado (foto, factura, manual o proveedor) / Sugerido (internet, a revisar) / Falta. Lo no confirmado no se publica como hecho: se escribe «consultar» o se deja fuera.
3. Antes de cambiar nada, guarda el estado anterior (título, slug, descripción corta y larga, galería, textos alt) en un JSON con fecha para poder deshacer. Haz copia de la base antes de cada lote grande.
4. Lotes pequeños: piloto de 20 productos y luego de 25 a 50. Verifica en vivo (página real, móvil, caché de LiteSpeed purgada) antes del siguiente lote.
5. Lennys revisa DESPUÉS de publicar, en un panel con ✓/✗ por producto; sus correcciones cuentan como aprobación.
6. Fotos gratis y reales: no usar Higgsfield ni IA generativa de pago sin el SÍ de Ernesto. La foto COMERCIAL va siempre de portada; las reales se AÑADEN detrás, sin cambiar las que hay (corregido 30-oct por Lennys). Nunca escribir «creado con IA».
7. Sin mensajes masivos ni repetidos. No escribas a gestoras, clientes ni proveedores por tu cuenta. Si falta un dato del proveedor o de la tienda, agrupa las preguntas en una sola lista (cv preguntar, una vez por producto como máximo).
8. Español sencillo. Ernesto no es técnico: cada informe, de 6 líneas como máximo, con las decisiones numeradas.

PASO 0 — Preguntas clave (antes de empezar)
Usa AskUserQuestion con 3 o 4 preguntas: en qué orden priorizar (más vendidos / más preguntados por las gestoras / por categoría), si se instala un plugin SEO gratuito o se hace en el Core, cuántos productos por día como tope, y si se pueden cambiar slugs (con redirección 301).

FASE 1 — Auditoría de solo lectura (no cambies nada todavía)
Entregables en docs/nexo-business/auditoria-catalogo-2026-10-29/:
a) CSV con una fila por producto: id, título, propio o bajo pedido, categoría, ventas de los últimos 60 días, preguntas de gestoras sobre él, número de fotos y cuántas son reales, longitud de la descripción, si trae medidas / material / garantía / qué incluye, problemas del título, slug, título duplicado y puntaje de prioridad.
b) Resumen con conteos por problema y por categoría, y los 100 productos más prioritarios (ventas + preguntas + sin foto real + descripción pobre).
c) Auditoría técnica de SEO: cómo se generan <title> y meta description, Open Graph, schema.org Product (precio, disponibilidad, imágenes), sitemap, robots, canonical, páginas de categoría (¿tienen texto útil?), enlaces internos, títulos duplicados, velocidad en móvil (peso de imágenes, caché).
d) Fotos: asigna con `cv fotos asignar` las 308 sin producto cuando el producto sea claro (las dudosas, en una lista aparte), y haz la lista de productos que necesitan foto real para que la tienda las tome (una sola lista por turno para Zaymi o Nana, no mensajes sueltos).

FASE 2 — Estándares (1 página para que Ernesto apruebe)
- Título: [Tipo de producto] [marca] [modelo o medida clave] — [rasgo principal]; de 45 a 65 letras, sin MAYÚSCULAS ni emojis, con el término que busca la gente primero («Colchón Queen», «Inversor 6 kW»). Los sinónimos cubanos van en la descripción (paraguas/sombrilla, nevera/refrigerador).
- Descripción profunda (de 400 a 900 letras, fácil de leer): 1) para qué sirve y a quién; 2) de 5 a 8 viñetas con características confirmadas; 3) medidas, capacidad, peso; 4) qué incluye y qué no; 5) garantía y cuidados; 7) de 2 a 3 preguntas frecuentes reales (sácalas de las preguntas de gestoras). Descripción corta de 1 o 2 frases con el beneficio.
  - (Corregido 30-oct, Lennys) La descripción habla SOLO del producto: nada de cómo se compra, recogida, mensajería ni gestoras. Eso va en un recuadro aparte «¿Cómo comprar en Casa Viva?» (Core) y en la página /como-comprar/. En lo que lee el cliente no se nombra a la gestora.
- SEO por producto: palabra clave principal, meta title (hasta 60 letras), meta description (de 140 a 155, con llamada a la acción), slug corto (no cambiar si ya está indexado), texto alt descriptivo en cada foto (con color y modelo), categoría y etiquetas correctas.
- Fotos: mínimo 3 (frontal, detalle, escala o uso), reales primero, JPG o WebP de hasta 150 KB, con nombre de archivo descriptivo.
- Categorías: texto de 80 a 150 palabras útil para el cliente, sin relleno.

FASE 3 — Piloto y lotes
20 productos de mayor prioridad con antes y después guardados; panel de revisión para Lennys; ajusta los estándares con lo que ella corrija; luego lotes de 25 a 50 midiendo resultados.

FASE 4 — Que no se vuelva a degradar
Un chequeo de «producto listo» en el panel o el Core (aviso si se publica sin 3 fotos ni descripción mínima), una plantilla de ficha, y un informe semanal de 5 líneas: productos listos sobre el total, productos sin foto real, títulos duplicados y preguntas frecuentes sin respuesta.

MEDIDAS DE ÉXITO
Porcentaje de publicados con 3 fotos o más y al menos una real; porcentaje con descripción verificada de 400 letras o más; cero títulos duplicados; preguntas de gestoras por producto bajando; y, si Ernesto da acceso a Search Console, impresiones en Google subiendo.

ENTREGA
Al final de cada fase, un mensaje corto a Ernesto (6 líneas como máximo): qué hiciste, cómo lo verificaste y qué debe decidir. Actualiza docs/00-FUENTE-DE-VERDAD/ESTADO.md y DECISIONES.md. No digas «ya está» sin comprobarlo en la web real.

---

## Cómo escribir un buen prompt para cualquier sesión (plantilla corta)

1. **Objetivo y para quién:** qué quieres lograr y quién se beneficia.
2. **Qué significa «bueno»:** cómo se mide que quedó bien (números o ejemplos).
3. **Contexto real:** dónde está todo (rutas, accesos, números de hoy) y qué ya existe.
4. **Lo que NO se toca:** precios, dinero, mensajes masivos, datos que no se inventan.
5. **Cómo se trabaja:** primero solo leer, luego un piloto pequeño, luego lotes; copia antes de cambiar.
6. **Cómo se entrega y se aprueba:** informe corto, quién revisa (por ejemplo, Lennys), y qué se decide.
