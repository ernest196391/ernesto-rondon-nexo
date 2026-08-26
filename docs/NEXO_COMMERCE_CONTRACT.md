# NEXO Commerce — contrato operativo v1

## Autoridad

- WooCommerce conserva producto, precio publicado, inventario y pedido oficial.
- NEXO conserva captura, archivos originales, evidencia, investigación, ficha, cálculo y auditoría.
- Casa Viva conserva atribución, comisión, mensajería, operación y conciliación.

## Identificadores

`nexo_capture_id`, `nexo_product_id`, `woocommerce_product_id`, `woocommerce_order_id`, `casa_viva_order_id`, `commerce_id`, `gestora_id`, `captured_by`, `verified_at`.

## Estados de captura

`uploaded → analyzing → researching → awaiting_review → woocommerce_draft → published`

Desvíos: `needs_evidence`, `failed`. Ningún producto con `missingCritical` puede crear borrador.

## Evidencia y confianza

Cada campo conserva valor, origen, confianza e imágenes o URL de respaldo. Una inferencia no puede superar 0.5. Valores fotográficos legibles y consistentes pueden superar 0.8. Las contradicciones se conservan y nunca se corrigen en silencio.

## Precio

Prioridad: producto → categoría → comercio → global. Mensajería queda separada. Cada cálculo conserva costo, regla, incremento, reserva, costos, comisiones, precio bruto y final.

## Atribución

Los enlaces `?ref=` o `?cv_ref=` siguen siendo resueltos por `CVD_Attribution`; el checkout oficial ejecuta sus hooks y WooCommerce guarda el pedido.
