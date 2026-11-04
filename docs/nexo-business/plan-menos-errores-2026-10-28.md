# Plan para que el sistema cometa menos errores (propuesta del 28-oct-2026)

Hecho por el vigía de chats a partir de los errores de la semana (#32 a #121 en crm_errores) y de lo que pasó el 27 y 28-oct. Es una propuesta: Ernesto decide.

## Los 6 errores que se repiten

| # | Qué pasa | Ejemplo real |
|---|---|---|
| 1 | El bot dice que hizo algo y no lo hizo | «Anotado» sin guardar (Lennys, Dany); «datos confirmados de Melani» sin cambiar el pedido (#5604) |
| 2 | Una persona decide sin saber lo que el bot prometió | El bot dijo a Kay «se guarda hasta mañana»; Nana canceló el #5551 |
| 3 | El mismo dato se escribe en varios sitios a mano | Hoja de papel, marca «recibido» en la web y mensaje de WhatsApp: no cuadran (27 y 28-oct) |
| 4 | Datos que se copian del cliente anterior | El vale #5604 llevó el teléfono y parte de la dirección de otra clienta |
| 5 | El bot trata como persona lo que no lo es, o no entiende una orden | Autorrespuesta de Revolico contestada; «#supervisor» respondido con un párrafo |
| 6 | Todo depende de que Ernesto o Claude estén conectados | SSH bloqueado, supervisor apagado, 29 errores esperando decisión |

## La idea central

**Una acción = un registro verificado.** Nada «se anota», «se guarda» ni «se avisa» solo en el texto de un mensaje: primero se hace, se comprueba, y después se dice.

## Los 6 pilares

1. **Acciones verificadas (el bot nunca promete sin registro).**
   - Toda promesa del bot crea una fila en una tabla de pendientes (quién, qué, día límite, estado).
   - El texto del bot se escribe después de que el registro se creó. Si falla, dice «se lo paso a Ernesto».
   - El resumen de las 10:00 y el barrido del supervisor listan lo abierto hasta cerrarlo.
2. **Dinero: un solo cierre, sin papel y sin marcar de golpe.**
   - Corto plazo (ya pedido): cuadre por dependienta y por día; el bot compara la foto de la hoja.
   - Definitivo: Nana y Zaymi marcan cada cobro en el momento en que lo reciben y hacen el conteo de billetes en la propia caja (la app de caja de NEXO). El sistema dice «cuadra» o «faltan X» antes de que ella se vaya. El resumen de Lennys sale de ese cierre, no se recalcula.
3. **Lo que se promete llega a la tienda.**
   - Una reserva (guardar hasta mañana, esperar al cliente) es un campo del pedido, visible en la lista de la dependienta, con aviso rojo «Kay pidió guardarlo hasta el día X».
   - La cancelación automática o manual pide confirmación si hay reserva.
4. **Validar los datos al crear el vale.**
   - Si el teléfono ya existe en otro cliente con otro nombre, la web avisa a la gestora antes de guardar (igual que el aviso «ya compró con otra gestora»).
   - Teléfono y dirección se piden en campos separados, y el mensaje de WhatsApp pegado se lee con IA y se confirma («¿Es Melani, 53220458?»).
5. **Que el sistema no dependa de una conexión.**
   - El supervisor del VPS atiende las órdenes de Lennys con «#supervisor» (ya aprobado).
   - Un vigilante comprueba cada 5 minutos que el VPS, el bot y la web responden, y avisa a Ernesto por WhatsApp o correo si no.
   - Conexión SSH única y reutilizada (ControlMaster) para no disparar bloqueos por muchas conexiones.
6. **Menos cola de decisiones para Ernesto.**
   - Semáforo: verde (reversible y pequeño: lo hace el supervisor y cuenta después), ámbar (Lennys decide, que su pedido ya cuenta como aprobado), rojo (Ernesto: dinero, precios grandes, borrar).
   - Los errores de más de 5 días en «para decidir» se revisan en una sola página de 5 minutos, con casillas.
   - Cada error se convierte en una regla con prueba (`npm run check`); medir cada semana: errores por día y «anotado sin registro» (debe ser 0).

## Orden recomendado

1. Pilar 1 (ya en marcha con bot-maraton) y cuadre por dependienta + foto de la hoja (aprobado el 28-oct).
2. Pilar 3 (reservas visibles para la tienda): evita pérdidas de comisión y quejas.
3. Pilar 4 (validar datos del vale).
4. Pilar 5 (vigilante y conexión única) junto con `#supervisor`.
5. Pilar 2 definitivo (cierre en la caja).
6. Pilar 6 (semáforo y revisión semanal).

## Qué se mide

- Anotados sin registro = 0.
- Diferencia entre hoja y cuadre cada día (meta: 0 USD o explicada en el momento).
- Pedidos cancelados por la tienda con reserva activa = 0.
- Vales con datos de otro cliente = 0.
- Errores nuevos por día (bajar semana a semana).
