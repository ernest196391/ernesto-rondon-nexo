# Bajo pedido en 24 horas, casi automático

**Idea de Ernesto, 13-oct-2026 13:08.** Etapas 1–3 hechas: Ernesto contestó las 5 preguntas (D47) y el flujo está **en vivo desde el 13-oct a las 14:24** (VivaBot `483b9fb`). Cómo funciona, órdenes y cómo pararlo: `docs/00-FUENTE-DE-VERDAD/ESTADO.md`, sección L4. Falta: verlo con el primer pedido real y la etapa 4 (contárselo a las gestoras).

| | |
|---|---|
| **Quién** | Gestoras y clientes que piden productos de proveedores (bajo pedido), y Ernesto, que recoge en algunas tiendas. Hoy hay 253 productos de Digital Store (Kevin) y 3 de Sergio; vienen más tiendas y e-commerce. |
| **Promesa** | Respuesta en **menos de 1 hora**: está o está agotado. Entrega en **24 horas**. Las gestoras pueden pedirlo y publicarlo; ese tipo de pedido va «bajo supervisión». |
| **Evidencia** | Nadielys (13-oct) preguntó cómo vender lo nuevo y si se recoge o va con mensajería. El split de Harley (12-oct) se hizo todo a mano en la tienda de 23 y 42. |
| **Cómo se mide** | Minutos hasta la respuesta del proveedor, % de pedidos confirmados en menos de 1 h, % entregados en menos de 24 h y agotados por proveedor. |
| **Qué existe ya** | Core 3.13.63: un pedido bajo pedido no sale al grupo de mensajeros. VivaBot (`bajopedido-rules.js`, `bolsa-rules.js`) ya avisa a Ernesto, escribe al proveedor, lee su «sí/no», ofrece parecidos si no lo tiene y avisa a la gestora. También hay fichas de proveedor (`suppliers-rules.js`, tabla `crm_suppliers`, con los campos `lleva` y `recoge`) y la regla de recogida 24/48 h. |

## El flujo

1. **Entra el pedido** (de la web o de una gestora) con un producto bajo pedido.
2. **Al proveedor, al momento**, si está en su horario: «¿Tienes X? ¿Sigue a Y USD?».
   - A los 20 min sin respuesta, se le recuerda.
   - A los 40 min, si otro proveedor tiene lo mismo, se le pregunta a ese.
   - A los 55 min, a la gestora se le dice «seguimos confirmando» y Ernesto recibe una alerta.
   - Fuera de horario, a la gestora se le dice «te confirmo mañana a las 9».
3. **Si el proveedor dice que sí:** la gestora recibe «✅ confirmado, llega antes de [hora]». Si la compra la hizo el cliente directo en la web, el bot le escribe al cliente.
4. **Si dice que no:** la gestora recibe los productos parecidos con su precio, y el pedido espera a que ella diga qué hace.
5. **Cómo llega a Casa Viva**, según la ficha del proveedor:
   - *Lo lleva él* (Sergio, Kevin, Electros…): lleva el producto a la tienda o al cliente.
   - *Hay que recogerlo* (4ta y 3ra, 23 y 42…): entra en la **ruta de Ernesto**.
6. **Resumen a Ernesto:** cada mañana y cuando entra algo urgente, le llega «Hoy tienes que recoger: [tienda] · [dirección] · abre [hora] · pagar [X] · pedidos #…». Va agrupado por tienda y en el orden que encaja con los horarios.
7. Después sigue el reparto normal: al grupo de mensajeros o directo, como cualquier pedido.

## Para que crezca (escalable)

- **Cada tienda o e-commerce nuevo = una ficha y nada más:** nombre, WhatsApp, dirección, **horario**, si lo lleva (a la tienda o al cliente), cómo se le paga y quién lo atiende. Para ninguna se escribe código aparte.
- **El sistema aprende solo:** cuánto tarda cada proveedor en responder y cuántas veces dice que sí. Si varios tienen el mismo producto, pregunta primero al más rápido y fiable.
- Las fichas se editan desde el chat «Tú» (`FICHA …`). Falta añadir el **horario**.

## Preguntas para Ernesto (antes de construir)

1. **Clientes de gestora:** los avisos van solo a la gestora, y ella se lo dice a su cliente (es la regla de hoy). Al cliente se le escribe solo si compró directo en la web. ¿Así?
2. **Los proveedores que lo llevan:** ¿lo llevan a la tienda de Casa Viva o directamente al cliente?
3. **Las tiendas:** Sergio, Kevin y Electros lo llevan; en 4ta y 3ra y en 23 y 42 recoge Ernesto. ¿Falta alguna (dijo también «20»)? ¿Qué horario tiene cada una? ¿Cuál es el teléfono de Electros?
4. **De noche:** ¿vale prometer «te confirmo mañana a las 9» en lugar de la hora?
5. **El dinero:** ¿quién le paga al proveedor y cuándo? Por ejemplo: Ernesto al recoger, o el mensajero cuando el proveedor lo entrega.
