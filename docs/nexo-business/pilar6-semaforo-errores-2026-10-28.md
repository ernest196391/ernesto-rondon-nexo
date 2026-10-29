# Pilar 6 · Menos cola de decisiones para Ernesto (28-oct-2026)

Plan base: `plan-menos-errores-2026-10-28.md` (aprobado por Ernesto el 28-oct). Esta sesión hizo el pilar 6.

## Qué quedó hecho
1. **Página de decisiones** (6 preguntas, 2 minutos, casillas Sí / No / Luego): `decisiones-ernesto-2026-10-28.html` (copia publicada como página privada).
2. **Semáforo** escrito como regla, listo para el CLAUDE.md del supervisor: `pilar6-propuesta-supervisor-claude-md.md` (entregado a bot-maraton, sin aplicar).
3. **Triage de los errores «para decidir»**: eran 29 al empezar el encargo y hoy son **38** (#32 a #126; se sumaron #118–#126). Tabla abajo.
4. **Reglas con prueba** en el bot (rama `pilar6-reglas-pruebas`): `test/reglas-pilar6.test.js` y `test/errores-semana.test.js`, ya dentro de `npm run check`.
5. **Métrica semanal en 5 líneas**: `scripts/errores-semana.mjs` (+ `src/errores-semana-rules.js`).

## Lo que NO se pudo hacer (y por qué)
- **SSH al VPS y a Hostinger**: «Connection reset by peer», 3 intentos en cada uno, y paré. Los errores se leyeron directo de Supabase (solo lectura). Por eso **no se cerró ningún error con `cv errores cerrar`** y no se comprobó el estado en la web (`cv pedido`).
- **No se cerró ninguno** porque casi todos tienen la parte de código sin programar (la prueba nueva sale con `todo`). Solo el **#57** se puede cerrar ya: Ernesto lo decidió (D111, 24-oct) y está programado (`src/tarifa-kevin-rules.js`, commit 0668573). Comando listo abajo.
- **Por qué hay 38 y no 29**: en `crm_errores` el estado `decidir` se usa para «hay una propuesta de código pendiente», no solo para «Ernesto debe decidir». Casi todos son propuestas ya acordadas que esperan que alguien las programe. La decisión real de Ernesto es muy pequeña (6 cosas).

## Triage de los 38
| Semáforo | Cuántos | Errores |
|---|---|---|
| **Rojo** (Ernesto) | 6 | #109 hora límite · #110 Niurka · #118 guardar recogidas · #119 Todo Market · #122 y #126 devoluciones (#5546, #5604, #5645) |
| **Ámbar** (Lennys) | 6 | #87 Dany 36,20 vs 40 · #88 #5430 Max · #94 euro · #96 #5427 · #97 Nayeli · #98 «El Pocho» |
| **Verde** (supervisor / código) | 26 | #32 #57 #68 #86 #89 #90 #91 #92 #93 #95 #99 #100 #101 #107 #108 #111 #113 #114 #115 #116 #117 #120 #121 #123 #124 #125 |

Los rojos y ámbar tienen además una parte de código verde (por ejemplo #118: no prometer sin avisar a la tienda).

**Ya decidido, no se pregunta:** #57 (Kevin pedido por pedido, D111) · #113 causa 2 (D120: la venta es de quien arma el vale) · #93 horario (tienda abre todos los días, recogida 10–16 h, commit 1f8f358).
**Caso pasado (el caso ya no aplica, falta la regla):** #89 (#5442 se entregó el 25-oct), #90 (hora ya pasada), #68 (premios publicados el 23-oct).
**Dato nuevo que cambia una pregunta (crm_dispatch):** #5427 y #5428 están cerradas como entregadas por tarjeta de carrera (Leonardo). Pero el #5428 figura con Félix como mensajero en la fila y con Leonardo en el registro: por eso #98 sigue abierto como ámbar. #5442 entregado el 25-oct.

## Reglas con prueba (punto 3)
Archivo: `test/reglas-pilar6.test.js` (13 pruebas: **5 pasan hoy, 8 son `todo`**, ninguna falla). Cuando el código exista se quita el `todo` y la regla queda protegida.

| Regla acordada | Errores | Estado de la prueba |
|---|---|---|
| El bot no dice que hizo algo que no puede («lo marco como devuelto», «actualizo que fueron entregados») | #3, 24-oct | **pasa hoy** |
| Idem, con «ya lo registro como cancelados» | #122 | `todo` |
| «Anotado», «lo marco», «anoto esto…», «queda reportado» sin registro real | #121, #125 | `todo` |
| «Anotado lo de la comisión», «tu pago quedó anotado» sin registro | #68, #97 | `todo` |
| «Quedan anotados en el pedido» sin cambiar la web | #114 | `todo` |
| A un contestador automático no se le contesta | #77 | **pasa hoy** |
| Idem, con la respuesta de Revolico de Todo Market | #119 | `todo` |
| Un «no» de producto necesita un dato (General) | #32 | **pasa hoy** |
| Idem, en el privado a clientes («no son de algodón») | #91 | `todo` |
| No devolver la pregunta como respuesta (anti-eco) | #92 | `todo` (falta `src/eco-rules.js`) |
| `#supervisor` no lo contesta la IA | #121 | `todo` (falta `src/supervisor-tag-rules.js`) |

**Lo que todavía no tiene prueba ni código** (las propuestas están escritas en cada error; `cv errores abiertos`): ficha «sujeto a confirmación» (#86), enlaces inventados contra el catálogo (#111), gestora real del pedido leída de Core (#113, #87), «entregado #N» por mensajero asignado (#88), «pásale el vale #N a …» (#89), unir mensajes seguidos de la hora (#90), no pasar carreras ya entregadas (#96), apodo ≠ mensajero (#98), gancho «para los apagones» (#95), hilo de producto (#100), comentario ≠ pregunta (#101), «sí» que cita una pregunta abierta (#116), vale/carrera pegado = número de pedido (#115), pregunta a la tienda solo con producto (#123), internet ≠ dato de la tienda (#124), «#N devolución» antes de la pausa (#126), número suelto de Lennys para Ernesto (#120). Siguiente paso: bot-maraton las programa en este orden (las que más se repiten primero): 1) no afirmar sin dato (#32 #86 #91 #99 #107 #111 #117 #124), 2) acciones falsas (#121 #122 #125 #68 #97 #114), 3) entender órdenes (#89 #115 #116 #126), 4) leer de Core (#113 #96 #88).

## Métrica semanal (punto 4)
Cómo se saca (en el VPS): `cd /root/vivabot && node scripts/errores-semana.mjs` (solo lee `crm_errores`; `--dias 7`, `--json`). La misma cuenta en SQL se ejecutó hoy contra Supabase:

```
📊 Errores del bot · últimos 7 días
1) Errores nuevos por día: 22: 69 · 23: 12 · 24: 10 · 25: 9 · 26: 9 · 27: 7 · 28: 9 (media 17,9)
2) Abiertos «para decidir»: 38 (3 con más de 5 días)
3) Repetidos esta semana: 10 (el error dice «repite #N» o «mismo arreglo que #N»)
4) «Anotado» sin registro: 11 (meta 0)
5) Tiempo medio de cierre: 32 h (85 cerrados)
```
- El 22-oct (69) es la carga inicial cuando se empezó a registrar (D89); sin ese día la media es **9 al día** y la tendencia es de 12 a 7–9.
- «Anotado sin registro» se mide por el texto del error mientras no exista la tabla de pendientes del Pilar 1; cuando exista se mide directo (promesas del bot sin fila = 0).
- Para el resumen del domingo: pegar las 5 líneas tal cual.

## Para aplicar en el VPS cuando el SSH vuelva (verde, reversible)
```bash
cv errores cerrar 57 "Tarifa de Kevin pedido por pedido (D111, 24-oct); programado en src/tarifa-kevin-rules.js (commit 0668573)" --leccion "App disponible no equivale a precio de transporte actualizado" --estado corregido
```
Comprobar antes que `test/d111-tecnicos.test.js` pasa (lo hace `npm run check`).

## Entrega
- **bot-maraton:** merge de la rama `pilar6-reglas-pruebas` (solo añade 2 pruebas, 1 regla y 1 script; el cambio en `package.json` es una línea al final de `check`), pegar el bloque del semáforo en el CLAUDE.md del supervisor y ampliar `AUDIENCES` en `cv.mjs` (#120).
- **Ernesto:** contestar la página de decisiones (6 preguntas).
- **Lennys:** el supervisor le junta las 6 preguntas ámbar en un solo mensaje, entre 10:00 y 17:00.
