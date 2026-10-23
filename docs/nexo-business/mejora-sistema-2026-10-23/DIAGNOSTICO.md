# Diagnóstico «fuera de la caja» de Casa Viva / NEXO — 23-oct-2026

> Solo lectura. Nada cambiado ni enviado. Datos sacados el 23-oct entre las 11:30 y las 12:30 (Cuba) de: `crm_errores`, `crm_messages`, `crm_outbox`, `crm_escalations`, `crm_supervisor`, `crm_knowledge`, `crm_dispatch`, `crm_wa_messages`, `cv pedidos-hoy`, `cv gastos`, `cv preguntas`, crontab y logs del VPS, opciones de WordPress en producción, y docs (ESTADO L19–L59, DECISIONES D60–D97, LECCIONES, TRASPASO, redes, proveedores, fidelidad).
> Lo que es **estimación** va marcado con «≈» o «(estimado)».

---

## 1. Números clave

### Ventas (web, reales: sin pruebas ni cancelados)
| Día | Pedidos | USD |
|---|---|---|
| sáb 18-oct | 12 | 568 |
| dom 19-oct | 18 | 706 |
| lun 20-oct | 22 | 751 |
| mar 21-oct | 14 | 574 |
| mié 22-oct | 18 | 800 |
| jue 23-oct (hasta 12:07) | 5 | 140 |
- **Media 18–22 oct: ≈ 17 pedidos/día y ≈ 680 USD/día. Ticket medio ≈ 40 USD.** Del 10 al 15-oct eran ≈ 13 pedidos y ≈ 600 USD al día: crece despacio.
- **36 gestoras vendieron en 7 días**, de 77 contactos con rol gestora (71 aprobadas). Dos de ellas hacen el 27 %: Daymee 15 pedidos y Nadielys 9.
- **21 mensajeros distintos** hicieron 114 carreras en 7 días (102 entregadas, 8 canceladas).
  - Pedri 18, Ely 16, Alejandro 15, Daiquel 14, Fernando 10.
  - **Una carrera se coge en 18 s de mediana** (el 90 % en menos de 3 min): el grupo de Mensajerías ya funciona para repartir.

### Mensajes (últimos 7 días)
- **Chats privados del bot: 6.885 mensajes ≈ 985 al día** (≈ 450 entrantes y ≈ 530 salientes).

| Entrantes por rol en 7 días | Mensajes | Al día |
|---|---|---|
| Gestoras | 1.686 | **≈ 240** |
| Lennys (admin, 1 persona) | 598 | **≈ 85** |
| Mensajeros | 280 | ≈ 40 |
| Clientes | 273 | ≈ 39 |
| Privados de Ernesto | 324 | ≈ 46 |

- Grupo General: 408 mensajes (≈ 58 al día). Mensajerías guarda 58 (el bot no guarda los suyos).
- **Escritos a mano desde el teléfono del bot (`author=humano`): 741.** De ellos, 536 son de trabajo (gestoras 300, clientes 90, admin 75, mensajeros 71): **≈ 77 al día**.
- **Buzón `crm_outbox`: 1.463 envíos en 7 días.**
  - **839 creados por `claude`** (`cv enviar`, es decir sesiones de Claude o el supervisor escribiendo a mano): **≈ 120 al día**.
  - Unos 80 más con etiquetas `codex-*` / `claude-xag` / `claude-42y23` / `claude-pc`.
  - Automáticos (pagos, novedades, avisos, resúmenes, tasa, bajo pedido): ≈ 400.
  - Solo 7 errores de envío: el buzón es fiable.

### Errores, escalaciones y preguntas
- **`crm_errores`: 75 errores apuntados**, 61 el 22-oct y 14 el 23-oct. El registro empezó el 22-oct (D89); los casos son del 15 al 23-oct, casi todos del 19 al 23.
  - **Por tipo:** no_ayudo 17 · entendio_mal 15 · técnico 13 · regla 11 · **invento 10 · promesa 5** · destino_equivocado 2 · datos 1 · interpretación 1.
  - **Por gravedad:** alta 18 · media 49 · baja 8.
  - **Por estado:** 40 corregidos · **28 «para decidir» (esperan a Ernesto)** · 5 abiertos · 2 descartados.
  - Quién los encontró: Claude 62, Codex 13.
  - **Ritmo real: ≈ 15–20 errores nuevos al día laborable** (estimado con 19–23 oct).
- **Escalaciones `crm_escalations`: 161 en 7 días (≈ 23 al día); 116 siguen abiertas.** 15 tienen más de 7 días y 35 entre 3 y 7. 121 son de tipo «decision». **18 son «Fallo de la IA: 429 no credit».**
- **Preguntas pendientes para Ernesto en `crm_supervisor`: 36 sin cerrar, desde el 8-oct.** Por ejemplo:
  - #9: Dany sobre el vale, 8-oct.
  - #394: Lennys pregunta si las carreras salen al crear el pedido. Ya se hizo (`cvd_dispatch_on_create=yes`), pero sigue «pendiente».
  - #581: número de pedido consecutivo.
  - #600: ventas sin enlace de gestora.
  - #658 y #668: resúmenes Hormozi sin respuesta.
- **Conocimiento del bot: 87 respuestas en «pendiente»**, sin revisar, frente a 213 activas. Ejemplo: la #290 «¿por qué no carga el catálogo?» espera a Ernesto, y el error #27 sale justo de ahí.
- **Preguntas a la tienda (`cv preguntas`, 7 días): 57.** 25 respondidas · 7 cerradas · **12 caducadas (21 %)** · 13 abiertas.

