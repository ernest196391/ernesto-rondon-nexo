# Herramientas para gestoras — qué quieren, qué damos gratis y qué vende NEXO

**Fecha:** 2026-10-12 · **Autor:** Claude (solo lectura: no se cambió código, datos ni se mandó nada) · **Para:** Ernesto
**Fuentes:** aprendizajes del día 1 (`aprendizajes/2026-10-11-dia1.md`); 412 mensajes por privado de 27 gestoras (5–12 oct, `crm_messages`); 173 mensajes de 35 personas en el grupo General (6–12 oct); 170 consultas de soporte (`crm_support_requests`) y 29 sugerencias (`crm_feedback`); el área de gestoras de Core (`class-cvd-gestora-app.php`, `-store`, `-portal`, `-payouts`, `-promotional-resources`); VivaBot (`src/`); fuente de verdad, `NEGOCIO.md`, `PRODUCT_DECISIONS_V1.md`, skills `nexo-fabrica`, `modelo-de-dinero` y `conseguir-clientes`.
No se leyó ningún contacto con `bot_mode=ignorar`. No hay teléfonos en este documento.

## Resumen en 6 líneas
1. Las gestoras piden, por este orden: **saber qué pasa con su pedido**, **cómo se vende ahora** (enlace, vale, mensajero), **qué decirle al cliente** (precio en CUP, medidas, material, si hay) y **material para publicar**. Del dinero preguntan menos, pero es lo que las hace volver.
2. Casi todo lo que piden **ya existe a medias** en su área. Falta juntarlo en un botón: "Compartir ficha" (foto + precio suyo en USD y CUP + medidas + quedan N).
3. **Gratis para siempre** lo que les hace vender y les quita preguntas. **Se cobra al negocio**, no a la gestora: 10–20 USD/mes según cuánto hace NEXO por él.
4. La gran palanca de NEXO no es cobrar a las gestoras: es **"tu negocio llega con una red de vendedoras incluida"**. Cada comercio nuevo da más catálogo a las gestoras, y más gestoras hacen más valioso a NEXO.
5. Las gestoras pueden **traer comercios a NEXO** como afiliadas, pero empezando con 2–3 y cobrando solo cuando el comercio paga.
6. Un riesgo grande: hoy casi todo vive en el plugin de WordPress de Casa Viva. Para venderlo a 1.000 comercios, la lógica tiene que pasar a NEXO (nube + Tienda NEXO + VivaBot multi-negocio).

---

## 1. Qué quieren de verdad las gestoras (por evidencia)

Conteos aproximados por palabras clave (un mensaje puede contar en dos temas). "Priv." = chats privados con el bot (412). "Grupo" = General (173).

