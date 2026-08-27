# NEXO Commerce — carrito v1

## Frontera

- La interfaz pública vive en `/carrito` y nunca construye URLs hacia el frontend de Casa Viva.
- `/api/commerce/cart` es la única frontera del navegador para leer o modificar el carrito.
- El servidor usa WooCommerce Store API y guarda `Cart-Token` en una cookie `HttpOnly`, `SameSite=Lax` y segura en producción.
- Las credenciales REST existentes siguen utilizándose solamente en servidor para catálogo y producto; no intervienen en la sesión del carrito.
- La primera lectura añade un identificador único para impedir que un CDN intermedio reutilice una respuesta anónima cacheada.

## Atribución

`?ref=` se conserva en catálogo, ficha y carrito. Al añadir el primer producto, la frontera valida el código y lo guarda en una cookie `HttpOnly` separada para que el futuro checkout lo incorpore al pedido oficial.

## Próxima frontera

`NEXO-COMMERCE-002` debe implementar `/checkout`, leer el carrito y la atribución desde esta misma frontera y crear el pedido oficial sin exponer credenciales ni desviar al cliente al frontend de Casa Viva.