### Coste
- **IA del bot: 15,75 USD en 7 días = 2,25 USD/día ≈ 68 USD/mes.** El objetivo de D72 era 0,50 USD/día.
  - **gpt-4.1 se lleva el 91 %** (14,27 USD).
  - **«Chats con gestoras» se lleva el 75 %** (11,75 USD; 11.275 tokens de entrada por llamada; 46 % sale de la caché).
- **Gastos fijos: 198,58 USD/mes**, más 4 sin dato (Render, Groq, Resend, OpenAI prepago).
  - Claude 100 (50 %) · **Higgsfield 80 (40 %)** · Hostinger 13 · ElevenLabs 5 · dominio 0,58.
- **Coste de herramientas por día ≈ 6,6 (fijos) + 2,25 (IA) ≈ 8,9 USD.**
  - **≈ 0,13 USD de IA por pedido.**
  - **≈ 0,52 USD de herramientas por pedido.**
  - ≈ 1,3 % de lo vendido (estimado).
- **Claude del supervisor: ≈ 34,5 USD «equivalentes» en 192 vueltas en 7 días.** No se paga aparte, pero gasta el cupo de los 100 USD.
- **ElevenLabs:** 32.488 de 40.000 caracteres usados. Se gastan ≈ 3.600 al día y quedan 7.512, así que **se acaba hacia el 25-oct**, antes de la renovación del 7-nov (estimado). Sin voz, las notas de voz del bot fallan.

