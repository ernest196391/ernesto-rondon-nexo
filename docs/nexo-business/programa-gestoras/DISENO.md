# Programa de gestoras · diseño (14-oct-2026)

Para: Ernesto · Hecho por: Claude · Estado: **programado y probado, SIN desplegar** (modo sombra listo para la prueba de 2 semanas con Dany). **16-oct:** puesto encima de lo que está en vivo como Core 3.14.29 (§10 y §11). **16-oct tarde: EN VIVO como Core 3.14.30 (D77)** — red 1 % + 0,5 %, fondo sobre la ganancia neta, arrastre de devoluciones, reembolsos parciales, cierre con bloqueo, alertas «autocompra_red» y «ganancia_alta» (§12 y `AUDITORIA-2026-10-16.md` §0).
Reglas: D53–D58 en `docs/00-FUENTE-DE-VERDAD/DECISIONES.md` y las propuestas de `docs/nexo-business/propuestas/*-2026-10-14.md`.

**Dónde está el código (actualizado 16-oct)**
- Web (Core): repo `ernest196391/Casa-Viva`, rama **`programa-gestoras-1016`**, versión **3.14.29**, encima de `main` 3.14.25. En la web ya va la 3.14.26 y hoy sale la 3.14.28: hay que rebasar antes de subir (PLAN-DESPLIEGUE, paso 1). Carpeta: `C:\Users\Ernesto\Casa-Viva-programa`. La rama vieja `programa-gestoras-1014` (3.14.1) queda como historia.
- Panel de Lennys: repo `ernesto-rondon-nexo`, rama **`programa-gestoras-1016-panel`** (empujada), encima de `main`. Carpeta: `C:\Users\Ernesto\nexo-programa`.
- Cómo subirlo y **lo que hay que decidir antes**: `PLAN-DESPLIEGUE.md` (en esta carpeta).
- Lo que cambió al encajarlo con lo que está en vivo: §10. Datos reales del 16-oct: §11.

---

## 1. En palabras sencillas

1. **Cada venta entregada y cobrada da puntos a quien la vendió.** 1 punto = 1 USD de ganancia limpia: precio de Casa Viva − lo que costó el producto − la comisión de la gestora. Si el producto no tiene costo cargado o se vende perdiendo, da 0 puntos.
2. **Piedras.** Con los puntos del mes de su equipo (ella + sus invitadas + las invitadas de ellas) llega a Bronce, Plata, Oro… hasta Corona. El **título** (la mejor piedra que tuvo) no se pierde. El **bono** en CUP se cobra solo el mes en que mantiene la piedra.
3. **Red.** La madrina gana el **1 %** de lo que vende su invitada y el **0,5 %** de lo que venden las invitadas de su invitada (D77; antes 2 % + 1 %), sobre el precio de Casa Viva, durante 12 meses desde que entró la invitada. Para cobrarlo tiene que haber entregado al menos 1 venta suya ese mes; para el 0,5 % tiene que ser Plata ese mes.
4. **Fondo de seguridad.** Todo eso sale del **15 % de la ganancia** que trajo el equipo ese mes. Primero se paga la red; los bonos, con lo que quede. Si no alcanza, todas cobran el mismo %. Casa Viva nunca pone más.
5. **Modo sombra.** Calcula todo cada noche y lo enseña con el aviso «En prueba: así se calcularía; todavía no se paga». No paga nada.
6. **Libro.** Cada cálculo queda guardado con su huella (SHA-256), y el cierre de cada mes no se puede rehacer. Cuando se pague, se anota quién, cuándo y con qué referencia, con su recibo.

---

## 2. Datos que usa (todo ya existe en la web)

