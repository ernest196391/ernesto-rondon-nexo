# Piloto de fotos de producto — Digital Store → web de Casa Viva (bajo pedido)

**Fecha:** 2026-10-12 · **Hecho por:** Claude (en local) · **Nada publicado, nada subido, ningún mensaje enviado, 0 créditos gastados.**

Hoja visual: `hoja-piloto.jpg` (borde verde = foto final, cruz roja = descartada, número = nota 0-10).
Datos: `auditoria.json` (nota y motivo de cada foto), `normalizacion.json` (medidas y ampliación), `<id>/web/fuentes.json` (de dónde salió cada foto de internet).
Comparación de fondo: `ejemplo-blanco-vs-crema.jpg`. Programas usados: `../scripts/`.

## Resultado en una línea

De 12 productos, **9 quedan listos** (6 con fotos del proveedor y 3 con fotos oficiales de internet) y **3 se quedan bloqueados** porque no hay ninguna foto buena. Del proveedor solo sirvieron **15 de 47 fotos (32 %)**.

## Tabla

Carpeta = primeros 8 caracteres del `id` del catálogo. «Prov» = foto del proveedor. «Web» = foto de internet.

| # | Producto (carpeta) | Fotos encontradas | Usadas (nota) | Descartadas y por qué | Fuente web | Tiempo aprox. |
|---|---|---|---|---|---|---|
| 1 | BLUETTI Elite 100 V2 (`498c4cd9`) | 5 prov | 1 (7) | 4: anuncios con títulos en inglés, app, infografía de batería | — | 2 min |
| 2 | Batidora Farberware (`37da52ba`) | 6 prov | 3 (9, 8, 7) | 3: **son de otra batidora (Ninja Classic)** | — | 2 min |
| 3 | Cafetera cubana (`7cc8a1c0`) | 2 prov | 0 · **BLOQUEADO** (provisional nota 5) | 01: buena pero diminuta (389 px), ampliada 2,1× se ve blanda; 02: collage de medidas con logo «Milky House» | Buscada: no hay coincidencia exacta (genérica) | 5 min |
| 4 | Lámpara LED recargable 30 W (`25b0d739`) | 1 prov | 0 · **BLOQUEADO** | Texto en inglés, fondo oscuro, lámpara cortada, 423 px | Buscada: muchas parecidas, ninguna comprobable (genérica) | 4 min |
| 5 | Protector de voltaje 12 A (`c240ada1`) | 4 prov | 1 (7) | 3: collage de habitaciones, ambiente con título, infografía | — | 2 min |
| 6 | Samsung A17 4/128 gris (`0bd4c7ba`) | 3 prov + 5 web | 2 web (9, 8) | Prov: solo la caja; trasera de 325 px; render sobre fondo negro. Web: versión 4G con funda, guía de tallas, anuncio de Norton | coolblue.de (renders oficiales de Samsung) | 8 min |
| 7 | JBL Charge 6 (`85ecbad6`) | 5 prov | 2 (8, 7) | 3: infografía naranja, ambiente con texto, **altavoz azul** (otro color) | — | 2 min |
| 8 | Power bank Quikcell 10 000 mAh (`6fc938b1`) | 1 prov | 0 · **BLOQUEADO** | Texto «Fast Charging» encima, sale con un iPhone, 681 px | Modelo hallado (Quikcell PowerFuel 10K, QCFUEL10, Newegg), pero la página pide «¿eres humano?» y eso no se salta | 6 min |
| 9 | Lenovo V15 G6 ARP (`750aa656`) | 5 prov | 4 (8, 7, 7, 7) | 1: repetida. En las 4 usadas se tapó con blanco el logo AMD y la línea legal | — | 3 min |
| 10 | Logitech MK270 (`32b6702f`) | 4 prov + 6 web | 4 web (9, 9, 8, 7) | Prov: la 01 parecía buena pero **el teclado está cortado** por la derecha; 3 con bandas de texto y fondo turquesa. Web: 2 perfiles que sobran | logitech.com (oficial) | 8 min |
| 11 | Nintendo Switch OLED blanca (`cc696612`) | 4 prov | 4 (9, 7, 8, 7) | 0 | — | 2 min |
| 12 | PS4 edición Uncharted 4 (`4b9725f0`) | 3 prov + 3 web | 2 web (8, 7), línea de copyright tapada | Prov: pequeñas (581–720 px) o cortadas; el pack trae **juego y caja que la descripción no menciona**. Web: auriculares que **no vienen** | blog.playstation.com/?p=168638 (fotos oficiales de Sony) | 8 min |