### Intervenciones manuales al día (estimado con los datos de 7 días)
| Quién | Qué | Al día |
|---|---|---|
| Ernesto (teléfono del bot) | mensajes de trabajo escritos a mano | ≈ 77 |
| Sesiones Claude / supervisor | `cv enviar` a mano | ≈ 120 |
| Codex (envíos con etiqueta propia) | mensajes a mano por casos | ≈ 11 |
| Supervisor Codex en el VPS | vueltas: **358 de 364 «deferred»** (no hizo nada) | ≈ 80 vueltas |
| Supervisor Claude (hasta el 18-oct) | 43–101 vueltas al día; el 18-oct, 16 fallos | — |
| Ernesto en persona | recoger y pagar en la TRD 42 y 23, llevar pedidos en su carro (#4974), vales en la app de Kevin, instalar la caja, Revolico 2 veces al día, pegar SQL, recargar OpenAI | varias |

---

## 2. Los 10 problemas que más cuestan

Están ordenados por coste: dinero, tiempo de Ernesto y confianza de gestoras y clientes. En cada uno: evidencia → causa de raíz.

### P1. Ernesto es el embudo de todas las decisiones, y estas mueren en 4 bandejas distintas
- **Evidencia:**
  - Hay cuatro sitios donde esperan cosas suyas:
    - 36 preguntas pendientes en `crm_supervisor`, desde el 8-oct;
    - 28 errores «para decidir»;
    - 87 conocimientos «pendiente»;
    - 116 escalaciones abiertas.
  - En ESTADO hay más de 25 decisiones abiertas suyas (lista (b) del informe de docs): mínimo de las piedras, SeFué, XAG, 33 USD de comisiones del equipo, quién paga los puntos, D97 en la caja…
  - Errores que salen directamente de esto:
    - #70: Lennys dijo «Sube el premio», pero el relevo esperaba la frase exacta «publicar premios», y nadie publicó los premios de septiembre.
    - #658 y #668: los resúmenes no salen sin «SÍ N».
  - Además, ≈ 77 mensajes al día escritos a mano por él.
- **Causa de raíz:** no existe **una sola bandeja de decisiones con botones** (Sí / No / Otra cosa, con la recomendación ya hecha), ni una regla de «si en 24 h no contestas, aplico la recomendación cuando sea reversible». Cada agente pregunta en texto libre y en un sitio distinto. Las aprobaciones dependen de frases exactas.

### P2. Preguntas de producto sin respuesta o mal respondidas: un tercio de los errores
- **Evidencia:**
  - **25 de los 75 errores salen del grupo General y de las preguntas de producto:** #16, #18–#41.
  - Casos:
    - #23 y #34: no se contesta si falta el signo «?».
    - #29 y #39: la pregunta de seguimiento pierde el producto.
    - #26: no dice que está agotado.
    - #28: dice «sí hay» sin el atributo «doble».
    - #31: enseña el código interno «ptn…».
    - #32: niega el cable tipo C cuando la ficha dice USB-C.
  - **12 de 57 preguntas a la tienda caducaron.**
  - En la tienda, **124 de 212 fichas** están sin datos completos (L41), y 17 no tienen descripción larga.
- **Causa de raíz:** **los datos del producto no están estructurados** (voltaje, medidas, material, carga, qué trae, stock, «bajo pedido»). El bot adivina con texto libre y un filtro de palabras. Cada respuesta de Nana o Zaymi se queda en el chat en lugar de volver a la ficha, así que la misma pregunta se hace una y otra vez.

### P3. El bot dice que hizo cosas que no hizo, o que no puede hacer
- **Evidencia (15 errores de tipo invento o promesa):**
  - #1: «ya está reportada y subida» la comisión de Nadielys (gravedad alta).
  - #3: «ya lo marco como devuelto».
  - #15: «te mando fotos» y no las mandó.
  - #30: ofreció enlaces y no los mandó.
  - #43: «dejo preparado el pedido».
  - #47: «el bolso llega hoy» sin hora confirmada.
  - #59: «estoy en la página de BizneCubano».
  - #64: «una persona te escribe mañana».
  - #65: «ya lo paso a Daiquel» sin comprobarlo.
  - #73: «tu cuenta está pendiente», cuando ya estaba aprobada.
  - #66: «pagos de octubre», cuando octubre es solo prueba.
- **Causa de raíz:** la IA **redacta el estado del sistema sin leerlo ni escribirlo con una herramienta que devuelva un recibo**. Se está parcheando frase a frase con reglas de palabras (`src/acciones-falsas-rules.js`), y eso nunca termina.

### P4. Un pedido de proveedor cuesta lo que diez pedidos normales
- **Evidencia:**
  - **#4963** (un bolso de Kevin, gestora Maryta) generó **44 envíos del buzón y 8 errores**: #10, #42, #47, #51, #53, #54, #55 y #65.
    - El teléfono de la gestora acabó como teléfono del cliente.
    - Hubo avisos dobles de Codex y del motor.
    - Se dijo «llega hoy» sin hora confirmada.
    - El «Suelto» de un mensajero se ignoró.
    - Se dijo que un mensajero se había ofrecido cuando no era así.
  - #4974: Ernesto lo llevó en su carro, y el resumen lo volvió a ofrecer (#74).
  - #57: el tarifario de la app de Kevin está atrasado.
  - Al proveedor se le contesta como a un cliente (#52 XAG, #61 y #75 SeFué), o se le pregunta al proveedor equivocado (#14).
  - **Hay más de 300 productos MK- publicados** (Sergio 103, LJH 164, Kevin, 42 y 23 con 23 fichas, XAG 8). **En octubre solo hubo unas 7 ventas de proveedor**; la comisión de Ernesto fue ≈ 60,93 USD.
  - Kevin tiene 412 de 682 artículos bloqueados por falta de foto.
  - SeFué: 145 de 146 productos saldrían más caros que en su propia web.
- **Causa de raíz:**
  - No hay **un único camino de estados para un pedido de proveedor**: pedido → confirmado por el proveedor → pagado → recogido → en tienda → reparto. Cada proveedor tiene sus propios scripts y su carpeta (D66, D69, D73, D85, D90, D93, D95).
  - El contacto «proveedor» **no es un rol que el bot respete**.
  - Se publican catálogos enteros sin saber qué se vende.

### P5. Reglas de comisión y de «a quién pertenece el cliente» cambiadas más de 11 veces, y la caja no las cumple
- **Evidencia:**
  - Decisiones: D64, D68, D78, D80, D87, D88, D92, D93, D95, D97, más el conocimiento #287.
  - #3833: se pagó doble (2,30 USD a Zaymi, le tocaba a Katia).
  - 33 USD de comisiones del equipo ya pagadas siguen sin decidir: #4222, #4097, #3942, #3939, #3887 y #3696.
  - **58 pedidos de 24 gestoras** llevaban el teléfono de la propia gestora (L24). Casos #10 y #51.
  - #48: los enlaces que ve el cliente no llevan el `?ref` de la gestora.
  - La caja no aplica D97 (no busca a la gestora por teléfono) y aplicaba el 0,5 % en lugar del 2 % de D80.
- **Causa de raíz:** las reglas viven repartidas en Core, en el bot, en la caja y en los CLAUDE.md. **No hay un motor de reglas único** (una función o un endpoint) que usen los tres. Además, el formulario «Vender» **no valida** que el teléfono del cliente sea distinto del de la gestora.

### P6. La IA cuesta 4,5 veces más de lo decidido y se queda sin saldo
- **Evidencia:**
  - D72 (15-oct) decía `OPENAI_MODEL_SMART=gpt-4.1-mini`. **Hoy el `.env` del VPS tiene `OPENAI_MODEL_SMART=gpt-4.1`**; el `.env` se modificó el 22-oct.
  - Por eso gpt-4.1 es el 91 % del gasto y el día sale a 2,25 USD en lugar de 0,50.
  - 50 llamadas fallaron por falta de saldo en 7 días, y hubo **18 escalaciones «429 no credit»**. Cortes de OpenAI el 14-oct (224 llamadas fallidas) y el 18-oct.
  - No hay recarga automática ni clave Admin para leer el gasto real.
- **Causa de raíz:** **la configuración no tiene vigilante**. Una decisión escrita (D72) se deshizo sin aviso, y no hay ni tope diario en el bot ni alarma de «modelo distinto al decidido».

### P7. Mensajeros: coger la carrera funciona, pero el «entregado» y el dinero se escapan
- **Evidencia:**
  - #4223: Daiquel la entregó, quedó «para revisión», y Pedri la volvió a coger.
  - #3863: Leonardo; el bot dijo «Anotado» y no marcó nada.
  - #3842, #3857 y #3861: contacto «fantasma» @lid.
  - #54: el «Suelto» en el grupo se ignora.
  - #56: el aviso pedía 234 USD en lugar de 300 porque no sumaba el vuelto.
  - #58: un mensajero nuevo quedó sin respuesta porque estaba en pausa.
  - #4: problema de entrega tratado como «entregado».
  - #65: «pasar a Daiquel» sin comprobar.
  - #74: se volvió a ofrecer un pedido ya entregado.
  - **El horario de los avisos de dinero cambió 4 veces en una semana** (L33, L50, L55).
  - Con el enlace del vale no sale «✅ #N entregado por X» a la tienda (L37).
- **Causa de raíz:** la entrega se lleva **por chat libre más regex**, y la verdad está repartida entre `crm_dispatch` y Core. El mensajero **no tiene una tarjeta de carrera con botones** (Recogí / Entregado / Problema / Dinero entregado). Lo que existe (portal, enlace firmado) no lo usa casi nadie, porque el WhatsApp es más cómodo.

### P8. La supervisión automática trabaja mucho y sirve poco; las reglas crecen sin control
- **Evidencia:**
  - **Supervisor Codex (activo desde el 19-oct): 364 vueltas en 5 días, 358 «deferred»** (el 98 % no hizo nada). Ejemplo de la última: «No se cumplen las condiciones… se conservan las mismas tareas pendientes».
  - El supervisor Claude llegó a 101 vueltas al día, con 16 fallos el 18-oct. Los motivos que más se repetían eran escalación, «evasiva» y «sin_respuesta».
  - `CLAUDE.md` del supervisor tiene 490 líneas y `CODEX-VPS.md` 710, con más de 25 copias `.bak`.
  - **13 tareas de «una sola vez» siguen en el crontab** (12, 16, 17 y 21 de octubre); el año que viene se volverían a disparar.
  - #12: una revisión escrita en instrucciones nunca tuvo un disparador.
  - #42: Codex y el motor avisaron a la vez.
- **Causa de raíz:** **lo aprendido se guarda como prosa en instrucciones, no como código y pruebas.** Hay 4 agentes (Claude en el PC, Claude en el VPS, la sesión del móvil y Codex) sin un dueño claro por tarea.

### P9. La caja NEXO no está en uso real ni ve el dinero de la web
- **Evidencia:**
  - A las 10:00 del 22-oct **ninguna caja tenía la 1.1.1** (todas seguían en 1.1.0, L56).
  - Los teléfonos de Nana y Zaymi no se conectaban y la PC no estaba dada de alta (auditoría del 20-oct, L42).
  - Turno de Lennys abierto desde el 11-oct y turno huérfano de Zaymi (`12025c00`).
  - Al teléfono de Zaymi le pasó lo del punto 6 de las notas de la 1.1.0: dejó de sincronizar a las 12:41.
  - Tasa clavada en 775 desde el 3-oct (L53; hoy la pone el cron de las 8:50).
  - Hay **dos sitios para cobrar** (`/ventas/` y la caja). La caja no aplica D97.
  - «Venta de mostrador» (D80) sin construir.
- **Causa de raíz:** **instalar y mantener la caja depende de que Ernesto vaya en persona.** Además, la caja se pensó al principio para ventas de mostrador, y casi todo el dinero llega por pedidos web.

### P10. Redes y clientes: dinero en contenido que no vende, y un bot que molesta a los clientes VIP
- **Evidencia:**
  - **Higgsfield cuesta 80 USD/mes (40 % de los fijos).** La página de Facebook tiene **8 seguidores**. D94 lo dice claro: «con 8–12 seguidores los reels no movieron ventas; las ventas llegan por las gestoras».
  - Reel del 12-oct: 171 vistas, 42 % pasa de 3 s, 1 me gusta. Reel del 16-oct: 1.426 de alcance.
  - Del 17 al 21-oct no se publicó nada.
  - El sorteo del topper se prometió en un reel y luego se quitó (D94).
  - Clientes VIP:
    - **#71: a Daria le repitió 8 veces «escríbele a Nadielys»** mientras ella sospechaba una estafa.
    - #69: contestó a «gracias» y a contestadores automáticos de otros negocios.
    - #72: volvió a invitar a clientes que ya se habían invitado el 22-oct.
- **Causa de raíz:**
  - El contenido se piensa **para la página propia, cuando el canal real son las 36 gestoras activas**.
  - Al grupo VIP se le puso un texto fijo **sin regla de «no repetir» ni de «callar»**.

---

## 3. Por área

### Mensajeros
- **Funciona:**
  - Coger la carrera en el grupo (mediana 18 s).
  - Sale la carrera al crear el pedido (`cvd_dispatch_on_create=yes`).
  - La tienda cierra el pedido al recibir el dinero (3.14.38).
  - Enlace firmado «Entregado» en el vale (3.14.39).
  - Vuelto de la tienda dentro del aviso de «entregado» (L56).
  - Unir pedidos de la misma clienta (`join_same_customer`).
- **Falla:** P7. Además, los avisos de dinero han cambiado de horario 4 veces, @lid, «Suelto», el vuelto y la reoferta de pedidos ya entregados.
- **Arreglos de hoy (menos de 1 día):**
  1. «Suelto» o «Ya no puedo» en el grupo se resuelve por quien lo escribe, o por su única carrera activa (#54; la propuesta ya está escrita).
  2. Que el enlace «Entregado» del vale mande también «✅ #N entregado por X» a la de turno (L37).
  3. Congelar el horario de avisos: 9:30 y 14:30, y no tocarlo en 2 semanas. Medir cuántos «entregado» faltan a las 18:00.
- **Apuesta grande:** la **tarjeta de carrera** (ver §5). Un enlace firmado por pedido con 4 botones; el WhatsApp queda solo para «Yo».

### Gestoras
- **Funciona:**
  - App de gestora abierta a todas (`cvd_gestora_app=all`) y estudio de fotos abierto (`cvd_estudio_acceso=all`).
  - Tienda espejo con su precio; NEXO Busca; «¿Es de confianza?».
  - D97 en Core 3.14.52; programa de piedras en prueba para todas.
  - 36 vendieron esta semana.
- **Falla:**
  - El bot es su único canal: 240 mensajes al día, que son el 75 % del gasto de IA.
  - Preguntas de producto (P2), comisiones (P5) y el teléfono del cliente.
  - Tutoriales listos sin enviar (estudio de fotos, NEXO Busca).
- **Arreglos de hoy:**
  1. En «Vender» (Core), bloquear o avisar si el teléfono del cliente es el de la gestora (#10, #51; 58 pedidos afectados).
  2. Toda respuesta de producto dice «hay N / agotado / bajo pedido» (#26, #38).
  3. Poner `?ref=` de la gestora en los enlaces del vale y del seguimiento (#48; necesita el sí de Ernesto).
- **Apuesta grande:** el **botón «Pregunta sobre este producto» dentro de la ficha** de su app. La pregunta va atada al ID del producto, la contesta la tienda en un toque, la respuesta se guarda en la ficha y se avisa a todas las que preguntaron (ver §4 y §5).

### Clientes
- **Funciona:** «Mi pedido» sin cuenta, seguimiento en vivo, Billete Seguro (D82), lista de sospechosos (20 números, 5 confirmados), D97.
- **Falla:**
  - Bucles del bot en el grupo VIP (#69, #71, #72).
  - Estafas reales (#4220, billetes falsos de 100).
  - 20 clientes tienen dueña solo por un pedido cancelado.
  - Puntos: 0 dados; el canje es 100 % a mano y no se sabe quién paga el descuento.
- **Arreglos de hoy:**
  1. Regla de silencio: al cliente de una gestora, el «escríbele a X» se dice **una sola vez cada 7 días**; a «gracias» y a contestadores, nada (#69, #71).
  2. Parar las invitaciones VIP hasta revisar `invitar.sh` contra todo el historial (#72 corregido; comprobarlo en uso real).
- **Apuesta grande:** que el cliente **no hable con el bot de Casa Viva**: todo va a su gestora (D97 ya lo dice), y el bot solo atiende «Mi pedido #N» con datos de Core.

### Redes sociales
- **Funciona:**
  - Videos con HyperFrames a 0 créditos (22-oct).
  - D96: los videos van sin enlace y se reenvían al General para que cada gestora ponga el suyo.
- **Falla:** P10. Publicación a saltos; no se mide; 8 seguidores; Revolico a mano 2 veces al día.
- **Arreglos de hoy:**
  1. Medir lo único que importa: cuántas gestoras reenvían el video del día y cuántos «VENDER» o «APAGÓN» llegan (D94).
  2. Preguntar a Ernesto si **pausa Higgsfield** (80 USD/mes) hasta que haya un reel que venda; se puede seguir con HyperFrames gratis.
- **Apuesta grande:** el **«kit diario de la gestora»** en su app: 1 video vertical sin enlace, 3 fotos reales y un texto con su `?ref`, para compartir en un toque. Las redes de Casa Viva pasan a ser solo una vitrina.

### Bot / IA
- **Funciona:**
  - Registro único de errores (D89) con revisión a las 20:30, 21:00 y 21:40.
  - Buzón fiable (7 errores de 1.463).
  - Tasa automática con reintentos.
  - Fotos reales del equipo (D70); búsquedas con tope de 1 USD al día.
- **Falla:**
  - P3 (afirma cosas sin comprobar).
  - P6 (gpt-4.1 en lugar de mini; sin saldo).
  - Filtro del General (P2).
  - El proveedor tratado como cliente (#52, #61, #75).
  - `cv reiniciar` necesita `--sin-check` por una prueba que depende del `.env` (#7; L42, L43, L56, L57).
- **Arreglos de hoy:**
  1. Volver `OPENAI_MODEL_SMART` a `gpt-4.1-mini` (D72) y probarlo 1 día con Dany. **Ahorro ≈ 1,45 USD/día.** Ojo: es un cambio del `.env`, va con el sí de Ernesto y con `cv reiniciar`.
  2. Rol **proveedor** en `crm_contacts`: al proveedor el bot solo le dice «recibido, se lo paso a Ernesto» (#52, #61, #75).
  3. Aislar la prueba `catalog-commission` del `.env` (#7), para que `cv reiniciar` vuelva a proteger.
- **Apuesta grande:** **«acciones con recibo»**. La IA no puede escribir frases de estado («hecho», «anotado», «pagado», «aprobado», «llega hoy»). Solo puede llamar a una herramienta, que devuelve un recibo, y es el recibo lo que se le manda a la persona. Con eso desaparece la familia de errores de P3.

### Productos propios
- **Funciona:** regla de precio ×1,5 con mínimo (D68), gastos fijos ≈ 8 % (D74), altas rápidas (Nana 4896–4913, Dayra, Ely).
- **Falla:**
  - 124 de 212 fichas incompletas.
  - 11 productos dejan menos de 1 USD; 19 están por debajo del costo; 20 bajo el mínimo.
  - La lista de precios de Lennys sigue sin devolver (D78).
  - `fichas_auto` sigue en «prueba».
- **Arreglos de hoy:**
  1. Lista de los **20 productos más preguntados** (de las preguntas a la tienda y del General) y completar SOLO esos atributos con Nana o Zaymi (unos 30 min en la tienda).
  2. Mandar a Lennys solo los 19 que están bajo el costo, con sus números (regla «explicar primero»).
- **Apuesta grande:** ficha con **campos fijos por categoría** (voltaje, medidas, material, carga, qué trae, garantía) que el bot lee, sin texto libre. Cada respuesta de la tienda rellena un campo.

### Productos de proveedor bajo pedido
- **Funciona:**
  - Motor de bajo pedido con 24 h, doble comprobación (D73) y «de quién es el MK-» (D90).
  - Reparto y estadísticas de proveedor en Core 3.14.50 (margen medio 17,8 %).
- **Falla:** P4. Más de 300 productos publicados para unas 7 ventas; 44 mensajes en un solo pedido; Ernesto recoge y paga en persona; tarifas atrasadas; SeFué más caro que su propia web.
- **Arreglos de hoy:**
  1. Fijar como fuente la tabla de tarifas de Kevin (#57, pide el sí de Ernesto) y quitar las de su app.
  2. No publicar SeFué hasta conseguir −5 % o precio de mayorista. Con −3 % pierde contra su web en 145 de 146 productos.
  3. Ocultar los MK- sin foto y los que llevan 30 días sin ninguna consulta (hay que medirlo primero).
- **Apuesta grande:**
  - **Un único estado de pedido de proveedor** dentro del `order-transition-service` de Core (confirmado, pagado, recogido, en tienda), con **un solo aviso por cambio** a gestora, tienda y mensajero, sin mensajes a mano.
  - **Ruta de recogida semanal o por lotes** (martes y viernes) en lugar de un viaje de Ernesto por cada pedido.

### Caja
- **Funciona:** 1.1.1 hecha (cobro de pedidos web con la tasa del pedido, «Cambiar tasa» con motivo, cierre con billetes); la laptop de Lennys conectada; el cierre en papel cuadró el 20-oct.
- **Falla:** P9.
- **Arreglos de hoy:**
  1. Cerrar los 2 turnos huérfanos (el de Lennys desde el 11-oct y el de Zaymi `12025c00`).
  2. Mandar a Nana y Zaymi una guía de 3 imágenes para «actualizar a 1.1.1 encima» (APK con la misma firma).
- **Apuesta grande:** que la caja sea **el único sitio donde se cobra** (quitar el cobro de `/ventas/`), con D97 dentro (buscar la gestora por teléfono) y venta de mostrador (D80).

### Gastos
- **Funciona:** el informe `cv gastos` (diario, por función, con sugerencias); correo a las 21:00.
- **Falla:**
  - D72 no está en vigor.
  - Sin recarga automática de OpenAI ni tope diario.
  - ElevenLabs se acaba hacia el 25-oct.
  - Hay 4 fijos sin dato.
  - El supervisor Claude gasta ≈ 34,5 USD equivalentes por semana en vueltas.
- **Arreglos de hoy:**
  1. Alarma en `cv estado`: «modelo distinto de D72» y «ElevenLabs con menos de 5.000 caracteres».
  2. Tope diario de IA en el bot (por ejemplo 3 USD) con aviso a «Tú».
  3. Ordenar el prompt para que la parte fija vaya primero; la caché pasaría del 38 % al 60 %, **≈ 0,40 USD/día**.
- **Apuesta grande:** que el gasto de IA **por pedido** sea un número fijo del panel, con meta de 0,05 USD por pedido.

### Forma de trabajo de Ernesto con Claude
- **Funciona:**
  - La fuente de verdad (ESTADO, DECISIONES).
  - El registro de errores.
  - El «Archivo de Ernesto» (`dbff98a`, 23-oct).
  - La sesión del móvil que vuelve sola.
- **Falla:**
  - 4 agentes sin un dueño por tarea (#42: Codex y el motor duplicaron avisos).
  - Más de 25 decisiones abiertas y 36 preguntas viejas.
  - Aprobaciones con frases exactas (#70).
  - Instrucciones en prosa de 1.200 líneas.
  - Ernesto hace a mano Revolico, recogidas, vales de Kevin, recargas y SQL.
- **Arreglos de hoy:**
  1. **Limpiar las bandejas:** cerrar las 36 preguntas de `crm_supervisor` (muchas ya se resolvieron), las escalaciones de más de 7 días y las 18 escalaciones «429».
  2. **Un parte único a las 9:00** con como mucho 5 decisiones, cada una con «Recomiendo X · responde 1, 2 o 3». Si en 24 h no contesta, se aplica la recomendación en lo reversible (eso ya está en la memoria «Ernesto decide, Claude recomienda»).
  3. Borrar del crontab las 13 tareas de una sola vez ya pasadas (con copia).
- **Apuesta grande:** **la app de Ernesto** (§5): una bandeja de decisiones en `/control/`, que ya existe con 11 vistas solo para el usuario 1.

---

## 4. Ideas fuera de la caja (con evidencia)

1. **Cada error se convierte en una prueba automática, no en una regla en prosa.** Los 75 errores ya tienen «qué pasó», «qué debía» y «lección». Un script nocturno en el VPS convertiría cada uno en una prueba de regresión (mensaje real → respuesta esperada) y las correría antes de cada `cv reiniciar`.
   - Evidencia: la lección repetida #15/#16/#18/#23/#34/#35/#40, «Comprobar cada frase real contra el código ejecutado…».
   - El supervisor Codex podría hacer esto en lugar de 80 vueltas al día «deferred».
2. **Donde el bot debería callarse:**
   - Con proveedores: solo «recibido» (#52, #61, #75).
   - Con clientes de gestora: una vez y basta (#69, #71).
   - En el General, cuando otra gestora ya contestó (#33 `isAnswerToOther`).
   - Ante «gracias» y contestadores (#69).
   - Siempre que vaya a afirmar algo del sistema sin herramienta (P3).
   - Callar es gratis y es la mayor fuente de confianza.
3. **La pregunta de producto como botón, no como chat.** Son 240 mensajes al día de gestoras (75 % del gasto de IA), y un tercio de los errores son preguntas de producto. Si la ficha de su app tiene el botón «Preguntar» con 6 opciones (¿voltaje? ¿medidas? ¿material? ¿qué trae? ¿cuándo llega? ¿foto real?), la tienda contesta en un toque y la respuesta queda en la ficha para siempre. **Así la misma pregunta nunca se hace dos veces.**
4. **«Respuesta de la tienda → campo de la ficha» automático.** Ya existen `cv preguntar` y `cv aprender`; falta que la respuesta se escriba en la ficha de Woo (`_cvd_ficha_datos`) y no solo en `crm_knowledge`. Hoy hay 87 conocimientos pendientes que nadie revisa.
5. **Catálogo de proveedor «a demanda».** En lugar de publicar 300 productos (unas 7 ventas al mes), publicar los 30 más buscados en NEXO Busca o en el General; el resto, «lo buscamos por ti» con el formulario de NEXO Busca. Menos fichas que mantener, menos «sí hay» falsos (#38) y menos fotos que faltan (412 de Kevin).
6. **Recogidas en lote para la TRD 42 y 23 y para Kevin.** Hoy Ernesto va por cada pedido (#4974 en su carro). Dos rutas fijas a la semana, con un mensajero de confianza que recibe el dinero en la tienda, sacan a Ernesto de la calle.
7. **Lo que hoy se hace a mano en el VPS y podría ir solo:**
   - ≈ 120 `cv enviar` al día, casi todos de plantilla: bienvenidas, enlaces de grupo, «tu cuenta ya está aprobada» (#73).
   - Cerrar escalaciones viejas.
   - Cerrar preguntas a la tienda que ya tuvieron respuesta.
   - Cerrar turnos huérfanos de la caja.
   - Borrar crons caducados.
   - Una alarma de «configuración distinta a la decidida» (D72).
   - Una alarma de cuota de ElevenLabs.
8. **El supervisor como «auditor de 1 vez al día» en lugar de un bucle de cada minuto.** 358 de 364 vueltas no hicieron nada. Mejor:
   - un barrido a las 13:00 y otro a las 18:00 con una lista concreta (entregas sin marcar, dinero pendiente, preguntas caducadas, escalaciones de más de 24 h);
   - más el disparo inmediato solo para «pago», «queja» o «estafa».
9. **Lennys escribe 85 mensajes al día al bot** cuando «tiene poco tiempo». Sus órdenes repetidas (subir productos, premios, tasa, precios) deberían ser botones del panel con confirmación, no chat (#68 «Sube el premio» mal entendido; #70).
10. **La tasa del día con una sola regla escrita en un solo sitio.** #67: el bot dio 3 versiones distintas de quién pone la tasa. La regla debe vivir en `crm_settings` y el bot citarla, nunca redactarla.

---

## 5. Apps: qué hay, qué falta y el MVP del «80 %»

### 5.1 Mensajeros
- **Ya existe:**
  - En Core: `/area-mensajeros/` con el portal clásico (`[casa_viva_portal role=mensajero]`: ofertas, ruta, contactos, cierre y entrega del dinero) y el feed `GET /messenger/feed`.
  - `class-cvd-messenger-delivered-link.php`: enlace firmado `?cvd_entregado=ID&t=…` de 7 días, sin iniciar sesión.
  - Otros módulos: `messenger-cash` (dinero por entregar), `messenger-accounting`, `messenger-reputation`, `live-tracking` (`/delivery/{id}/location`).
  - Web push para mensajeros aprobados; PWA `/casa-viva-app/`.
  - En el bot: «Yo», «Suelto», «entregado #N», traspasos y avisos a las 9:30 y 14:30.
  - En la caja: «Efectivo de mensajeros».
- **Qué duele:** «entregado» sin marcar o mal marcado, «Suelto» ignorado, el vuelto, problemas de entrega, reofertas (#4, #54, #56, #58, #65, #74, #4223). Casi nadie usa el portal.
- **MVP «Tarjeta de carrera»** (≈ 1–2 días; extiende el enlace firmado que ya existe):
  - Al coger la carrera, el bot le manda **un solo enlace firmado por pedido**, válido 48 h y sin contraseña.
  - La página tiene: dirección y teléfono del cliente (los del pedido actual de Woo, #51), **cuánto cobrar y cuánto traer a la tienda con el vuelto** (#56) y 4 botones grandes:
    - **Recogí**;
    - **Entregado** (cobré X);
    - **Problema** (no estaba / solo quiso una parte / devuelve / vale mal / otro);
    - **Ya no puedo** (suelta la carrera).
  - Cada botón llama a `order-transition-service` (un único camino) y el bot avisa a la de turno, a la gestora y al grupo con lo que devolvió Core.
  - En el grupo solo se dice «Yo». Todo lo demás se hace en la tarjeta.
- **Qué quita:** los errores #4, #54, #55, #56, #65 y #74, y el caso #4223. Calculo que más del 80 % de los errores de mensajeros.

### 5.2 Gestoras
- **Ya existe:**
  - En Core, `class-cvd-gestora-app.php` (abierta a todas): Inicio, Mi tienda, Mis precios, Clientes, NEXO Busca, Calculadora, ¿Es de confianza?, Curru, Fotos para publicar, Ventas, Cobrar («Pedir mi pago»), Invitar, Mi equipo / Mi piedra (programa en sombra), Estudio de fotos, Contabilidad y Aprende.
  - En el panel, el modo persona.
  - En el bot: «mis pedidos», «#N», «mi comisión» y avisos.
  - Falta el web push para gestoras: la regla de `can_subscribe` las deja fuera.
- **Qué duele:** las preguntas de producto (P2: 25 errores) y el teléfono del cliente (#10, #51). «¿Cómo cobro?» (#64), «¿mi cuenta está aprobada?» (#73) y el «¿te refieres a…?» sin producto (#60, #62, #63) son preguntas que la app ya contesta, pero la gestora pregunta por chat.
- **MVP «Ficha que contesta + Vender seguro»** (≈ 2 días):
  1. **Ficha con datos fijos y estado** (hay N / agotado / bajo pedido, con su plazo). Botón **«Preguntar a la tienda»** con 6 opciones más texto libre, atado al ID del producto.
     - La pregunta va a la de turno, que contesta en un toque.
     - La respuesta se guarda en la ficha y avisa a todas las que preguntaron.
     - El bot del General responde con la ficha y no con texto inventado.
  2. **En «Vender»:** el teléfono del cliente distinto del de la gestora (bloqueo con «¿seguro?»), y validación de municipio y tarifa.
  3. **Inicio de la app con 3 tarjetas:** «Mis pedidos de hoy» (estado en vivo desde Core), «Mi dinero» («Pedir mi pago») y «Mi cuenta» (aprobada o no). Más **web push para gestoras**: «tu pedido salió», «entregado», «pago hecho».
- **Qué quita:** la mayor parte de los 25 errores del General y de producto, más #10, #51, #64 y #73, y ≈ 30 % de los mensajes de gestora al bot (estimado). Ese 30 % equivale a ≈ 0,5 USD/día de IA.

### 5.3 Caja (dependientas y Lennys)
- **Ya existe:**
  - Caja NEXO **1.1.1** (Tauri, Windows y Android, en `C:\Users\Ernesto\nexo-caja-p0\apps\business-pos`): Inicio (Cobrar pedido / Venta rápida / Cerrar el día), pedidos web con la tasa del pedido, «Cambiar tasa» con motivo, turno, cierre con billetes, devoluciones, fiado, efectivo de mensajeros, inventario, consignación y sincronización con Supabase y Woo (`nexo-device-web-orders` → `caja-bridge` de Core).
  - Ojo: en `ernesto-rondon-nexo` sigue la **1.0.8**. Falta integrar el repo `nexo-caja-p0`.
  - En Core también se cobra por `/ventas/` (`casa_viva_sales`: «Dinero recibido»).
  - El panel tiene «Caja y cobros», turnos y salidas (con aprobación «SALIDA SI N» por WhatsApp).
- **Qué duele:**
  - Ninguna caja tenía la 1.1.1 el 22-oct.
  - Teléfonos que se cierran al unirse a un turno (nota 6 de la 1.1.0).
  - Turnos huérfanos.
  - Dos sitios de cobro.
  - No cumple D97 ni el 2 % de D80.
  - No hay venta de mostrador con gestora.
- **MVP «Una caja, un cobro»** (≈ 2–3 días más la visita a la tienda):
  1. 1.1.1 instalada en los 2 teléfonos y en la laptop (guía de 3 imágenes; la APK se instala encima).
  2. **Un único sitio de cobro:** la caja. `/ventas/` queda solo para mirar.
  3. Al cobrar, **buscar la gestora por el teléfono del cliente** (D97, fallo 3) y la «Venta de mostrador» con el 2 % (D80).
  4. **Cierre de turno obligatorio** a las 17:00 (aviso a la de turno) y cierre automático de turnos con más de 24 h, con aviso a Lennys.
- **Qué quita:** los turnos huérfanos, el cobro doble o perdido entre `/ventas/` y la caja, y D97 y D80 en la tienda. Con eso, que el dinero del día cuadre sin papel.

### 5.4 (Extra, la que más ahorra) App de Ernesto: «Bandeja de decisiones»
- **Ya existe:** `casaviva.company/control/` (solo el usuario 1, 11 vistas, memoria compartida en SQLite), `crm_supervisor`, `crm_errores` (estado «decidir»), `crm_knowledge` (estado «pendiente») y `crm_escalations`.
- **MVP** (≈ 1–2 días):
  - Una sola lista que une las 4 tablas: **hoy hay 36 + 28 + 87 + 116 cosas esperando**.
  - Ordenada por dinero y por confianza. Cada fila trae: 1 línea de qué pasa, la recomendación y 3 botones (✅ Recomendado / ❌ No / ✏️ Otra cosa).
  - Las de más de 7 días se cierran solas con «caducada».
  - Las reversibles se aplican solas a las 24 h con aviso.
  - Por WhatsApp, **solo el parte de las 9:00 con las 5 primeras.**
- **Qué quita:** la mayor parte de P1, que es el problema que más tiempo le cuesta a Ernesto.

---

## Anexo: evidencia en bruto (para comprobar)
- **Errores:** `ssh … 'cv errores 30d'` · `cv errores abiertos` · tabla `crm_errores` (75 filas, ids 1–75).
- **Grupos de errores usados en este documento:**
  - General / producto: #16, #18–#41 (25).
  - Invento o promesa de acción: #1, #3, #15, #30, #43, #47, #59, #64, #65, #66, #73.
  - Proveedor: #14, #52, #57, #61, #75.
  - Mensajeros: #4, #54, #55, #56, #58, #65, #74.
  - #4963: #10, #42, #47, #51, #53, #54, #55, #65.
  - Clientes VIP: #69, #71, #72.
  - Ofrecer productos sin nombre: #13, #60, #62, #63.
- **Gasto:** `cv gastos 7d` (23-oct). Modelo: `.env` del VPS, `OPENAI_MODEL_SMART=gpt-4.1` (D72 decía mini). Uso por día en `/root/archivos/gastos/ia-2026-10-*.jsonl`.
- **Pedidos:** `cv pedidos-hoy N` con N = 1…6. Ojo: devuelve como mucho 100 pedidos, por eso 7 y 14 días salen cortados.
- **Supervisor:** `/root/supervisor/active-supervisor` = `codex-vps`; `codex-runs/*.result.json` (364: 358 deferred, 6 completed); `logs/2026-10-1*.log` (vueltas de Claude).
- **WordPress en producción:** `cvd_gestora_app=all`, `cvd_estudio_acceso=all`, `cvd_dispatch_on_create=yes`, `cvd_programa_gestoras=sombra`, Core 3.14.52.
- **No se pudo leer:** las tablas de la caja en la nube (esquema `nexo_business`, no expuesto a la API); los datos de la caja salen de la documentación (L42, L56 y las notas de la 1.1.0).