| # | Grupo | Lo que piden | Evidencia | Hoy |
|---|---|---|---|---|
| 1 | **Saber qué pasa** | Estado del pedido, hora de entrega, quién lo lleva | Priv.: 67 de mensajería y entrega, 45 de pedidos. Dayami: *"Necesito saber sobre qué hora podrá ser entregado… para que el cliente esté pendiente"*. Thaly y Elizabeth: ¿los vales siguen llegando al grupo? | Bot con estado real sin IA (`5f7c93d`) y avisos de cada paso. Falta probarlo en real. |
| 2 | **Vender más (cómo se usa)** | Enlace, vale, registro, acceso | Priv.: 52 de enlace o acceso. Dayisel: *"le paso el enlace y ya? O debo añadirlo en la sección clientes"*. Cely: *"no entiendo muy bien, creo que hice algo"*. | Guía `tutoriales/gestoras.md`, tutoriales 2 y 3 enviados. |
| 3 | **Atender al cliente** | Medidas, material, color real, si hay, cuándo llega más | Grupo: 22 de medidas y material (la mayoría **sin respuesta**: lámpara, cortinas antimoho, soporte de TV). Priv.: 37 de "hay / queda". Dayami: *"cuándo volverán a surtir"*. Katia: *"la descripción de los productos ya no es visible? Hay que preguntar?"* | "Quedan N" para gestoras (3.13.47). Medidas: no hay ficha. |
| 4 | **Atender al cliente (precio y pago)** | Precio en CUP, pagar en MN, Tropical, Zelle, PayPal | Priv.: 26. Grupo: 12. Caridad: *"cómo selecciono que el pago será en CUP?"*. Sugerencias: transferencias en MN y Tropical (Keyla). | Calculadora con la tasa del día (3.13.51). El bot ya da los datos de pago a gestoras (`e12bc07`). |
| 5 | **Vender más (material)** | Fotos, productos nuevos, textos, tutorial para sus clientes | Priv.: 47 con foto o material, 17 de "nuevo". *"Más clientes! Me puedes ayudar??"*, *"Productos nuevos"*. Katia pide un tutorial para que sus clientes compren con su enlace. 6 sugerencias de "fichas con medidas" y "foto de la fachada". | Biblioteca "Fotos y textos listos" existe pero hay que llenarla. Video `tutorial-como-comprar.mp4` existe pero no está en el área. "Fotos de producto" sale como *Pronto*. |
| 6 | **Cobrar** | Cuánto gané, cuándo me pagan | Priv.: 22. FAQ 26 ("cómo se paga la comisión") sigue sin respuesta oficial. Lennys: la comisión del 10 % general hay que revisarla por producto. | Inicio con Ganado y Por cobrar, "Pedir mi pago" con Transfermóvil, Zelle, etc. |
| 7 | **Precio propio** | Subir su precio y verlo | Katia y Niurka: subieron el 5 % y "sigue igual" (solo se ve entrando por su enlace). | Funciona, pero no se entiende. |
| 8 | **Crecer** | Clientes que repiten, extras en tienda | Priv.: 43 mencionan "cliente", casi todo dudas. Dany: el cliente compró una percha en la tienda y no se le cargó (D33). | Lista de clientes con "sin comprar en 30 días" y botón "Escribir". |
| 9 | **Logística propia** | Elegir mensajero, pedidos de varias tiendas, llevar 3 modelos para que el cliente elija | 5 gestoras pidieron elegir mensajero. Isabella, Dany y Ela: varias tiendas. Sugerencia repetida: "llevar varios modelos". | Elegir mensajero hecho (3.13.48). Varias tiendas: decisión D5 pendiente. |

**Lo que casi no aparece:** nadie pide estadísticas complicadas, ni gráficas, ni una app nativa. Piden respuestas rápidas y cosas para copiar y pegar.

**Línea base del día 1 (11-oct):** 28 gestoras aprobadas, **7 vendieron** (25 %), 11 pedidos reales por 613 USD. En BizneCubano había 90 gestoras y la mejor tenía 395 pedidos (19.808 USD): ese es el techo a recuperar.

---

## 2. GRATIS ya, en el área de gestoras o en el bot (10 cosas)

Esfuerzo: **S** = horas, **M** = 1–3 días, **L** = semana o más.

