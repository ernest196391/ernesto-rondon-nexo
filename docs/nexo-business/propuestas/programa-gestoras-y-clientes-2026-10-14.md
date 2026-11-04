# Programa de gestoras y clientes — propuesta (14-oct-2026)

Para: Ernesto · Hecho por: Claude · Estado: **PROPUESTA. No se ha programado nada, no se ha cambiado la web ni la base, no se ha escrito a nadie.**

---

## Resumen en 10 líneas

1. **Lo de «cliente de por vida» ya existe en la web.** El cliente que compró con una gestora queda unido a ella por su teléfono o su correo. Si vuelve a comprar solo en la web, la comisión completa es de ella (D50). Falta que **las gestoras lo vean y lo sepan**.
2. **La red de invitaciones está a medias.** La web ya guarda quién invitó a cada gestora (`_cvd_invited_by`) y el panel lo muestra. **No paga nada todavía.**
3. **Puntos para clientes: no hay nada.**
4. **Números reales** (web, 11 al 14-oct, 3 días): 46 pedidos, **2.008 USD**, ticket medio **43,65 USD**, **23 gestoras** vendieron y la comisión media es el **10,9 %** (4,82 USD por pedido).
5. **Margen:** costo × 1,5 = **33 % de ganancia bruta** (fórmula de Lennys). Después de la comisión, a Casa Viva le quedan unos **22 USD de cada 100** vendidos, antes de los gastos fijos.
6. **Tu 1 % + 0,5 % es sostenible.** Cuesta como mucho 15 USD por cada 1.000 USD que venden las invitadas: el 6,7 % de lo que le queda a Casa Viva de esa venta. Es más barato que el 2 % que se le propuso a Lennys.
7. **Hay que ponerle 4 frenos:** calcularlo sobre el precio de Casa Viva (sin el recargo de la gestora), un tope del 40 % de la ganancia para todas las comisiones juntas, cobrar la red solo si tú también vendes, y pagarlo una vez al mes.
8. **Clientes que traen clientes:** «Tú 3, tu amiga 3». La amiga ahorra 3 USD en su primera compra y quien la trae gana 3 USD para su próxima compra. El cliente nuevo pasa a la gestora de quien lo trajo.
9. **Coste total estimado: entre 84 y 579 USD al mes** (0,8 % a 2,8 % de las ventas). Se paga solo con **9 a 59 pedidos más al mes**.
10. **Antes de programar:** Lennys tiene que estar de acuerdo, porque lo paga Casa Viva. Luego tú respondes 8 preguntas (sección 7) y se prueba con Dany en «modo sombra», que calcula pero todavía no paga.

---

## 1. Lo que ya existe en la web (Core) y lo que falta

| Pieza | Qué hay hoy | Qué falta |
|---|---|---|
| Cliente unido a su gestora | Sí. `find_existing_owner` busca el teléfono, el correo o la cuenta del cliente en sus pedidos anteriores. Si encuentra una gestora, la venta es suya **siempre**, aunque el cliente compre solo, con el enlace de otra gestora o por el bot. | Que la gestora lo vea: «tuyo para siempre», lo que lleva ganado con cada cliente y un aviso cuando un cliente suyo compra solo. |
| Cambiar la dueña de un cliente | Sí. Administración puede pasar un cliente a otra gestora, con motivo obligatorio y registro. Afecta solo a las compras futuras (`class-cvd-attribution-overrides.php`). | Nada urgente. |
| Comisión | Sí. Se guarda por producto (fija o %), más el recargo propio de la gestora. Se aprueba **solo cuando el dinero está verificado** (`approve_for_closeout`). Se anula si se cancela o se devuelve. | Nada para la gestora. Para la red, hay que colgar el 1 % y el 0,5 % de esa misma aprobación. |
| Compra de la gestora para sí misma | Sí, se detecta. Si el pedido tiene el teléfono o el correo de la gestora, queda marcado «Revisión requerida» (`self_order`). | Que ese pedido no genere red ni puntos. |
| Invitar gestoras | Sí. Enlace `?invita=` con QR. Al registrarse se guarda `_cvd_invited_by` (solo si la invita una gestora aprobada; no se puede invitar a sí misma ni cambiarse después). El panel enseña «invitada por». | Pagar el 1 % y el 0,5 %. Pantalla «Mi equipo». Bono para la invitada. |
| Pagos | Sí. «Pedir mi pago» con Transfermóvil, Zelle o efectivo, historial y descuentos pendientes (`class-cvd-payouts.php`). | Sumar lo de la red al saldo disponible. |
| Lista «Mis clientes» | Sí. Muestra compras y última compra, y la gestora puede añadir clientes a mano. | Ver el hallazgo B, más abajo. |
| Rangos, retos, insignias, puntos de clientes | No hay. | Todo. |

**Dos fallos que encontré y que conviene arreglar antes (o a la vez):**

