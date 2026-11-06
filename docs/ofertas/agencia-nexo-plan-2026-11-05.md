# NEXO: la red cubana de catálogos, entregas y anuncios — diseño por fases (5-nov-2026, v2)

> Solo diseño. **No se construyó nada.** La v1 de este archivo (la «agencia») se reemplazó: Ernesto aclaró que la agencia es solo la puerta de entrada.
> Lo legal es información para decidir, **no asesoría legal**.

## 1. La idea en una frase

Una app cubana, **NEXO**, donde están los catálogos de todos los negocios, se compra y se habla con ellos (chat, bots), Pa'llá entrega, y los emprendedores pagan anuncios **en CUP / EnZona / Transfermóvil**: lo que en Cuba no se puede hacer con Facebook, Instagram, WhatsApp Business y Meta Ads.

Se hace **nuestra, no copiada**: mismas funciones que la gente ya entiende (catálogo, historias, chat, anuncios), con diseño y marca propios. Copiar el logo o la apariencia de Meta trae problemas legales y en las tiendas de apps.

## 2. Lo que Ernesto decidió (5-nov)

| Tema | Decisión |
|---|---|
| Nombre de la app | **NEXO**, sin más («búscalo en NEXO»). Pa'llá es la parte de entregas y transporte |
| Trato con los negocios | **Se dice desde el día 1:** «Tu carta digital es gratis para siempre. Solo ganamos un % pequeño de lo que NEXO te venda; si no te vendemos, no pagas» |
| Dónde empezar | Los primeros 20 negocios, **donde ya trabajan los mensajeros** (zona de Casa Viva). Panda26 es la muestra |
| Cara de la marca | Avatar IA |
| Canales externos | Una sola vitrina NEXO en Facebook / canal de WhatsApp / TikTok **para llevar gente a la app**, no para vender anuncios ahí |

## 3. Lo que YA tienes construido para esto

| Pieza de la red | Ya existe | Dónde |
|---|---|---|
| Entregas y transporte | **Pa'llá** (mensajeros en vivo, apagada; transporte en diseño, D139–D141) | Core, `casaviva.company/palla/` |
| Cartas digitales en serie | Fábrica **/menu-360** + Panda26 en vivo (D133–D136) | `apps/menu-360`, `casaviva.company/panda26/` |
| Catálogo + carrito + pedido por WhatsApp | **Tienda NEXO** | `tienda.nexocuba.com` |
| Vendedores sin mercancía | Gestoras con comisión automática | Core / NEXO Impulsa |
| Bot de WhatsApp | VivaBot | VPS |
| Stock y caja reales | NEXO Business | Casa Viva |
| Contenido con IA | Reels de Cúrru, estudio de fotos | Higgsfield + HyperFrames |

La red **no empieza de cero**: es juntar estas piezas bajo la app NEXO.

## 4. Las fases (cada una tiene una meta para pasar a la siguiente)

| Fase | Qué se hace | Quién paga | Meta para pasar |
|---|---|---|---|
| **1. Catálogos** (ahora) | Encender Pa'llá. Hacer gratis la carta digital de 20 negocios de la zona. Todos sus catálogos salen en la app NEXO y se piden con entrega Pa'llá | Nadie todavía | 20 negocios con catálogo al día y pedidos entregados **cada semana** |
| **2. Primeros ingresos** | % pequeño de lo que NEXO le vende a cada negocio. Cuota o % a mensajeros y choferes cuando Pa'llá les dé muchos viajes. **Ventas extra:** redes con IA, videos, bot y caja para el negocio que quiera más | Negocios, mensajeros, choferes | Ingresos que cubran los gastos de IA y servidores (~270 USD/mes) |
| **3. Red social** | En la app: seguir negocios, publicaciones e historias, chat con el catálogo dentro, bot que contesta | Nadie extra | Compradores que vuelven a la app cada semana |
| **4. Anuncios** | El emprendedor paga en CUP / EnZona / Transfermóvil por salir arriba, en historias o en zonas | Emprendedores | Base legal confirmada (sección 6) + público suficiente |
| **5. Quitar trabas** | Resolver una por una lo que no se puede hacer en Cuba (pagos, más servicios) | — | — |

**Por qué este orden:** una red social vacía no atrae a nadie. Los catálogos y las entregas dan una razón para abrir la app desde el día 1.

## 5. La puerta de entrada (fase 1)

- **Qué le dices al negocio:** «Te hago tu carta digital gratis, con fotos buenas. Sale en la app NEXO y te la entregan los mensajeros de Pa'llá. Solo ganamos un % pequeño de lo que te vendamos.»
- **Qué te deja hacer:** actualizar su catálogo y venderlo en la app y en redes bajo NEXO.
- **Producción:** la fábrica `/menu-360` (un `negocio.json` por negocio).
- **Regla de mensajes:** uno por persona, cada uno distinto y sin recordatorios (tu número fue restringido el 23-oct). Mejor en persona, con el móvil en la mano.
- **Web `nexocuba.com`:** dos puertas, «Compra en NEXO» y «Pon tu negocio gratis».

## 6. Legal: lo que hay que confirmar antes de cada fase

| Fase | Riesgo | Qué hacer |
|---|---|---|
| 1 | Bajo: servicio gratis y catálogos | Seguir adelante |
| 2 | Para cobrar con EnZona/Transfermóvil hace falta, casi seguro, una **figura legal** (TCP o mipyme) con cuenta. Hoy no tienes ninguna | Elegir figura con un abogado cubano **antes de cobrar** |
| 4 | **El más grande.** La Ley 162/2023 y el Decreto 102/2024 no dejan que los privados tengan «medios» propios. Una app donde se **cobra por anunciar** podría contar como medio | Preguntar al abogado y al ICS antes de vender el primer anuncio. Plan B: cobrar por «destacar el catálogo» como servicio de la tienda (por confirmar) |
| 4 | USDT: en Cuba los activos virtuales necesitan licencia del Banco Central (por confirmar) | Empezar solo con CUP, EnZona y Transfermóvil |
| Todas | La LLC de EE. UU. **no** cobra ni procesa pagos de negocios de Cuba (D14, reglas OFAC del 30-sep-2026) | La LLC solo paga herramientas |

Del 5-nov: Google/YouTube Ads y AdSense no funcionan para Cuba, y Meta prohíbe actividad comercial desde países bajo embargo. Por eso tiene sentido una red propia. El Decreto 160/2026 (vigente desde el 4-ago-2026) permite todo lo que no está en su lista prohibida; falta leer el anexo completo.
Fuentes: [ICS publicidad](https://www.ics.gob.cu/en/publicidad-y-patrocinio/) · [Google Ads](https://support.google.com/google-ads/answer/6163740?hl=en) · [Meta](https://www.facebook.com/legal/commercial_terms) · [Decreto 160/2026](https://www.gacetaoficial.gob.cu/es/decreto-160-de-2026-de-consejo-de-ministros) · [OFAC FAQ 1273](https://ofac.treasury.gov/faqs/1273)

## 7. Siguiente paso de diseño (antes de construir)

1. Recorrido de la app NEXO en 5 pantallas (inicio, negocio, producto, pedido con Pa'llá, chat), en papel o como imagen.
2. Lista de los 20 negocios de la zona (nombre, tipo, si tienen Facebook/WhatsApp).
3. Texto del trato del día 1 y el % (número a decidir por Ernesto).
4. Las preguntas para el abogado cubano (fases 2 y 4).