| # | Qué es | Por qué (evidencia) | Esfuerzo | ¿Existe? | Qué construir |
|---|---|---|---|---|---|
| 1 | **"Compartir ficha"** en cada producto: foto + su precio (USD y CUP) + medidas y material + "quedan N", en un toque a WhatsApp | Temas 3, 4 y 5. Es lo que más preguntan y lo que más tarda en contestarse. | M | A medias: "Compartir" solo en "Lo que más se vende"; stock y CUP ya calculados | Botón en Mis precios y en la tienda con su enlace. Medidas y material salen de la ficha de conocimiento de Digitaliza (empezar por los 30 más vendidos). |
| 2 | **Mandar a tu cliente "cómo comprar"** | Katia lo pidió y Ernesto lo prometió. Dayisel no sabía si basta con el enlace. | S | Sí: `tutorial-como-comprar.mp4` y los GIF de compra | Botón en Mi tienda: "Mandar el video de cómo comprar" (enlace + texto con su código). |
| 3 | **Respuestas listas para el cliente** | Tema 4 + sugerencias de "foto de la fachada" y "ubicación" | S | En `crm_knowledge` (para el bot) | Tarjeta "Qué le digo al cliente": formas de pago, mensajería por zona (en CUP), recogida desde las 10, dirección con foto de la fachada. Copiar con un toque. |
| 4 | **Novedades del día** | 17 mensajes de "nuevo", *"Productos nuevos"* | S | "Llegó mercancía" en panel y caja; canal de WhatsApp pendiente de crear | Sección "Llegó hoy" en Inicio con lo que entró en las últimas 72 h, cada uno con "Compartir ficha". Mismo contenido al canal (`/canal`). |
| 5 | **Fotos y textos listos con contenido** | Tema 5 | S (llenarla) | Sí, la biblioteca `cvd_resource` | Que el panel o el supervisor publique 1–3 piezas al día (las infografías del cierre y las fotos del estudio). Sin contenido, la sección resta. |
| 6 | **Mis pedidos paso a paso** | Tema 1, el más alto | S | Bot: estado real y avisos. Área: lista de ventas | En Ventas, línea de tiempo por pedido (Preparando → Listo → Lo lleva X → Entregado) y botón "Avisar a mi cliente" que abre WhatsApp con el texto (lo manda ella, nunca el bot: regla P6). |
| 7 | **"Avísame cuando llegue"** | Dayami: sábanas agotadas; *"cuándo volverán a surtir"* | M | No | En un producto agotado, la gestora pulsa "Avísame". Cuando el puente sube el stock, el bot le escribe. Además le dice a Lennys qué se está pidiendo sin stock (dato de compras). |
| 8 | **Tu semana** (mensaje privado del bot, lunes) | Tema 6; FAQ 26 sin respuesta | S | Datos en Inicio y en Cobrar | Un mensaje: vendiste X, ganaste Y, por cobrar Z, se paga el día N, tus 3 productos más vendidos y 1 cliente para volver a escribir. Antes: Lennys decide y se publica cómo y cuándo se paga (FAQ 26). |
| 9 | **Fotos bonitas de producto** | "Fotos de producto" sale como *Pronto*; Neisy pide fotos reales | M | Sí en el bot: `src/studio.js` (quita el fondo y pone la marca, gratis en el servidor) | Llevar el estudio al área: sube foto → la recibe con fondo Casa Viva. Límite de 10 al día. |
| 10 | **Clientes que repiten** | Tema 8; hoy hay "sin comprar en 30 días" | M | A medias | En cada cliente quieto: "Escríbele" con un texto ya hecho y un producto sugerido (lo nuevo o lo más vendido). Lo envía ella desde su teléfono. |

Ya hecho y que hay que **contar mejor** (no construir): elegir mensajero, cuenta doble gestora y mensajero, precio propio sin tope, calculadora, buscar precios, QR, contraseña propia. Una línea en el tutorial basta.

---

## 3. Mapa de herramientas NEXO: gratis o de pago, y cómo se reutilizan

Regla de la fábrica: lo que se hace dos veces a mano se convierte en **módulo** (código de NEXO), **plantilla** (textos, diseño), **script** (`cv`, supervisor) o **skill**.
Precios en USD al mes, **pagados por el comercio**. Referencias: la meta de la fábrica es 10–20 USD/mes; la hipótesis de `PRODUCT_DECISIONS_V1` es 30 de alta + 10/mes; BizneCubano cobraba 1 USD/mes por cada empleado con acceso.