- **A. Un pedido sin pagar ya «se queda» al cliente.** `find_existing_owner` cuenta los pedidos en estado `pending`. Una gestora podría crear un pedido con el teléfono de un cliente directo de Casa Viva, no pagarlo nunca, y quedarse con el cliente para siempre. **Propuesta:** que solo unan al cliente los pedidos entregados y cobrados (o en curso de verdad), y que los pedidos sin pagar se cancelen solos a los 7 días.
- **B. El cliente añadido a mano en «Mis clientes» no está protegido.** Va a la lista (`wp_cvd_clients`), pero la atribución solo mira los pedidos. Si ese cliente compra después por otro lado, la venta no es de ella. **Propuesta:** que cuente, pero solo si ese teléfono no ha comprado nunca, y solo durante 60 días: si en 60 días no compra, se libera. Así nadie acapara listas de teléfonos.

**Lo ya decidido que esta propuesta respeta:**
- D50: el último enlace manda para un cliente nuevo; el cliente que ya compró sigue con su gestora.
- D33: lo extra que compra en la tienda el cliente de una gestora es de ella.
- D36 y D37: la comisión es por producto y se gestiona en el panel.
- D30: la devolución anula la comisión.
- D42: el cliente de NEXO es la gestora.

**Lo que hay que reconciliar:** a Lennys se le mandó el 11-oct la «Red de gestoras» (`docs/nexo-business/propuesta-red-de-gestoras.html`). Ahí iba un **2 % de un solo nivel**, con un tope del 40 % de la ganancia, la condición de vender tú para cobrar del equipo y el pago a los 7 días. **Todavía no ha contestado.** Tu 1 % + 0,5 % la sustituye y sale más barato. Hay que decírselo y que diga que sí, porque sale del margen de su tienda.

---

## 2. Los números reales (solo lectura, `cv pedidos-hoy 14` + `cv pedido`)

La web arrancó en limpio el 11-oct, así que hay **3 días de datos** (11-oct 11:29 → 14-oct 08:02). Hay que volver a calcularlo a los 30 días.

| Dato | Valor |
|---|---|
| Pedidos reales (sin pruebas ni cancelados) | 46 |
| Ventas | 2.008 USD |
| Ticket medio | **43,65 USD** |
| Pedidos con gestora | 45 de 46 |
| Gestoras que vendieron | **23** (de 28 aprobadas el 11-oct) |
| Comisión total | 216,70 USD = **10,9 %** de las ventas |
| Comisión media por pedido | **4,82 USD** |
| Ya entregados | 26 pedidos, 1.096 USD |
| Cancelados reales | 6 de 52 (≈ 11 %) |
| Al ritmo de hoy, en un mes | ≈ 21.000 USD (puede ser el pico del arranque) |

**Las que más vendieron en 3 días:** Patricia 305 USD (2 pedidos), Nadielys 277 (8), Daymee 180 (3), Oliuska 171 (3) y Thaly 140 (1). Dany (Daniela Moreno) vendió 106 USD en 4 pedidos.

**Margen.** No hay costo por producto en la web. Uso la fórmula de Lennys (**costo × 1,5 → 33 % de ganancia bruta**, de la propuesta del 11-oct) y el motor de precios. Ojo: allí hay productos que dejan muy poco, como la cortina Royale, con 9,4 % limpio. Para no depender de un solo número, enseño también 25 % y 45 %.

**Lo que le queda a Casa Viva de cada 100 USD vendidos:**

| Margen bruto | Ganancia | − comisión 10,9 | Queda (antes de gastos fijos) |
|---|---|---|---|
| 25 % | 25,0 | 10,9 | 14,1 |
| **33 % (real)** | **33,3** | **10,9** | **22,4** |
| 45 % | 45,0 | 10,9 | 34,1 |

Con un margen del 25 %, las comisiones de hoy ya se llevan el 44 % de la ganancia. En ese caso cualquier programa nuevo tiene que tener tope.

---

## 3. Lo que aprendí de las empresas buenas (con fuentes)

**Multinivel y venta por catálogo**
- **Natura:** 5 niveles (Semente, Bronze, Prata, Ouro, Diamante). Se sube por **puntos de venta propia**, no por reclutar, y cada nivel gana un poco más (del 20 al 35 % según blogs). Los premios fuertes son reconocimiento, regalos y viajes. [1]
- **Avon México 2025:** las líderes ganan sobre 3 generaciones: 6,5 % / 3 % / 2 % (Líder Bronce). Para cobrar hay que tener **ventas personales mínimas**. Hay una «protección» para no bajar de título por un mes malo. [2]
- **Mary Kay:** del 4 % al 13 % sobre el equipo, según el tamaño del equipo y **las compras propias**. Críticos como Pink Truth denuncian que eso empuja a la autocompra. **No lo copiamos.** [3]
- **Yanbal:** «Escalera del Éxito», viajes y reconocimiento. La idea de su jefa: que la directora gane como mínimo 2 salarios mínimos. [4]
- **Jafra:** títulos (Team Leader → Gold Director) y premios anuales por ventas del grupo. No encontré los % oficiales. [5]
- **Amway (caso FTC 1979):** se salvó de ser pirámide con 3 reglas: vender al menos el 70 % de lo comprado, **10 clientes reales al mes** para cobrar del equipo, y recompra del stock que sobra. [6]

