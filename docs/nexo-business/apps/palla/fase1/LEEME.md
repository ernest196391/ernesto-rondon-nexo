# Pa'llá · Fase 1 (investigación y diseño) · 4-nov-2026

**Qué es:** la Fase 1 de D138 (una sola app de transporte: Pa'llá = Taxi + Triciclo/Triciclub + Mensajero, precio mixto como inDrive). Sin código.
**Entregable:** página web interactiva `palla-fase1.html` (publicada como Artifact; enlace en `ESTADO.md`). Las decisiones que marca Ernesto en la página se guardan en su base de datos (colección `decisiones`, un documento por decisión: `{opcion, nota, at}`); se leen con `ArtifactData list decisiones`.

## Lo que se midió de verdad (Redmi 9A de Ernesto por USB, 4-nov)
- La Nave cliente instalada: 55,4 MB (base 12,3 + librerías 42,9); chofer: 90,7 MB. Pa'llá Android: 0,8 MB.
- Triciclub web (`/triciclub/`): 48 KB propios comprimidos + MapLibre 4.7.1 175 KB + pmtiles 8 KB. Cuadros del mapa: sin medir.
- El móvil iba por datos LTE de ETECSA (APN nauta) **con una VPN encendida** (tun0).
- **No se pudo medir el tiempo de arranque:** el móvil estaba bloqueado (`am start -W` se quedó esperando). Se cerró La Nave y se apagó la pantalla. Protocolo en la página (sección Velocidad).

## Propuestas clave (pendientes del SÍ de Ernesto)
- Precio justo sugerido + cliente ofrece entre −20 % y +50 % (de 10 en 10) + chofer acepta o pide +10/+20/+30 %; acordado = fijo.
- Interruptor «coger la 1.ª oferta a este precio» (apagado al empezar).
- Triciclo eléctrico sugerido: 60 + 50 CUP/km, redondeo a 10 (2 km = 160; hoy 620).
- Abrir Triciclo y Mensajero; Taxi solo tras consulta legal.
- Comisión 0 % en el piloto y 2 meses, luego 8 %, sin fondo; cobro semanal por Transfermóvil, pausa de viajes en efectivo si la deuda pasa un tope.
- Ofertas en vivo por el VPS (el hosting de la web no tiene conexión en vivo).
- Piloto cerrado 3–5 choferes + 20–40 clientes invitados; criterios para abrir en la página (sección Plan).

## Fuentes
En el pie de la página (con fecha). Estudios previos: `../../nave-investigacion-2026-10-23.md`, `../../triciclub/recon-lanave/RECON.md`, `../../triciclub/sms-y-tipos-de-triciclo-2026-11-04.md`.
