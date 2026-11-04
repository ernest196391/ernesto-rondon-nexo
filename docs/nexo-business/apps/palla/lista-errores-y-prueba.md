# Pa'llá · lista de errores, simulación y prueba guiada (24-oct)

Modo práctica en vivo: **https://casaviva.company/palla/?practica=1** (Core 3.14.64.1). Carreras inventadas (#9001–#9004), nada toca pedidos reales. La barra azul de arriba simula lo que pasa fuera: **Con señal / Sin señal**, **Pasa algo…** (otro mensajero coge una, sale una nueva, la tienda me quita una, la tienda cancela una mía, la tienda recibe mi dinero) y **Reiniciar**.

## 1. Simulación (la hice yo): 27 de 27 bien
| # | Caso (error que puede pasar) | Qué hace la app | Resultado |
|---|---|---|---|
| 1 | Coger con señal | «La cojo» → es tuya y abre «Mi carrera» | ✔ |
| 2 | Doble toque en «La cojo» | Solo cuenta una vez | ✔ |
| 3 | Otro la coge un segundo antes | «#N ya la cogió otro» y desaparece | ✔ |
| 4 | «La cojo» sin señal | NO se guarda (otro puede cogerla): pantalla de ayuda con «Yo» en el grupo | ✔ |
| 5 | La coge y ya no puede (antes de recoger) (#54) | «No puedo» → vuelve a quedar libre | ✔ |
| 6 | Marcar Entregado sin haber recogido | Entregado bloqueado hasta tocar Recogí | ✔ |
| 7 | Recogí dos veces | La 2.ª: «ya constaba» | ✔ |
| 8 | Soltar con el paquete en la mano | No sale «No puedo»; hay que usar Problema | ✔ |
| 9 | Entregado efectivo USD | Lleva 44 USD; «Mi dinero» suma mensajería y lo que debe | ✔ |
| 10 | Pagó en otra moneda y no escribe cuánto | No deja confirmar hasta escribir la cifra | ✔ |
| 11 | Con vuelto de la tienda (#56) | «Lleva 10 USD + 12.250 CUP (… del vuelto)» | ✔ |
| 12 | Ya pagado (Zelle) | No cobra nada, no lleva nada | ✔ |
| 13 | Transferencia CUP sin tasa | **Fallaba** (solo «Otra cantidad», marcada efectivo). **Arreglado**: 1.ª opción = forma de pago del pedido con campo de CUP | ✔ tras arreglo |
| 14 | Sin señal: Recogí + Entregado | Se guardan, se puede seguir trabajando, al volver se mandan solas y en orden | ✔ |
| 15 | Se perdió la respuesta y se reenvía | No se repite nada (mismo código de envío) | ✔ |
| 16 | Problema mal rellenado / problema ≠ entregado (#4) | Pide motivo y frase; con problema abierto no deja Entregado | ✔ |
| 17 | La tienda le quita la carrera (#65, #4223) | Aviso «ya no está a tu nombre» | ✔ (nuevo) |
| 18 | Acción guardada sin señal de una carrera que cancelaron | Al volver: «eso ya no se puede», la cola no se atasca | ✔ |
| 19 | La dependienta marca «Dinero recibido» | «Mi dinero» se pone en cero | ✔ |
| 20 | Ayuda sin conexión | Las 4 palabras para WhatsApp con el número de la carrera | ✔ |

Simulador: `Casa-Viva/artifacts/palla-preview/practica.html?practica=1&sim=1`.

## 2. Lo que dicen los chats reales (14 días, 177 carreras)
Informe completo: notas de sesión `palla-analisis-chats.md`. Lo que más se hace a mano y lo que más falla:
| # | A mano o error | Veces | ¿Lo quita Pa'llá hoy? |
|---|---|---|---|
| 1 | Contarle a la gestora cómo va (quién, hora, salió, llegó) | ≈ 162 avisos | **No** → falta aviso automático a la gestora en cada paso |
| 2 | «Escribe entregado #N» / entregas cerradas sin «entregado» | 47 + 38 de 161 | **Sí** (botón Entregado) |
| 3 | Pedir o aclarar la hora («¿las 3 para cuál?») | 41 a mano + 117 de 177 carreras | **A medias** → falta poner la hora en la app |
| 4 | Explicar vuelto / cuánto llevar (#56, #4238) | 35 + 8 escalaciones | **Sí** |
| 5 | Pasar la carrera a otro (#54, #65) | 30 a mano + 21 piden «pásale a X» | **No** → falta «Pasar a otro mensajero» |
| 6 | «No vayas»: cancelada o de prueba (#74) | 21 | **A medias** → aviso «ya no está a tu nombre» (nuevo) |
| 7 | Vale con datos viejos (#51) | 19 | **Sí** (la app lee el pedido actual) |
| 8 | «¿Quién tiene el #N?» (tienda) | 10 + 11 «prepara» | **No** → falta vista de la tienda |

## 3. Qué falta automatizar antes de abrirla a todos (recomendación, en orden)
1. **Hora en la app** al coger la carrera (obligatoria, por carrera, «Cambiar hora»). Quita ≈ 200 mensajes en 14 días.
2. **Aviso automático a la gestora** en cada paso (la cogió X a tal hora, recogió, entregó, problema). Quita ≈ 162 avisos a mano.
3. **«Pasar a otro mensajero»** desde la app (el otro acepta en la suya; Core cambia de dueño). Quita 30 + 21 y los errores #54/#65.
4. **Vista de la tienda**: quién tiene cada pedido, a qué hora viene, qué gestora, dinero y vuelto.
5. **Un solo aviso inteligente** si a las 2 h de la hora sigue sin «Entregado» (en vez de los 67 recordatorios).

## 4. Prueba guiada con Ernesto (modo práctica, en su teléfono)
1. Abrir https://casaviva.company/palla/?practica=1 con Chrome.
2. Coger **#9001** → Recogí → Entregado (Efectivo USD) → mirar «Mi dinero».
3. Coger **#9002** → comprobar que la tarjeta dice «Llevas 10 USD + 12.250 CUP» (vuelto) → Recogí → Entregado.
4. Tocar **Sin señal** → intentar coger **#9003** (no deja, sale la ayuda con «Yo») → **Con señal** → cogerla → **Sin señal** → Recogí → Entregado → **Con señal** → ver los dos avisos.
5. Coger **#9004** → **No puedo** (vuelve libre) → cogerla otra vez → Recogí → Entregado por transferencia (escribir los CUP).
6. **Pasa algo… → La tienda recibe mi dinero** → «Mi dinero» en cero.
7. Apuntar lo que no se entienda o moleste.
