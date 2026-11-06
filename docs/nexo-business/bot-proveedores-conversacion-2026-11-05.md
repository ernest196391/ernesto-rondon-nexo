# Pedido para bot-maraton: cómo habla el bot con PROVEEDORES (Vigía, 5-nov-2026)

Caso real: XAG Góndolas (5355148266, Fontanar). Error #227 (alta).

## Qué pasó (5-nov)
1. 10:22 — El bot le preguntó a XAG «¿el mueble mostrador MK-1886 se puede recoger en tienda o solo lo entregan a domicilio?» sin nombre, foto ni precio. La pregunta venía de la gestora Nadielys (8:07). Un código MK no le dice nada al proveedor.
2. 14:44 — XAG contestó «Sí. Se puede recoger en Fontanar». El bot le respondió «Para avisar a la persona correcta, cita la pregunta que estás respondiendo o dime de qué producto y de quién es la consulta», como si fuera una gestora.
3. XAG preguntó «¿Usted me habla de este mueble?» con foto. El bot contestó cosas internas («no lo encuentro con ese nombre exacto en el catálogo», «se lo pregunté a la tienda y todavía no me han respondido») y creó una pregunta basura para la tienda.
4. XAG escribió «No entiendo este bot». Ernesto tuvo que disculparse a mano (15:24).
5. Nadielys quedó 7 horas sin respuesta. El Vigía se la dio a las 15:33 (#4437) y cerró las preguntas pto15rurt y pto1ogji4.

## Qué se pide
a) Toda pregunta a un proveedor lleva NOMBRE del producto, un dato clave (medida o precio) y la foto si existe. Dice con claridad qué quiere saber en una sola pregunta («¿se puede recoger en tu almacén de Fontanar o solo entregan?»).
b) Si el proveedor contesta (con cita o sin ella) mientras hay una pregunta abierta, se toma como la respuesta: el bot da las gracias en una línea («Gracias, anotado») y reenvía la respuesta a quien preguntó en minutos. Nunca se le pide que «cite la pregunta».
c) El bot NO contesta con datos internos a un proveedor (catálogo, tienda, gestoras). Si el proveedor no entiende, repite la pregunta una sola vez con nombre y foto; si vuelve a no entender, avisa a Ernesto y no escribe más.
d) Cuando Ernesto (humano) ya está escribiendo al proveedor, el bot calla.
e) Las frases de conversación del proveedor no se convierten en preguntas «¿Tenemos …?» para la tienda.

## Cómo probarlo
Sin enviar nada real (modo prueba). Avisar al Vigía en 4 líneas.
