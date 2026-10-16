# Programa de gestoras (multinivel) · segunda pasada y auditoría (16-oct-2026)

Para: Ernesto (y para preparar la charla con Lennys) · Hecho por: Claude · Todo **solo lectura** en la web y en Supabase. Nada desplegado.

- **Código revisado:** Core 3.14.29 en vivo = `main` de `ernest196391/Casa-Viva` (`ba3ff03` + `4915f1e`). Los dos archivos del programa en la web son idénticos a `main` (mismo md5).
- **Pruebas que ya había:** 91 + 33 + 49 OK (PHP 8.2 en una carpeta temporal de Hostinger fuera de la web, ya borrada).
- **Arreglos pequeños propuestos (SIN desplegar):** rama `programa-auditoria-1016` del repo Casa-Viva, commit `5779174`. Pruebas 104 + 33 + 49 OK. Ver §5.4.
- **Simulaciones:** carpeta `auditoria-2026-10-16/` al lado de este archivo. El resultado de cada escenario está en `escenarios-resultado.csv` y la comparación con el binario en `binario-comparacion.json`. También están los guiones para repetirlo. Se usó **el cálculo de verdad** de la web (`CVD_Programa_Calc::compute`), no una copia.
- Las gestoras salen como «gestora A, B…» (el repo es público).

---

## 7 · Resumen para Ernesto en 10 líneas (va primero)

1. **Lo que hay que decirle a Lennys:** el programa **solo reparte un trozo de la ganancia de ventas ya entregadas y cobradas**: como mucho 15 de cada 100 USD de ganancia, que son unos 3 de cada 100 USD vendidos. No se cobra por entrar, no hay compra obligatoria y no se paga nada por traer gente.
2. **Con los datos reales de octubre (del 1 al 16)**, las gestoras vendieron 3.207 USD y dejaron 647 USD de ganancia. Hoy el programa pagaría **6,25 USD** (1 bono Bronce). El tope sería 97 USD.
3. **En 18 de los 20 escenarios simulados la tienda nunca paga más de lo que gana.** En 13 de ellos paga el 15 % o menos.
4. **Hay 2 casos en que sí puede perder:**
   - un **costo mal puesto** (por ejemplo 3,20 en vez de 28);
   - un **mes entero devuelto después de pagar**, con el mes siguiente vacío.

   Los dos se evitan con vigilancia y con 2 arreglos que se explican en §2 y §4.
5. **El error más importante que no cuadra:** la red, que es el 2 % más el 1 % **del precio**, cuesta lo mismo que todo el fondo (15 % de la ganancia) en cuanto hay equipos de 2 niveles.
   - En la propuesta aprobada (D56) la red era 5 de esos 15. D58 la subió sin rehacer la cuenta.
   - **Resultado:** cuando la red crezca, los bonos de piedra se cobrarán al 17–45 % (con octubre real puesto en equipos, al 45 %; en un mes muy bueno, al 17 %), y en una red grande casi a 0.
6. **Antes de abrirlo a más gestoras, decidir una de estas 3:**
   - (a) bajar la red a 1 % + 0,5 %, como en D53. Los bonos subirían a cobrarse al 48–87 %. **Es la que recomiendo.**
   - (b) mantenerla y anunciar el bono como «hasta X CUP»;
   - (c) subir el fondo.
7. **Arreglos ya hechos en la rama, sin subir:**
   - el fondo se calcula sobre la ganancia **neta** (las liquidaciones que pierden restan);
   - la madrina que compra a través de su invitada no cobra red de ese pedido;
   - nueva alerta «ganancia muy alta: revisar costo».
8. **Falta programar** (están en §4 y §5):
   - arrastrar las devoluciones al mes siguiente cuando no alcanzan;
   - una alerta de cuentas que comparten teléfono o tarjeta;
   - restar las devoluciones parciales;
   - un cierre del mes a prueba de fallos.
9. **El binario:** no lo cambiaría ahora. Con nuestro tope del 15 % no crea dinero nuevo: solo lo reparte distinto. Además paga por cómo te colocaron en el árbol (el «derrame») y deja a cero a quien tiene un solo brazo. Hoy solo 2 de 71 gestoras tienen madrina, así que no hay datos.
10. **Recomendación:** arreglar la red y las 3 cosas de arriba, hacer las 2 semanas con Dany y volver a mirar el binario dentro de 3–6 meses solo si hay 20 madrinas o más con equipos activos. Si se hace, que sea un «bono de equipo equilibrado» pequeño, dentro del mismo 15 %.

---

## 1 · El programa en 1 página

**De dónde sale el dinero:** solo de la **ganancia de ventas reales, ya entregadas y con el dinero confirmado**.
- Ganancia de una venta (= puntos) = precio Casa Viva − lo que costó el producto − la comisión de la gestora.
- En un producto de proveedor (bajo pedido) se resta además el fondo de la operación: mensajero, dependienta y tienda (~3.000 CUP).
- Todo lo que paga el programa sale de un **fondo = 15 % de esa ganancia del mes**. Casa Viva nunca pone más: si no alcanza, todas cobran el mismo %.

**Qué NO paga el programa:** nada por inscribirse, nada por invitar, nada por comprar. No hay cuota, no hay compra mínima, no hay que tener mercancía. Las compras para una misma, las pruebas y las devoluciones no cuentan.

