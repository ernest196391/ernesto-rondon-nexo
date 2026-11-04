# Estándar de ficha de Casa Viva — para aprobar (Fase 2, 29-oct-2026)

Una sola página. Si Ernesto la aprueba, es la regla para el piloto y los lotes (D124). Lennys corrige después de publicar y sus correcciones cambian este estándar.

## 1. Título (lo que se ve en la tienda y en WhatsApp)
- **Forma:** `[Tipo de producto] [marca] [modelo o medida clave] — [rasgo principal]`. Ej.: «Juego de cortinas tapa sol Royale 1,37 × 2,28 m — bloquea el 90 % de la luz».
- **45 a 65 letras.** La palabra que busca la gente va primero («Colchón Queen», «Inversor 6 kW»). Sin MAYÚSCULAS, sin emojis, sin precio.
- Los sinónimos cubanos van en la descripción (sombrilla/paraguas, nevera/refrigerador, cubrecama/sobrecama).
- **Bajo pedido:** el título solo dura si se cambia también en la bolsa del proveedor (`crm_market_items`); si no, la próxima publicación lo pisa (ver 7).

## 2. Descripción
- **Corta (1–2 frases):** el beneficio. En bajo pedido sigue el aviso «Bajo pedido · llega en 24 h…» (lo pone el Core).
- **Larga (400–900 letras), en este orden:** 1) para qué sirve y a quién · 2) de 5 a 8 viñetas con datos **confirmados** · 3) medidas, capacidad, peso · 4) qué incluye y qué no · 5) garantía y cuidados · (30-oct, Lennys: **la descripción habla SOLO del producto**; cómo se compra va en el recuadro «¿Cómo comprar en Casa Viva?» con flecha roja, fuera de la descripción, y en la página `/como-comprar/`) · 6) 2 o 3 preguntas frecuentes **reales** (de las gestoras).
- Cada dato con su marca **Confirmado / Sugerido / Falta** en la ficha interna (skill `/ficha`). Lo que no está confirmado no se publica: «consultar» o fuera.
- Tono Casa Viva: cálido (tú), corto, sin «baratísimo», «oferta loca», «precio por privado».

## 3. Google y WhatsApp (por producto)
- **Título SEO** (`_cvd_seo_title`): hasta 60 letras, palabra clave primero, «| Casa Viva» al final si cabe.
- **Meta description** (`_cvd_meta_description`): 140 a 155 letras, qué es + dato clave + «en La Habana» + llamada a la acción. *Desde hoy (Core 3.14.83) si falta se usa el texto del producto, ya no el aviso de bajo pedido.*
- **Slug:** no se toca, salvo los malos (con «-2», raros o repetidos), y siempre con redirección 301 (D124).
- **Texto alt** en cada foto: tipo + color + modelo («Cortina tapa sol Royale gris, panel de 1,37 m»).
- Categoría correcta (una principal) y sin categorías basura.

## 4. Fotos
- **Mínimo 3:** frente, detalle (etiqueta, tela, botones) y escala o uso (con algo al lado o puesto).
- **La foto comercial (de estudio o del proveedor) va SIEMPRE de portada; las reales, detrás** (30-oct, Lennys: «que pusiera las fotos reales también, pero no que las cambiara»). **Bajo pedido:** vale la foto del proveedor del modelo exacto.
- JPG o WebP de hasta 150 KB, nombre de archivo descriptivo (`cortina-tapa-sol-royale-gris-1.jpg`). Sin IA de pago sin el SÍ de Ernesto; nunca «creado con IA».

## 5. Categorías
- Texto de 80 a 150 palabras útil para el cliente (qué hay, medidas típicas, cómo elegir). Hoy: 0 letras en las 19.
- Juntar las casi vacías: «Sala» → «Sala y muebles», «Baño, cocina» → la que toque, «Aires acondicionados» → «Electrodomésticos», «Juguetes» → «Accesorios»; los 7 de «Sin categorizar» a su sitio.

## 6. «Producto listo» (lo que se mide cada semana)
Listo = 3 fotos o más (y al menos 1 real si es propio) + descripción de 400 letras o más con medidas + título de 45–65 letras + título SEO y meta propios + alt en todas las fotos. **Hoy: 73 de 923 cumplen la parte de fotos.**

## 7. Piloto (20 productos propios, los primeros de la lista de prioridad)
290 cortina Royale · 118 sobrecama lisa full · 2449 fundas Majestic · 2407 cama plegable · 302 protector Queen · 2463 farol solar · 2491 sábanas Majestic camera · 119 maceta suculenta · 177 alfombras baño 3 pzas · 3714 almohada cervical · 2523 protector King · 2908 cortina baño flores · 2906 cortina baño conchas · 2387 capas de moto · 346 doyle rectangular · 463 bata de baño · 2755 mochila M-15 · 2457 edredón + sábana Queen · 2397 alfombra Bienvenido · 3556 organizador con ruedas.
Para cada uno: copia del antes en JSON con fecha → fotos reales de la biblioteca a la web (hay 42 esperando para estos 20) → textos → comprobación en el móvil con la caché purgada → panel ✓/✗ para Lennys.

## Decisiones para Ernesto
1. ¿Apruebas este estándar tal cual?
2. Los 21 productos publicados dos veces (bajo pedido, a veces con precio distinto): ¿oculto el repetido más nuevo y dejo el que se vendía? (no toco precios)
3. Bajo pedido: ¿le paso a **web-maraton** que el Core no pise título/descripción mejorados al volver a publicar, y que el `supplier-feed` de Sergio no borre fotos reales?
4. ¿Junto las 4 categorías casi vacías como dice el punto 5?
