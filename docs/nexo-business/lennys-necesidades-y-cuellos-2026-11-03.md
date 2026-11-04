# Lennys: qué hace, qué necesita y dónde se atasca (revisión del Vigía, 3-nov-2026)

Fuente: su chat con el bot del 30-oct al 3-nov (≈ 150 mensajes suyos y ≈ 190 del bot). Nada de esto está programado; son recomendaciones.

## 1. Lo que Lennys hace en un día normal
- **Decide dinero y precios:** comisiones de gestoras (listas a las 10:00 y 16:00 con enlace para pagar), precio y comisión de productos nuevos (guirnalda LED, luces navideñas), tarifas de mensajería, quién cobra qué cuando una venta salió sin nombre.
- **Lleva la web y el catálogo:** publica lo que mandan Sairi, Zayri y Nana, fotos reales y comerciales, descripciones, el recuadro «¿Cómo comprar?», revisa lo que el bot dejó mal.
- **Lleva el cierre con las dependientas:** cuadre de caja con Zaymi, salidas del cajón, devoluciones y cancelaciones de pedidos que el cliente no recoge.
- **Hace vales** y revisa las tarifas de mensajería en el PDF antes de montarlas en la página.
- **Resuelve dudas de gestoras** y dependientas, y escucha al cliente en la tienda (felicitaciones, billetes rotos).
- **Manda sus órdenes por audio** y con `#supervisor`, y a veces escribe «Erne» (para ella el bot y Ernesto son lo mismo).

## 2. Cifras (por día, mensajes con el bot)
| Día | Ella al bot | Bot a ella |
|---|---|---|
| 30-oct | 26 (8 audios, 7 fotos) | 35 |
| 31-oct | 22 | 30 |
| 1-nov | 29 | 37 |
| 2-nov | 36 (8 audios, 5 con `#supervisor`) | 40 |
| 3-nov (hasta 10:35) | 37 (10 fotos, 8 `#supervisor`) | 44 |

El bot le escribe MÁS de lo que ella escribe. No es un ayudante que le quita trabajo, es otra conversación que atender. El 3-nov, entre 10:00 y 10:30, recibió 7 mensajes seguidos.

## 3. Cuellos de botella (con prueba)
1. **Todo termina en ella como única que decide.** Comisiones, precios, salidas del cajón, fichas por aprobar, fotos pendientes («sigue pendiente la foto real…»), cancelaciones. Si ella no está, nada avanza.
2. **No ve cómo va la tienda sin preguntar.** 1-nov 15:04: «en casa no tenía corriente y me desespera no poder saber nada de cómo va la tienda». Pregunta por chat lo que debería ver de un vistazo.
3. **Dos fuentes de tarifas.** 2-nov 11:32: el PDF dice 1.600 a La Habana Vieja y la web 1.800; ella revisa el PDF primero y luego la web, y tuvo que dar dos precios al cliente.
4. **Ventas en tienda sin dueño.** Nayeli y Katia (#3833): una clienta de la gestora compra en la tienda y la dependienta no sabe de quién es; «no puedo ponerla como venta de ella». Mismo origen que Anisley (error #132).
5. **Pagos que esperan.** 1-nov 19:13 y 2-nov 08:58: pasa a mano el número de tarjeta para pagar a alguien «que ya la están esperando».
6. **Datos de productos a pedazos.** Sairi manda fotos, Zayri los datos, Lennys el costo y la comisión, el bot pregunta lo que falta («¿cuántas entraron?», «¿el costo 25 es USD?»), y se repite la conversación varias veces.
7. **El bot reenvía preguntas que otros podrían contestar** (cuenta de Zelle, reposición de protectores) y pide aprobaciones que ella ya delegó (salidas del cajón: ya quitado el 2-nov).
8. **Respuestas que no cierran.** «Listo, se lo paso al supervisor» sin resultado concreto (#191); «anotado» sin acción (#158, #164).
9. **Descuadres de caja al final del día** (30-oct: −3 USD y +126 CUP) que ella revisa con Zaymi, y diferencias de tasa que obligan a «decir mentiras» en la caja para cerrar un pedido.

## 4. Lo que ella necesita (leído entre líneas)
- Decidir en UN toque, con la propuesta ya hecha y el efecto en dinero.
- Ver de un vistazo qué está atrasado, qué decidió ya y qué falta de otros.
- Que lo que dice (`#supervisor`, un audio) se haga de verdad y reciba una confirmación corta con resultado.
- Que nadie le repita lo que ya contestó.
- Un solo lugar para tarifas, precios y datos de pago.
- Poder delegar con reglas claras y que no se le pregunte lo delegado.

## 5. Mejoras propuestas (ordenadas por efecto)
1. **Un solo mensaje del bot por tarea y por turno** y un «resumen del día» a las 17:00 (pendientes que solo ella decide, atrasos, dinero por pagar). Meta: de ~40 a ≤ 10 mensajes al día.
2. **Bandeja de decisiones de un toque** (ya hay una sesión «Tablero único por roles»): cada decisión con propuesta, efecto en dinero y botones Sí / No / Cambiar; lo decidido no vuelve a preguntarse.
3. **Una sola fuente de tarifas:** la web manda y el PDF se genera solo desde ella (hoy se actualizan a mano).
4. **Venta en tienda con dueño:** en la caja, al cobrar, «¿cliente de una gestora?» con búsqueda por nombre. Y avisar a las gestoras que deben decirlo antes.
5. **Alta de producto en un solo formulario** (costo, precio, comisión, cantidad, fotos, quién lo manda) para que Zayri lo llene y Lennys apruebe con un toque. El bot no pregunta lo que el formulario ya trae.
6. **Reglas delegadas por escrito:** salidas del cajón hasta un tope, cancelaciones de recogida a las 24 h, tasa especial autorizada con la diferencia descontada de la comisión (decisión del 1-nov). El bot solo avisa cuando se sale de la regla.
7. **Pagos pendientes con los datos al lado** (tarjeta, monto, quién espera) en la misma bandeja, sin copiar números a mano.
8. **Confirmación con resultado** a cada `#supervisor` («hecho: …» o «no pude: …, necesito …») en menos de 5 minutos.
9. **Cierre de caja sin diferencias de origen conocido** (vuelto duplicado, tasa distinta): avisar al momento de anotar, no al cuadrar.

## 6. Cómo medirlo
- Mensajes del bot a Lennys por día (hoy ~40, meta ≤ 10).
- Decisiones pendientes con más de 24 h.
- Tiempo entre una orden suya (`#supervisor`) y su confirmación con resultado.
- Veces que se le pregunta algo ya contestado (meta 0).
- Diferencias de cierre de caja por semana.

## 7. Decisiones para Ernesto
1. ¿Se aprueba el «resumen del día» a las 17:00 como único mensaje fijo del bot a Lennys (con urgencias aparte)?
2. ¿Pasamos esta lista a la sesión «Tablero único por roles» para que la bandeja nazca con estas necesidades?
3. ¿Quién fija el tope de salidas del cajón y la tasa especial: Lennys (recomendado)?