**Comercio social, afiliados y referidos**
- **Meesho (India):** la revendedora no tiene stock: comparte el catálogo por WhatsApp y la plataforma entrega y cobra. **Es el modelo de Casa Viva.** Créditos de 100 a 200 rupias por amiga que compra. [7]
- **Shein (afiliados, Reino Unido):** **12 % por cliente nuevo y 0,8 % por cliente que ya compraba.** Paga mucho más por traer que por repetir. [8]
- **Shopee:** hasta 10 % + lo que pague la marca. Pago mensual. **Autocompra = expulsión.** [9]
- **Plugins de afiliados (AffiliateWP, Solid, UpPromote):** «comisión de por vida» = el cliente queda unido en la base de datos, no en el navegador. Algunos lo cortan a los X días o pagan menos por la repetición. [10]
- **Dropbox:** premio para los dos (500 MB y 500 MB), tope de 16 GB, y la invitación al final de los pasos de alta. Pasó de 100.000 a 4 millones de usuarios en 15 meses. [11]
- **Temu:** el premio llega cuando la amiga **compra**, no cuando se registra. Aun así, hubo estafas con códigos en TikTok. [12]

**Puntos de clientes**
- **Starbucks:** las estrellas caducan a los **6 meses sin actividad**. [13]
- **Sephora:** 3 niveles por gasto en el año (100 / 350 / 1.000 USD) y 1 / 1,25 / 1,5 puntos por dólar. [14]
- **Coste típico de un programa de puntos:** devolver del 1 al 5 % de la compra. Entre el 20 y el 30 % de los puntos no se usan nunca. [15]

**Cuándo un multinivel se vuelve pirámide (FTC, guía 2018 y revisión posterior) [16][17]**
- El dinero tiene que salir de **ventas a clientes reales** que no están en la red. No de reclutar.
- Comprar para subir de rango o para que cobre tu madrina es mala señal. Comprar para tu casa, no.
- Nada de cuotas de entrada ni compras obligatorias.
- Nada de prometer ingresos sin datos. Según AARP (2018), el 47 % de los que entran en un multinivel pierde dinero y el 27 % queda igual. [18]

**Errores típicos y cómo los evitamos**

| Error | Defensa en Casa Viva |
|---|---|
| Autocompras para cobrar | Ya existe la marca `self_order`. Esos pedidos no dan red, ni rango, ni puntos. |
| Cuentas falsas («mi prima», mi segundo número) | Alta aprobada a mano (D32). Alerta si comparten teléfono, cuenta de cobro, dirección o cliente. Tope de invitadas aprobadas por semana. |
| Puntos que nunca caducan | Caducan a los 6 meses sin comprar. |
| Costes que se comen el margen | Base = precio de Casa Viva. Tope del 40 % de la ganancia para todas las comisiones juntas. «Bajo pedido» caro con regla propia. |
| Liquidaciones lentas | Cierre automático el día 1 y pago del 1 al 5 de cada mes, visible en el panel. |
| Pagar por reclutar | Por invitar no se cobra nada. Solo se cobra cuando la invitada **vende y entrega**. |
| Promesas de dinero | Nunca «gana X al mes». Solo ejemplos con cálculo y la palabra «ejemplo». |

---

## 4. La propuesta: 3 piezas + extras

### Pieza 1 — «Madrinas Casa Viva» (invitar gestoras)

**La oferta.**
- **Nombre:** Madrinas Casa Viva.
- **Promesa:** «Invita, enseña y gana 12 meses: el 1 % de todo lo que venda tu ahijada y el 0,5 % de lo que vendan sus ahijadas. Sin pagar nada y sin comprar nada.»
- **Garantía:** «Tu ahijada cobra su comisión completa: tu 1 % lo pone Casa Viva, no sale de su bolsillo. Si ves un error en tu cálculo, se corrige en 48 h.»
- **Urgencia real:** las que inviten antes del 30-nov llevan la insignia **«Madrina Fundadora»** para siempre. No cuesta nada y es verdad.
- **Escasez real (opcional):** «Aprobamos 10 ahijadas por semana, para poder enseñarles bien.» Solo si de verdad es la capacidad de Lennys y Ernesto.
- **Bono para la ahijada:** **«Bono Primera Venta» de 2 USD** cuando entrega su primera venta, más el kit de arranque que ya existe (fotos, «Aprende» y tutoriales). El bono va a la que **vende**, no a la que invita.

**Reglas exactas**
1. Cada gestora nueva tiene una madrina: la gestora aprobada que la invitó con `?invita=`. Queda guardado y no se cambia.
2. **Nivel 1:** la madrina gana el **1 %** de cada venta de su ahijada. **Nivel 2:** la madrina de la madrina gana el **0,5 %**. **No hay nivel 3.**
3. Dura **12 meses** desde el día en que aprueban a la ahijada.
4. Solo cuentan las ventas **entregadas y con el dinero verificado** (la misma aprobación de la comisión). Si después hay devolución (D30), se descuenta el mes siguiente.
5. **Base del cálculo:** el precio de Casa Viva de lo vendido, **sin** el recargo propio de la gestora y **sin** la mensajería. Ejemplo: si una gestora vende a 140 USD algo que Casa Viva tiene a 120, el 1 % se calcula sobre 120.
6. **Para cobrar la red, véndele tú también a un cliente real:** al menos **1 venta propia entregada en ese mes**. Para el **nivel 2** hay que ser, además, **Anfitriona** o más (sección 5). Si un mes no cumples, lo de ese mes no se paga, pero no pierdes a tu equipo.
7. **Tope:** la comisión de la vendedora + el 1 % + el 0,5 % nunca pasan del **40 % de la ganancia** del pedido. El sistema recorta solo la parte de la red.
8. **Bajo pedido** (D43/D45): la red es la mitad (0,5 % y 0,25 %), porque allí la ganancia se reparte ya 40/60.
9. **No dan red:** los pedidos marcados `self_order`, los de prueba y los de cuentas del equipo.
10. Se calcula el día 1 de cada mes y se paga del 1 al 5, junto con «Pedir mi pago».

