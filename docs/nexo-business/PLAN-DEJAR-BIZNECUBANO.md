# Plan para dejar BizneCubano (Casa Viva)

**Creado:** 2026-10-07 · **Decide:** Ernesto (aprobación necesaria antes de cada fase)
**Base:** D29 (un pedido, un hilo, 4 momentos), D30 (devoluciones), D31 (sugerencias con aprobación).

## Dónde estamos
- El flujo completo funciona en Casa Viva Core + VivaBot, probado el 2026-10-07 con personas reales (#2675).
- Lo que falta para cambiar no es técnico: **las gestoras reales siguen en BizneCubano** (en Core solo hay 3 cuentas de prueba).

## Fases

| Fase | Qué pasa | Quién | Termina cuando |
|---|---|---|---|
| **0. Pruebas de rol** (ahora) | Lennys hace el camino como gestora y luego como mensajera; se corrige lo que salga | Lennys, Zaymi, Claude | Lennys dice "OK" a las dos pruebas |
| **1. Invitación** | Mensaje único al grupo "General" con el registro (`/registro-gestora/`). El bot avisa de cada solicitud; Lennys o Ernesto aprueban; el bot da la bienvenida y el enlace | Gestoras, Lennys | Las gestoras activas (las que vendieron en los últimos 30 días) están aprobadas |
| **2. Paralelo (1 semana)** | Se puede vender por los dos sitios. Los pedidos nuevos se animan por la web (enlace de cada gestora). El reparto de los pedidos de la web va por el grupo **PRUEBA** con 1–2 mensajeros de confianza | Todos | 7 días sin fallos graves y la caja cuadra cada día |
| **3. Cambio** | Los pedidos se hacen solo en la web. El bot publica las carreras en el grupo real **"Mensajerías CASA Viva"** (variable `DISPATCH_GROUP`). Los mensajeros reales se registran en `/registro-mensajero/` | Ernesto decide la fecha | BizneCubano sin pedidos nuevos |
| **4. Cierre** | Se liquidan las comisiones pendientes de BizneCubano y se archiva | Lennys | Saldo de BizneCubano en cero |

## Antes de la fase 3 (lista de comprobación)
- [ ] Gestoras activas dadas de alta y con su enlace
- [ ] Mensajeros reales registrados, aprobados y con su WhatsApp en la cuenta
- [ ] Número de operaciones propio para el bot (hoy es el número personal de Ernesto)
- [ ] Claves cambiadas (las que se vieron en capturas)
- [ ] Contraseña del Mensajero piloto cambiada
- [ ] Notas de voz funcionando (opcional para el cambio)

## Riesgos y cómo se cubren
| Riesgo | Plan |
|---|---|
| Una gestora no se registra y sigue mandando vales de BizneCubano | Durante el paralelo se atienden igual; el bot le recuerda el registro con su enlace |
| Nadie dice "Yo" a una carrera | Aviso a los 15 min en el grupo y a Ernesto (ya programado) |
| La web o el bot se caen | La tienda sigue con el panel `/ventas/` y el grupo a mano; nada se pierde porque Core guarda el pedido |
| La caja no cuadra | `/ventas/` avisa si lo recibido no coincide con lo declarado por el mensajero |