| Quién | Qué gana | De dónde sale | Condiciones |
|---|---|---|---|
| Toda gestora | **Su comisión normal** (10 % o la fija del producto) | De la venta, como siempre | No cambia nada. El programa **no la toca** |
| La madrina (la que invitó) | **2 %** de lo que vende su invitada (precio Casa Viva), durante 12 meses | Fondo del 15 % | Haber entregado al menos 1 venta suya ese mes |
| La madrina de la madrina | **1 %** de lo que vende el 2.º nivel | Fondo del 15 % | Lo mismo + ser Plata ese mes |
| Quien llega a una piedra | **Bono fijo en CUP** ese mes (Bronce 5.000 … Corona 250.000) | Lo que queda del fondo después de la red | Puntos del equipo del mes; cada invitada cuenta como mucho el 60 % de lo que pide la piedra; 1 venta propia + un mínimo propio |
| Casa Viva | **El 85 % o más de la ganancia** de esas ventas | — | Nunca pone de su bolsillo |

**En números, por cada 100 USD que vende una gestora** (media real de octubre):
- costo 70;
- comisión 10;
- **ganancia 20**;
- el programa, como mucho, 3 (15 % de 20);
- **a Casa Viva le quedan al menos 17**. Después de los gastos fijos de cada producto (~5,5) y del 2 % de la dependienta y Nati, le quedan **al menos ~9,5**.

**Estado hoy:** EN VIVO en **modo sombra**, solo lo ve Dany. Calcula cada noche, enseña «En prueba» y **no paga nada**.

---

## 2 · «La tienda nunca pierde»: la prueba con números

### 2.1 Datos reales de octubre (del 1 al 16; leídos hoy, sin guardar nada)

Fuente:
- web: cálculo del programa ejecutado en solo lectura. Da lo mismo que el cálculo guardado del 16-oct (`run 1`: 3.192 USD y 643 puntos) más las ventas aprobadas después;
- panel: gastos fijos de cada producto (D74) y 2 % de dependienta + Nati (D76).

| | USD |
|---|---|
| Ventas de gestoras entregadas y cobradas (73 pedidos, 87 líneas) | **3.207,00** |
| Costo de los productos | 2.236,90 (69,7 %) |
| Comisiones normales de las gestoras | 317,70 (9,9 %) |
| Fondo de la operación de la venta de proveedor (1 lámpara) | 5,06 |
| **Ganancia = puntos** | **647,34** (20,2 %) |
| Gastos fijos de esos productos (D74, ~7,9 % del costo) | 176,10 |
| Dependienta 0,5 % + Nati 1,5 % (D76) | 64,14 |
| **«Queda limpio» como lo ve Lennys en el panel** | **≈ 407** (12,7 %) |
| Tope del programa (15 % de 647,34) | 97,10 |
| **Lo que pagaría hoy el programa** | **6,25** (1 Bronce de 5.000 CUP a tasa 800) |
| Le queda a Casa Viva después del programa | **≈ 401** |

Más datos del mismo cálculo:
- Solo 1 gestora llega a Bronce: **gestora A**, 633 USD vendidos, 115 puntos. La siguiente tiene 64 puntos (le falta 1).
- **Red = 0**: de 71 gestoras solo 2 tienen madrina (las dos de la misma) y todavía no han vendido.
- **Alertas:**
  - 1 autocompra (42 USD, no cuenta);
  - 58 «revisar», que es lo normal: la gestora pone su teléfono en el pedido de su clienta;
  - 18 «costo provisional».
- **Ninguna línea se vendió perdiendo.**
- **Ojo para Lennys:** el **punto (647) no es su «queda limpio» (≈ 407)**. El punto no resta los gastos fijos ni el 2 % (así lo decidió Ernesto en D75.1). Si Lennys compara los «⭐ N puntos» de un producto con el «queda limpio» del panel, verá números más altos y hay que explicárselo.
- **Estimación del mes entero** (las ventas del 1 al 16 repetidas): 6.414 USD vendidos, 1.295 de ganancia y un tope de **194 USD**.

### 2.2 Simulaciones (20 escenarios con el cálculo de verdad)

Cómo se hicieron:
- Margen como el de octubre: costo 70 %, comisión 10 %, ganancia 20 %. Tasa 800.
- «Ganancia real» = con el costo **de verdad**. En los escenarios de costos mal puestos, es distinto del costo cargado en la web.
- «Le queda» = ganancia real − lo que paga el programa.
- Los escenarios de devoluciones (S5) suman 2 meses.

