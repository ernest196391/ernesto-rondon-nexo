# Respuestas preparadas para Lennys (16-oct-2026)

Este archivo es para quien conteste a Lennys cuando Ernesto no esté: el supervisor del VPS o cualquier sesión de Claude.

**Cómo usarlo:**
- Contesta en español sencillo, corto y con ejemplos con números. Lennys es la dueña y administradora.
- **No le mandes tareas de tienda** (recoger, entregar, contar). Esas son de Nana y Zaymi.
- Si pregunta algo que **no** está aquí, o pide **decidir dinero** (porcentajes, pagos, precios): «Eso lo vemos con Ernesto, ya se lo paso». Después avisa a Ernesto.

**Contexto.** El 15-oct por la noche Lennys dejó en su chat varias cosas que no funcionaban. Ernesto dijo: «lee lo que ella necesita y corrígelo». Esto es lo que pidió, lo que se hizo y lo que queda.

---

## 1. Pagos de comisiones sin chat (EN VIVO desde el 16-oct, Core 3.14.23)

**¿Qué cambió?** Antes las gestoras pedían su comisión por el grupo «Casa Viva Despachos» y había que buscar a mano cuánto era. Ahora:
1. La gestora entra en su área → **Cobrar** → elige cuánto quiere (todo o una parte) y cómo (transferencia en CUP o efectivo) → **Pedir mi pago**.
2. A Lennys le llega un WhatsApp: «*Fulana pide su comisión* · Transferencia: X CUP», con la tarjeta, el teléfono y un **enlace**.
3. En el enlace («Pagar a…») están:
   - el importe en CUP;
   - el detalle por pedido;
   - los botones **Copiar tarjeta**, **Copiar teléfono** y **Copiar importe**.
4. Hace la transferencia en Transfermóvil, **sube la captura** (o escribe el número de la transacción) y toca **Ya pagué**.
5. A la gestora le llega «✅ Te pagaron X CUP…» y ve la captura en su área.