| Dato | De dónde sale |
|---|---|
| Quién invitó a quién | `_cvd_invited_by` de cada gestora (Core, desde el 11-oct). |
| Cuándo entró la invitada | Fecha de registro del usuario (`user_registered`). No hay fecha de aprobación guardada; el registro es igual o antes, así que los 12 meses nunca se alargan. |
| Venta «entregada y cobrada» | Comisión del pedido en `approved` o `paid` (se aprueba solo al confirmar el dinero, `approve_for_closeout`). |
| Mes de la venta | El momento de esa aprobación (historial `_cvd_commission_history`), en hora de Cuba. Si falta: `_cvd_cash_verified_at` y luego fecha de completado. |
| Precio de Casa Viva (base de la red) | `base_amount` del desglose `_cvd_commission_breakdown` de cada línea: ya excluye lo que sube la gestora y la mensajería. |
| Comisión de la gestora | `base_commission` del mismo desglose (sin lo que sube ella, que lo paga el cliente). |
| Costo | `_cvd_cost_usd` por unidad, de la variación o de su producto (campo del otro agente, Core 3.14.0). Filtro `cvd_programa_unit_cost` por si un día el costo de «bajo pedido» se lee de otro sitio. |
| Autocompra | Quien compra o recibe (nombre de facturación, de envío o `cliente_vinculado`) se llama como la gestora. La marca `_cvd_commission_risk = self_order` de Core (su teléfono o correo en el pedido) sola **no** excluye: deja la alerta «revisar» (ver §9). |
| Prueba | Pedido de prueba (`CVD_Delivery`) o cuenta de prueba (`_cvd_test_account`). |
| Tasa | Tasa del día de la web (`CVD_Daily_Rates`), solo para comparar el bono en CUP con el fondo en USD. Queda guardada en cada cálculo. |

---

## 3. El cálculo (CVD_Programa_Calc, funciones puras)

Archivo `includes/class-cvd-programa-calc.php`. No toca la base de datos: recibe gestoras, ventas y devoluciones y devuelve el resultado. Por eso se puede probar con casos.

1. **Ventas que cuentan:** del mes, aprobadas o pagadas, no de prueba, no autocompra. Cada línea: `puntos = max(0, base − costo × unidades − comisión)`, 0 si no hay costo.
2. **Devoluciones:** un pedido que ya se contó en un mes **cerrado** y después se anula resta en el mes en curso sus puntos, sus ventas y la red que dio.
3. **Equipo:** nivel 1 = invitadas de ella; nivel 2 = invitadas de esas. Puntos del equipo = los suyos + los de los dos niveles.
4. **Piedra del mes:** la más alta que cumple a la vez:
   - puntos que cuentan ≥ umbral, donde **cada miembro del equipo cuenta como mucho el 60 % del umbral** (sus ventas propias cuentan enteras);
   - al menos 1 venta propia entregada y el **mínimo propio** de la tabla D54 en USD vendidos (Bronce 0 · Plata/Oro/Platino 50 · Zafiro/Rubí/Esmeralda 100 · Diamante/Doble 150 · Corona 200).
5. **Título:** la mejor piedra entre los meses cerrados de verdad y la de este mes. Los meses en sombra no dan título.
6. **Red:** 1 % y 0,5 % (D77; antes 2 % y 1 %) del precio Casa Viva de cada venta de la invitada dentro de sus 12 meses. Si la madrina no vendió ese mes, o no es Plata para el 1 %, esa red **se pierde** (no se acumula) y se enseña como «pierde».
7. **Fondo:**
   - por equipo: `fondo = 15 % × puntos del equipo`. La red se paga hasta ese tope; el bono, con lo que quede;
   - del mes: `15 % × toda la ganancia` (cada venta una sola vez). Si la suma pasa de ahí, se recorta a todas por igual (primero la red, después los bonos).
8. **Alertas** (lo grave primero): autocompra, un miembro con más del 60 % de los puntos del equipo, red en negativo, devolución, producto que pierde, producto sin costo y «revisar» (su teléfono con otro cliente).