| Herramienta | Gratis / Pago | Por qué | Se reutiliza como | Paso de la fábrica |
|---|---|---|---|---|
| Enlace con código, QR, precio propio, calculadora CUP | **Gratis** (incluido en cualquier plan con gestoras) | Es la puerta: sin esto no hay venta | Módulo NEXO Impulsa (hoy en Core `CVD_Gestora_Store`; pasarlo a Tienda NEXO `app/`, `lib/`) | 4 Prototipo |
| Área de gestora (Inicio, Ventas, Cobrar, Clientes) | **Gratis** para la gestora; parte del plan **Con gestoras** del comercio | El comercio paga porque le hace vender | Módulo NEXO Impulsa | 4 y 10 |
| Comisiones automáticas y pagos | Plan **Con gestoras** | Es lo que hoy el dueño hace a mano | Módulo (nube NEXO, D37) | 8 |
| Compartir ficha (foto + precio + medidas + stock) | **Gratis** para la gestora | Quita preguntas y vende | Módulo + ficha de conocimiento de **Digitaliza** | 3 Fichas |
| Fotos y textos listos, novedades del día | **Gratis** | Gancho diario para entrar al área | Plantilla + skill `canal` | 3 |
| Estudio de fotos (fondo de marca) | **Gratis** 10/día · **Extra** por lotes | Cuesta poco (corre en el servidor) | Módulo "NEXO Fotos" (`studio.js` ya admite la marca de cada tienda) | 2 Fotos pro |
| Fotos pro con IA (Higgsfield) | **Extra**: ~0,30 USD/foto o paquete de 50 por 10 USD | Cuesta créditos (≈2,7 por foto) | Script de lote con presupuesto | 2 |
| Bot de WhatsApp: estado del pedido, respuestas, datos de pago | Plan **Pro** | Es lo que más horas ahorra (el día 1, 171 correcciones a mano) | VivaBot multi-negocio (`business_id`, `lines.js`, `crm_knowledge`) | 10 Atención |
| Preguntas abiertas con relevo a la tienda | Plan **Pro** | Responde lo que no sabe sin inventar (D11) | VivaBot `preguntas.js` | 10 |
| Cierre del día con infografía y ranking | Plan **Pro** | Motiva al equipo y ordena al dueño | Script `cierre-del-dia.mjs` + skill `cierre` | 10 |
| Reparto con mensajeros (carreras, vale, entregado) | Plan **Pro** | Ahorra coordinación y cuadra el dinero | Módulo mensajería (Core + VivaBot `dispatch.js`) | 10 |
| Buscar precios (foto → Revolico) | **Gratis** 3/día · **Extra** con más | Cada búsqueda cuesta IA | Módulo (hoy `CVD_Gestora_Busca`) | 7 Clientes |
| Avísame cuando llegue | **Gratis** | Recupera ventas perdidas y da datos de compra | Módulo + puente de stock | 10 |
| Tu semana / clientes que repiten | **Gratis** | Hace volver a la gestora | Script del supervisor + plantilla | 10 |
| Tutoriales en video con la marca del comercio | **Extra**: 15–30 USD cada uno, o incluido en la alta | Se hacen con la skill `video-tutorial-casa-viva` | Skill (generalizar marca) | 6 Propuesta |
| Cazadora de clientes | **No construir** (ver §9) | Riesgo de spam y de bloqueo del número | — | — |

**Planes que salen de aquí (borrador para que decida Ernesto):**

| Plan | USD/mes | Incluye |
|---|---|---|
| **Caja** | 10 | Caja sin internet, inventario, resumen del día, tienda online |
| **Con gestoras** | 15 | Caja + NEXO Impulsa: hasta 30 gestoras, enlaces, comisiones y pagos, área de gestora con todo lo gratis de §2 |
| **Pro** | 20 | Con gestoras + bot de WhatsApp (estado, respuestas, preguntas abiertas), reparto con mensajeros, cierre del día con infografía |
| Extras | — | +5 USD/mes por cada 30 gestoras más · fotos pro por lote · tutoriales · alta asistida (digitalizar productos) 30 USD única |

**De gratis a pago (los ganchos):** la gestora no paga nunca en Casa Viva. El "salto" es del comercio: ve que sus gestoras venden con el área gratis → quiere que el bot conteste sus preguntas (Pro) → quiere fotos y videos (extras).

---

