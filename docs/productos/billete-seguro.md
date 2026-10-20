# Billete Seguro: revisar billetes con la cámara del celular

**Idea de Ernesto, 20-oct-2026.** Etapa 1 hecha. Etapa 2: boceto para móvil hecho el 20-oct, a la espera del visto bueno de Ernesto: [Billete Seguro — boceto móvil](https://claude.ai/artifact/XQZou8qM5L6wKCGjeFDATC) (8 pantallas que se pueden tocar). **Etapa 3: primera versión en vivo el 20-oct en https://casaviva.company/billete/** (ver ESTADO L42 y D82).

| | |
|---|---|
| **Quién** | Mensajeros (cobran en la calle), dependientas Nana y Zaymi (caja) y gestoras (cobran a sus clientes). Después, cualquier comercio, cambista o vendedor cubano que reciba efectivo. |
| **Problema** | Los billetes nuevos y grandes (CUP 5 000, 10 000 y 20 000; USD 100) son los que más se falsifican, y casi nadie conoce sus medidas de seguridad. Un billete falso de 20 000 CUP o de 100 USD es una pérdida de casi toda la ganancia de una venta. |
| **Evidencia** | 20-oct, 13:35: una gestora avisa de un estafador (56280375) que paga con billetes falsos de 100 USD ([incidencias](../nexo-business/incidencias/2026-10-20.md)). El BCC dice que el 2 000 y el 5 000 CUP ya se falsificaron. La prensa cita series falsas LAA-01 y LAA-02 (5 000) y KAA-17 (2 000), y billetes de 1 000 impresos sobre billetes de 200 (se descubren por la marca de agua). El 10 000 y el 20 000 CUP circulan desde el 16-sep-2026. |
| **Qué es** | Página web (enlace por WhatsApp, sin instalar) con la marca de Casa Viva. 1) Eliges el billete. 2) La app te guía en 4 pruebas con la cámara y una foto de ejemplo: **a contraluz** (marca de agua), **inclinar** (hilo 3D y Flor Nacional que cambia de color), **tocar** (relieve) y **luz UV** (fibras y banda). 3) Resultado: «no vemos señales de falso», «dudoso: revísalo con otra persona» o «no lo aceptes». Nunca dice «es 100 % bueno». |
| **Dos modos** | **Sin internet:** solo la guía con fotos de ejemplo; la persona marca cada prueba y la app da el resultado. Gratis. **Con internet:** además, la IA mira las fotos y avisa si algo no cuadra. Cuesta centavos por revisión. La persona elige el modo. |
| **Extra** | Anota el número de serie y avisa si es una serie reportada como falsa o si ese mismo número ya lo revisó otra persona del equipo. |
| **Billetes v1** | CUP 20 000, 10 000, 5 000, 2 000 y 1 000; USD 100, 50 y 20; EUR 50 y 20. |
| **Gratis o premium** | Gratis para el equipo de Casa Viva y las gestoras (D42). Premium para otros comercios: pago mensual o por equipo. Se reutiliza en NEXO. |
| **Cómo se mide** | Revisiones por semana, billetes dudosos o rechazados y pesos o dólares que se dejaron de perder. |
| **Qué existe ya** | El BCC tiene un catálogo oficial de billetes con sus medidas de seguridad ([bc.gob.cu/app/billetes](https://www.bc.gob.cu/app/billetes)), pero **sin cámara ni guía**. Para dólares está Cash Assist, de la Reserva Federal (solo informa, en inglés). Hay apps que leen el valor del billete (Cash Reader, MCT Money Reader), pero ninguna guía las pruebas de los billetes cubanos nuevos. **Ese es el hueco.** |

## Notas para construirlo

- **Honestidad ante todo:** la cámara no ve la tinta magnética, así que el resultado es una ayuda y no un certificado. Si hay duda, el billete se lleva al banco.
- **Lámpara UV** (3-5 USD) para cada mensajero y dependienta: con ella se hace la prueba más segura.
- **Las apps de «luz ultravioleta» no sirven (comprobado el 20-oct):** la pantalla y la linterna del celular no dan luz UV, solo luz visible pintada de morado, así que las fibras y el hilo no brillan. El truco de la cinta azul y morada sobre la linterna tampoco llega a 365 nm: puede hacer que un billete bueno parezca malo. Por eso la app no lo ofrece; lo que sirve es una lámpara de 365 nm (llavero o linterna, en Revolico o por el casillero de Panavana).
- **Datos:** las medidas de seguridad, de las fichas oficiales del BCC (serie 2026: 150 × 70 mm, hilo con «BCC» y el valor, marca de agua con la patriota, Flor Nacional que cambia de color y relieve). Las series falsas se marcan como «reportadas por la prensa», no como oficiales.
- **Rendimiento:** fotos de ejemplo ligeras (webp), y que funcione en celulares viejos y con datos caros.
- **Antes de programar:** boceto para móvil (etapa 2), y Ernesto lo ve.