**Tabla (D56, tasa 785):** Bronce 65 → 5.000 CUP · Plata 130 → 10.000 · Oro 195 → 15.000 · Platino 320 → 25.000 · Zafiro 510 → 40.000 · Rubí 765 → 60.000 · Esmeralda 1.150 → 90.000 · Diamante 1.660 → 130.000 · Doble Diamante 2.300 → 180.000 · Corona 3.190 → 250.000.

**Ejemplo de las pruebas (inventado):** Marta invitó a Ana; Ana invitó a Rosa. Rosa vende 390 USD cobrados (87 puntos), Ana 175 USD (35 puntos, una cortina sin costo da 0), Marta 60 USD (14 puntos).
- Ana: 1 % de 390 = **3,90 USD** (con la red vieja de 2 %: 7,80); equipo 122 puntos → Bronce.
- Marta: 1 % de 175 = **1,75 USD**; el 0,5 % de Rosa (1,95) lo pierde porque no es Plata; equipo 136 puntos, pero con el tope del 60 % cuentan 14 + 35 + 39 = 88 → Bronce; le faltan 3 puntos para Plata.
- Fondo del mes: 15 % de 136 = 20,40 USD. La red (11,30) va primero; los bonos se cubren al 48 % (Marta cobraría 2.381 de 5.000 CUP).

---

## 4. Libro (dónde se guarda y por qué)

**Decisión: tablas propias en WordPress, no en Supabase.** Los pedidos, las comisiones y los pagos a gestoras (`cvd_payouts`) ya viven en esa base; así el cálculo y su apunte van en la misma transacción, sin depender de la red, y el panel lo lee por el puente que ya existe.

| Tabla | Qué guarda |
|---|---|
| `wp_cvd_programa_runs` | Cada cálculo: mes, tipo (`diario`, `manual`, `mensual`), modo, estado (`vista`, `sombra`, `cerrado`), tasa, totales, **el JSON completo** y su **SHA-256**. |
| `wp_cvd_programa_people` | Una fila por gestora y cálculo: piedra, título, puntos, red, fondo, bono, cobertura y, al pagar, `paid_at`, `paid_by`, `paid_ref` y el SHA-256 del recibo. |
| `wp_cvd_programa_lines` | Pedido a pedido de los **cierres de mes**: venta, red1, red2, red perdida, devolución, bono. Sirve para las devoluciones y para auditar. |

- Solo se añade, nunca se borra ni se reescribe. Un mes se cierra **una sola vez**.
- **Cada noche (03:30 de Cuba)**: cálculo `diario` del mes en curso. **Del día 1 al 5**: cierre `mensual` del mes anterior si no existe. En sombra queda como `sombra` (no se paga ni da título); en «sí», como `cerrado` (por pagar).
- Pago: en wp-admin, «Cierres del mes y recibos» → «Ver» recibo → «Pagado» con la referencia (Transfermóvil, efectivo…). Todavía **no** se suma a «Pedir mi pago» (ver pendientes).

---

## 5. Pantallas

Capturas con datos de ejemplo en `capturas/` (móvil).

**Área de la gestora (`/area-gestoras/`, grupo «Mi equipo» del menú):**
- **Mi equipo** (`#equipo`): aviso «En prueba»; «Te dejan este mes» (USD y ≈ CUP), número de invitadas y de sus invitadas; aviso si pierde la red («Sin venta propia entregada este mes… entrega al menos 1 venta tuya»); lista de invitadas con su piedra, desde cuándo, meses que le quedan del 2 % y lo que le deja cada una; su enlace para invitar (copiar y WhatsApp). Nunca enseña clientes ni pedidos de otras.
- **Mi piedra** (`#piedra`): su título con la gema de color, si este mes la mantiene, puntos propios y del equipo, barra «Para llegar a Plata: te faltan N puntos» (y el mínimo propio si le falta), su bono del mes y cuánto lo cubre el fondo, «Cómo se ganan puntos» y la tabla de las 10 piedras.
- **Tienda:** en cada producto, solo para ella, «⭐ N puntos» (variables: «⭐ hasta N puntos»; producto que pierde: «⭐ 0 puntos»; sin costo cargado: no sale nada).
- Se ven solo si el programa está en «sí», o en sombra para las de la lista `cvd_programa_ver` y las cuentas de prueba.

