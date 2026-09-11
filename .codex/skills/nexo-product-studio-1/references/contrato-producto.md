# Contrato mínimo de producto

## Registro comercial

- `sku`, `name`, `slug`, `category`, `brand`, `model`
- `supplier_price`, `currency`, `shipping_cost`, `reserve`, `markup`, `commissions`, `public_price`
- `warranty`, `delivery_terms`, `availability_status`, `verified_at`
- `short_description`, `description`, `benefits[]`, `specifications[{name,value,unit}]`, `faq[]`
- `primary_image`, `gallery[]`, `alt_text`, `woo_product_id`, `status`

## Product Knowledge Record

- `summary`, `customer_description`, `aliases[]`, `product_type`
- `specs[{name,value,unit,confidence,evidence}]`
- `sources[{type,title,url,supports,consulted_at,confidence}]`
- `contradictions[]`, `gaps[]`, `sales_playbook`, `faq[]`

## Separación de datos

El precio del proveedor, margen, reparto y notas de conciliación son internos. El cliente solo ve precio público, descuentos autorizados, entrega, garantía y disponibilidad. Cada cálculo debe ser reproducible desde su regla e historial.