**Preguntas que puede hacer**
- **¿Con qué tasa se calcula?** Con la tasa **del día de cada venta**, como decidió Ernesto. Si un pedido viejo no guardó la tasa, se usa la que había ese día en el registro de tasas.
- **¿Y si la gestora debe algo a la tienda?** Se le descuenta **entero** al cobrar.
  - Si la deuda es mayor que lo que pide, no se crea la solicitud y a la gestora se le explica.
  - Las deudas se apuntan o se quitan en **/contabilidad/**. Al quitar una no se borra: queda escrito quién la quitó.
  - Hoy no hay ninguna deuda apuntada. Si una gestora debe, por ejemplo los «2.000 y pico CUP», hay que apuntarla ahí.
- **¿Y en efectivo?**
  - A Lennys le llega «Fulana pide su comisión en efectivo · Hay que darle X CUP».
  - A **Zaymi** también, para que lo tenga listo en la tienda. Ella toca «Dinero listo».
  - La gestora lo recoge y toca **Recibido**. Si en la tienda no hay dinero, lo manda Lennys.
  - Para avisar también a Nana se añade su teléfono a la lista de efectivo (lo hace Claude).
- **¿Si toco «Ya pagué» dos veces?** No se paga dos veces: el sistema lo bloquea.
- **¿El enlace sirve para siempre?**
  - Caduca a los **7 días**.
  - Cuando el pago ya está hecho, el mismo enlace solo enseña el comprobante, ya sin la tarjeta.
  - Es solo para quien paga. Una dependienta no puede abrir una transferencia.
- **¿La gestora puede pedir solo una parte?** Sí.
  - Van pedidos enteros, del más viejo al más nuevo.
  - Lo que no retira queda guardado para la próxima vez.
- **¿Puedo rechazar un pago?** Sí. Se le avisa a la gestora: «no se aprobó, ese dinero sigue en tu saldo».
- **¿Y los pagos que ya estaban aprobados antes?** Siguen igual y se pueden pagar desde el panel o desde la página nueva:
  - **#2:** 1 USD por transferencia, que sale como 780 CUP.
  - **#3:** 15 USD en efectivo.
  - **#4:** «otro», con la cuenta que escribió la gestora.
- **¿Se pega bien en Transfermóvil?** Copiar tarjeta da solo los 16 números, sin espacios, y Copiar teléfono da los 8 números. Si algo no se pega, se mantiene el dedo sobre el número y se copia a mano. Ernesto lo está probando en su móvil.
- **¿Hay que dejar el grupo de Despachos?** Ernesto dijo que quien quiera puede dejarlo cuando esto esté probado. A las gestoras todavía **no** se les ha avisado: primero se prueba con Lennys.

**Estado de la prueba** (supervisor):
- `crm_settings avisos_pago`: `prueba` = todo le llega a Ernesto; `si` = a quien corresponde.
- El día de la prueba se pone en `si`.
- Cuando Lennys lo apruebe, se hacen los tutoriales para las gestoras y se anuncia en el General, con el SÍ de Ernesto.

---

## 2. Costos, gastos fijos y mínimo (EN VIVO 16-oct)

### Lo que pidió Lennys
1. «En los productos con variaciones no me deja ponerle el costo».
2. «¿Por qué 1,59 de gastos fijos a todo? En lo barato no nos queda nada». Y si ese 1,59 incluye el 2 % (0,5 % de la dependienta + 1,5 % de Nati).
3. «Debes dejar el dato tal y como lo dejo»: que nadie le pise los costos que pone a mano.
4. El panel decía «mínimo 8,14» y la web «mínimo 6,05»: no coincidían.

### Lo que se hizo
1. **Costo por color:** en el panel → producto → «Diseños y colores», cada color tiene «Costo de compra USD».
   - Debajo está «Costo para todos los diseños», que pone el mismo costo en todos los colores. Luego se pulsa «Guardar».
2. **Gastos fijos según el costo.** El 1,59 eran los gastos fijos del mes repartidos **igual** entre 330 unidades. **No incluía el 2 %.**
   - Ahora cada producto carga el **7,98 % de lo que costó** (redondeado, «el 8 %»).
   - La cuenta: gastos del mes **525,69 USD** ÷ (330 unidades al mes × 19,96 USD de costo medio) = 7,98 %.
   - Así lo barato carga poco y lo caro más, y entre todos se siguen pagando los 525,69 del mes.
   - **Gastos fijos que entran** (por mes, en CUP con la tasa de hoy):

     | Gasto | CUP | USD |
     |---|---|---|
     | Electricidad y renta | 159.000 | 205,16 |
     | Salarios | 110.000 | 141,94 |
     | Depreciación | 52.708,50 | 68,01 |
     | Teléfono | 26.500 | 34,19 |
     | Mantenimiento del local | 20.000 | 25,81 |
     | Viáticos | 15.000 | 19,35 |
     | Javas | 6.950 | 8,97 |
     | Atención a proveedores | 6.000 | 7,74 |
     | Café | 5.200 | 6,71 |
     | Material de oficina, cubo, papel sanitario, jabón, frazada, detergente, escoba | ~5.800 | ~7,8 |

   - Se ven y se cambian en el panel → **Ajustes → Costos**. Ahí también se cambian las «unidades al mes» (330) y se puede volver a «Iguales por unidad».
3. **Sus costos están protegidos.** Lo que Lennys guarda a mano ya no lo cambia nada automático: ni una factura leída, ni un Excel, ni un script, ni la copia de precios del proveedor de las 8:50. Si algo lo intenta, queda el de ella y queda apuntado.
4. **Mismo mínimo en el panel y en la web.** Ernesto decidió el 16-oct que la web use el **mínimo completo**, igual que el panel. Antes la web solo contaba costo + comisión + 0,50.

### Cómo se calcula el mínimo («no vender por debajo»)
**Mínimo = costo + gasto fijo + comisión de la gestora + una ganancia mínima.** La ganancia mínima es lo que sea **mayor** de estas dos cosas: el **10 % del precio** o **1 USD**.

| Producto | Costo | Gasto fijo | Comisión | Mínimo | Precio | Estado |
|---|---|---|---|---|---|---|
| Bola navideña | 4,55 | 0,36 (antes 1,59) | 1 | 6,92 | 8 | ✓ Bien (antes «bajo el mínimo») |
| Topper con gel | 32,07 | 2,56 | 7 | 46,26 | 60 | ✓ Bien |
| Algo de Maryta de 5 USD | 5 | 0,40 | — | — | — | — |

- **«Queda limpio por unidad»** = precio − costo − gasto fijo − comisión.
  - Bola: 8 − 4,55 − 0,36 − 1 = **2,09**. Antes salía 0,86.
  - Topper: 60 − 32,07 − 2,56 − 7 = **18,37**.
- **Las etiquetas:**
  - **✓ Bien:** el precio llega al mínimo.
  - **Bajo el mínimo:** gana algo, pero menos de lo que debería.
  - **Pierde:** no cubre ni el costo más la comisión.
  - «Bajo el mínimo» **no** quiere decir que pierda dinero. Lo decidió Ernesto el 14-oct.
- **Pregunta pendiente para Lennys:** ¿también se resta en «queda limpio» el 0,5 % de la dependienta y el 1,5 % de Nati? Hoy no se resta. Si dice que sí, se cambia en Ajustes.

### Productos que hoy salen «bajo el mínimo» en la web (16-oct, 20 a la venta)
No se cambió ningún precio: eso lo decide Lennys, con la propuesta de Ernesto.

| Producto | Precio | Mínimo |
|---|---|---|
| Estante organizador de metal y madera, 5 niveles | 38 | 38,13 |
| Riñonera gris / verde | 10 | 10,23 |
| Cojín forma de flor naranja | 25 | 25,03 |
| Cortina de baño 180×180 rojo | 8 | 11,32 |
| Ventilador recargable F6 (negro, naranja, verde) | 70 | 76,44 |
| Casas en miniatura 8 cm | 6 | 6,64 |
| Silla de oficina 23_222 | 75 | 83,55 |
| Shampoo 2 en 1 | 6 | 6,32 |
| Protector de colchón king | 39 | 39,33 |
| Masajeador corporal | 56 | 56,22 |
| Sobrecama Queen (blanco, verde, beige) | 38 | 38,13 |
| Válvula de paso mini HH 1/2" (hembra / hembra-macho) | 4 | 4,88 / 4,32 |
| Escamadora de pescado | 6 | 6,32 |
| Brazalete deportivo para celular | 7 | 7,04 |

Muchos quedan por céntimos: subirlos 1 USD basta. Los que más se alejan son los ventiladores F6, la silla de oficina y la cortina de baño. Si pregunta, explica la cuenta y dile que el panel le dice el precio sugerido.

**Si cambian los gastos fijos o las unidades,** cambia el %. El panel lo aplica al momento. La web lo actualiza en cada producto cuando se guarda su costo; para actualizar todos de una vez, hay que pedírselo a Claude, que tiene el script.

---

## 3. Fotos de los productos (EN VIVO 16-oct, Core 3.14.25)
**Lo que pidió:** al crear un producto solo dejaba subir una foto. En los productos con variaciones quería una foto comercial para el producto y una foto real de cada color.

**Lo que se hizo:**
- En el panel, **Nuevo producto**: «Foto principal» y «**Más fotos (opcional)**», hasta 8.
- **Producto con diseños**: «**Foto comercial**» y «Más fotos comerciales» para el producto, y «**Foto real**» en cada color.
- Las fotos de más se añaden a la galería de la web sin repetirse.

Todavía no se ha probado guardando un producto de verdad. Si a Lennys algo no le sale, que mande captura y se avisa a Ernesto.

---

## 4. Stock (16-oct)
**Lo que pidió:**
- «La web de administración es la verdad, ya lo arreglé uno por uno».
- Que en todas partes esté igual.
- Que solo ella y Ernesto puedan cambiar el stock.

**Lo que se hizo:**
- Se comparó la web con la caja y había 16 diferencias, casi todas en productos ocultos. Se igualaron con la web como verdad.
- Se dio de alta en la caja la «Cortina blackout moderna (2 paneles)» (36 USD, 4 unidades, costo 24, comisión 4), que estaba en la web pero no en la caja.
- El «Organizador de 2 niveles» estaba en −1 en la web y quedó en 0.

**¿Quién puede cambiar el stock a mano hoy?**
- En la web, solo Lennys y Ernesto. Nana y Zaymi lo cambian solo con los pedidos.
- En el panel, solo Lennys y Ernesto.
- En la **caja**, cualquier dependienta, con el botón «**Llegó mercancía**». **Pregunta pendiente para Lennys:** ¿lo cerramos para que solo lo usen ella y Ernesto, o que quede «por aprobar»? No está hecho: espera su respuesta y el sí de Ernesto.

**Ojo:** lo que Lennys cambie a mano **en la administración de la web** (WooCommerce) **no pasa a la caja**. Lo mejor es cambiar el stock desde el **panel**. Si lo hace en la web, hay que avisar para igualarlo.

---

## 5. Otras cosas que dejó en su chat
- **Lámpara recargable que no aparecía:** era la «Lámpara recargable portátil», de 25 USD, que estaba oculta desde lo de BizneCubano. Ya está a la venta en la web y en la caja con **2**. **Falta su costo** y que confirme que son 2.
- **Tendedero rosado de Dayra:** vuelve a la venta con **1** en la web y en la caja («Última unidad»). El azul sigue oculto.
- **Ely / #3700:** la mensajería la hizo Félix y el dinero y la carrera quedaron a nombre de **Félix**. A Ely ya no le sale. Lo único que tiene pendiente es su propio #3832 (15 USD).
- **Rafael / #2963** (puerta corredera, recogida en tienda):
  - La clienta la recogió el 14-oct y Nana lo confirmó en el grupo.
  - Nana no encontraba el vale porque la pantalla de pedidos solo enseñaba los 50 últimos. **Arreglado** (Core 3.14.24): ahora `/ventas/` encuentra cualquier pedido por número, nombre, teléfono o gestora.
  - A las 10:05 del 16-oct se le pregunta a Nana cómo se cobraron los 60 USD. Con eso se cierra y la comisión de Rafael (6 USD) pasa a aprobada.
- **Regla de la tienda:** se quitó el texto viejo del 33/33/33. Ahora la gestora cobra su comisión normal también por lo que su clienta compre de más. El premio de la dependienta está **en espera**, porque Lennys dijo que el 5 % es mucho y hay que estudiarlo.

---

## 6. Hacia dónde vamos (para cuando pregunte «¿y ahora qué?»)
- **Que cada producto tenga su costo real.** Con eso el panel dice solo cuáles dejan ganancia, cuáles están bajos y a qué precio venderlos, y las comisiones salen bien para las gestoras y para la tienda. Lo que falta: que Lennys termine de poner los costos que faltan (el panel los marca «sin costo»).
- **Que las gestoras cobren sin chat.** Se prueba con Lennys, luego tutoriales para las gestoras y se cierra el grupo de Despachos para los pagos.
- **Un solo stock**, el de la web y el panel, sin cambios a mano fuera del panel.
- **Fotos reales** de cada producto y de cada color.
- **Decisiones que esperan a Lennys:**
  - el 2 % en «queda limpio»;
  - cerrar «Llegó mercancía»;
  - el costo de la lámpara;
  - los precios de los 20 productos bajo el mínimo;
  - el % del premio de la dependienta.
