# Pilar 6 · Propuesta para el CLAUDE.md del supervisor (semáforo de decisiones)

**Estado:** propuesta del 28-oct-2026. NO está aplicada. La dueña de `/root/supervisor/CLAUDE.md` y del cron es la sesión **bot-maraton**: copiar el bloque de abajo tal cual, después de la sección «Parte de las 9:00 (23-oct)». Necesita el SÍ de Ernesto en la pregunta **R1** de `decisiones-ernesto-2026-10-28.html` (cambiar reglas = rojo).

Encaja con D100/D105 (parte de las 9:00 y Bandeja de decisiones): el semáforo decide **qué llega** a esas bandejas. Lo verde y lo ámbar ya no llegan a Ernesto.

---

## Bloque para pegar en CLAUDE.md

### Semáforo de decisiones (28-oct, Pilar 6)

Antes de preguntarle algo a Ernesto, clasifica. Si es verde o ámbar, **no se pregunta: se hace y se cuenta después**.

**VERDE · pequeño y reversible → lo haces tú y lo cuentas en el resumen.**
Corregir un dato que está mal en una ficha o contacto, reintentar un envío fallido, avisar a una persona del equipo (privado, una vez), cerrar una pregunta abierta que no es de producto, preguntar a la tienda con `cv preguntar`, programar una regla ya acordada con su prueba, cerrar un error cuyo arreglo ya está en producción y comprobado.
- Ejemplos de la semana: ficha de Melany (#92) y de Ale (#126) a línea Casa Viva; avisar a Day de que la lámpara trae gancho (#116); colores de las fundas Majestic Imperial a Rafael (#108); cerrar las 25 preguntas abiertas que no eran de producto (#123).

**ÁMBAR · lo decide Lennys (admin) → ya cuenta como aprobado; haces lo que ella diga y le informas a ella y a Ernesto después.**
Datos de la tienda y de la operación que solo ella sabe: horarios, quién llevó una carrera, a nombre de quién va una venta de caja, comisiones pequeñas, textos para el equipo. Se lo preguntas **en un solo mensaje** (no uno por tema), de 10:00 a 17:00.
- Ejemplos: ¿a cuánto se toma el euro en la tienda? (#94); la venta de Nayeli cobrada en caja sin su nombre (#97); ¿«El Pocho» es Leonardo o Félix? (#98); ¿Max entregó el #5430? (#88).

**ROJO · decide Ernesto → nunca solo.**
Dinero real o grande, precios grandes, tarifas y tasas, pagos y devoluciones, borrar o cancelar pedidos, mensajes a grupos (General, Mensajerías) o a mucha gente, escribir a un cliente por algo de más de 100 USD, cambiar reglas del bot o del supervisor, cualquier cosa que no se puede deshacer.
- Ejemplos: cancelar/devolver #5546, #5604 y #5645 (#122); escribir a Niurka por un kit de 3.865–4.250 USD (#110); hora límite de reparto (#109); cuánto se guarda una recogida (#118).
- Van a la Bandeja (`/control/decisiones/`) con «Recomiendo X». Máximo 6 por día. Una línea cada una.

**Prioridad de Ernesto (29-oct): primero Lennys.** Antes de todo lo demás, mira su chat (…5368, últimas 48 h) y haz lo que pidió o dejó pendiente. Un `#supervisor` de Lennys se atiende el mismo día: acuse corto, fila real (escalación) y respuesta cuando se hace. Nunca «mañana dentro de horario» a algo pedido dentro de horario.

**Reglas de cierre del semáforo**
1. Duda entre dos colores → el más alto.
2. Si lo dice Lennys sobre Casa Viva, es ámbar aprobado, **salvo** que toque dinero grande, borrar o un mensaje a grupo (eso sigue rojo).
3. Verde o ámbar sin hacer a los 5 días → se hace o se explica por qué no (sin esperar a Ernesto).
4. Un error de crm_errores solo pasa a `corregido` cuando existe **la regla con su prueba** en `npm run check` (o el dato corregido, si era un dato) y se comprobó. Si falta, queda abierto con el motivo.
5. Cada error de tipo `regla` o con «repite #N» necesita su regla con prueba. Si no se puede probar con una función pura, se anota por qué.
6. Respeta siempre: sin mensajes masivos ni repetidos; nada de 22:00 a 7:30 (Cuba); no decir «ya funciona» sin probarlo.

### Revisión semanal (domingo 20:30, dentro de `revision-errores.sh`)
1. `cv errores abiertos`: clasifica cada error en verde / ámbar / rojo y deja la letra en el cierre (`--leccion "semáforo: verde"`).
2. Haz lo verde; junta lo ámbar en un solo mensaje a Lennys; manda a la Bandeja solo lo rojo.
3. Saca la métrica de 5 líneas con `cd /root/vivabot && node scripts/errores-semana.mjs` y pégala al resumen semanal a Ernesto, después de «Qué pasó».

---

## Cambios que necesita bot-maraton (todos pequeños)
- Pegar el bloque de arriba en `/root/supervisor/CLAUDE.md`.
- `revision-errores.sh`: añadir el paso 3 (la métrica) al texto que manda a Ernesto el domingo.
- `cv.mjs`: ampliar `AUDIENCES` para que `cv aprender` acepte audiencia `admin`/`equipo` (error #120: la base las rechaza por `crm_knowledge_audience_check`; hay que cambiar la restricción o la lista, lo que sea más pequeño).
- Merge de la rama `pilar6-reglas-pruebas` del bot (pruebas de reglas + `errores-semana`). Detalle en `pilar6-semaforo-errores-2026-10-28.md`.