**Ejemplo en USD.** Marta invitó a Ana, y Ana invitó a Rosa. Rosa vende una alfombra de 30 USD (costo 20, ganancia 10).

| Quién | Cobra | De dónde sale |
|---|---|---|
| Rosa (vende) | 3,00 | su comisión normal |
| Ana (madrina, 1 %) | 0,30 | Casa Viva |
| Marta (nivel 2, 0,5 %) | 0,15 | Casa Viva |
| Casa Viva | 6,55 | |

Reparto: 3,45 de 10 = **34,5 %**, por debajo del tope del 40 %.

En un mes (es un ejemplo, no una promesa): si Rosa vende 600 USD, Ana gana 6 USD y Marta 3 USD. Si Ana tiene 5 ahijadas así, gana 30 USD al mes, unos 360 USD en 12 meses.

**¿Es sostenible el 1 % + 0,5 %? Sí.** Por cada 1.000 USD que vende una ahijada:

| Margen | Le queda a Casa Viva | Red (15 USD) = |
|---|---|---|
| 25 % | 141 | 10,6 % de lo que queda |
| 33 % | 224 | **6,7 %** |
| 45 % | 341 | 4,4 % |

Esas ventas **no existirían sin la ahijada**, así que Casa Viva gana igual. El peligro no es el %: es pagar sobre recargos, sobre «bajo pedido» caro o sobre autocompras. Por eso están las reglas 5, 7, 8 y 9.

**Mi recomendación:** mantener **1 % + 0,5 %**, 12 meses y 2 niveles como máximo, con las 10 reglas. No subirlo al 2 %: el valor está en que la madrina **enseñe**, no en el %.

**Riesgos y cómo evitarlos**
- Que reclutar se vuelva el negocio → por invitar no se cobra nada; sin venta propia no hay red; nivel 2 solo para Anfitriona o más; el ranking es por ventas.
- Cuentas falsas para cobrar un 1 % sobre ti misma → aprobación a mano y alerta automática si la madrina y la ahijada comparten teléfono, cuenta de cobro, dirección o clientes.
- Que la madrina le quite clientes a la ahijada → el cliente es de quien lo trajo primero (ya funciona así).
- Gestoras viejas sin madrina → no cambia nada para ellas. Se puede abrir un «reconoce a tu madrina» solo para las invitadas con `?invita=` desde el 11-oct (pregunta 1).

**Qué hay que programar**
- **Web (Core):** un libro de la red (pedido, beneficiaria, nivel, base, %, importe, estado, mes) que se escribe al aprobar la comisión, más el cierre mensual del día 1 con el tope y el requisito de actividad. Las devoluciones lo descuentan. El saldo se suma a «Pedir mi pago».
- **Pantalla de la gestora «Mi equipo»:** sus ahijadas (nombre, desde cuándo, días que faltan de los 12 meses, ventas entregadas del mes **sin datos de sus clientes**, lo que te deja cada una), las de nivel 2 en total, si este mes cumples la venta propia, y el botón «Invitar» (ya existe).
- **Panel de Lennys:** el árbol de la red, el coste del mes, las alertas y el botón para pausar a una gestora.
- **Estimado:** 3 a 5 días de trabajo, más la prueba.

### Pieza 2 — «Tu cliente, tuyo para siempre» (cliente de por vida)

**La oferta.**
- **Nombre:** Tu cliente, tuyo para siempre.
- **Promesa:** «El cliente que traes es tuyo: compre con tu enlace, solo en la web o por el bot, la comisión es tuya.» **Esto ya es verdad hoy**, solo hay que contarlo y enseñarlo.
- **Garantía:** «Si un cliente tuyo compra y la venta sale a nombre de otra, lo corregimos en 48 h y te pagamos esa comisión.»
- **Bono:** el aviso «Tu cliente María compró sola en la web: ganaste 4 USD». Es la prueba que quita el miedo.

**Reglas exactas**
1. Un cliente es de la gestora con la que hizo su **primera compra entregada y cobrada** (hoy basta un pedido sin pagar: arreglo del fallo A).
2. Se reconoce por el teléfono, el correo o la cuenta. Si el cliente usa otro número, la gestora lo reclama y administración lo une (eso ya existe).
3. **Web y bot:** comisión completa, como hoy (D50). No se toca.
4. **Tienda física (nuevo, opcional):** si el cliente da su teléfono en la caja, su gestora gana **la mitad de su comisión (5 %)**. Si el cliente viene con la gestora, sigue D33. Shein paga mucho menos por el cliente que repite; aquí la mitad es justo porque la tienda hace el trabajo.
5. **Para siempre, mientras la gestora siga activa:** al menos 1 venta cada 90 días. Si no vende en 6 meses, se le avisa 30 días antes, y después sus clientes pasan a Casa Viva. Así ningún cliente queda pagando comisión a alguien que ya no trabaja.
6. Los clientes añadidos a mano cuentan durante 60 días si no han comprado nunca (arreglo del fallo B).