| # | Escenario | Ventas | Ganancia real | Paga el programa | % de la ganancia | Bonos cobrados al | Le queda a la tienda | ¿Paga más de lo que gana? |
|---|---|---|---|---|---|---|---|---|
| R1 | **Octubre real (1–16), tal cual** | 3.207 | 647 | 6,25 | 1,0 % | 100 % | 641 | No |
| R2 | Octubre real, con las 27 vendedoras puestas en 3 equipos inventados | 3.207 | 647 | 97,09 (red 63,46 + bonos 33,63) | 15,0 % | **45 %** | 550 | No |
| R3 | Octubre completo estimado (×2) con esos equipos | 6.414 | 1.295 | 194,19 | 15,0 % | **33 %** | 1.100 | No |
| S1 | Mes flojo (12 gestoras, 2 equipos chicos) | 1.020 | 204 | 30,20 | 14,8 % | 100 % | 174 | No |
| S2 | Mes muy bueno (80 gestoras en 8 equipos) | 32.940 | 6.588 | 988,18 (red 778 + bonos 210) | 15,0 % | **17 %** | 5.600 | No |
| S3 | Gestora estrella (4.000 USD sola → Rubí) | 5.000 | 1.000 | 75,00 | 7,5 % | 100 % | 925 | No |
| S4 | Red grande que vende poco (madrina 60 USD + 40 invitadas × 35) | 1.460 | 292 | 43,80 | 15,0 % | 84 % | 248 | No |
| S5a | Devuelven el 20 % de los pedidos ya pagados; el mes siguiente es normal | 13.596 | 2.719 | 407,89 | 15,0 % | 30 % | 2.311 | No |
| S5b | Devuelven todo lo de 3 de 7 gestoras; el mes siguiente casi no se vende | 1.660 | 332 | 84,01 | **25,3 %** | 23 % | 248 | No (pero pasa del 15 %) |
| **S5c** | **Caso extremo: se devuelve TODO el mes ya pagado y el siguiente no se vende nada** | 0 | 0 | 84,01 | — | — | **−84** | **SÍ** |
| S6 | Solo productos de proveedor (45 − 32 − 5,20 − 3,75) | 3.285 | 296 | 44,35 (solo red, recortada al 78 %) | 15,0 % | **0 %** | 251 | No |
| S7 | Liquidaciones que se venden perdiendo (35 % de las líneas) | 5.880 | 336 | **126,00** → con el arreglo **50,40** | **37,5 %** → 15 % | 0 % | 210 → 286 | No (pero pasaba del 15 %) |
| S8a | Costos provisionales demasiado bajos (la mitad, real 82 % y cargado 67 %) | 5.780 | 807 | 187,94 | **23,3 %** | 31 % | 619 | No |
| S8b | Costo tecleado 3,20 en vez de 22 en un producto que vende todo el equipo | 1.440 | 315 | 174,14 | **55,3 %** | 67 % | 141 | No |
| **S8c** | **Costo tecleado 3,20 en vez de 28 (producto casi sin margen)** | 1.440 | 45 | 174,14 | **387 %** | 67 % | **−129** | **SÍ** |
| S9 | Muchas en la misma piedra (cadena de 6, 400 USD cada una) | 2.400 | 480 | 72,00 | 15,0 % | **17 %** | 408 | No |
| S10a | Gestora honrada: 650 USD sola → Plata | 650 | 130 | 12,50 | 9,6 % | 100 % | 117,50 | No |
| S10b | Tramposa: las mismas 650 USD repartidas con una «invitada» falsa | 650 | 130 | 19,50 | 15,0 % | 69 % | 110,50 | No (la tramposa cobra 7 USD más) |
| S10c | La madrina compra 300 USD para ella por su invitada | 360 | 72 | 6,00 → con el arreglo **0** | 8,3 % → 0 | — | 66 → 72 | No |
| S11 | Red grande y profunda: 127 gestoras, cada una invita a 2 | 12.700 | 2.540 | 380,96 (red 376 + bonos 4,96) | 15,0 % | **1 %** | 2.159 | No |

**Qué demuestran:**

1. **Con costos bien puestos, la tienda nunca paga más del 15 % de la ganancia de ese mes.** Hay doble tope: por equipo y del mes entero. Lo comprueban las 200 rondas al azar de las pruebas y 200 más que añadí.
2. **Cuándo puede pasar del 15 % (o perder):**
   - **Costos mal puestos** (S8): el programa cree que se gana más de lo que se gana.
     - Si el error es grande en un producto casi sin margen (S8c), la tienda **pierde**: paga 174 USD de una ganancia real de 45.
     - **Arreglo:**
       - alerta nueva «ganancia muy alta» (en la rama; habría saltado aquí: 3,20 de costo en un producto de 32);
       - Lennys revisa «Costo provisional» y «Ganancia alta» antes de cada cierre de mes en «sí» (§4).
   - **Devoluciones después de pagar** (S5): el mes siguiente se restan.
     - Si ese mes se vende poco, lo devuelto no alcanza a restarse entero y no se arrastra. Con un mes entero devuelto y nada después (S5c), la tienda pierde lo pagado: 84 USD.
     - **Arreglo propuesto (sin programar):** «saldo de devoluciones». Si un mes queda en negativo, ese negativo pasa al mes siguiente y resta de su fondo hasta cubrirse.
     - Es raro: el cierre se hace del 1 al 5 del mes siguiente, así que lo pagado ya lleva semanas entregado.
   - **Liquidaciones que pierden** (S7): antes, el fondo se calculaba solo con las ventas que ganan. Las que pierden contaban 0 en vez de restar, y se llegaba a pagar el 37,5 % de lo que de verdad se ganó.
     - **Arreglado en la rama:** el fondo se calcula sobre la ganancia **neta**. Los puntos de cada gestora siguen sin bajar de 0 por línea, para no castigarla por una liquidación que decidió la tienda.
3. **Lo que no cuadra (no hace perder dinero, pero sí promesas):** en cuanto hay equipos de 2 niveles, **la red se come casi todo el fondo y los bonos de piedra se cobran a medias o a cero** (R2 45 %, R3 33 %, S2 17 %, S9 17 %, S11 1 %, S6 0 %).
   - **Por qué:** con un 20 % de ganancia, el 2 % + 1 % del precio es el 10 % + 5 % de la ganancia = **el 15 % entero**.
   - La propuesta aprobada (D56) era 5 para la red + 10 para bonos. D58 subió la red al 2 % + 1 % del precio, y la cuenta ya no da.
   - Con red **1 % + 0,5 %** (D53), los mismos escenarios cobran los bonos al: R2 87 %, R3 68 %, S2 48 %, S9 47 % y S11 50 % (`variante-red-1-y-medio.json`).
   - **Decide Ernesto** (§5.1).
4. **Una red grande que vende poco no es un peligro para la tienda** (S4: paga el 15 % de una ganancia real). Pero es lo que hay que vigilar éticamente:
   - la madrina, con 60 USD vendidos, llega a Oro y cobra ~44 USD, contra los 6 de su propia comisión;
   - es legal porque sale de ventas reales a clientas, pero premia más invitar que vender;
   - **Propuesta:** subir el «mínimo propio» de Plata, Oro y Platino (hoy 50 USD) a 100–150.