## 4. Modelo de dinero (método $100M Money Models)

### 4a. Para un comercio que usa NEXO con sus propias gestoras

| Paso | Oferta | Precio | Cuándo se ofrece | % que se espera que acepte |
|---|---|---|---|---|
| Atracción | **Diagnóstico gratis + 20 productos digitalizados + tienda demo con su enlace de gestora**. "Gana tu dinero de vuelta": si en 30 días sus gestoras venden 300 USD, la alta de 30 USD se descuenta del 2.º mes | 0 / 30 USD de alta | En la primera visita, enseñando Casa Viva en el teléfono | 30–40 % de los que ven la demo |
| Mensualidad | Plan **Con gestoras** | 15 USD/mes | Al terminar la semana de prueba | 60 % de los que prueban |
| Venta adicional 1 | Plan **Pro** (bot + reparto + cierre) | +5 USD/mes | Cuando el dueño dice "me preguntan mucho" o "no sé quién lo lleva" (la receta: "esto te quita esas preguntas") | 30 % |
| Venta adicional 2 | Fotos pro por lote, tutorial para sus gestoras | 10–30 USD una vez | Al subir productos nuevos | 20 % |
| Si dice que no (1.º cambia cómo paga) | Alta en 2 pagos, o la paga un familiar desde fuera; 3 meses pagados = 1 gratis **al final** | igual | En la misma conversación | — |
| Si sigue que no (luego quita partes) | Plan **Caja** solo (10 USD), "hazlo tú" (sube él sus productos), sin bot | 10 USD/mes | Último paso | 20 % |

Cuenta rápida: alta 30 + primer mes 15 = **45 USD en 30 días**. Si conseguir un comercio cuesta unas 4 horas y un par de mensajes, alcanza para pagar a una afiliada (§5) y para atender a otros dos. Cumple la regla de la skill solo si la implementación se hace con plantillas (Digitaliza, kit-demo), no a mano.

### 4b. Para la gestora (dentro de un comercio NEXO)

La gestora **no paga mensualidad** (`NEGOCIO.md`: "NEXO Impulsa: nadie paga directo"). Su "modelo de dinero" es de compromiso, no de cobro:
- **Atracción:** área gratis + primer pedido acompañado por el bot ("hazlo conmigo").
- **Ascenso:** al vender 5 pedidos en el mes se desbloquea "Gestora destacada": más búsquedas de precios, fotos del estudio sin límite, sale en el ranking del cierre.
- **Más adelante (3–6 meses), si hay gestoras que venden para varias tiendas NEXO:** "Gestora Pro" a 2–3 USD/mes **descontado de su comisión solo en los meses en que gane más de 30 USD** ("solo pagas si ganas"). Probarlo con 5 gestoras antes de anunciarlo.

---

## 5. Las gestoras como canal para conseguir comercios (afiliadas)

**Idea realista:** las gestoras conocen dueños de tiendas (sus proveedores, otras tiendas para las que venden; Isabella, Dany y Ela ya venden para varias). No hay que convertirlas en vendedoras de software: solo en **presentadoras**. Ernesto cierra.

| Qué | Cómo | Esfuerzo |
|---|---|---|
| Quiénes | Empezar con 3: las que más venden y entienden el sistema (por ejemplo Dany, Maryta, Isabella). Que acepten, no por grupo | — |
| Qué ganan | **10 USD cuando el comercio paga su 2.º mes** + 10 % de su mensualidad durante 12 meses. Nada por presentar ni por inscribir (regla 1 de la propuesta de red: si se paga por inscribir, es pirámide) | Reutiliza el libro de comisiones |
| Su enlace | `nexocuba.com/?ref=CODIGO`, el mismo código que ya tienen en Casa Viva | S |
| Lo que enseñan | Video de 60 s "así vende Casa Viva con 28 gestoras" (con la skill de tutoriales) + 1 página "Qué es NEXO" + guion de 3 mensajes por WhatsApp | S–M |
| El gancho para el dueño | "Te llevo a una red de vendedoras que ya venden por WhatsApp" + diagnóstico gratis | — |
| Bonus de red | Si el comercio entra a NEXO Impulsa, la misma gestora puede vender sus productos desde su área y cobrar comisión de los dos | L (necesita gestora en varias tiendas) |