**Ejemplo en USD.** María es clienta de Dany. Un mes después compra sola en la web un juego de ollas de 50 USD (comisión fija de 7). **Dany cobra 7 USD**, como hoy, y le llega el aviso. Si María, en cambio, entra a la tienda y compra 40 USD dando su teléfono: Dany cobra 2 USD (la mitad de 4).

**Coste para Casa Viva**
- Web y bot: **0 USD extra.** Ya se paga hoy.
- Tienda física con el 5 %: si los clientes de gestoras compran en la tienda 300 / 800 / 1.500 USD al mes, cuesta **15 / 40 / 75 USD al mes**.

**Riesgos y cómo evitarlos**
- Acaparar clientes ajenos → solo une una compra cobrada; los añadidos a mano caducan a los 60 días.
- Una gestora que se va y sigue cobrando → regla de los 90 días y los 6 meses.
- Una gestora que comparte su enlace y la venta es de otra → el panel le dice «este cliente ya es de otra gestora», sin dar el nombre.
- Privacidad → la gestora ve a sus clientes; nunca los de otra.

**Qué hay que programar**
- **«Mis clientes» mejorada:** la etiqueta «Tuyo para siempre», lo ganado con cada cliente, la marca «compró solo» y los filtros «sin comprar en 30 días» y «compraron este mes».
- El aviso por WhatsApp o notificación cuando un cliente suyo compra solo. A la gestora sí, **nunca al cliente** (D47).
- Arreglos A y B en `class-cvd-attribution.php`.
- **Caja:** buscar el teléfono del cliente y anotar a su gestora (caja Tauri + nube). Es lo más caro y se deja para la fase 3.
- **Estimado:** 1 a 2 días sin la caja, 3 a 5 días más con la caja.

### Pieza 3 — «Amigas Casa Viva: tú 3, ella 3» (clientes que traen clientes)

**La oferta.**
- **Nombre:** Amigas Casa Viva.
- **Promesa:** «Trae a una amiga: ella ahorra 3 USD en su primera compra y tú ganas 3 USD para la próxima tuya.»
- **Garantía:** «Si tu amiga compra y no ves tus 3 USD en 48 h después de la entrega, te los damos dobles.» El riesgo es pequeño y obliga a hacerlo bien.
- **Urgencia real:** en diciembre, «doble para quien invita» (6 USD). Es la temporada de Navidad.
- **Más adelante (fase 4):** 1 punto por cada USD que compres, donde 100 puntos = 1 USD (1 %), y niveles «Clienta Viva» y «Viva Oro». **Solo si los datos de los primeros 2 meses dicen que hace falta.**

**Reglas exactas**
1. Cada cliente tiene un código corto unido a su teléfono (por ejemplo CARMEN52), que puede mandar por WhatsApp. El enlace lleva también el `?ref=` de **su gestora**.
2. La amiga tiene que ser **nueva:** un teléfono que nunca ha comprado, con otro nombre y otra dirección.
3. **Primera compra de 20 USD o más:** la amiga paga 3 USD menos. Quien la trajo recibe 3 USD en puntos **cuando el pedido está entregado y cobrado.**
4. **La amiga pasa a ser clienta de la gestora** de quien la trajo, para siempre (pieza 2). Por eso a las gestoras les conviene empujarlo.
5. Los puntos se usan en la próxima compra, hasta el **20 % del pedido**. No se dan en dinero ni se pasan a otra persona.
6. Caducan a los **6 meses sin comprar** (como Starbucks).
7. Máximo **5 amigas al mes** por persona.
8. Las gestoras, las dependientas y los mensajeros no ganan puntos de cliente con sus propios teléfonos.

**Ejemplo en USD.** Carmen, clienta de Nadielys, manda su código a Luisa. Luisa compra 45 USD y paga 42. Al entregarse, Carmen recibe 3 USD. Luisa ya es clienta de Nadielys.

Primera compra de Luisa, con margen del 33 %: ganancia 15, comisión unos 4,90, queda 10,10. Menos 6 USD del programa, **quedan 4,10. Gana Casa Viva desde la primera compra**, y Luisa sigue comprando después.

| Margen | Le queda a Casa Viva tras «3 + 3» |
|---|---|
| 25 % | 0,35 USD (casi cero: si el margen es este, mejor «2 + 2») |
| 33 % | 4,10 USD |
| 45 % | 9,35 USD |

**Coste:** si llegan 10 / 30 / 60 amigas al mes, cuesta unos **52 / 158 / 315 USD al mes**. Ya cuenta con que el 25 % de los puntos no se usa. A cambio entran 437 / 1.310 / 2.619 USD en primeras compras.