---

## 3 · Preguntas que hará Lennys, con su respuesta

1. **«¿Quién paga los bonos?»** Casa Viva, pero solo de un fondo que es el 15 % de la ganancia que trajeron esas ventas.
   - Ejemplo: si las gestoras dejan 647 USD de ganancia (octubre, 1–16), el programa puede pagar como mucho 97. Hoy pagaría 6,25.
2. **«¿Cuánto me cuesta al mes?»**
   - Hoy, ~6 USD.
   - Como mucho, 3 de cada 100 USD que vendan las gestoras. Con el octubre completo estimado (6.400 USD), un máximo de **194 USD**, y esos 194 solo se pagan si hay equipos. Sin equipos, solo bonos de quien llegue sola a una piedra.
3. **«¿Puedo perder dinero con esto?»** Con los costos bien puestos, no: nunca paga más de 15 de cada 100 USD de ganancia. Los dos casos raros en que sí (costo muy mal puesto; mes entero devuelto) están en §2, y cómo vigilarlos en §4.
4. **«¿Qué pasa con la comisión normal?»** Nada. Sigue igual (10 % o la fija) y se cobra por «Pedir mi pago». El programa va **aparte y encima**.
   - Ejemplo: una gestora vende 300 USD → 30 de comisión, como siempre. Si además es Bronce, cobra su bono del fondo.
5. **«¿Y si una gestora se inventa clientas?»** Solo cuentan ventas **entregadas por nuestro mensajero y con el dinero confirmado**. Inventarse una clienta significa pagar ella el producto.
   - Ejemplo: paga 100 USD, recibe 10 de comisión y, como mucho, ~3 del programa.
   - Si el nombre de quien compra es el suyo, no cuenta («autocompra»).
6. **«¿Y si la madrina se hace cuentas falsas de invitadas?»** No puede sacar más del 15 %. Pero sí puede quedarse con una parte mayor de ese 15 % que las honradas.
   - Ejemplo S10: vendiendo sola 650 USD cobra 12,50 USD. Repartiéndolo con una cuenta falsa cobra 19,50.
   - Hoy no hay alerta de «cuentas con el mismo teléfono o tarjeta» y hay que programarla (§4).
   - Truco: el pago de una invitada a la misma tarjeta que la madrina es la señal más clara.
7. **«¿Y si se devuelve un producto?»**
   - Si se devuelve **antes** del cierre del mes, ni da puntos ni red.
   - Si se devuelve **después** (mes ya pagado), se resta el mes siguiente: sus puntos, sus ventas y la red que dio.
   - Ejemplo S5a: devuelven el 20 % de los pedidos y el mes siguiente el fondo baja lo que hace falta.
   - Lo que no está programado es arrastrar el negativo si el mes siguiente se vende poco (§2).
8. **«¿Y las devoluciones de una parte del pedido (1 de 3 cosas)?»** Hoy el programa solo ve el pedido anulado entero. **Propuesta:** leer los reembolsos parciales. En octubre no hubo ninguno.
9. **«¿Puedo apagarlo?»** Sí, en un minuto.
   - wp-admin → Casa Viva → Programa gestoras → «no», o `wp option update cvd_programa_gestoras no`.
   - No se ve ni calcula nada. Lo que ya se pagó queda apuntado.
10. **«¿Es una pirámide?»** No:
    - no se paga por entrar ni por invitar;
    - no hay que comprar nada;
    - todo sale de ventas reales a clientas, entregadas y cobradas.

    Es lo que separa una venta directa sana de una pirámide (§6). La señal de alarma sería que las gestoras ganaran más por invitar que por vender, y por eso propongo subir el mínimo propio (§2, punto 4).
11. **«¿Por qué los ⭐ puntos no son mi "queda limpio"?»** Porque el punto no resta los gastos fijos ni el 2 % de dependienta y Nati (decisión D75.1).
    - Ejemplo de octubre: 647 puntos contra ≈ 407 de «queda limpio».
    - Si Lennys quiere que sean iguales, se cambia con un interruptor (`cvd_programa_gastos_fijos = si`). Los puntos bajan ~27 % y las piedras cuestan más.
12. **«¿Cuánto tiene que vender una gestora para el primer bono?»** Bronce = 65 puntos del equipo en el mes ≈ **325 USD** vendidos (con el margen de octubre) y 1 venta propia. Cobra 5.000 CUP.
    - Gestora A lo logró en la primera quincena de octubre con 633 USD.
13. **«¿Y si la tasa del CUP cambia?»** El bono es fijo en CUP.
    - Si el CUP pierde valor, a la tienda le cuesta menos en USD.
    - Si gana valor, el bono pesa más, pero el tope del 15 % no deja pasarse: se cobra a medias.
14. **«¿Puede una gestora ganar más que yo?»** No: entre todas, el programa reparte como mucho el 15 % de la ganancia. La que más cobra en los escenarios grandes:
    - 65 USD de red en un mes de 33.000 USD vendidos (S2);
    - 75 USD de bono siendo Rubí con 4.000 USD vendidos sola (S3).
15. **«¿Y los productos sin costo o los de proveedor?»**
    - **Sin costo:** dan 0 puntos (hoy solo 2 productos publicados no tienen costo).
    - **De proveedor:** a sus puntos se les resta el fondo de la operación (mensajero, dependienta, tienda). Ejemplo: la lámpara de 45 USD da 4,05 puntos, no 7,80.