**wp-admin → Casa Viva → Programa gestoras:** interruptor (sombra / sí / no) y lista de quién lo ve en sombra; «Calcular ahora»; «Cerrar el mes anterior ahora»; totales (ventas, ganancia, fondo, red, bonos, total, % cubierto); alertas; tabla de gestoras (invitada por, piedra y título, puntos, red y lo que pierde, fondo, a pagar); recibos y «Pagado»; libro con las huellas.

**Panel de Lennys (`casaviva.company/panel` → Equipo → «Programa»):** estado (En prueba / Activo / Apagado), «Fondo del mes» y «Se pagaría / Se debe pagar», alertas, lista de gestoras con piedra, puntos del equipo, invitada por, red y bono, ficha de cada una, «Recalcular ahora» y la huella del libro.

---

## 6. Decisiones que tomé yo (operativas y reversibles, D58)

1. **Libro en WordPress** (arriba), con JSON + SHA-256 y cierres que no se rehacen.
2. **Doble tope del fondo:** por equipo (lo que pediste) **y** del mes entero. Los equipos se solapan: una venta de Rosa cuenta para el equipo de Ana y para el de Marta. Sin el tope del mes, Casa Viva podría acabar pagando hasta el 45 % de la ganancia de esa venta. Con los dos, nunca pasa del 15 %.
3. **El 60 %** se aplica a cada miembro del equipo (no a ella misma) y contra el umbral de cada piedra, como la regla de los multinivel serios. Así una gestora que vende sola también puede llegar a Bronce con sus ventas.
4. **Mínimo propio** = 1 venta entregada + los USD de la tabla D54.
5. **Plata para el 1 %** = piedra de ese mes (D55: «equipo con … en el mes»), no el título.
6. **Los 12 meses** solo limitan la red; los puntos de la invitada siguen contando para la piedra de la madrina.
7. **Mes de la venta** = cuando se confirmó el dinero (no cuando se hizo el pedido).
8. **Red perdida** (sin venta propia o sin Plata) se pierde, no se guarda para otro mes.
9. **Devolución de un mes ya cerrado** resta en el mes siguiente; si deja la red en negativo, ese mes no cobra red y sale una alerta para revisarlo a mano (no se arrastra deuda).
10. **Sin costo = 0 puntos** y no se enseña la insignia, para no desanimar a vender un producto solo porque falta cargar su costo.
11. **Bono fijo en CUP**; la red en USD. La tasa del día solo se usa para comparar el bono con el fondo.
12. **Sombra no da títulos** y su cierre de mes queda como `sombra`: al pasar a «sí» se empieza limpio.
13. **Interruptor** = opción de WordPress `cvd_programa_gestoras` (no `crm_settings`), porque todo el cálculo vive en la web.
14. **Autocompra por nombre, no por teléfono** (§9): con la marca de Core, 19 de 24 ventas reales de octubre no habrían contado.

---

## 7. Pruebas

- `artifacts/tests/test-programa-gestoras.php` — **77 comprobaciones** del cálculo puro: puntos por línea, autocompra por nombre, fondo que alcanza, fondo que no alcanza (la red se come el fondo), reparto proporcional con equipos que se solapan, regla del 60 %, mínimo propio, autocompra, pruebas, pendientes, anulados, otro mes, sin costo, producto que pierde, red sin venta propia, 1 % sin Plata, ventana de 12 meses, devolución de un mes cerrado, red negativa, título que no se pierde, recibo, y **200 rondas al azar** comprobando que nunca se paga más que el 15 % (ni del mes ni de cada equipo).
- `artifacts/tests/test-programa-gestoras-wp.php` — **23 comprobaciones** con WordPress simulado: lectura de pedidos reales de forma (desglose, autocompra por nombre, su teléfono con otro cliente, cuenta de prueba, pendiente, anulado, aprobado el 31-oct a las 23:00 de Cuba = octubre), puntos de producto simple y variable, quién lo ve en sombra, y las dos pantallas.
- Resultado: **100 de 100 OK** (PHP 8.2), también después de ponerla encima del campo de costo. En este ordenador no hay PHP: se ejecutaron en una carpeta temporal del servidor de Hostinger, fuera de la web, y se borró después.

