# Triciclub: SMS a Cubacel y tipos de triciclo (investigación del 4-nov-2026)

Investigación en internet hecha por Claude (no se compró, ni se registró, ni se envió nada). ✔ = confirmado en la fuente · ≈ = estimación.

## 1. SMS con el enlace de entrada

Ernesto (4-nov): «usemos el mío de ser posible, es difícil comprar móviles para eso; busca otras opciones».

**Ojo:** el número de Ernesto es también el WhatsApp del bot. Si ETECSA suspende esa línea por mandar SMS seguidos, se cae el bot. Por eso NO hay que mandar con la SIM principal.

| Vía | Costo | Pegas |
|---|---|---|
| **SMSGate en el Redmi de Ernesto, con una 2.ª SIM Cubacel** ✔ (la app deja elegir la SIM: `simNumber: 2`, [docs](https://docs.sms-gate.app/features/multi-sim)) | la línea nueva (precio 2026 sin confirmar; en 2021 eran 1.000 CUP de activación) + ≈ 0,5–1 CUP por SMS (120 SMS = 60 CUP, [Fonoma](https://help.fonoma.com/es/articles/11345635-mobile-services-and-rates-in-cuba)) | el móvil siempre encendido, con datos y sin ahorro de batería de MIUI; ETECSA corta tras 10–15 SMS seguidos según la prensa ([CubaNet](https://www.cubanet.org/?p=252597)) → 1 SMS cada 30–60 s, máx. ≈ 10 por hora. La línea la puede sacar un familiar (máx. 3 líneas por persona). |
| D7 Networks ✔ 0,07 USD/SMS ([D7](https://d7networks.com/sms/cuba/)) · BudgetSMS ✔ 0,07 €/SMS ([BudgetSMS](https://budgetsms.net/sms-gateway-pricing/cu/cuba/)) · Plivo ✔ 0,11 USD | dólares por SMS | todos piden **registro del remitente: 2–6 meses**; Plivo pide datos del director para ETECSA |
| Twilio / AWS | — | **no mandan a Cuba** (Twilio desde el 15-sep-2025) |
| WhatsApp del bot (ya existe) | gratis | hace falta datos; muchos mensajes a números nuevos → riesgo de baneo de Meta |
| Bot de Telegram (`t.me/bot?start=código`) | gratis | menos gente lo usa; ya lo bloquearon en 2021 |
| **QR impreso en el triciclo** | casi gratis | solo sirve con el cliente delante |
| Correo | gratis | poca gente lo mira |

**Recomendación:** 1) ya: enlace por WhatsApp del bot + QR en cada triciclo. 2) SMS barato: 2.ª SIM en el Redmi con SMSGate, siempre `simNumber: 2`, despacio y con tope diario; plan B por WhatsApp. 3) Si crece: empezar el registro de remitente con D7 o BudgetSMS (tarda meses).

**Sin comprobar:** precio de una línea nueva en 2026, si el límite de 10–15 SMS seguidos sigue hoy, precios de Vonage/Infobip/Bird.

## 2. Tipos de triciclo en La Habana

| Tipo | Capacidad | Notas |
|---|---|---|
| Bicitaxi de pedal («coche») | 2 adultos ✔ | viajes de barrio de 1–3 km ≈; necesita LOT para pasaje ([EFE feb-2026](https://www.lanacion.com.py/mundo/2026/02/18/cuba-encara-la-crisis-de-combustible-con-triciclos-electricos-y-bicitaxis/)) |
| Triciclo eléctrico de pasaje (casi todos chinos; «tuk-tuk» si tiene techo) | 4–6 asientos, algunos 6–8 ✔ | 2.000–4.000 USD ✔ ([EFE abr-2026](https://www.prensa.com/mundo/los-triciclos-electricos-en-la-habana-la-alternativa-a-la-crisis-energetica-en-cuba/)); el estatal: 6 pasajeros, 45 km/h ✔ |
| Triciclo eléctrico de carga (cajón o «cama») | tiendas: 400–800 kg ✔; en la práctica 100–300 kg ✔ | [Havana Times](https://havanatimes.org/?p=244374) |
| Motorina / moto (eléctrica o gasolina), a veces con sidecar | 1 persona ✔ (sidecar 2–3 ≈) | licencia A1 |
| Triciclo de gasolina | — | pocos: falta gasolina en 2026 ≈ |
| Cocotaxi | 2 | turístico: no conviene como categoría |

**Licencias ✔:** desde feb-2026 hay **LOT temporal hasta el 31-dic-2026** para motos y triciclos sin placa (licencia categoría A + demostrar que el vehículo es legal; el número de chasis sustituye la placa) ([CiberCuba](https://en.cibercuba.com/noticias/2026-02-23-u1-e208512-s27061-nid321460-otorgaran-licencias-transporte-pasajeros-motos)).

**La Nave** tiene 5 categorías: Moto, Basic, Comfort, Basic XL y Comfort XL ✔ (no se vio una categoría «Triciclo»).

**Precios ✔:** triciclo eléctrico privado, viaje corto 100–150 CUP (hasta 250 lejos) ([CiberCuba mar-2026](https://en.cibercuba.com/noticias/2026-03-09-u1-e135253-s27061-nid322643-guaguas-ni-gasolina-triciclos-electricos-vuelven)); 200–500 CUP según distancia ([Havana Times jun-2026](https://havanatimes.org/?p=244374)). Bicitaxi 2026: sin dato (≈ 100–200 CUP).

### Propuesta de categorías para el cliente (≈, por decidir con Ernesto)

| Nombre | Para qué | Capacidad | Símbolo propio |
|---|---|---|---|
| Bici | pedal, tramos cortos | 2 | triciclo de lado + pedal |
| Eléctrico | pasaje normal | 3–4 | triciclo de lado + rayo |
| Eléctrico XL | grupo o familia | 6–8 | triciclo largo con techo + rayo |
| Motor | gasolina, más lejos o lomas | 2–4 | triciclo de lado + gota |
| Moto | rápido, 1 persona | 1 | moto de lado |
| Carga | mudanza o mercancía | hasta 150 kg / hasta 500 kg | triciclo + caja |

**Lo que marca el chofer en el alta** (Ernesto 4-nov): foto del triciclo de frente o de lado, pasaje o carga, gasolina o eléctrico (o pedal), número de asientos o kilos, su foto de perfil y la licencia (opcional, porque muchos no la tienen). La app pone la categoría con esos datos. Ernesto aprueba por **correo con enlace** (un toque).