**Riesgos y cómo evitarlos**
- Segundo número propio (en Cuba muchos tienen 2 líneas) → la misma dirección o el mismo nombre no cuentan; tope de 5 al mes; alerta si una sola persona trae muchas.
- La gestora «inventa» amigas con sus clientes de siempre → solo cuentan teléfonos que nunca han comprado.
- Que los puntos se acumulen → caducan a los 6 meses y tienen tope del 20 % por pedido.
- Clientes sin internet → el bot contesta «MIS PUNTOS» y la gestora lo ve en su panel.

**Qué hay que programar**
- Un libro de puntos por teléfono (sumar y restar, motivo, pedido y caducidad).
- El descuento de la amiga en la caja de la web y en el pedido que hace la gestora.
- **Pantalla del cliente «Mis puntos Viva»:** en su cuenta web y por el bot, con el código y el botón «Mandar a una amiga».
- En «Mis clientes» de la gestora: los puntos de cada cliente y quién trajo a quién.
- En el panel de Lennys: los puntos pendientes (lo que se debe) y las alertas.
- **Estimado:** 4 a 6 días.

### Extras creativos (baratos y útiles)

| Extra | Cómo funciona | Coste |
|---|---|---|
| **Rangos con nombres de casa** | Ver la sección 5. Se sube por ventas propias, nunca por reclutar. | 0 al principio |
| **Reto del mes** | Uno cada mes: «10 ventas entregadas en noviembre → 5 USD», o «3 clientes nuevos → insignia». Siempre de ventas. | 0 a 60 USD al mes |
| **Insignias en su panel** | Primera venta, 10 clientes, Cliente que repite, Madrina (su ahijada vendió), Madrina Fundadora, Cero devoluciones. | 0 |
| **Ranking semanal** | En el canal de gestoras (skill `/canal`): las 10 que más **entregaron**. Nunca por número de invitadas. | 0 |
| **Calculadora «¿Cuánto gano?»** | En el panel, con ejemplos marcados como ejemplo. No promete ingresos (FTC). | 0 |
| **Bono Primera Venta** | 2 USD a la ahijada en su primera entrega. | 2 USD por gestora nueva |
| **Lista de la madrina** | 5 pasos para enseñar a su ahijada: alta, Aprende, primera foto compartida, primer cliente, primera venta. La madrina ve en qué paso va. | 0 |

---

## 5. Plan de carrera (rangos)

**1 punto = 1 USD de venta propia entregada y cobrada** (precio de Casa Viva). Se cuenta por mes. Si un mes bajas, conservas el rango un mes más («protección», como Avon). Los umbrales salen de los datos: la mejor gestora va a unos 2.800 USD al mes y la mitad de las gestoras, a unos 500.

| Rango | Puntos al mes | Qué gana |
|---|---|---|
| **Vecina** | 0 – 199 | Comisión normal, kit de arranque, puede ser madrina (nivel 1) |
| **Anfitriona** | 200 – 799 | + nivel 2 de la red, insignia, fotos nuevas antes que nadie |
| **Casa Llena** | 800 – 1.999 | + aparece en el canal, prioridad con el mensajero |
| **Embajadora Casa Viva** | 2.000 o más, 2 meses seguidos | + regalo cada 3 meses, opina sobre los productos nuevos, prioridad cuando hay poco stock |

**Fase 1: solo reconocimiento y prioridad** (coste 0). Después de 3 meses con datos, se puede añadir +1 % para Casa Llena y +2 % para Embajadora (pregunta 7).

**«Mi rango» en el panel:** el rango de hoy, una barra «te faltan 120 puntos para Anfitriona», los puntos del mes, las insignias y el reto del mes. **«Mis puntos»** de la gestora es esa misma barra (puntos de venta). No hay que confundirlos con los puntos de cliente.

---

## 6. Coste mensual estimado para Casa Viva (dentro de 6 meses)

Supuestos: ventas web de 10.000 USD (bajo), 15.000 (medio, la cifra de la propuesta a Lennys) y 21.000 (alto, el ritmo de estos 3 días). Margen del 33 %.

| Pieza (USD al mes) | Bajo | Medio | Alto |
|---|---|---|---|
| 1 · Red 1 % + 0,5 % ¹ | 11 | 43 | 99 |
| 1 · Bono Primera Venta ² | 6 | 16 | 30 |
| 2 · Tienda física al 5 % | 15 | 40 | 75 |
| 3 · Amigas «3 + 3» ³ | 52 | 158 | 315 |
| Retos y rangos | 0 | 30 | 60 |
| **Total** | **84** | **287** | **579** |
| % de las ventas | 0,8 % | 1,9 % | 2,8 % |
| Pedidos extra para pagarlo ⁴ | 9 | 29 | 59 |

¹ Ventas de las ahijadas: 10 % / 25 % / 40 % del total; las de nivel 2: 200 / 1.000 / 3.000 USD.
² 3 / 8 / 15 ahijadas nuevas que venden.
³ 10 / 30 / 60 amigas nuevas. Solo esas primeras compras ya suman 437 / 1.310 / 2.619 USD.
⁴ Lo que hace falta vender de más para cubrir el coste, con 22,4 USD de cada 100 para Casa Viva y un ticket de 43,65 USD.

**Lectura:** el riesgo no es el coste, que es pequeño y se paga solo. El riesgo es **la complejidad y el fraude**. Por eso va por fases y con frenos.