---

## 8. Lo que falta para lanzarlo con Dany

1. **Campo de costo:** ya está (Core 3.14.0 en la web, 412 costos cargados). **Falta poner costo a los productos de la tienda que no lo tienen** (121 publicados; 18 de 24 pedidos cobrados de octubre llevan alguno) y que Ernesto decida la propuesta de precios (D59). Ver §9.
2. **Desplegar 3.14.1** en sombra (PLAN-DESPLIEGUE) y probarlo con una cuenta de prueba.
3. Poner el ID de Dany en `cvd_programa_ver`.
4. **Escribirle a Dany** (Ernesto o con su sí): con amabilidad, preguntar si tiene tiempo y explicarle en 3 líneas qué va a ver. Lo ideal es que invite a 1 o 2 gestoras con su enlace: hoy solo 2 gestoras de 61 tienen madrina.
5. Durante 2 semanas: cada día comparar el cálculo con los pedidos a mano (base, 2 %, puntos, tope, devoluciones). Para pasar a «sí»: cero errores, Dany entiende sus pantallas sola, ninguna alerta sin explicar.
6. Panel: desplegar la función `nexo-panel-web` y el `index.html` (y decidir si se empuja la rama del panel a GitHub).
7. **Después (no programado):** sumar lo aprobado a «Pedir mi pago»; comando del bot «MI PIEDRA»; guía/tutorial para gestoras con la comisión clara; el «Bono Primera Venta»; alerta de cuentas que comparten teléfono o tarjeta (D53 lo pedía como freno de cuentas falsas).

---

## 9. Vista previa con datos reales (solo lectura, 14-oct hacia las 12:00)

Se ejecutó el cálculo contra la web **sin guardar nada** (sin crear tablas ni tocar el plugin; script temporal ya borrado). Octubre hasta hoy:

- **Ventas que cuentan:** 1.076 USD de 15 gestoras. **Ganancia limpia (puntos): 60.** Fondo del mes: 9 USD. **Nadie llega a Bronce** (la que más: 14 puntos). Red: 0 (solo 2 gestoras de 61 tienen madrina, y sus invitadas aún no han vendido).
- **Por qué tan pocos puntos:** 18 de los 24 pedidos cobrados llevan algún producto **sin costo** (cuenta 0), y donde sí hay costo, lo que queda tras la comisión es poco (Patricia: 305 USD vendidos → 5 puntos). Dany: 71 USD → 0 puntos (sus 3 pedidos son de productos sin costo).
- **Autocompra:** con la marca de Core, 19 de 24 pedidos habrían quedado fuera, todos con el nombre de un cliente real (la gestora pone su teléfono). Por eso se cambió a «por nombre» (decisión 14). Ahora: 0 autocompras y 19 «revisar».
- **En la tienda:** de 472 productos publicados, 347 enseñarían «⭐ N puntos» (mediana **8**; el 10 % mejor, 24 o más; arriba del todo neveras y estaciones de energía con 130–230), 4 «⭐ 0 puntos» y 121 nada (sin costo).

**Qué significa para la prueba con Dany:** con los costos de hoy verá números muy bajos y ninguna piedra. Antes de abrírselo conviene (a) cargar los costos que faltan de la tienda y (b) que Ernesto mire si Bronce = 65 puntos al mes es alcanzable: con la ganancia real de octubre (~5,6 % de lo vendido) un equipo necesita unos 1.160 USD cobrados al mes. Las cifras están en `class-cvd-programa-calc.php` → `STONES`; cambiarlas es una línea, pero es decisión de Ernesto.