**Total:** 47 fotos del proveedor + 14 de internet revisadas una a una. 23 fotos finales de 1200×1200 (75 KB de media). Tiempo total del piloto ≈ 1 hora de Claude, incluida la investigación y los programas.

## Lo que enseñó el piloto

1. **El proveedor mezcla.** Fotos de otro producto dentro de la ficha (Farberware con Ninja), otro color (JBL azul), otra versión (Samsung 4G/5G). Hay que revisar **todas las fotos de un producto juntas** y compararlas con el nombre.
2. **Cuidado con prometer de más.** Fotos con caja, juego, funda o auriculares que no vienen. Si la descripción no lo dice, esa foto no va.
3. **Mirar también el resultado.** El teclado Logitech parecía bien y solo al centrarlo se vio que estaba cortado. El programa ahora avisa si el producto toca el borde.
4. **Lo genérico no se arregla con internet.** Cafetera y lámpara sin marca: no hay forma de comprobar que una foto de internet es la misma. Hace falta una foto real.
5. **Fotos pequeñas:** ampliar hasta 1,8× con un poco de enfoque queda bien (protector, 1,81×). A 2,1× ya se ve blando (cafetera).
6. **Infografías en inglés:** casi todas las fotos 2–5 del proveedor lo son. No se usan; su información va al texto de la ficha.

## Decisiones de estilo (para que Ernesto apruebe)

- **Fondo blanco puro, no crema.** Google, Meta y WooCommerce esperan fondo blanco o liso, y con crema los productos blancos se vuelven color hueso (ver `ejemplo-blanco-vs-crema.jpg`). La crema de la marca va en la web (alrededor de la foto) y en las publicaciones de redes, no dentro de la foto.
- **Sin logo ni marca de agua en la foto.** Google Shopping y el catálogo de Meta rechazan fotos con marcas de agua, logos de tienda o texto promocional. Además, casi todas son fotos del fabricante, así que una marca de agua no protege nada. La marca de Casa Viva va en el marco de la web y en las plantillas de redes.
- **Cuadrado 1200×1200, producto centrado con 8 % de margen.** WooCommerce pide al menos 800 px; Meta recomienda 1024; Google exigirá mínimo 500×500 desde el 31-ene-2027 y aconseja 1500 para lucir más. 1200 es buen equilibrio de calidad y peso (≈75 KB).

## Pendiente de una persona

- Confirmar con el proveedor: Samsung A17 ¿es 5G? · PS4 ¿trae el juego y la caja?
- Avisar al proveedor de que la Farberware tiene fotos de una Ninja.
- Foto real para cafetera, lámpara y power bank (o dejarlos fuera de la web por ahora).

## Fuentes de las reglas

- Google Merchant Center, enlace de imagen: https://support.google.com/merchants/answer/6324350
- Google Merchant Center, cambios 2026 (mínimo 500×500 desde 31-ene-2027): https://support.google.com/merchants/answer/16989427
- Meta, catálogo (guías de terceros: 500×500 mínimo, 1024×1024 recomendado, sin marcas de agua): https://www.tryvizup.com/blog/meta-catalog-ads-specs-2026 · https://www.godatafeed.com/disapproval/meta-product-image-contains-watermark
- WooCommerce, tamaños (guías de terceros: ≥800 px, subir 1200×1200): https://seahawkmedia.com/woocommerce/woocommerce-product-image-size/
