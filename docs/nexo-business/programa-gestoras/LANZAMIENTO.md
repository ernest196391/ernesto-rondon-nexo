# Programa de gestoras (multinivel) · qué falta para lanzarlo a todas (16-oct-2026, noche)

**Hoy:** Core 3.14.32 en vivo, modo **sombra** (`cvd_programa_gestoras=sombra`), solo lo ve **Dany** (`cvd_programa_ver=18`). Calcula cada noche y no paga.
Dany ya tiene **4 invitadas reales**: Damarys (110), Lena (112), Zulien (113) y Daniela Piñero (114), y una de prueba, DANIELA PRUEBA (109), que ella pide borrar.
Plan técnico y cómo volver atrás: `PLAN-DESPLIEGUE.md`. Números y auditoría: `AUDITORIA-2026-10-16.md`. Decisiones: D75, D77, D78 y D79.

## A · Decisiones (Ernesto y Lennys)
| # | Qué | Quién | Estado |
|---|---|---|---|
| A1 | Aprobar el programa y cómo se paga: **opción 2** (subir +1, +2 o +3 USD según el precio, 203 productos) | Lennys | Se le manda la presentación el 17-oct a las 9:15 |
| A2 | Fecha para abrirlo a todas | Ernesto | ✅ D88 (22-oct): prueba para todas 22–31 oct, de verdad desde el 1-nov |
| A3 | Las invitadas de Dany ven «Mi piedra» (`cvd_programa_ver=18,110,112,113,114`) | Ernesto | ✅ SÍ (16-oct 22:40), puesto |
| A4 | Cuenta DANIELA PRUEBA (109) | Ernesto | ✅ Suspendida y fuera del equipo de Dany (copia `~/bak-20261016-user109-meta.json`) |
| A5 | Mensaje de lanzamiento en el General | Ernesto (SÍ) | Al final |

## B · Técnico
| # | Qué | Estado |
|---|---|---|
| B1 | Lista de puntos por vale en «Mi piedra» (pedido de Dany) | ✅ Core 3.14.33 (L26); aviso a Dany 17-oct 8:35 |
| B2 | Bienvenida con el enlace de la comunidad | En marcha; **falta el enlace** (solo lo tiene Ernesto) |
| B3 | Que el bot conteste bien sobre el programa (piedras, red 1 % + 0,5 %, bonos, «el bono depende de lo que gane el equipo»). El 16-oct dijo «2 %» | Falta: respuestas aprobadas en la base del bot |
| B4 | Alerta «ganancia_alta» de la sombrilla (15 USD, costo 3,55) | Lennys la revisa antes del 1-nov; si no, el cierre de octubre espera |
| B5 | Costos provisionales (~30 productos) | Lennys los confirma: cambian los puntos |
| B6 | Probar «Pedir mi pago» con red y bono, con un cierre de prueba antes del primero de verdad | Falta |
| B7 | Aplicar los precios de la opción 2 si Lennys dice sí (con copia y lista de antes y después) | Espera A1 |
| B8 | Al pasar a «sí»: comprobar que cada gestora ve solo lo suyo y que las alertas están revisadas | Al lanzar |

## C · Materiales
| # | Qué | Estado |
|---|---|---|
| C1 | Video tutorial (HyperFrames): qué son las piedras, cómo invitar, de dónde salen los puntos. Primero lo aprueba Lennys | En marcha (16-oct noche) |
| C2 | Guía paso a paso «Cómo invitar a una gestora», con 3-5 capturas | Falta |
| C3 | Imagen con la tabla de piedras y bonos para compartir; foto para captar gestoras (la pidió Dany) | Presentación para gestoras HECHA (18-oct): Artifact 1a78WT3R4eDJcH23Yt756J, copia `presentacion-gestoras.html`; falta la foto |
| C4 | Texto del General con la comisión clara | Falta (con el SÍ de Ernesto) |

## D · Calendario propuesto
1. **17-oct:** Lennys recibe la propuesta. Se termina B1-B3.
2. **17 al 30-oct:** prueba con Dany y sus 4 invitadas (si A3 = sí). Cada día se miran las alertas.
3. **30-oct:** revisión con números reales, y Ernesto y Lennys deciden. Antes del 1-nov: B4, B5 y B6.
4. **1-nov:** `cvd_programa_gestoras=si` + video + mensaje en el General. Octubre se cierra en sombra, sin pago.

## E · Propuesta a Lennys (Ernesto, 16-oct 22:40)
Ernesto: «dejarlo listo» y mandarle a Lennys la propuesta con la subida de precios (opción 2), por qué hacer el programa y qué gana, el caso real de Dany y cómo iremos aprendiendo de los errores y corrigiendo sobre la marcha.
- La página tiene ya esas 3 secciones nuevas: https://casaviva.company/programa-3b7716d52919b0e7e1.html (noindex; copia en el artifact WQBGVtsZz7qc7FucmRX4pj).
- El 17-oct a las 9:15 sale por crontab del VPS: `/root/supervisor/tareas/lennys-programa-0915.txt`.