16. **«¿Por qué el bono sale "cubierto al 69 %"?»** Porque las piedras de una madrina y de su invitada se ganan con las mismas ventas y el fondo es uno solo. Cuando no alcanza, todas cobran el mismo %. Con la red actual (2 % + 1 %) va a pasar mucho (§2, punto 3).
17. **«¿Qué tengo que hacer yo?»**
    - Una vez al mes, antes del cierre (días 1–5), mirar en el panel → Equipo → Programa las alertas «Costo provisional», «Ganancia muy alta», «Pierde» y «Autocompra».
    - Pagar lo que pidan por «Pedir mi pago», como las comisiones.
18. **«¿Cuándo empieza a pagar?»** Después de las 2 semanas de prueba con Dany, si no hay errores y Ernesto dice SÍ. El primer cierre que se paga es el del mes en que se encienda.

---

## 4 · Fallos posibles y cómo vigilarlos

| Fallo | Ejemplo | Alerta que YA existe (panel → Equipo → Programa, y wp-admin) | Lo que FALTA |
|---|---|---|---|
| **Autocompra** (la gestora compra para ella) | Pedido a nombre de la gestora | **«autocompra»** (no cuenta); **«revisar»** si solo coincide su teléfono (cuenta) | Con 58 «revisar» en octubre, la alerta se ignora. **Propuesta:** agruparlas («58 pedidos con el teléfono de la gestora, normal») y enseñar solo las que se repiten con la misma clienta |
| **La madrina compra por su invitada** | S10c: Marta compra 300 USD a través de Ana y se cobra el 2 % | Ninguna en `main` | **Hecho en la rama:** alerta **«autocompra_red»** y esa madrina no cobra red de ese pedido |
| **Cuentas falsas de madrina** | S10b: reparte sus ventas con una «invitada» inventada y cobra +56 % | **«concentración»** (un miembro aporta más del 60 % de los puntos del equipo); la regla del 60 % frena las piedras | **Alerta de cuentas que comparten teléfono, tarjeta de pago o dirección** con su madrina (D53 ya lo pedía). Sin programar |
| **Costos mal puestos** que inflan los puntos | S8b/S8c: 3,20 en vez de 22 o 28 | **«costo provisional»** (fórmula o por confirmar), **«pierde»**, **«sin costo»** | **Hecho en la rama:** **«ganancia_alta»** (línea de 10 USD o más que gana más del 55 % del precio; en octubre saltaría 1 vez: sombrilla de 15 USD con costo 3,55). **Falta:** que Lennys confirme esas alertas antes del cierre en «sí». Mejor aún: que el cierre automático espere a que no haya ninguna sin revisar |
| **Liquidaciones que pierden** | S7 | «pierde» | **Hecho en la rama:** el fondo se calcula sobre la ganancia neta |
| **Devoluciones** | S5 | «devolución» (de un mes cerrado), «red_negativa» | 1) **Arrastrar el negativo** del fondo al mes siguiente (S5c). 2) **Devoluciones parciales** (reembolso de 1 de 3 artículos sin anular el pedido): hoy no se ven |
| **Errores de cálculo** | Fórmula o redondeo | 104 + 33 pruebas automáticas; libro con huella SHA-256; un cierre por mes que no se rehace | Durante la prueba con Dany, comparar cada día 2–3 pedidos a mano (PLAN-DESPLIEGUE paso 6). **Cierre a prueba de fallos:** hoy, si se corta a mitad de guardar las líneas, el cierre queda a medias igual (§5.2) |
| **El fondo no alcanza** | R2/S2/S11: bonos al 45 %/17 %/1 % | El panel enseña «Bonos cubiertos X %» y la gestora ve «el fondo cubre el X %» | Antes de abrirlo: decidir la red (§5.1) y anunciar el bono como «hasta» |
| **Red grande que vende poco** | S4 | «concentración» (solo si una sola aporta más del 60 %) | Subir el mínimo propio de las piedras (§2, punto 4) |

**Rutina de 5 minutos al mes** (Lennys o Ernesto, días 1–5, antes del cierre):
1. Panel → Equipo → Programa.
2. Mirar «Costo provisional», «Ganancia muy alta», «Pierde» y «Autocompra».
3. Corregir el costo que esté mal (el cierre lo recalcula solo).
4. Si algo no cuadra, apagarlo («no») hasta revisarlo.

---

## 5 · Auditoría del código y de la lógica (frente a D60 y D75)

### 5.1 Errores que no cuadran

| # | Qué | Dónde | Efecto | Propuesta |
|---|---|---|---|---|
| E1 | **La red (2 % + 1 % del precio) cuesta el 15 % entero de la ganancia** cuando hay 2 niveles. D56 decía «5 red + 10 bonos». D58 la cambió sin rehacer la cuenta | `DEFAULTS red1_pct/red2_pct` | Los bonos de piedra se cobran al 17–45 %, o a ~0 en redes grandes. No hace perder dinero, pero sí **promesas** | **Decide Ernesto.** Recomiendo **1 % + 0,5 %** (D53), o la red **en puntos**: 5 % + 2,5 % de la ganancia de la invitada, que se ajusta sola a los productos de poco margen. Es cambiar 2 números |
| E2 | **El fondo se calculaba sin restar las líneas que pierden** | `compute()` → `$pool` | Con liquidaciones se podía pagar más del 15 % de la ganancia real (S7: 37,5 %) | **Arreglado en la rama** (fondo sobre la ganancia neta; prueba incluida) |
| E3 | **Devolución sin arrastre:** si el mes siguiente no alcanza para restar lo devuelto, se pierde | `compute()` (`max(0, total)`) y `red_negativa` | S5c: la tienda pierde lo pagado | Guardar el negativo del cierre y restarlo del fondo de los meses siguientes. No está hecho: toca el libro y quiero que lo vea Ernesto |
| E4 | **Reembolsos parciales** (Woo «reembolsar 1 artículo» sin anular el pedido) no restan | `sales()` lee el desglose de la comisión, no los reembolsos | Puntos y red de algo devuelto. En octubre: 0 casos | Leer `$order->get_refunds()` por artículo y restarlo de `base`, `qty` y la comisión |
| E5 | **D54 decía «comisión + red + rango ≤ 40 % de la ganancia del pedido».** Hoy, comisión (≈ 10/30) + programa (≤ 3/30) ≈ 43 % | — | Ya no rige: D55 la cambió por el fondo del 15 % sobre la ganancia **después** de la comisión | Nada en el código. Si alguien cita el 40 %, explicarle que manda D55 |
| E6 | **«1 punto = 1 USD que le queda a Casa Viva»** (PLAN-DESPLIEGUE) no es el «queda limpio» de Lennys (D76) | Textos | Confusión al presentarlo | Decir «1 punto = 1 USD de ganancia **antes de gastos fijos**» |
| E7 | Ventas de proveedor: si el pedido no tiene tasa o reparto, el fondo de la operación **no se resta** y nadie se entera | `spread_supplier_fund()` | Unos pocos puntos de más (~3,75 por venta) | Añadir una alerta «proveedor sin reparto» |