**Cuidado:** pagar a residentes en Cuba por traer clientes a un negocio de Ernesto puede tocar las reglas de `PAGOS-Y-LEGAL.md` (OFAC, D14). Pagar en CUP o con crédito en productos de Casa Viva es más simple. Confirmarlo antes de anunciarlo.

**Cuándo activarlo:** cuando NEXO haya cerrado al menos 2 comercios sin ayuda (la skill dice: multiplicadores solo con un proceso que ya funcione).

---

## 6. Casa Viva es el piloto: qué probar antes de vender cada cosa

| Herramienta de pago | Qué probar en Casa Viva | Señal de que está lista para vender |
|---|---|---|
| Plan Con gestoras (comisiones y pagos) | 4 semanas de comisiones calculadas y pagadas sin arreglos a mano | 0 correcciones manuales de comisión en 2 semanas seguidas; las gestoras ven el mismo número que Lennys |
| Área de gestora + Compartir ficha | 30 productos con medidas; uso real | ≥15 de 28 gestoras venden al menos 1 vez por semana; preguntas de medidas en el General bajan a la mitad |
| Bot: estado y respuestas | Las preguntas "¿cómo va mi pedido?" y "¿a qué hora llega?" | ≥90 % contestadas bien sin Ernesto durante 14 días; 0 promesas falsas ("se lo paso a Lennys") |
| Preguntas abiertas con relevo | Medidas y material que la tienda contesta | Respuesta en menos de 2 h el 80 % de las veces y queda en el conocimiento |
| Reparto con mensajeros | Carreras, entregado y dinero | 50 entregas seguidas con dinero cuadrado y sin "entregado" perdido (como el de Ely) |
| Cierre del día con infografía | Envío automático tras el "sí" de Ernesto | 14 días seguidos con ≤1 corrección por semana; Lennys dice que lo lee |
| Estudio de fotos | 20 productos procesados | Lennys aprueba ≥80 % sin rehacer |
| Avísame cuando llegue | Agotados más pedidos | ≥5 ventas recuperadas al mes |

**Antes de vender cualquier cosa a otro comercio:** que funcione en Casa Viva sin que Ernesto intervenga, y que se pueda encender para otro negocio cambiando datos (nombre, colores, `business_id`), no código.

---

## 7. Hoja de ruta (pasos pequeños, cada uno se prueba con gestoras reales)

### Esta semana (12–18 oct)
1. Decidir y publicar **cómo y cuándo se pagan las comisiones** (FAQ 26) con Lennys. Prueba: 3 gestoras lo explican con sus palabras.
2. Botón **"Mandar a tu cliente cómo comprar"** con el video que ya existe (cumple lo prometido a Katia). Prueba: Katia y Dayisel lo mandan a 1 cliente cada una.
3. Tarjeta **"Qué le digo al cliente"** (pago, mensajería en CUP, recogida desde las 10, dirección con foto de la fachada). Prueba: menos preguntas de pago en el General.
4. Llenar **"Fotos y textos listos"** con 10 piezas (infografías aprobadas + fotos del estudio).
5. **Línea base de medición** (§8) guardada con fecha.

### Este mes (hasta el 15 de noviembre)
6. **Compartir ficha** con los 30 más vendidos medidos por Nana o Zaymi (ficha de conocimiento de Digitaliza). Prueba con Dany, Dayami y Caridad.
7. **Mis pedidos paso a paso** + "Avisar a mi cliente".
8. **Tu semana** por el bot (lunes), aprobado por Ernesto la primera vez.
9. **Avísame cuando llegue**.
10. **Llegó hoy** en Inicio + canal de gestoras (cuando Ernesto cree el canal).
11. Cierre del día automático (`cierre-del-dia.mjs`).