> **§9 es la foto del 14-oct.** Con los costos cargados desde entonces, los números cambiaron mucho: ver §11.

---

## 10. Encaje con lo que se subió del 14 al 16-oct (Core 3.14.29)

| Pieza nueva en vivo | Choque con el programa | Qué se hizo / propuesta |
|---|---|---|
| Costo `_cvd_cost_usd` (D59, D62) | Ya lo usaba. Ahora casi todo tiene costo, pero 30 publicados lo tienen **provisional** (fórmula = precio ÷ 1,5, o «por confirmar»). | Cuenta igual y sale la alerta **«Costo provisional»** (la última en orden). Los puntos cambian solos cuando se carga el costo real. |
| Gastos fijos por producto `_cvd_fixed_usd` (D74, ~8 % del costo) | D55 dice ganancia = precio − costo − comisión, **sin** gastos fijos; el mínimo de la web sí los resta. | Opción nueva `cvd_programa_gastos_fijos` = `no` (por defecto, como D55) o `si` (resta los gastos fijos de cada producto; bajo pedido nunca, D59). También cambia «⭐ N puntos» de la tienda. **Decide Ernesto** (PLAN-DESPLIEGUE, decisión 1). |
| Regla del 15-oct: «tu clienta, tu comisión»; premio de la dependienta en espera | Un «extra en tienda» es venta de la gestora: da puntos y red como cualquier otra. | Si un día se paga el premio de la dependienta (`cvd_extra_staff_pct` > 0), se resta de la ganancia de esa línea (sale de la foto de la comisión). Hoy es 0: no cambia nada. |
| Cuándo se aprueba una comisión (al cerrar el pedido con el dinero confirmado) | Ninguno. El programa cuenta las comisiones `approved` y `paid`, en el mes en que se aprobaron. «Pedir mi pago» no cambia ese estado hasta que se paga (`paid`). | Nada que cambiar. Una venta anulada después del cierre del mes resta en el mes siguiente (§3.2). |
| Pagos sin chat (`cvd_payouts`, «Pedir mi pago», 3.14.23) | La red y los bonos se pagan aparte: wp-admin → «Pagado» con la referencia. | **Programado (D75, 3.14.29):** la red (USD, tasa del cierre) y el bono (CUP fijo) de cada cierre en «sí» salen en «Pedir mi pago» como un renglón más (id = 1.000.000.000 + fila del libro). Al pedirlo se ata la fila (`cvd_programa_people.payout_id`) en la misma transacción; si Lennys lo rechaza, se libera; al pagar queda «Pago #N · referencia» con la huella del recibo. El «Pagado» manual de wp-admin ya no toca una fila pedida. En sombra no sale nada. |
| Venta de proveedor (bajo pedido, D66, D69) | De su margen sale además un fondo de ~3.000 CUP (mensajero, dependienta, tienda) y el resto es del gestor especial. El programa no lo resta. | **Programado (D75, 3.14.29):** el fondo (mensajero + dependienta + tienda) del reparto sellado (o el calculado si aún no se cerró) se pasa a USD con su tasa y se resta de los puntos de esas líneas, repartido por precio. |

**Pruebas 3.14.29:** 91 + 33 OK (las 77 + 23 de antes y 24 nuevas: gastos fijos, premio de la dependienta, costo provisional, «pierde» con gastos fijos, puntos de la tienda, fondo de proveedor, renglón de «Pedir mi pago», reserva doble, interruptor en «no») y las 49 de las cuentas de pagos.

**EN VIVO desde el 16-oct ~14:20** (D75): modo sombra, solo Dany (user 18), gastos fijos no. Ver PLAN-DESPLIEGUE arriba.

## 11. Vista previa con datos reales (16-oct, solo lectura, nada guardado)