### 5.2 Mejorable

1. **Cierre a prueba de fallos:** en `run()`, si falla una inserción, igual se guarda lo que haya (`COMMIT` sin mirar). Un cierre «mensual» a medias quedaría como definitivo.
   - **Propuesta:** comprobar cada `insert` y hacer `ROLLBACK` si alguno falla.
   - Bloquear con `GET_LOCK` para que la tarea de la noche y el botón «Cerrar ahora» no creen 2 cierres a la vez. Hoy se comprueba primero y se guarda después, sin bloqueo.
2. **Redondeos:** la red se redondea a céntimos por persona después del recorte, así que el total puede pasar del fondo por 1–2 céntimos. Las pruebas lo toleran (0,05). Para que nunca pase, redondear hacia abajo.
3. **Mínimo propio** de Plata, Oro y Platino = 50 USD: bajo para la ética del programa (S4). Propuesta: 100–150.
4. **Alertas «revisar»:** 58 al mes tapan las importantes. Agruparlas.
5. **Cuentas que comparten teléfono o tarjeta** (D53): sin programar.
6. **Pantalla de la gestora:** el bono sale como «5.000 CUP» y debajo «el fondo cubre el X %». Mejor «hasta 5.000 CUP» desde el principio.
7. **Rendimiento:** `sales()` lee todos los pedidos tocados en el mes, con `limit -1`. Hoy sobra; con miles de pedidos al mes, paginar.
8. **Panel de Lennys:** muestra el `type` de las alertas nuevas (`autocompra_red`, `ganancia_alta`). Habría que ponerles el texto en español en `index.html` cuando se suba la rama. En wp-admin ya lo tienen.

### 5.3 Lo que está bien, y por qué

Comprobado frente a lo decidido:

| Regla | ¿Cumple? | Cómo se comprobó |
|---|---|---|
| D55/D56 · punto = precio − costo − comisión; sin costo = 0 | Sí | Código + prueba; R1 da los mismos 647,34 que el cálculo en vivo |
| D58 · red 2 % + 1 % sobre el precio Casa Viva (sin lo que sube la gestora ni la mensajería), 12 meses | Sí (pero ver E1) | `base_amount` del desglose; `within_months` |
| D60 · doble tope del 15 % (equipo y mes) | Sí | 200 + 200 rondas al azar; todos los escenarios ≤ 15 % con costos bien puestos |
| D60 · 60 % por miembro, mínimo propio, Plata del mes para el 1 % | Sí | Pruebas; S10b (la cuenta falsa no basta para subir sola) |
| D60 · mes de la venta = cuando se confirmó el dinero (hora de Cuba) | Sí | El historial se guarda en UTC (`current_time('mysql', true)`) y se pasa a hora de Cuba. Todas las comisiones aprobadas de octubre están en pedidos `completed` (73 + 1 pagada), que el programa sí lee |
| D60 · red perdida no se guarda; devolución de mes cerrado resta en el siguiente | Sí (ver E3) | Prueba + S5a |
| D60 · autocompra por nombre (la marca de Core sola solo avisa) | Sí | 1 autocompra y 58 «revisar» en octubre |
| D60 · sombra no da títulos ni paga; libro que solo añade, con SHA-256 | Sí | `titles()` solo lee cierres «cerrado»; «Pedir mi pago» solo cierres «cerrado» |
| D75.1 · gastos fijos no se restan | Sí | `cvd_programa_gastos_fijos = no` en vivo |
| D75.2 · prorrateo de bonos | Sí | `factor_bonus` |
| D75.3 · red y bono por «Pedir mi pago», solo cierres en «sí» | Sí | Reserva con `payout_id` en la misma transacción; si se rechaza, se libera; si ya se pidió, falla |
| D75.4 · fondo de proveedor restado | Sí (ver E7) | Lámpara #3693: 5,06 USD restados |
| D75.5 · en vivo solo para Dany, en sombra | Sí | `cvd_programa_ver = 18`, `cvd_programa_gestoras = sombra`, tasa 800 |

**Por qué está bien hecho:**
- el cálculo es una función pura, sin base de datos, y se puede probar con casos;
- el libro no se puede rehacer;
- el interruptor apaga todo sin tocar archivos;
- el dinero sale de un tope que no depende de nadie;
- no hay ningún pago por invitar.

### 5.4 Lo que dejé en la rama `programa-auditoria-1016` (SIN desplegar)