### Próximos 3 meses (hasta mediados de enero)
12. Llevar la lógica de gestoras a **NEXO** (nube + Tienda NEXO): Casa Viva sigue igual, pero otro comercio la puede encender sin WordPress.
13. **VivaBot multi-negocio** de verdad: un segundo negocio con su conocimiento, su marca y su línea, sin tocar el código.
14. Estudio de fotos en el área (10/día) y **Clientes que repiten**.
15. Empaquetar planes **Caja / Con gestoras / Pro** con la oferta de §4a y probar con **2 comercios** (Colo Shop si paga, más uno nuevo de la fábrica).
16. Piloto de **afiliadas** con 3 gestoras, solo si los 2 comercios anteriores ya pagan.

---

## 8. Cómo medir si cada herramienta sirve

| Medida | Cómo se saca | Hoy (11-oct) | Meta a 30 días |
|---|---|---|---|
| Gestoras activas (vendieron en los últimos 7 días) | Pedidos web con gestora (`cv pedidos-hoy 7`) | 7 de 28 (25 %) | 15 de 30+ (50 %) |
| Ventas por gestora activa por semana | Mismo dato | ~1,5 pedidos, ~85 USD (día 1) | 3 pedidos, 120 USD |
| Clientes que repiten (2+ pedidos en 60 días) | Tabla de clientes de Core (`wp_cvd_clients`) | 0 (sistema nuevo) | 15 % de los clientes |
| Preguntas a soporte por gestora y semana | `crm_messages` entrantes de gestoras / gestoras | ~15 por gestora (412 en 7 días, semana de cambio) | menos de 5 |
| Preguntas sin respuesta en el General | `crm_knowledge` pendientes + recuento | 4 de producto sin responder | 0 con más de 24 h |
| Uso de cada herramienta | Contador simple por botón (Compartir ficha, calculadora, video) en Core | No se mide | Añadirlo en el paso 5 de la semana |

Una herramienta **se queda** si en 30 días la usa al menos 1 de cada 3 gestoras activas o baja las preguntas de su tema. Si no, se quita del menú.

---

## 9. Riesgos y qué NO construir

**Riesgos**
- **Todo en WordPress:** el área, el precio propio y las comisiones viven en el plugin de Casa Viva. D16 dice que WooCommerce es solo un canal. Si se sigue añadiendo en PHP, no se podrá vender a otros. Cada herramienta nueva: datos y reglas en NEXO; Core solo la enseña.
- **Que el bot invente** medidas, horas o pasos (30 errores el día 1). Compartir ficha y respuestas solo con datos verificados (D11).
- **Que el bot escriba a los clientes de las gestoras:** prohibido (P6). Todo lo que va al cliente lo manda la gestora desde su teléfono.
- **Cobrar a las gestoras antes de tiempo:** se irían a otra tienda. En Casa Viva, gratis.
- **Pagar comisiones a afiliadas en Cuba:** revisar `PAGOS-Y-LEGAL.md` antes.
- **Pruebas que llegan a la operación** (pasó el día 1): toda herramienta nueva, con cuenta de prueba y la marca PRUEBA.

**No construir (por ahora)**
- **Cazadora de clientes** (buscar gente en grupos para escribirle): riesgo de spam, de bloqueo del número y de privacidad. Quitar el "Pronto" del menú.
- **Red de varios niveles** o pagar por invitar: solo 1 nivel y solo por ventas (propuesta de red, regla 1).
- **App nativa para gestoras:** la web en el móvil basta y ya funciona.
- **Gráficas y estadísticas complicadas:** nadie las pidió; basta "ganado / por cobrar / tu semana".
- **Envíos masivos del bot a clientes:** solo campañas aprobadas, despacio, como ya hace `campaigns.js`.
- **Dominio o tienda propia por gestora:** el enlace con código basta.
- **Pedidos de varias tiendas** antes de que Ernesto decida cómo funcionan (D5).