Se ejecutó el cálculo 3.14.29 contra la web (Core 3.14.26) desde una carpeta temporal fuera de la web, ya borrada. Octubre del 1 al 16:

| | Sin restar gastos fijos (D55) | Restando gastos fijos (D74) |
|---|---|---|
| Ventas de gestoras que cuentan | 3.147 USD | 3.147 USD |
| Ganancia limpia (puntos) | **635** (20 % de lo vendido) | **463** (15 %) |
| Fondo del mes (15 %) | 95 USD | 69 USD |
| Gestoras con piedra | 1 (Bronce, 633 USD vendidos → 120 puntos) | 1 (Bronce, 88 puntos) |
| La segunda | 234 USD → 64 puntos (le falta 1 para Bronce) | 52 puntos |
| Se pagaría | 1 bono de 5.000 CUP (6,25 USD) | igual |

- **Costos:** de 464 productos publicados en la web, solo **2 sin costo**; **30 provisionales** (29 fórmula, 1 por confirmar). En los pedidos de octubre ya no hay ninguno «sin costo»; 18 pedidos llevan algún costo provisional. (En la caja de la nube, 72 de 349 productos activos no tienen fila de costo, pero el programa lee el costo de la web.)
- **Puntos en la tienda:** mediana **7** por unidad (6 con gastos fijos), el 10 % mejor 21 o más, el máximo 228.
- **Red:** de 71 gestoras, solo **2 tienen madrina** (las dos de la misma). Hoy la red pagaría 0.
- **Alertas:** 1 autocompra, 56 «revisar» (pedido con el teléfono de la gestora y otro nombre de cliente: es lo normal, no excluye) y 18 «costo provisional».
- **Conclusión:** el miedo del 14-oct («los puntos salen muy bajos») ya no vale: con los costos cargados la ganancia limpia es ~20 % de lo vendido, y Bronce (65 puntos) pide unos **325 USD cobrados del equipo al mes** (unos 440 si se restan los gastos fijos). Lo que limita ahora es el **fondo del 15 %**: con 2 piedras en el mismo equipo los bonos ya no se cubren enteros (ver el ejemplo de PLAN-DESPLIEGUE).

## 12. Core 3.14.30 EN VIVO (16-oct tarde, D77; Ernesto 15:40)

Tras la auditoría (`AUDITORIA-2026-10-16.md`), Ernesto decidió:

| Cambio | Detalle técnico |
|---|---|
| Red 1 % + 0,5 % | `DEFAULTS red1_pct = 0.01`, `red2_pct = 0.005`. Los textos salen de `CVD_Programa_Calc::pct()` |
| Fondo sobre la ganancia neta | `pool = 15 % × min(puntos, ganancia neta)`; `totals.net_profit_usd` |
| Arrastre de devoluciones | `totals.carry_out_usd` del último cierre «cerrado» → `carry_usd` del mes siguiente (`CVD_Programa::carry_in`) |
| Reembolsos parciales | `refunded_qty()` por artículo en el mes; `refund_share()` para los meses ya cerrados (una vez por pedido) |
| Cierre seguro | `GET_LOCK` por mes + `ROLLBACK` si falla cualquier fila (`run_locked`) |
| Madrina compradora | `buyer_names` → alerta `autocompra_red` y sin red de ese pedido |
| Costo sospechoso | Alerta `ganancia_alta` (> 55 % del precio en líneas de 10 USD o más) |
| Redondeo | Hacia abajo (céntimos y CUP): la suma nunca pasa del fondo |

- **Pruebas:** 118 + 35 + 49 OK.
- **Mes recalculado:** 647,34 puntos, fondo 97,10, se pagaría 6,25.
- **Escenarios rehechos:** con equipos, los bonos se cobran al 47–87 % (antes al 1–45 %). Detalle en `AUDITORIA-2026-10-16.md` §0.1.
- **Copia:** `~/bak-20261016-cvd-3.14.29-antes-3.14.30`.