---

## 7. Preguntas para Ernesto (8, con mi recomendación)

1. **¿Lennys está de acuerdo, y qué pasa con su propuesta del 2 %?**
   - A) 1 % + 0,5 % sustituye al 2 %.
   - B) Su 2 % en un solo nivel.
   - C) Solo 1 % en un nivel.
   → **Recomiendo A**, explicado a Lennys con el ejemplo de la alfombra: le cuesta menos que el 2 %.
2. **¿Sobre qué precio se calcula la red?**
   - A) Precio de Casa Viva, sin recargo de la gestora ni mensajería.
   - B) Lo que pagó el cliente.
   → **A.** Casa Viva no paga sobre dinero que no gana.
3. **¿Qué hace falta para cobrar la red?**
   - A) Nada.
   - B) 1 venta propia entregada al mes.
   - C) B, y ser Anfitriona para el nivel 2.
   → **C.** Es la regla de Amway que la FTC aceptó, y premia vender.
4. **¿«Para siempre» es para siempre?**
   - A) Sí, pase lo que pase.
   - B) Mientras la gestora venda al menos cada 90 días; si pasa 6 meses sin vender, los clientes pasan a Casa Viva, con aviso.
   - C) Caduca si el cliente pasa 12 meses sin comprar.
   → **B.**
5. **El cliente de una gestora que compra solo en la tienda física:**
   - A) No gana nada, como hoy.
   - B) La mitad de la comisión (5 %) si da su teléfono.
   - C) La comisión completa.
   → **B**, en la fase 3.
6. **Puntos para clientes:**
   - A) Solo «tú 3, ella 3».
   - B) A, más el 1 % en puntos por cada compra.
   - C) Nada por ahora.
   → **A**; B dentro de 2 meses si hay datos.
7. **¿Los rangos dan dinero?**
   - A) Solo reconocimiento y prioridad.
   - B) +1 % Casa Llena y +2 % Embajadora desde el principio.
   → **A ahora**, B a los 3 meses con datos.
8. **¿Cuándo se paga la red?**
   - A) Con cada comisión, en el cierre del pedido.
   - B) Una vez al mes, del 1 al 5, con las devoluciones ya descontadas.
   → **B.** Es más simple de explicar y protege contra las devoluciones.

Si te parece, los nombres («Madrinas», «Tuyo para siempre», «Amigas Casa Viva», Vecina, Anfitriona, Casa Llena, Embajadora) los decide Lennys.

---

## 8. Prueba controlada con Dany y lanzamiento por fases

**Antes de nada:** que diga que sí Lennys, que respondas las 8 preguntas, y que se arreglen los fallos A y B (son pequeños).

**Fase 1 — «Modo sombra» con Dany (2 semanas).** Se programa la red y «Mi equipo» / «Mi rango». **Calcula, pero no paga.** Solo lo ven Dany y administración.
- Antes de empezar, se le escribe a Dany con amabilidad. Se le pregunta si tiene tiempo, y se le explica en 3 líneas qué va a ver y qué tiene que probar.
- Dany invita a 1 o 2 gestoras reales con su enlace. Ellas venden normal.
- Cada día se compara el cálculo con los pedidos a mano: base, 1 %, tope, devoluciones y venta propia.
- Dany prueba las pantallas desde su teléfono y anota lo que no entiende.
- **Para pasar a la fase 2:** cero errores de cálculo en 2 semanas, Dany entiende sus pantallas sin ayuda, y ninguna alerta de fraude sin explicar.

**Fase 2 — Piloto con 5 gestoras, pagando de verdad (1 mes).** Dany, Nadielys, Patricia, Daymee y Oliuska. Primer pago del 1 al 5 del mes siguiente. Aquí entra «Mis clientes» mejorada con el aviso «compró solo».
- **Se mide:** ahijadas nuevas que venden, ventas de las ahijadas, coste real, alertas y preguntas al bot.
- **Se para si:** el coste pasa del 2 % de las ventas, más del 5 % de los pedidos dan alerta, o hay quejas de clientes robados.

**Fase 3 — Todas las gestoras.** Mensaje al grupo General con un video tutorial (skill `video-tutorial-casa-viva`) y la insignia «Madrina Fundadora» hasta el 30-nov. Siempre con la comisión clara en el anuncio. Si se decide, entra la tienda física al 5 %.

**Fase 4 — «Amigas Casa Viva» para clientes (a los 30 días de la fase 3).** Primero 1 semana con los clientes de Dany, después para todos. La campaña «doble en diciembre» por Navidad.

**Fase 5 — Revisión a los 3 meses.** ¿Rangos con dinero (pregunta 7)? ¿Puntos por cada compra (pregunta 6)? ¿Se puede reutilizar para otros comercios NEXO (D42)?

**Trabajo total estimado:** 2 a 3 semanas de programación repartidas en las fases, sin contar la caja de la tienda física.

---

## Fuentes

