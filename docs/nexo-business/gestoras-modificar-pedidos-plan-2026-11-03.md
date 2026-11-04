# Que las gestoras puedan recuperar, cambiar y cancelar sus pedidos sin errores de dinero (plan del Vigía, 3-nov-2026)

Caso que lo motivó: Nadielys (gestora) pidió 6 veces, entre las 10:55 y las 14:07, separar el pedido #6062 (un protector Queen para Ricardo, mañana; un Camero para Katy, hoy). El bot respondió 8 veces «ya no se puede desde aquí, se lo paso a Ernesto» o «lo tiene que aprobar Ernesto». Al final alguien creó el #6102 con un topper de 60 USD que ella no pidió (total 94 en vez de 34), y el mensajero ya lo había aceptado. El Vigía quitó el topper a las 14:27 con la función oficial del Core (total 34 USD, avisos automáticos al mensajero y a la gestora).

## 1. ¿Es posible? Sí, y la mayor parte ya existe
El Core ya tiene, para la tienda (Lennys, Zaymi, Nana: permiso `cvd_manage_sales`), estas funciones en `CVD_Order_Edit` (`class-cvd-order-edit.php`):
- `edit()`: cambia nombre, teléfono, dirección, día y ventana de entrega, nota, vuelto, **quita o baja la cantidad de productos** y **añade productos** con el precio de ESA gestora. Ajusta la existencia, deja la cola de cambios para la caja, recalcula la comisión (`mark_pending`) y avisa por WhatsApp al mensajero y a la gestora (`CVD_Order_Avisos::record_edit`).
- `cancel()`, `reactivate()` y `set_change()`.
- Reglas de bloqueo (`edit_block`, `cancel_block`): no se cambia si el mensajero ya recogió el paquete, si está cerrado o cancelado, si la ganancia del mensajero ya está liquidada ni si hay una reserva vigente.

Lo que NO existe:
1. Que la **gestora** use esas funciones sobre sus propios pedidos (hoy solo la tienda).
2. **Dividir un pedido** en dos (otro cliente, otra dirección).
3. Que el bot **pase la petición a la dependienta** en vez de a Ernesto.

## 2. Dónde puede haber errores de dinero (y cómo evitarlos)
| Riesgo | Cómo se evita |
|---|---|
| Subir el total o añadir un producto sin que la tienda lo sepa | La gestora solo puede QUITAR o BAJAR cantidad, nunca añadir ni subir precio. Añadir = nivel 2 (tienda). |
| Pedido ya pagado por adelantado (Zelle, PayPal, transferencia) | Bloqueado: cualquier cambio de total en un pedido prepago pasa a la tienda. |
| El mensajero ya recogió | Bloqueado (regla actual). Se pide la devolución a la tienda y luego se cancela con confirmación de «ya está aquí». |
| La tarifa de mensajería cambia por cambiar de municipio | Cambiar de municipio o reparto = nivel 2 (se recalcula con la tarifa oficial). |
| Comisión pagada o liquidada | Bloqueado por `can_void_order`; solo Ernesto. |
| Existencia mal ajustada | `edit()` ya deja la cola de cambios para la caja; verificar que no se duplique si se repite la misma orden (clave de idempotencia). |
| Dos personas cambian lo mismo a la vez | Una sola orden de cambio por pedido y minuto; nota con quién y cuándo. |
| Nadie se entera | Cada cambio avisa solo a mensajero, gestora y tienda, con «antes / ahora / total». Ya existe. |

## 3. Quién hace qué (niveles)
- **Nivel 1: la gestora, sola (por el bot o por su panel).** Solo sobre SUS pedidos, antes de que el mensajero recoja y sin pago adelantado. Puede: quitar productos o bajar cantidades, cambiar nombre, teléfono, dirección (misma zona), día y nota, y cancelar con motivo. Resultado: lo hace el Core con las funciones de arriba y confirma en una línea con el nuevo total.
- **Nivel 2: la dependienta de turno (Zaymi o Nana), con una tarjeta lista.** Añadir productos, subir el total, cambiar de municipio o tarifa, dividir un pedido, cualquier cosa después de la recogida o en un pedido prepago. El bot crea la tarea con TODOS los datos escritos (pedido, qué se pide, cómo quedaría el total) y se la deja a la dependienta; la gestora recibe «la tienda lo hace hoy antes de las X». No pasa por Ernesto.
- **Nivel 3: solo Ernesto.** Reembolsos, comisiones ya pagadas, días ya cerrados.

## 4. Cómo se construye (orden)
1. **Web (web-maraton):** endpoint para la gestora, `POST /gestora/pedido/{id}/cambiar` y `/cancelar`, que llame a `CVD_Order_Edit::edit/cancel` con una lista blanca (solo `lines` a la baja, contacto, día, nota) y las reglas de la tabla; solo `owner_user_id` = la gestora que pide. Botones «Cambiar» y «Cancelar» en su lista de pedidos. Función «Dividir pedido» solo para la tienda: mueve líneas elegidas a un pedido nuevo con otro cliente y dirección, conserva el total, reparte la comisión por línea y no manda avisos al cliente.
2. **Bot (bot-maraton):** reconocer «cambia, quita, separa o cancela el #N» de una gestora; nivel 1 → llamar al endpoint y confirmar; nivel 2 → crear la tarea para la dependienta; nunca «lo tiene que aprobar Ernesto» ni «cancelo» si no se canceló (hoy hay mensajes contradictorios sobre el Camero del #6062 a las 10:58 y 11:01).
3. **Tablero:** mostrar a la dependienta de turno las tareas de nivel 2 con un botón.
4. **Pruebas sin dinero real:** pedidos de ensayo marcados (`_cvd_ensayo`), con la regla «sin teléfono real» para que no salgan WhatsApp a números falsos.

## 5. Errores del bot detectados en este caso
- Dijo «lo tiene que aprobar Ernesto» para quitar un producto de un pedido: es falso, lo cambia la tienda.
- Dijo «cancelo el Camero» (10:58) y luego «todavía no está cancelado» (11:01).
- Repitió 4 veces «se lo paso a Ernesto» sin darle a Nadielys una fecha ni un responsable.
- «Cambiar a mensajería» solo funciona antes de salir de la tienda; no ofrece una alternativa útil después.
- Se creó el #6102 con un producto que ella no pidió (topper de 60 USD).

## 6. Decisiones para Ernesto
1. ¿Aprobar los 3 niveles de arriba? (recomendado)
2. ¿Quién es el responsable del nivel 2 en la tienda: la dependienta de turno? (recomendado)
3. ¿La gestora cancela sola un pedido antes de la recogida? (recomendado: sí, con motivo y aviso al mensajero)
