# Estilo de los resúmenes del día de Casa Viva (estilo Alex Hormozi)

**Decisión de Ernesto, 2026-10-18:**
- Todos los resúmenes del día van **estilo Alex Hormozi**, para todos los públicos.
- Empiezan con el resumen de hoy a las **20:00**.
- Los grupos salen solo con su **SÍ n** en la previa.

**Para quién es este archivo:** lo implementa `scripts/resumen-diario.mjs` (VivaBot).

**Origen:** las tarjetas del 11-oct de la sesión «cierre del día». A Ernesto le gustaron; sobre todo el **resumen administrativo de Lennys**.

**Imágenes de referencia:** `docs/nexo-business/resumenes/referencia-2026-10-11/`
- `general.png`: gestoras, grupo General.
- `mensajeros.png`: grupo Mensajerías.
- `gestora-32.png`: «Tu día» de Patricia. Hay una por gestora: `gestora-21/27/30/47/57`.
- `dependientas.png`: Nana y Zaymi.
- `lennys.png`: la que más gustó.
- `ernesto.png`: parte técnico.

**Código de referencia (sin subir):** rama local `archivo/cierre-1011` de `C:\Users\Ernesto\vivabot`.
- `scripts/cierre/cards.js`: el dibujo.
- `scripts/cierre/compute.js`: los cálculos.
- `scripts/cierre/texts.js`: la única llamada de IA.

**Para leer la caja:** en Supabase existe `public.crm_cierre_caja(p_business, p_from, p_to)`. Es de solo lectura y solo la puede llamar service_role.

---

## 1. Qué es «estilo Hormozi» en un resumen del día

Cada resumen sigue estos 6 pasos, en este orden:

| Paso | Qué es | Ejemplo |
|---|---|---|
| 1. **Gancho** | La primera línea es el resultado que importa, en grande. Nunca «Hola, aquí el resumen». | «Entre todos vendimos **699 USD**» |
| 2. **Prueba** | Números reales del día, calculados sin IA. Nunca redondear hacia arriba ni inventar. | «11 pedidos web · 2 ventas en tienda» |
| 3. **Reconocimiento** | Nombre de pila + su número. Lo que se celebra en público se repite. | «1 Patricia 305 USD · 2 ventas» |
| 4. **Progreso** | Que vean que se acercan a algo grande. Siempre en positivo. | «12 % más que ayer» · «¡Nuestro mejor día hasta hoy!» · «En 8 días: 4.200 USD y 120 ventas» · «Día 1 de la web nueva: el primero de muchos» |
| 5. **Próximo paso con premio** | UNA acción para mañana, fácil, con lo que ganan si la hacen. El premio tiene que existir de verdad (comisión real de Core, un bono que ya esté aprobado). | «Comparte hoy el perchero: ganas 3 USD por cada uno» |
| 6. **Urgencia solo si es verdad** | Fechas o existencias reales. | «Quedan 2 cintas RGB» (sí). «¡Solo hoy!» sin motivo (no). |

**Ecuación de valor aplicada:** que se vea **el resultado** (dinero, entregas), **que es posible** (otra lo logró hoy), **rápido** («mañana») y **fácil** (una sola acción).

**Reglas de lectura** (memoria *messages-easy-to-read*):
- Una idea por línea.
- Negrita solo en la cifra o la palabra clave.
- El texto de WhatsApp tiene como mucho unas 6 líneas. Si hay más, el resto va a la imagen.
- La decisión o la pregunta va al final, sola.

---

## 2. Formato visual (todas las tarjetas)

- **Tamaño:** PNG **1080 × 1350** (4:5), pensado para el móvil.
- **Colores de casaviva.company:**
  - petróleo `#006068`: cabecera;
  - verde `#004042`: cifras, puesto 1, recuadro final;
  - beige `#f2e9dc`: chips y círculos de puesto;
  - arena `#e5d6bd`: «CASA VIVA» y etiqueta;
  - blanco roto `#fafaf7`: fondo;
  - terracota `#a3502a`: barrita de cada sección, alarmas y pie;
  - menta `#cfe3e1`: subtítulos sobre petróleo;
  - gris cálido `#6f685f`: detalle;
  - línea `#e6ddcf`.
- **Letras:**
  - títulos y cifras en serif fuerte (usé Fraunces 800; Cinzel vale si es la del manual);
  - texto en Figtree 400 a 800.
  - Nada de Inter.
