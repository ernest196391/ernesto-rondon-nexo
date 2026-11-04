# Cómo arreglar los productos que pierden y cómo escalar a un marketplace grande (14-oct-2026)

## 1. Productos que se venden perdiendo (20 de 150)
**Causa:** la web no sabe cuánto cuesta cada producto. Los precios se pusieron a mano y algunos costos del Excel están cruzados con otra fila (14 casos).

**Arreglo, en este orden:**
1. **Ernesto revisa la lista de costos cruzados** (`simulacion-precios/2026-10-11/posibles-costos-cruzados.md`) y después Lennys confirma los costos reales.
2. **El costo pasa a ser un dato obligatorio de cada producto:** los de la tienda salen del archivo de BizneCubano o de la caja; los de proveedor, de `supplier_price`.
3. **Precio mínimo automático** = costo + gastos fijos (1,58 USD por unidad) + comisión + ganancia mínima. Un producto por debajo del mínimo no se publica, o se publica marcado para revisar. Alerta diaria a Ernesto.
4. **Para cada uno de los 20,** una de tres cosas: subir el precio al mínimo (la regla de Lennys), bajar su comisión fija, o venderlo como liquidación hasta que se acabe y no reponerlo.
5. **Una sola tasa del CUP** para la web, la caja y el bot.

## 2. Cuellos de botella de un marketplace grande, y qué hacer desde ahora
| # | Cuello de botella | Qué pasa hoy | Qué hacemos |
|---|---|---|---|
| 1 | **Costos y precios** | Sin costos, se pierde dinero sin saberlo | Costo obligatorio + precio mínimo automático (punto 1) |
| 2 | **Inventario** | Tres fuentes: web, caja y BizneCubano | Una sola verdad (NEXO/Supabase); la web y el bot leen de ahí; conteo por departamento |
| 3 | **Alta de productos** | Fotos, textos y departamentos a mano | Ficha estándar (foto real + comercial + medidas), agente nocturno de catálogo, importar por archivo de cada proveedor |
| 4 | **Proveedores** | Cada uno por WhatsApp, a mano | Ficha por proveedor, más adelante un portal para que suban productos, confirmen pedidos y vean sus pagos; puntuación por cumplimiento |
| 5 | **Reparto y dinero en efectivo** | Grupo de mensajeros y cuentas a mano | App del mensajero, liquidación diaria automática, cuadre con la caja |
| 6 | **Comisiones y pagos** | Se cierran a mano | Libro único de comisiones, red y bonos; pago semanal automático con su recibo |
| 7 | **WhatsApp** | Un solo número con una conexión no oficial: si WhatsApp lo bloquea, se para todo | Número de reserva listo; estudiar la API oficial de WhatsApp Business; nada crítico solo por WhatsApp (la web y los paneles también avisan) |
| 8 | **La web** | WordPress en hosting compartido: límite de correos, lentitud, cambios directos en producción sin copia de prueba | Copia de prueba (staging), pruebas automáticas antes de subir, imágenes en CDN; a medio plazo, la tienda multi-vendedor en NEXO |
| 9 | **Personas** | Ernesto y Lennys aprueban casi todo | Reglas escritas (DECISIONES), permisos por rol, tablero Ernesto / Lennys / Claude |
| 10 | **Confianza** | Sin reseñas ni garantía clara | Reseñas reales, política de garantía y devoluciones, antifraude (autocompras, cuentas falsas) |

## 3. Las 2 próximas semanas (por orden)
1. Costos y precio mínimo (arregla las pérdidas, y los puntos del programa salen de ahí).
2. Inventario con una sola verdad.
3. Copia de prueba de la web y pruebas automáticas antes de cada subida.
4. Número de WhatsApp de reserva.
5. Libro de comisiones y pagos automáticos (lo necesita el programa de piedras).
