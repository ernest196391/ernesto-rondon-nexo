# Pilar 4 — Validar los datos al crear el vale (diseño, 28-oct-2026)

Parte del plan `plan-menos-errores-2026-10-28.md`. Caso real: el vale #5604 (clienta Melani, gestora Lena) salió con el teléfono «5 2477027» y parte de la dirección de la clienta Sissy (#5452). La gestora copió los datos del cliente anterior, el mensajero recogió y el pedido ya no se podía editar (error 409).

## Idea en una frase
**La web (Core) es la que decide.** Antes de guardar el vale, Core revisa teléfono y dirección y, si algo huele a copia, **no guarda hasta que la gestora conteste «sí, es el mismo cliente»**. La web de la gestora y el bot solo hacen la pregunta; no pueden saltársela.

## Lo que se avisa (siempre antes de guardar)
| # | Caso | Texto a la gestora | Quién lo ve |
|---|---|---|---|
| 1 | El teléfono ya salió en los últimos 90 días con **otro nombre** y era un cliente **suyo** | «Este teléfono ya salió con otro cliente (Sissy). ¿Es el mismo?» | Solo ella; solo el nombre de pila |
| 2 | Igual, pero el otro pedido era de **otra gestora** o de la tienda | «Este teléfono ya salió con otro cliente de otra gestora. ¿Es el mismo?» | Sin nombre y sin decir cuál (como D120) |
| 3 | El teléfono es de **otra gestora o del equipo** | «Ese teléfono es de alguien del equipo de Casa Viva. ¿Seguro que es de tu cliente?» | Sin nombre |
| 4 | El teléfono es **el suyo** | Ya existía («Es para mí», 3.14.53). Se queda igual | — |
| 5 | La dirección es igual (o casi: ≥ 60 % de las palabras) a la de **su cliente anterior con otro teléfono** | «Esta dirección se parece a la de tu cliente anterior (Sissy). ¿Es la misma?» | Solo ella |

Respuestas: **«Sí, es el mismo / la misma»** → se guarda (queda una nota en el pedido: «la gestora confirmó…»). **«No»** → corrige el dato.

## Lo que se rechaza (no se puede confirmar)
- Teléfono con menos de 8 cifras, con más de las que caben (8 cifras, con o sin +53), todo igual (11111111), escalera (12345678) o que empieza por 0 o 1.
- Con mensajería, sin teléfono. En recogida en tienda sigue siendo opcional (decisión del 26-oct, Dany).

**Dirección vacía:** se queda como está decidido el 24-oct (la calle no es obligatoria; el pedido dice «Dirección por confirmar: llamar al cliente» y el bot/la web la piden explícitamente). Ernesto decide si quiere hacerla obligatoria (ver «Decisiones»).

## Leer el mensaje pegado
Formato real de las gestoras (Lena, 28-oct):

```
Nombre Cliente: Melani
Número de teléfono: 52477027
Dirección: Avenida los mangos #26 entre ...
Municipio: ...
```
Un lector sencillo (sin IA, siempre igual) separa **nombre, teléfono, dirección, municipio, entre calles/referencia**. Reglas:
- Reconoce «Nombre Cliente / Cliente / Nombre», «Número de teléfono / Teléfono / Tel / Cel / Móvil», «Dirección / Calle», «Municipio», «Entre calles / Referencia».
- **Nunca inventa**: lo que no viene, lo marca «falta» y lo pregunta.
- Siempre pide confirmar: «¿Es Melani, 52477027, Avenida los mangos #26…? 1) Sí 2) Corregir».
- El mismo lector está en el bot (JS) y en la web de la gestora (JS, caja «Pegar datos del cliente»).

## Dónde se pone
| Pieza | Cambio | Riesgo |
|---|---|---|
| Core (`class-cvd-vale-check.php`, nueva) | Revisión + rutas `/bot/vale/revisar` y `/vale/revisar` | Nuevo, no toca lo existente |
| Core `crear` del bot y `create_order` del vale web | Piden la confirmación (el bot solo si manda `canConfirmCheck`, así no se rompe el bot viejo) | Bajo, interruptor `cvd_vale_check` = si/no |
| Core checkout (solo con sesión de gestora/equipo) | Mismo aviso con ventana «Sí, es el mismo / No, corregir» | Los clientes normales no ven nada |
| VivaBot `vale-chat-rules.js` | Paso nuevo `repetido`; lector del mensaje pegado; el teléfono mal escrito se rechaza antes | Con pruebas |
| VivaBot (Pilar 1) | «Datos confirmados / cambiados / anotados» **solo** si Core registró el cambio. El bot no edita teléfono ni dirección en Core hoy: la frase salía de la IA libre | Lo hace bot-maraton; yo paso la regla |

Reversible: `cvd_vale_check = no` apaga todo en Core al instante; el bot sin la bandera sigue como antes.

## Decisiones para Ernesto
1. ¿Dirección obligatoria en mensajería? Hoy es opcional (se llama al cliente). Recomiendo **dejarla opcional pero que el bot/la web la pidan siempre una vez** (ya lo hacen).
2. ¿Ventana de 90 días para «el teléfono ya salió»? Recomiendo 90.