1. Natura, plan de crecimiento: [Serasa](https://www.serasa.com.br/limpa-nome-online/blog/saiba-quanto-ganha-uma-revendedora-natura/) · [Cartilla oficial Natura](https://static.natura.com.br/static/downloads/cartilha_venda_direta_v7.pdf) · [DivulgaNinja](https://www.divulganinja.com.br/blog/consultoria-natura-como-funciona-ganhos-2026)
2. [Avon 2025, plan de compensación de un vistazo (PDF oficial, español)](https://avon.com/magnoliaPublic/dam/jcr:c3247b15-34d1-4abc-938c-4f04ef7ecd27/avon-2025-compensation-plan-at-a-glance-es.pdf) · [Guía de carrera Avon 2025](https://avon.com/magnoliaPublic/dam/pdf/2025/guides/avon-2025-career-and-compensation-guide-es-v2.pdf)
3. Mary Kay: [Avenues of Income (PDF de consultora)](https://angielimon.yolasite.com/resources/AASC-TR-Avenues%20of%20Income.pdf) · [Pink Truth (crítica)](https://www.pinktruth.com/2025/09/01/mary-kays-ugly-truth)
4. Yanbal: [Forbes Colombia](https://forbes.co/forbes-women/yanbal-una-comunidad-de-mujeres-poderosas-que-cambia-vidas) · [Revista Economía](https://www.revistaeconomia.com/?p=58180)
5. [Jafra, reconocimientos anuales 2026-2027](https://www.jafra.com/pages/annual-recognition-2026-2027)
6. Amway y la FTC: [In re Amway Corp. (Wikipedia)](https://en.wikipedia.org/wiki/In_re_Amway_Corp.) · [Truth in Advertising](https://www.truthinadvertising.org/the-enduring-primacy-of-retail-sales-in-an-mlm-context/)
7. Meesho: [GrowthJockey](https://www.growthjockey.com/blogs/meesho-reseller-guide) · [Markhub24](https://www.markhub24.com/post/meesho-s-tier-ii-tier-iii-targeting-strategy-with-referral-led-user-acquisition)
8. Shein afiliados: [FlexOffers](https://www.flexoffers.com/affiliate-programs/shein-uk-affiliate-program/) · [Strackr](https://strackr.com/blog/shein-affiliate-program)
9. Shopee: [Centro de ayuda Shopee](https://help.shopee.sg/10/article/191689-Introduction-to-Shopee-Affiliate-Program-(SAP)) · [Malaysia4u](https://malaysia4u.com/shopee-affiliate-guide)
10. Comisiones de por vida: [WooCommerce](https://woocommerce.com/document/affiliate-and-referral/how-to-set-up-lifetime-commissions/) · [Solid Affiliate](https://docs.solidaffiliate.com/lifetime-commissions) · [UpPromote](https://docs.uppromote.com/set-up/program/lifetime-commission)
11. Dropbox: [Viral Loops](https://viral-loops.com/blog/dropbox-grew-3900-simple-referral-program/) · [Referral Rock](https://referralrock.com/blog/dropbox-referral-program/)
12. Temu: [Bitdefender](https://bitdefender.com/blog/hotforsecurity/scammers-push-temu-referral-codes-via-fake-celebrity-tiktok-videos-for-cash-rewards) · [TechNode](https://technode.com/2022/11/03/pinduoduos-overseas-platform-temu-to-launch-incentivized-referral-feature-report/)
13. Starbucks: [AwardWallet](https://awardwallet.com/blog/do-starbucks-rewards-stars-expire) · [SEC, correspondencia 2015](https://www.sec.gov/Archives/edgar/data/0000829224/000082922415000020/filename1.htm)
14. Sephora: [Goodshop](https://www.goodshop.com/blog/how-does-sephoras-beauty-insider-program-work) · [Makeup.com](https://www.makeup.com/sephora-beauty-insider-program-news)
15. Coste de los puntos y puntos sin usar: [EightX](https://eightx.co/blog/loyalty-program-economics-5pct-earn-rate) · [Leat](https://www.leat.com/resources/blog/loyalty-program-breakage)
16. [FTC, Business Guidance Concerning Multi-Level Marketing](https://www.ftc.gov/business-guidance/resources/business-guidance-concerning-multi-level-marketing)
17. [Kelley Drye, sobre la guía revisada de la FTC](https://www.kelleydrye.com/viewpoints/blogs/ad-law-access/ftc-staffs-revised-mlm-guidance-more-content-less-clarity)
18. [AARP Foundation, encuesta sobre multinivel](https://www.aarp.org/aarp-foundation/our-work/income/multilevel-marketing.html)
19. Fraude en referidos: [Prefinery](https://www.prefinery.com/blog/referral-fraud-types-and-prevention/) · [Talkable](https://www.talkable.com/blog/preventing-referral-program-fraud)

**Datos internos:** `cv pedidos-hoy 14` y `cv pedido <n>` (VPS, solo lectura, 14-oct 08:45); Core `includes/class-cvd-attribution.php`, `-attribution-overrides.php`, `-commissions.php`, `-registration.php`, `-gestora-app.php`, `-payouts.php`, `-clients.php`, `-portal.php`, `-panel-bridge.php`; `docs/nexo-business/propuesta-red-de-gestoras.html`, `motor-de-precios.md` y `herramientas-gestoras.md`.

**Aviso:** no soy abogado. Las reglas de la FTC son de Estados Unidos y no se aplican en Cuba, pero son la mejor guía para que el programa sea honesto y no se convierta en pirámide.
