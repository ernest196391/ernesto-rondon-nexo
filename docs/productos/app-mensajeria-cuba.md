# App de mensajería y transporte para Cuba · ficha (etapa 1 · 23-oct-2026)

**Nombre provisional:** «NEXO Mandados» (a decidir y registrar en la OCPI, Decreto-Ley 103/2025).

## 1. Quién lo usa y quién paga
| Quién | Qué gana | ¿Paga? |
|---|---|---|
| **Mensajeros** (moto, bici, triciclo, a pie) | carreras sin buscarlas, cobro claro, ruta | gratis al inicio; luego comisión baja o cuota fija |
| **Comercios** (tiendas, cafeterías, restaurantes, mipymes) | mandar pedidos sin grupos de WhatsApp ni llamar uno por uno | gratis al inicio; luego dentro de NEXO (10–20 USD/mes) |
| **Clientes** | pedir un mandado o un viaje, ver precio y seguirlo | gratis siempre |
| **Taxis / triciclos / motos de pasaje** (fase 3) | viajes y subasta de precio | gratis al inicio; luego comisión menor que La Nave (10–20 %) |
**Negocio real (decisión de Ernesto):** gratis para crecer rápido; el valor es la **red de contactos** (comercios, mensajeros, clientes) para venderles NEXO, Casa Viva y servicios. ⚠ Solo con **permiso** (casilla de consentimiento al registrarse) y sin mensajes en masa por WhatsApp (restricción del 23-oct).

## 2. Evidencia (Casa Viva, 7 días)
- 21 mensajeros, 114 carreras, la carrera se coge en **18 s** (el grupo funciona), pero el «entregado» y el dinero fallan (errores #4, #54, #56, #58, #65, #74, #4223).
- ≈ 40 mensajes/día de mensajeros al bot; dependencia total de WhatsApp (la restricción del 23-oct paró el reparto).
- En Cuba: La Nave (taxi, 10–20 % de comisión, fondo de 10.000 CUP, sin mensajería, sin modo sin internet), Mandao (mensajería), D'Taxi y «55» (estatales), Bajanda y Sube cerradas. **Nadie junta mandados + moto/triciclo + funcionar con mala conexión.** (`docs/nexo-business/apps/nave-investigacion-2026-10-23.md`)
- Subasta de precio: es el modelo de inDrive (el cliente propone, el chofer acepta o contraoferta); encaja con el regateo cubano.

## 3. Qué existe ya (no se empieza de cero)
Tarjeta de carrera (Core 3.14.54: 4 botones, dinero con vuelto), reparto por grupo + «Yo», vale, seguimiento en vivo (`live-tracking`), dinero por entregar (`messenger-cash`), tarifas por municipio, reputación del mensajero, web push, bot. Todo atado a Casa Viva: hay que sacarlo a NEXO (multi-comercio) — D16.

## 4. Cómo se mide
Carreras/día · tiempo hasta que alguien la coge · % de entregas sin error · mensajes al bot por carrera (meta: ↓80 %) · comercios activos · mensajeros activos · contactos con permiso.

## 5. Gratis o premium
Fases 1–2 gratis. Premium después: comercios con NEXO, mensajeros «destacados», comisión baja en viajes de pasaje.

## Diseño (etapa 2 · 23-oct)
Pantallas del mensajero, estilo NEXO, nombre **Pa'llá**: https://claude.ai/artifact/HGgfiy4NwTDgPr1Dbg5XoU (1 Carreras disponibles · 2 Mi carrera · 3 Confirmar entregado · 4 Mi dinero de hoy · 5 Sin conexión). Datos de ejemplo. Falta el visto bueno de Ernesto antes de la etapa 3.
