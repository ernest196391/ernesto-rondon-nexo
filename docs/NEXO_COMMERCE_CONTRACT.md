# NEXO Commerce — contrato operativo v1

## Autoridad

- WooCommerce conserva producto, precio publicado, inventario y pedido oficial.
- NEXO conserva captura, archivos originales, evidencia, investigación, ficha, cálculo y auditoría.
- NEXO conserva perfiles comerciales, storefronts de gestora, atribución efectiva de pedidos NEXO, reglas de markup, snapshots, ledger, payouts y auditoría.
- Casa Viva conserva su operación propia y funciona como adaptador temporal de mensajería/conciliación cuando corresponda. Sus comisiones no son pagables en pedidos con `_nexo_ledger_owner=nexo`.

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

Los enlaces `?ref=` se capturan en NEXO. La propietaria efectiva se resuelve por `override administrativo > identidad persistida > first-touch de sesión > orgánico`. WooCommerce guarda el único pedido oficial y NEXO conserva tanto la referencia solicitada como la atribución efectiva. Los metadatos CVD son únicamente compatibles durante la transición.

## Commercial Foundation

- Storefront público: `/g/{slug}`; deriva catálogo, disponibilidad e imágenes desde WooCommerce.
- Precio: se calcula en servidor con regla versionada `base|fixed|percent|custom_final`; una excepción de producto prevalece sobre la regla global.
- La mensajería se cotiza y registra fuera de precio, markup y comisión.
- El checkout reconcilia líneas del pedido oficial y guarda un snapshot comercial inmutable.
- El ledger NEXO es append-only. El pedido crea `provisional`; `delivered_paid` crea `accrual` disponible; cancelación/devolución crea reverso.
- Solo un payout pagado puede cerrar económicamente entradas disponibles.
- `_nexo_ledger_owner=nexo` bloquea cualquier ledger CVD paralelo pagable.
