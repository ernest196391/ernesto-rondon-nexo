# Mercancía de Nana en la web · 23-oct-2026

**Pedido de Lennys (admin):** 10:13 fotos y precios · 10:22–10:23: «Esta mercancía es de Nana. Ella pidió específico que fuera en esos precios para no estancar su mercancía. La ganancia de la tienda distribuir en lo que es gastos fijos».

## Lo que encontré
Los 4 productos **ya existían**. Lennys los creó en su panel el 20-oct (22:30–22:41) y los ocultó con «Ocultar». Tenían fotos, descripción y unidades, y ya estaban en la caja (retirados). Por eso **no creé fichas nuevas**: las puse otra vez a la venta en la web y en la caja, con los datos de hoy. Así no hay productos repetidos ni en la web ni en la caja.

## Productos (EN VIVO, comprobados con curl: 200 y precio)
| Woo | Producto | Enlace | Precio | Gestora (fija) | Costo = para Nana | Tienda (a gastos fijos) | Unidades | Categoría |
|---|---|---|---|---|---|---|---|---|
| 4896 | Compresor de aire portátil CUPSHE F8801 con pantalla digital | https://casaviva.company/producto/compresor-portatil-cupshe/ | 42 | 5 | 30 | 7 | 5 | Movilidad |
| 4902 | Bocina Bluetooth portátil T&G TG-157 con luces LED | https://casaviva.company/producto/bocina-tg/ | 50 | 4 | 41 | 5 | 4 | Tecnología |
| 4908 | Tira de luces LED RGB de 10 metros con control remoto | https://casaviva.company/producto/luces-10-metros/ | 27 | 3 | 20 | 4 | 5 | Tecnología |
| 4913 | Lámpara LED recargable de escritorio con portalápices | https://casaviva.company/producto/lampara-de-escritorio/ | 26 | 3 | 19 | 4 | **falta** (en existencia, sin número) | Apagones y energía |

Las unidades 5 / 4 / 5 son las que puso Lennys en el panel el 20-oct. La lámpara tenía 0.

## Qué se cambió
- **Web (Core 3.14.52):** publicado y visible (lo mismo que «Volver a vender»). Nombre más claro, precio de Lennys, `_cvd_commission_type=fixed` + `_cvd_commission_value`, `_cvd_cost_usd` (fuente `manual`), `_cvd_consignacion` = «Nana (23-oct, por Lennys) · precio fijado por ella… · la ganancia de la tienda va a gastos fijos» (igual que los de Ely, 3893), `_cvd_admin_note` con el reparto, y una descripción corta con lo que se ve.
  - **Compresor:** tenía la descripción, la categoría («Habitación»), el SKU y los datos de BizneCubano de la **tabla de planchar 4894**, porque era una copia («Duplicar»). Ahora tiene una descripción nueva, sacada solo de lo que pone la caja (80 W, 19 L/min, batería 7,4 V 1800 mAh × 2, USB-C, de 3 a 5 h, 12,8 × 7,8 × 5,2 cm, modos y presiones). La categoría es Movilidad, igual que el otro compresor, y el SKU es `nx-119`, el mismo de la caja. Le añadí la foto de la caja con las características (recortada con sharp, id 4997).
  - **Bocina, luces y lámpara:** se queda la descripción larga que escribió Lennys en el panel. Solo cambié el nombre, el precio, el dinero y la descripción corta.
  - **Fotos:** las de la web ya eran las mismas que mandó Lennys hoy (las subió ella el 20-oct). No subí copias repetidas. No hay caras ni datos personales.
  - Mínimo de Core: el compresor está «ok». La bocina, las luces y la lámpara salen **«bajo»** el mínimo (de 0,20 a 1,76 USD) porque la tienda solo gana 4–5 USD. Es lo que decidió Nana con Lennys. «Bajo el mínimo» no quiere decir que se pierda dinero.
- **Caja (nube, `nexo_business`):** los mismos 4 productos (`nx-119`…`nx-122`) vuelven a la venta, con el mismo nombre, precio y categoría. Tienen `product_costs` con costo y **dueña = Nana** (socia `d333378e…`, inversora, regla `supplier_price`: cobra el costo por unidad vendida) y `product_commissions` 5/4/3/3. También quedó apuntado en `cost_audit`. Las cajas lo reciben en su próxima sincronización. La lámpara no tiene unidades en la caja: **no se puede vender en caja hasta que alguien la cuente**.
- Caché purgada; inicio y /tienda/ dan 200. En las páginas públicas no sale «Nana» ni «gastos fijos».

## Cortinas tapasol (NO son de Nana, NO se tocaron)
Las 4 fotos de las 11:20–11:21 son capturas de fichas que **ya están en la web**. Las cifras «3, 10, 9, 4» son las unidades que quedan. Lennys contestaba la pregunta de Ernesto de las 10:08: «Quedan por fin las persianas». Coinciden exactamente con la web y con la caja:
- 2453 Cortina roller enrollable 160X280 · 65 USD · **3**
- 2433 Cortina roller enrollable 172X280 · 70 USD · **10**
- 2451 Cortina roller enrollable 100X160 · 55 USD · **9**
- 2431 Cortina roller enrollable 140X280 · 60 USD · **4**

En la caja son de «Casa en Sueño» (consignación). «No son persianas, son cortinas tapasol» corrige el nombre que usó Ernesto. Idea, sin hacer: añadir «tapasol» al nombre o a la descripción para que salgan en el buscador.

## Dudas para Lennys
1. **Lámpara:** ¿cuántas hay? En el panel puso 0 el 20-oct.
2. ¿Siguen siendo 5 compresores, 4 bocinas y 5 tiras de luces?
3. **Bocinas:** ¿son todas turquesa? Solo hay fotos de ese color.
4. ¿Nana cobra en USD o en CUP? Su ficha de socia ya existe (inversora, cobra el costo por unidad vendida).

## Archivos
- `originales/`: las 19 fotos de Lennys de hoy.
- `fotos/compresor-cupshe-f8801-caracteristicas.jpg`: la foto subida.
- `publicar-nana.php`: el script de la web (en seco por defecto).
- `bak-caja-antes.json`: copia de la caja antes del cambio.
- Copia de la web: Hostinger `~/bak-20261023-nana-antes.json` (post, meta y categorías de los 4).
- SQL de la caja: VPS `/root/archivos/nana-caja.sql`.
- **Deshacer:** con la copia, volver a poner los meta y `post_status=private` en la web. En la caja: `nexo_business_products_retire(..., true)` o `retired_at=now()`.