Commit `5779174`, encima de `main` `4915f1e`. Toca 3 archivos:
- `class-cvd-programa-calc.php`:
  1. **Fondo sobre la ganancia neta:** `pool = 15 % × max(0, min(puntos, ganancia neta))`, y `totals.net_profit_usd` nuevo. Sin líneas que pierdan, no cambia nada (R1 da igual).
  2. **La madrina que compra a través de su invitada no cobra red de ese pedido.** Lo mismo para la de 2.º nivel. Sale la alerta `autocompra_red`. La invitada sigue sumando su venta.
  3. **Alerta `ganancia_alta`:** línea de 10 USD o más con ganancia > 55 % del precio. Son 2 opciones nuevas (`high_margin`, `high_margin_min`).
- `class-cvd-programa.php`: pasa al cálculo los nombres de quien compra y recibe (no se guardan en el libro) y pone el orden y el texto de las 2 alertas nuevas en wp-admin.
- `artifacts/tests/test-programa-gestoras.php`: 13 comprobaciones nuevas, entre ellas 200 rondas al azar con líneas que pierden.

**Resultado de las pruebas:** 104 + 33 + 49 OK, y `php -l` sin errores.

Para subirlo: subir la versión (3.14.30 o la siguiente libre), seguir PLAN-DESPLIEGUE pasos 0–3 y poner el texto de las 2 alertas en el panel. **Necesita el SÍ de Ernesto.**

---

## 6 · El sistema binario: qué es, por qué tiene mala fama y si vale para Casa Viva

### 6.1 Cómo funciona
- Cada persona tiene **solo 2 «patas»** (izquierda y derecha). Las 2 primeras invitadas van una a cada lado. Las siguientes se colocan **debajo**, en la pata que la madrina (o la empresa) elija. Esto se llama **«derrame»**: te pueden caer personas que no invitaste tú.
- Se suman los puntos de **toda** la pata, sin límite de niveles.
- Se paga un **% de la pata débil** (la que suma menos), por ejemplo el 10 %.
- Lo que sobra de la pata fuerte a veces se **arrastra** al mes siguiente («carry over»).
- Suele tener **topes** por persona y por semana.

### 6.2 Por qué muchos binarios acaban en estafa piramidal
- **Se paga por reclutar:** hay que llenar las 2 patas, y los puntos salen de «paquetes» que compra quien entra, no de ventas a clientes.
- **Cuota o compra mínima:** para estar «activa» y cobrar hay que comprar cada mes. Ese dinero de los nuevos paga a los de arriba.
- **El producto es la excusa:** casi todo lo compran las propias participantes, no clientes de fuera.
- **Sin límite de niveles y con arrastre:** una misma venta cuenta para todas las de arriba. La suma de lo prometido crece con la profundidad del árbol, y solo se puede pagar si sigue entrando gente.

