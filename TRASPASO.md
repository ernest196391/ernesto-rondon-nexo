# TRASPASO — chat principal de Casa Viva (14-oct-2026, ~16:50)

## 1. Qué se hacía
Llevar la operación de Casa Viva atento a los chats (VivaBot), guiar a gestoras/equipo «como si fuera Ernesto», arreglar lo que falla y construir lo que Ernesto aprueba. Ernesto decide; Claude recomienda la mejor práctica.

## 2. Hecho y comprobado hoy por la tarde (detalle en ESTADO.md, bloque «Mediodía del 14-oct»)
- **Venta de proveedor (lámpara #3693, Kevin/Digital Store):** costó **28 USD** en su almacén (su app dice 32). Pedri la recogió en su 2.º local y la entregó en Bauta; **cerrada a nombre de Pedri 16:46** (estaba a nombre de Félix por una publicación repetida). Reglas **D66 y D69** (fondo ≈3.000 CUP variable por vale; todo sale del margen; Ernesto = gestor especial). Skill `venta-proveedor`. **Fase 1 del reparto EN VIVO**: Core 3.14.14 + panel (recuadro «Reparto de la venta de proveedor» en el pedido + «Ventas de proveedor del mes») + `nexo-panel-web` v18; #3693 da margen 13.430 CUP, Nadielys 4.108, fondo 4.000, Ernesto 5.322.
- **Precios (D68):** Lennys eligió «× 1,5 con mínimo, redondeado al dólar». Panel publicado (sugerido costo × 1,5; avisos Pierde / Bajo el mínimo / ✓ Bien). Guía de 5 pasos e infografía enviadas.
- **Estudio de fotos:** fallo de subida (500, `wp_tempnam`) **arreglado en Core 3.14.13**; Core 3.14.12 enseña el código de error. Dany, Dayra y **Lennys (lo hizo sola)** probaron; activado para 18, 33 y 14. Gemini necesita VPN en Cuba. Notas: `docs/nexo-business/estudio-fotos/prueba-dany-2026-10-14.md`.
- **Tienda de la gestora:** Core 3.14.9–3.14.11 (sin dirección de la tienda ni contactos de Casa Viva con enlace de gestora; el bot pasa al cliente de una gestora con ella). D67.
- **Biblioteca de fotos reales del equipo (D70):** VivaBot `c380724`; `cv fotos …`; 88 fotos guardadas para siempre en `/root/archivos/fotos-reales/`.
- **Producto 2823** renombrado a «Perfilador eléctrico de cejas FUGETSU (con luz)» (idea de Niurka).
- **#3698 (Niurka, perchero, Habana Vieja, pago mixto 12.000 transf + 15.650 efectivo):** pasada a **Frank (…1675)**; dijo «4:40»; aún sin marcar entregado a las 16:50.
- **Reel «Súper Prosko» LISTO, SIN PUBLICAR:** `videos/curru-tienda/reel-cama-plegable/` (mp4, `-fb.mp4`, portada, pie, 5 historias). 70,5 créditos; quedan ≈900.
- **Panel:** «Pagos de la web» legible en el móvil; Vercel al día (último `dpl` del agente del reparto).

## 3. Pendiente, en orden
1. **#3698:** que Frank marque entregado (y cobró mixto). Si no contesta, llamarle.
2. **Caja (Nana):** dinero por traer mañana antes de las 4 → Pedri 61.620 CUP (#3692) + 45 USD (#3693); Melany 15 USD (#3580); Fernando 40 USD (#3599). Sin marcar entregado: #3673 Alejandro, #3683 Ibelice, #3687 Melany. #2944 Daiquel (desde 12-oct, línea personal → Ernesto). #3675 Félix es para el jueves.
3. **Reel:** Ernesto lo ve; publicar a las 20:00 (él o con su sí; pestaña de Business Suite delante antes de las 19:30). Luego el mensaje al General con los enlaces.
4. **Ernesto tiene que pegar** `docs/nexo-business/sql/025_fotos_reales.sql` en Supabase (nexo-production, traductor apagado) y luego `cv fotos sincronizar`. Asignar producto a las fotos «sin producto» (`cv fotos sin`).
5. **Fallos por arreglar:** (a) #3693 pasó solo a «Listo para mensajería» a las 15:00 («system») y salió repetida; (b) el bot pidió la hora a Elaine 4 veces y tomó un mensaje dictado de Ernesto como «pasar carrera»; (c) cuando una pregunta abierta pide «foto», el bot toma cualquier foto de la tienda como respuesta (zhu recibió la del soporte TV); (d) el estudio olvida el producto elegido al reabrir; (e) **quitar el registro temporal** `wp-content/mu-plugins/cvd-estudio-log.php` cuando acabe la prueba; (f) contactos mal: 5358478068 dice «FERNANDO» y es Ibelice; 5353474881 Fernando tiene rol gestora; (g) Frank tiene 2 cuentas (75 …9736 y 76 …1675).
6. **Por construir (Ernesto decide):** fase 2 del reparto de proveedor (avisos a dependienta/proveedor, vale «recoger en el proveedor», +500 de la dependienta en /ventas/); pago mixto en el vale; lista de todo el catálogo con «cuánto gana la gestora»; lista negra de estafadores (idea de Niurka); vale como comprobante para controles de policía; poner fotos reales en la web con un toque; Lennys pidió poner su foto de la Alfombra Persa en la tienda principal (le ofrecimos hacerlo).
7. **Esperando:** Lennys confirma 5 costos raros (Rasuradora 19,50 vende 14; Luminoliss 12=12; Paraguas 1,08; Set utensilios 1,68; Sombrilla auto 3,55). Nana: fotos de rosado/rojo/azul del Set de alfombras 3 piezas (#177) para Dany. Dayra repite la foto mañana. Dany pone su foto en su tienda. Del TRASPASO anterior siguen: decisiones de Ernesto (Excel, cortina roja, piedras, Hostinger, YouTube de Jay), vale de recogida con dirección (Dayra), 11 colores sin alta en la caja.

0. **EN MARCHA desde las 18:00 (Ernesto fuera, PC encendido; pidió vigilar los chats cada 30 s y arreglar lo que haga falta):**
   - Agente: reel «Súper Prosko» programado en Business Suite para las **19:00** + mensaje al General con los enlaces.
   - Tarea programada `resumenes-casa-viva-19` (cada día ~19:15–19:22): resúmenes para Ernesto («Tú»), Lennys y el grupo Mensajerías. Primera vez hoy. Puede pararse a pedir permisos (el modo no se guardó).
   - Agentes: (1) fallos del bot de hoy (carrera repetida 15:00, hora repetida, mensaje de Ernesto como orden, foto equivocada en preguntas, «no hay» sin comprobar, contactos mal); (2) ordenar fotos reales + estudio (recordar producto, elegir producto desde la galería, textos VPN/descargar); (3) balance diario de gastos por correo a las 21:00 + aviso de saldo bajo.
   - Tarea nocturna del catálogo (títulos y descripciones) corre por primera vez esta noche a la 1:07.
   - **Escurridor (18:02):** Klaus SÍ quiere un *escurridor de platos* (no el escritorio). No existe en web ni caja. Pregunta a la tienda en cola (`ptmx3vw94`, sale a las 10:00 a Nana y Zaymi, respuesta va a Klaus). Preguntado también a Lennys.
8. **«Escurridor» = ESCRITORIO (17:58, CORREGIDO a las 18:02: era escurridor de verdad):** Klaus escribió «escurridor» y era el **Escritorio de oficina #2729** (230 USD, stock 1, «Última unidad» en la web, bien). Corregidos Lennys y Klaus. **Regla que pide Lennys (17:22):** antes de contestar «no hay / no tenemos», el bot verifica con Nana o Zaymi (y buscar por nombres parecidos: escurridor ↔ escritorio). Por programar.
9. **OpenAI se quedó sin saldo 17:00–17:55** (bot sin IA; errores 429 `credit_balance_exhausted`). A las 17:55 vuelve a funcionar. Anthropic sigue sin saldo. Ernesto pidió (17:50) **un balance diario por correo de lo que se gasta en herramientas, qué consume más y cómo abaratar**.
10. **Nadielys #3673 (17:23):** la clienta quiere pagar en CUP a la tasa de ayer 785 → 10.990 CUP (a 790 serían 11.060). Lo decide Ernesto (dinero).

## 4. Datos fijos
- **VPS:** `ssh -i ~/.ssh/vivabot_vps -o BatchMode=yes root@179.236.242.212`; `cv …` (`cv fotos` nuevo). Scripts que usan `core()` del bot: ponerlos dentro de `/root/vivabot/scripts/` (si no, no encuentran `dotenv`) y borrarlos después.
- **Web:** `ssh -i ~/.ssh/casa-viva-github-actions -p 65002 u824654880@88.223.85.72`, `~/domains/casaviva.company/public_html`. Core en **3.14.14**.
- **Panel:** casaviva.company/panel y negocio.nexocuba.com (Vercel `nexo-negocio`, redeploy con `withLatestCommit`). `main` del repo `ernesto-rondon-nexo` ya está al día.
- **Teléfonos de mensajeros:** sacarlos de `_cvd_whatsapp` en Core, no de `crm_contacts`.
- **Worktrees:** `C:\Users\Ernesto\cv-estudio-err` (Core), `C:\Users\Ernesto\vivabot-fotos`, `vivabot-recogida`, `cv-pegajosa` (no borrar con herramientas que sigan enlaces: `node_modules` enlazado).

## 5. Reglas de Ernesto (de este chat)
- Antes de cada tarea nueva, preguntas con opciones y una recomendada. Lo reversible lo decide Claude y lo apunta.
- Precios: mandar números a Lennys antes de tocar; «bajo el mínimo» ≠ «pierde».
- Explicar con mensaje corto + guía de imágenes; vigilar los chats y guiar «como si fuera Ernesto».
- Comprobar antes de afirmar; números de teléfono siempre buscados, nunca adivinados.

Mensaje para empezar: «Lee C:\Users\Ernesto\ernesto-rondon-nexo\TRASPASO.md y sigue con lo pendiente, empezando por la entrega de Frank (#3698) y la caja de Nana.»
