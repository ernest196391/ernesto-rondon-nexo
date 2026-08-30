# NEXO-GESTORAS-001 — Estado de aceptación

## Automatizado en este cambio

- Base, fijo, porcentaje, personalizado, límites, redondeo, moneda y precedencia de regla por producto.
- TypeScript, lint, suite completa y build de producción.
- Rutas dinámicas de storefront y oficina incluidas en el build.

## Contratos implementados

- Perfil/slug/estado; acceso firmado y ownership server-side.
- Storefront derivado y selección sin duplicar catálogo.
- First-touch persistido, segundo enlace preservado y override administrativo append-only.
- Regla global y por producto versionadas.
- Precio de ficha y carrito resuelto en servidor.
- Reconciliación del pedido WooCommerce, snapshot inmutable e idempotencia durable.
- Ledger provisional/accrual/reversal; payout transaccional y por moneda.
- Mensajería separada; auditoría; caché privada/no-store; respuesta pública sin datos financieros.
- Cola persistente de conciliación cuando falla una actualización posterior a crear el pedido.

## Evidencia que requiere staging

Las pruebas con credenciales reales, webhook, base Render y WooCommerce deben ejecutarse tras desplegar: ficha→carrito→checkout→pedido, caída/reintento, evento entregado+cobrado, cancelación/devolución, payout, dos gestoras, dos sesiones, 320/390/escritorio y verificación del plugin 0.2.0. No se consideran aprobadas únicamente por el build local.