Casos conocidos (con fuente):
- **Vemma (EE. UU., 2015).** La FTC la denunció como presunta pirámide:
  - se pagaba por apuntar gente, no por vender;
  - pedía un paquete de entrada de 500–600 USD y 150 USD de compra al mes para cobrar bonos;
  - según los escritos de la FTC que citan los análisis del caso, el plan era **binario** y premiaba reclutar.
  - El acuerdo final de 2016 le prohibió pagar por reclutar y atar los pagos a las compras propias.
  - Fuentes: [FTC, nota de prensa 26-ago-2015](https://www.ftc.gov/news-events/news/press-releases/2015/08/ftc-acts-halt-vemma-alleged-pyramid-scheme) · [FTC, orden final 2016 (PDF)](https://www.ftc.gov/system/files/documents/cases/161222_vemma_273-stipulated_final_order_redacted.pdf) · [BehindMLM, sobre el plan binario (análisis, no oficial)](https://behindmlm.com/companies/ftc-vemma-is-a-200-million-illegal-pyramid-scheme).
- **OneCoin (2014–2019).** Una «criptomoneda» vendida en paquetes por una red multinivel que pagaba comisiones por apuntar a otros compradores.
  - La fiscalía de Nueva York habla de más de 4.000 millones de USD de víctimas.
  - Un cofundador fue condenado a 20 años en 2023.
  - Fuente: [Departamento de Justicia de EE. UU., SDNY, 12-sep-2023](https://www.justice.gov/usao-sdny/pr/co-founder-multibillion-dollar-cryptocurrency-scheme-onecoin-sentenced-20-years-prison).
  - No he comprobado en una fuente oficial que su plan fuera binario. Lo cito como ejemplo de **pagar por reclutar**, no del binario.

### 6.3 Venta directa sana frente a pirámide

La referencia más usada son las guías de la FTC de EE. UU. ([Business Guidance Concerning Multi-Level Marketing, actualizada en abril de 2024](https://www.ftc.gov/business-guidance/resources/business-guidance-concerning-multi-level-marketing)). En Cuba no conozco una norma específica sobre esto; si hiciera falta, habría que consultarlo con un abogado.

| Sana | Pirámide |
|---|---|
| Se gana por **ventas a clientes reales** (usuarios finales) | Se gana por **apuntar gente** o por lo que compran las propias participantes |
| Entrar es gratis o muy barato; no hay compra obligatoria | Paquete de entrada, compra mínima para estar «activa» |
| Las compras propias se limitan y no cuentan para subir de rango | Se compra para mantener el rango o ayudar a la de arriba («cargar inventario») |
| Las promesas de ganancias son las reales y típicas | «Libertad financiera», casos excepcionales como si fueran normales |
| El negocio vive aunque no entre nadie nuevo | Si deja de entrar gente, se cae |

**Casa Viva hoy cumple la columna sana:**
- se entra gratis;
- no hay compra mínima;
- las autocompras no cuentan;
- todo sale de ventas entregadas y cobradas;
- el fondo tiene tope.

El punto a vigilar: que el ingreso de las madrinas no venga casi todo de su red (S4). Por eso propongo subir el mínimo propio.

### 6.4 ¿Se puede hacer aquí un «binario sano»? Propuesta y simulación

**Reglas que propongo si algún día se hace:**
- puntos solo de ventas **entregadas y cobradas a clientas finales** (los mismos puntos de hoy);
- **10 % de la pata débil**, pagado **del mismo fondo del 15 %**, primero el binario y después los bonos de piedra, con prorrateo;
- sin cuota, sin compra mínima, con 1 venta propia en el mes;
- **tope de 60 USD por gestora al mes**;
- **sin arrastre** (cada mes empieza de cero).

Simulado con las mismas ventas y los mismos árboles. El «binario sano» sustituye a la red del 2 % + 1 %; las piedras se quedan.

| Escenario | Sistema actual (red 2 % + 1 % + piedras) | Binario sano (10 % pata débil, tope 60) | Binario clásico, sin tope del 15 % |
|---|---|---|---|
| R1 octubre real | 6,25 (solo 1 bono) | 6,25 (igual: nadie tiene 2 patas) | 0 |
| R2 octubre real en 3 equipos | red 63,46 + bonos 33,63 (al **45 %**); cobran red 13 | binario 41,78 + bonos 55,32 (al **74 %**); cobran binario 10 | pediría el 6,5 % de la ganancia; si fuera el 10 % de las **ventas**, el **31 %** |
| R3 octubre completo en equipos | red 132,42 + bonos 61,77 (al 33 %) | binario 83,56 + bonos 110,65 (al 59 %) | 6,5 % / 31 % |
| S2 mes muy bueno | red 778 + bonos 210 (al **17 %**) | binario 358 + bonos 630 (al **50 %**) | 5,4 % / 27 % |
| S4 red ancha que vende poco | red 28 a 1 madrina + bonos 15,80 | binario 43,80 a **19 personas que no invitaron a nadie** (por el derrame) y bonos 0 | 15 % / 77 % |
| S9 cadena (cada una invita a 1) | red 56 + bonos 16 | binario **0** (nadie tiene 2 patas), bonos 72 | 0 |
| S11 red grande y profunda (127) | red 376 + bonos 4,96 (al **1 %**) | binario pedía 572 → recortado al 67 %; bonos 0 | **25 % de la ganancia; sobre ventas, el 126 %: imposible sin dinero de nuevas** |

**Qué se ve:**
1. **Con nuestro tope del 15 %, el binario no hace perder dinero, pero tampoco crea dinero:** reparte el mismo fondo. Con 10 % de la pata débil, el binario deja más para las piedras que la red actual. Eso es por ser más pequeño, no por ser binario: lo mismo se consigue bajando la red a 1 % + 0,5 % (bonos al 48–87 %).
2. **El binario paga por dónde te colocaron, no por lo que hiciste.**
   - S4: 19 gestoras que no invitaron a nadie cobran por el derrame.
   - S9: una cadena de 6 que vende igual no cobra nada.

   Es difícil de explicar y crea peleas («¿por qué la pusiste en mi pata?»).
3. **Empuja a reclutar:** para cobrar hay que «equilibrar las patas», es decir, buscar gente para la débil. Es justo lo que las guías de la FTC miran con lupa.
4. **El binario clásico sin tope se come el negocio:** en S11, pagando el 10 % de las ventas de la pata débil, lo prometido es el **126 % de la ganancia**. Solo se paga con el dinero de nuevas que entran. Esa es la trampa de muchos binarios.
5. **Hoy no hay datos:** solo 2 de 71 gestoras tienen madrina. Cualquier diseño de red es una suposición.

### 6.5 Recomendación

**No cambiar ahora. Pensarlo más adelante, y solo como añadido pequeño.**
1. **Ahora:** arreglar E1 (red 1 % + 0,5 % o red en puntos). Con eso se consigue lo bueno que tendría el binario (más fondo para las piedras) sin lo malo (derrame, presión por reclutar, mala fama).
2. **Dentro de 3–6 meses**, si hay **20 madrinas o más con equipos que venden**, se puede probar en sombra un **«bono de equipo equilibrado»**:
   - un 3–5 % de la ganancia de la pata débil, contando solo hasta el 2.º o 3.er nivel;
   - con tope por gestora, sin arrastre y dentro del mismo 15 %;
   - nunca con cuota, paquetes ni compra mínima.
3. **Nunca:** pagar por invitar, cobrar por entrar, exigir compras para estar «activa» o prometer ingresos que no sean los típicos reales.

---

## Anexo · Cómo se hizo (para repetirlo)

- **Lectura de octubre:** `auditoria-2026-10-16/leer-octubre-solo-lectura.php`.
  - Se ejecuta con `wp eval-file` desde una carpeta temporal fuera de la web.
  - No guarda nada en el libro: llama a `CVD_Programa::compute`, no a `run`.
  - El volcado con nombres **no** se guarda en el repo.
- **Escenarios:** `build.py` (los arma) → `run.php` (los pasa por `class-cvd-programa-calc.php`; se corrió con el de `main` y con el de la rama) → `analyze.py` (cuentas de la tienda y simulación del binario).
- **Supabase `nexo-production`, solo lectura:**
  - gastos fijos del mes del panel: 407.408,50 CUP ≈ 509 USD a 800;
  - `cost_settings`: dependienta 0,5 % y «Nati» 1,5 %;
  - la caja apenas tiene ventas en octubre (3 ventas, 88 USD): las ventas de las gestoras están en la web.
- La carpeta temporal de Hostinger (`~/tmp-auditoria`) se borró al terminar.