- **Estructura de cada tarjeta:**
  1. **Cabecera petróleo** (alto ~360):
     - «CASA VIVA» espaciado arriba a la izquierda;
     - etiqueta arriba a la derecha (`DÍA 8`, `TU DÍA`, `TIENDA`, `ADMIN`, `ERNESTO`);
     - fecha en minúscula con la primera mayúscula («Domingo 11 de octubre»);
     - título serif grande (86 px; 72 si es largo);
     - subtítulo de una línea;
     - dos círculos decorativos suaves a la derecha (verde sólido + aro arena).
  2. **Cifra principal** en una tarjeta blanca que monta sobre la cabecera (−84 px):
     - etiqueta en mayúsculas;
     - cifra serif de ~92 px;
     - debajo, el detalle;
     - y una «pastilla» beige con la frase de progreso.
  3. **Secciones:** barrita terracota + título en mayúsculas petróleo + lista.
  4. **Ranking:**
     - círculo con el número (el 1.º en verde con número arena; el resto beige);
     - nombre en negrita;
     - detalle gris debajo;
     - cifra serif a la derecha.
  5. **Pie:** línea + «casaviva.company» a la izquierda y una frase serif terracota a la derecha («Juntos crecemos cada día», «Para que todo cuadre», «Gracias por cuidar cada pedido»).
- **Sin emojis dentro de la imagen.** Las fuentes no los tienen; los emojis van en el texto de WhatsApp.
- **Recortar textos con «…»** para que nada se salga.

---

## 3. Por público: secciones y orden

### 3.1 Gestoras → grupo General (`general.png`)

- **Título:** «Resumen del día».
- **Subtítulo:** «Gracias, equipo. Así nos fue hoy.»
- **Etiqueta:** `DÍA N`. El día 1 es el 11-oct, el primer día de la web nueva.

**Secciones, en este orden:**
1. **Cifra principal:**
   - «ENTRE TODOS VENDIMOS · 699 USD»;
   - debajo, «11 pedidos web · 2 ventas en tienda»;
   - y la pastilla de progreso.
2. **Gestoras del día:**
   - **top 5 en USD**, con su número de ventas;
   - **nunca el último puesto**: con N gestoras se enseñan como mucho N−1;
   - debajo: «Y 1 gestora más también vendió hoy. ¡Gracias!».
3. **Lo más vendido:** 3 chips con nombre · unidades. El primero en verde.
4. **Mejoramos hoy, gracias a ustedes:** hasta 3 puntos. Salen de `crm_feedback` hecho hoy (con «idea de X») y de las notas a mano.

**Texto de WhatsApp debajo:**
- «💛 *Resumen del día · domingo 11 de octubre*»;
- la cifra;
- **Dudas del día (con respuesta)**: 3, respondidas solo con `crm_knowledge` activa;
- **El momento del día**: una frase simpática, casi literal, sin burlarse de nadie;
- cierre: «¡A seguir vendiendo! 💛».
- **Estilo Hormozi:** añadir el **próximo paso con premio** de mañana (un producto + lo que ganan).

### 3.2 Mensajeros → grupo Mensajerías (`mensajeros.png`)

- **Título:** «Reparto del día».
- **Subtítulo:** «Cada entrega hace crecer a Casa Viva.»

**Secciones:**
1. **Cifra principal:**
   - «3 entregas»;
   - debajo, «2 pedidos siguen en camino» (o «Todo lo recogido, entregado»);
   - pastilla «Mañana: 3 entregas».
2. **Quién repartió hoy:** ranking por entregas y zonas. Todos los que entregaron al menos 1 salen: es reconocimiento, no comparación.
3. **Para mañana:**
   - una fila por pedido: «#2898 · El Vedado» a la izquierda y el mensajero a la derecha. Si no hay mensajero, «Busca mensajero» en terracota;
   - debajo, los productos y la hora o el día;
   - **nada del cliente**.

**Texto de WhatsApp:** gracias + dudas de mensajeros (hasta 2) + «si cogiste una y no puedes, escribe *no puedo*».

### 3.3 «Tu día» → privado a CADA gestora que vendió (`gestora-32.png`)

- Solo a quien vendió hoy, para no molestar.
- **Título:** «Tu día, Patricia».
- **Subtítulo:**
  - si fue la 1.ª: «¡La que más vendió hoy!»;
  - si quedó entre las 3 primeras: «Entre las 3 que más vendieron hoy»;
  - si no: «Gracias por sumar hoy».
  - **Nunca su puesto si va abajo.**

