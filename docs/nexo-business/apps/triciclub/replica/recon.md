# Triciclub · mapa de reconocimiento (3-nov-2026)

**Qué es:** app de triciclos para La Habana (viajes, paquetes y carga), inspirada en lo que **hace** La Nave
(cliente + chofer). No copia su código, nombre, logo ni textos.

**Fuentes (solo información pública):**
- Estudio de La Nave: `docs/nexo-business/apps/nave-investigacion-2026-10-23.md` (flujos de cliente y chofer, precios,
  registro, quejas, ley: LOT de triciclos eléctricos por la Instrucción 1/2026 del MITRANS, válida hasta el 31-dic-2026).
- Ficha del producto: `docs/productos/app-mensajeria-cuba.md`.
- Diseño aprobado del cliente (Ernesto, 3-nov): https://claude.ai/artifact/26MHKm6pBFA6hThU85MSb6
- App del chofer ya hecha: Pa'llá (Core de Casa Viva, `includes/class-cvd-palla*.php`, `assets/palla/`).

## Pantallas

| id | quién | pantalla | de dónde sale |
| --- | --- | --- | --- |
| S00 | cliente | Abriendo la app (logo animado) | diseño aprobado |
| S01 | cliente | ¿Qué necesitas? (Viaje / Paquete / Carga, recoger y llevar, lugares guardados) | diseño aprobado |
| S02 | cliente | Precio fijo y pedir (servicio, forma de pago, nota, «Ofrecer otro precio») | diseño aprobado |
| S03 | cliente | Tu triciclo viene (chofer, LOT al día, número, código de seguridad, llamar, compartir) | diseño aprobado |
| S04 | cliente | Sin conexión (pedido guardado, SMS, llamar) | diseño aprobado |
| S05 | cliente | Llegó: pagar y valorar | diseño aprobado |
| S06 | cliente | Entrar con el teléfono (código por WhatsApp, nombre, permiso) | nuevo, falta dibujarlo |
| S07 | cliente | Mis viajes | nuevo, falta dibujarlo |
| C01 | chofer | Viajes disponibles (dentro de Pa'llá, junto a las carreras) | Pa'llá «Carreras disponibles» |
| C02 | chofer | Mi viaje (mapa, llamar, «Llegué», código, «Recogí», «Terminé») | Pa'llá «Mi carrera» |
| C03 | chofer | Cobrar y valorar al cliente | Pa'llá «Confirmar entregado» |
| C04 | chofer | Hacerme chofer de Triciclub (triciclo, LOT, licencia A, fotos) | nuevo |
| C05 | chofer | Estoy disponible / no disponible | Pa'llá (disponible) |
| A01 | Ernesto | Aprobar choferes (ver LOT y fotos) | nuevo |
| A02 | Ernesto | Tarifas | nuevo |
| A03 | Ernesto | Viajes del día | nuevo |

## Flujos

1. **Pedir:** S01 → elegir servicio y destino → S02 precio fijo (cotización firmada) → «Pedir» → buscando chofer.
2. **Asignar:** el viaje sale a los choferes disponibles cerca → el primero que toca «Lo cojo» se lo queda (C01) → S03.
3. **Recoger:** el chofer toca «Llegué» → el cliente le dice el código → «Recogí» (C02).
4. **Terminar:** «Terminé» → cobra el precio fijo (efectivo o transferencia) → los dos se valoran (C03, S05).
5. **Sin señal:** el cliente pide igual; el pedido queda en el móvil y sale solo al volver la señal (S04).
6. **Cancelar:** el cliente cancela antes de que lo recojan; el chofer puede soltar el viaje con motivo.
7. **Alta de chofer:** C04 → Ernesto revisa en A01 → aprobado → ya ve viajes.

## Modelo de datos (deducido)

cliente · chofer (un usuario de WordPress de Pa'llá con su triciclo y su LOT) · viaje (servicio, origen, destino, precio
fijo, estado, código) · ubicación del chofer durante el viaje · valoración (de cada lado) · evento (historia del viaje) ·
tarifas (una opción, no una tabla).