**Secciones:**
1. **Cifra principal:** «Vendiste hoy · 305 USD», con «2 ventas · 2 productos».
2. **Dos cuadros:** «Comisión de hoy» y «Por cobrar» (comisión pendiente de todas las fechas).
3. **Lo que vendiste:** producto y unidades.
4. **Recuadro verde final:** «ENTRE TODOS HOY · 699 USD · 13 ventas · Tú eres parte de esto.» Es lo de sentirse parte de algo grande.

- **Estilo Hormozi:** añadir el próximo paso con premio personal. Por ejemplo, «Si mañana vendes 1 más, llegas a X USD de comisión».

### 3.4 Dependientas Nana (5358004216) y Zaymi (5359163951) → privado (`dependientas.png`)

- **Título:** «Para mañana», con la fecha de mañana.
- **Etiqueta:** `TIENDA`.

**Secciones:**
1. **Cifra principal:** «Hoy en tienda · 66 USD», con «2 ventas en caja · ¡gracias!».
2. **Recogen en tienda (N):**
   - «#2903 · Elvis (Maryta)»: el cliente solo con su **nombre de pila**, y la gestora;
   - a la derecha, «Cobrar 40 USD» en terracota o «Pagado» en verde;
   - debajo, los productos.
3. **Entregar al mensajero (N):** «#2899 · Silla de oficina» a la izquierda; mensajero y hora a la derecha, o «Sin mensajero aún».

- Respetar que **a la tienda no se le escribe de 17:00 a 10:00**. Ya está en `resumen-diario.mjs`: su tarjeta va por la mañana.

### 3.5 Lennys (5356885368) → privado · «Resumen administrativo» (`lennys.png`) ⭐ la que más gustó

- **Título:** «Resumen administrativo».
- **Etiqueta:** `ADMIN`.
- **Subtítulo:** «N cosas para revisar», o «Hoy todo cuadra».
- **Es la alarma diaria de lo que no cuadra.** Solo administración: **nunca tareas de tienda** (memoria *lennys-is-admin*).

**Secciones:**
1. **Tres cuadros** que montan sobre la cabecera:
   - **Web** (USD y pedidos);
   - **Tienda** (USD y ventas);
   - **Comisiones** por pagar (web pendiente o aprobada + caja ganada − pagada).
2. **Dinero con mensajeros.** Una línea por pedido con `_cvd_cash_status = pending_return`:
   - «#2896 · Fernando · 60 USD»;
   - «#2901 · Isabel · 11.700 CUP»;
   - «#2900 · Pedri (transferencia) · 25.740 CUP».
   - El importe sale de `_cvd_collection_amount_usd/_cup` y `_cvd_collection_method`; en la caja, de la vista `messenger_custody`.
3. **Lo que no cuadra** (puntos terracota, hasta 3):
   - dinero en manos de un mensajero desde hace 24 h o más;
   - transferencias que hay que comprobar en la tarjeta;
   - pedidos con `_cvd_commission_risk`, en **UNA sola línea**: casi todos los pedidos de gestoras lo traen y por separado es ruido;
   - pedidos abiertos con 3 días o más;
   - existencias en negativo;
   - devoluciones del día;
   - si falló una fuente de datos, decirlo («los números pueden quedarse cortos»).
4. **Existencias y comisiones:**
   - existencias: negativos, lo que quedó agotado hoy después de vender, lo que está bajo el mínimo y conteos con diferencia;
   - de los conteos, **solo** los que dicen «Conteo…». Los movimientos «Pedido web #…», «Alta desde el panel» y «Diseño enlazado» son del puente y no cuentan;
   - «61 productos sin comisión propia (cobran el 10 % general)»: productos activos sin fila en `product_commissions`.

- **Pie:** «Para que todo cuadre».
- **Texto de WhatsApp:** «📊 Resumen administrativo · fecha.» + «👀 *Para revisar:*» con las alarmas en puntos (máx. 6), o «Hoy todo cuadra ✅».
- **Estilo Hormozi para Lennys:** gancho = lo más importante del día en dinero; al final, **una sola decisión** que tiene que tomar ella, sola y clara.

### 3.6 Ernesto (5354056173) → parte técnico (`ernesto.png`)

- **Título:** «Parte técnico».
- **Subtítulo:** «Todas las fuentes respondieron», o «N fuentes fallaron».

**Secciones:**
1. **Dos cuadros:** Ventas y Dudas (cuántas y cuántas sin respuesta del bot).
2. **Datos:**
   - pedidos web leídos;
   - pruebas y cancelados que quedaron fuera;
   - estado del buzón de hoy;
   - escalaciones pendientes;
   - de dónde salieron los textos (IA, manual).
3. **Fallos**, si los hay.
4. **Se enviaría:** la lista de envíos.

- **Pie:** «Responde SÍ n para enviar».
- **En su chat «Tú»:** nunca una pregunta de sí/no sola, porque el bot lo toma como orden. Siempre **SÍ n** con número (memoria *no-yes-no-questions-in-tu-chat*).

---

## 4. Datos (sin IA) y la única llamada de IA

- **Números:** siempre por código. El día va de 00:00 a 24:00 de Cuba (America/Havana).
- **Fuera de las cuentas:**
  - pedidos con `_cvd_test_order` (cualquier valor: tutorial, harley, auto…);
  - cancelados, fallidos y reembolsados.
- **A quién se atribuye cada venta:**
  - la gestora sale de `_cvd_owner_user_id` (con `_cvd_owner_type`; 0 = venta directa de la tienda, no es gestora);
  - el mensajero, de `_cvd_messenger_user_id`;
  - la entrega del día, de `_cvd_delivered_at` en GMT.
- **Nombres cortos** (cómo los conoce el equipo): Dayami (id 21), Maryta (47), Ely (56). Del resto, el primer nombre.
- **IA: UNA llamada barata al día** (gpt-4.1-mini por `src/ai.js`; el 11-oct costó menos de 1 centavo, unos 13.500 tokens). Solo para:
  - las 3 dudas de gestoras y 2 de mensajeros, con respuesta **solo de `crm_knowledge` activa**;
  - el momento simpático, de los chats del equipo con el bot.
  - Lo que se escribe a mano (notas) manda sobre la IA.
- **Guardar cada día** en `crm_daily_summaries`, con el JSON del día. Ya existe y está vacía. Así el ranking del domingo (semana) y el del mes salen gratis.

---

## 5. Ejemplos de textos que le gustaron (borrador del 11-oct, enviado)

- «Hoy fue el *primer día de la web nueva*. Gracias, equipo, por la paciencia y por cómo recibieron los cambios 🙏»
- «🏆 *Gestoras del día:* Patricia (305 USD) · Maryta (88) · Dayami (60) · Elizabeth (54) · Zuanet (33). ¡Felicidades! 👏»
- «🛠️ *Lo que mejoramos hoy, gracias a ustedes:* Calculadora con la tasa del día en tu área · Día de entrega en el pedido y en el vale · Página *Cómo llegar a la tienda* · Te aviso yo cuando tu pedido se entrega o lo recogen.»
- «😄 *El momento del día:* Daiquel, después de una carrera de prueba: «dile a tu programador que no me dejó ni la llave ni la bujía» 😂»
- «📌 *Para mañana:* antes de prometer, revisen que hay existencia.»
- A mensajeros: «Si cogiste una carrera y no puedes, escribe *no puedo*: pasa sola al siguiente que dijo «Yo».»
- Texto completo: `docs/nexo-business/cierres/2026-10-11-borrador.md`. Ojo: ese archivo dice «sábado 11»; el 11-oct-2026 fue **domingo**.

---

## 6. Lo que NO quiere

- **Nunca el último puesto** ni comparaciones que dejen mal a alguien. Si hoy fue peor que ayer, se habla del camino recorrido, no de la bajada.
- **Nunca teléfonos de clientes** en imágenes ni en grupos. Del cliente, como mucho el nombre de pila, y solo en la tarjeta de las dependientas.
- **Nada a grupos sin el SÍ de Ernesto.**
- **A Lennys, nada de tareas de tienda.** Eso va a las dependientas, los mensajeros o las gestoras.
- **Nada inventado:** cifras, premios, urgencias o respuestas que no estén en los datos o en `crm_knowledge`.
- **Sin frases de IA:**
  - «¡Perfecto!», «¡Claro!», «no dudes en», «para cualquier cosa estamos aquí», «Hola X» en medio de una conversación;
  - textos largos: una idea por línea.
- **Sin jerga técnica** para el equipo: nada de POS, SKU, sincronizar, outbox.
- **Notas de voz** solo generadas y comprobadas con Whisper antes (memoria *audit-voice-before-sending*).
- **Género:** si el contacto no tiene etiqueta, en neutro.
