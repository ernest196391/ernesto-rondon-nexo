# Puntos Casa Viva y grupo de clientes · piloto (22-oct-2026, D97)

**Aprobado por Ernesto el 22-oct:** «establécelo ya… hay que crear ya el grupo de clientes para darle promo».

## La regla que lo sostiene (D97)
El cliente que trae una gestora es **suyo para siempre**. Compre por el grupo, la web, el bot o la tienda, su comisión
queda reservada. Las reglas de desempate (primera gestora; solo cambia si el cliente lo pide y Lennys lo aprueba; nada
retroactivo) están en `docs/00-FUENTE-DE-VERDAD/DECISIONES.md` D97.
- **Web, bot, vales y pedidos hechos a mano en WordPress: cumplen desde Core 3.14.52 (22-oct).**
- **Caja de la tienda: todavía NO** (ver «Caja» abajo).
- Casos viejos: `conflictos-gestora.md` (1 caso, sin tocar).

## Caja de la tienda (fallo 3): plan, sin hacer
**Hoy:** la dependienta elige la gestora a mano (`apps/business-pos/src/attribution.ts`) y el teléfono del cliente es
opcional. La comisión la calcula Supabase con lo que manda la caja: el trigger `nexo_business.record_commissions()` sobre
`sync_events` lee solo `payload.gestor_id`. El Core no recibe las ventas de la caja, así que no puede poner la gestora él
mismo. Supabase no tiene la lista cliente→gestora: vive en el Core (`wp_cvd_clients` + `CVD_Attribution::customer_owner`).
**Por qué no se hizo hoy:** hacen falta SQL en Supabase (lo pega Ernesto), cambiar dos funciones (edge functions) y sacar
una caja nueva (APK/EXE). No es un cambio pequeño. Pasos, en este orden:
1. **Core:** endpoint `panel/client-owners` → `[{phone8, gestorWebId}]` con la regla `customer_owner`.
2. **Supabase (SQL):** tabla `nexo_business.customer_owners(phone8, gestor_person_id, updated_at)`. El puente
   `nexo-stock-bridge` la llena junto con las gestoras (paso C2), y `nexo_business_device_rates` la devuelve con las tasas.
   Así la caja la tiene aunque no haya internet.
3. **Red de seguridad en el servidor (sin caja nueva):** en `record_commissions()`, si la venta llega sin `gestor_id` y
   `customer.phone` está en `customer_owners`, la comisión va a esa gestora, y queda un aviso para Ernesto. Esto solo ya
   arregla el dinero de las ventas con teléfono.
4. **Caja 1.1.2:** al escribir el teléfono, se elige sola la gestora (lista del paso 2, guardada como `nexo.people`). Si
   la dependienta la quita o cobra sin gestora a un cliente que tiene una, sale el aviso «Este cliente es de X».
   Pruebas: `npx vitest run apps/business-pos/src supabase/tests/caja-p0.test.mjs` y `cargo test` en
   `packages/business-db/rust`.
Recomendación: hacer 1–3 primero (no hace falta instalar nada en la tienda) y el 4 con la próxima caja.

## Puntos (piloto)
- Solo clientes de **Dany** (user 18, …4351), **Nadielys** (29, …2217) y **Maryta** (47, …8052).
- **1 punto por cada USD** en productos de Casa Viva. Las líneas **MK-** (proveedor) no suman.
- Solo pedidos web **hechos desde el 22-oct y ENTREGADOS** (sin pruebas, cancelados ni devueltos). No suma lo que compra la propia gestora ni el equipo.
- **100 puntos = 2 USD** de descuento. Cada punto **caduca a los 6 meses** de ganarse.
- **Canje a mano:** el cliente se lo pide a su gestora → la gestora le escribe a Ernesto «canjear 100 puntos de [teléfono]» → Ernesto mira el saldo (`cv puntos <tel>`), pone el descuento en el pedido y lo apunta (`cv puntos canjear <tel> 100 --pedido N`). **Nada automático** en precios ni en el checkout.
- ¿Quién paga el descuento? Pendiente de decidir por Ernesto (propuesta: Casa Viva, sin tocar la comisión de la gestora).

## Dónde vive
| Pieza | Dónde |
|---|---|
| Movimientos (gana / canje / ajuste) | Supabase `crm_puntos` (SQL `vivabot/supabase/030_puntos.sql`, aplicado 22-oct) |
| Reglas del piloto | `crm_settings` clave `puntos_piloto` (gestoras, fecha, 1:1, 100 = 2 USD, 6 meses, sin MK-) |
| Cálculo | VPS `/root/supervisor/tareas/puntos-calcular.mjs` (copia aquí: `puntos-calcular.mjs`), cron diario 20:30 con `--hacer`, log `/root/supervisor/logs/puntos.log`. También avisa si un cliente del piloto compró y el pedido salió sin su gestora o a nombre de otra («⚠ D97») |
| Consulta | `cv puntos` (resumen) · `cv puntos <tel>` (saldo, caducidad, USD, movimientos) · `cv puntos dany|nadielys|maryta` · `cv puntos calcular [--hacer]` · `cv puntos canjear <tel> <N> [--pedido N]` |

## Grupo de clientes
- **Casa Viva · Clientes VIP** · `120363411309225409@g.us` · creado 22-oct 15:44 por el bot (su número es el de Ernesto: creador y admin).
- Miembros al crear: Ernesto, Dany, Nadielys, Maryta. **Solo admins escriben** (ajuste reversible). Descripción con las reglas de los puntos.
- **Enlace de invitación:** https://chat.whatsapp.com/GqMe3TeoKTa7y1CHUyCA77 — los clientes entran SOLO por su gestora.
- En el grupo no se dan precios ni se toman pedidos (los precios de cada gestora son suyos): «escríbele a tu gestora».
- Desde el VPS: `cv enviar vip <archivo> --ok` (siempre con el SÍ de Ernesto). Lo creó el tipo nuevo del buzón `grupo_crear` (VivaBot `a9985ee`, SQL `031_buzon_grupo_crear.sql`).
- Ojo: en un grupo normal de WhatsApp los miembros pueden ver el número de los demás. Por eso la regla D97 (cliente siempre de su gestora) es lo que da tranquilidad.
- **Foto del grupo** (22-oct): `foto-grupo-vip.jpg` (640×640, isotipo CV + «CLIENTES VIP», mismo sistema que las fotos de la comunidad; generador `foto-grupo-vip.mjs`, gratis con resvg + sharp). Puesta por el bot (#2637). **Para cambiarla:** sube el jpg/png a `/root/archivos/fidelidad/` y encola en el VPS: `node /root/supervisor/sb.mjs 'return await db.from("crm_outbox").insert({business_id:"8771c6ed-9dbf-497d-b3df-be6697ba2693",to_group:"120363411309225409@g.us",kind:"grupo_foto",file_path:"/root/archivos/fidelidad/<foto>.jpg",body:"",status:"pendiente",created_by:"claude-pc"})'` y mira `cv outbox 3` (tipo `grupo_foto`, solo a grupos donde el bot es admin; si no, sale `not-authorized`).

## Textos (borradores, sin enviar)
- `mensaje-gestoras.md` → a las 3 gestoras por privado (VPS `/root/archivos/fidelidad/mensaje-gestoras.txt`).
- `bienvenida-grupo.md` → primer mensaje del grupo (VPS `/root/archivos/fidelidad/bienvenida-grupo.txt`).

## Antes de enviar los textos (recomendado)
El número del bot es el de Ernesto: cuando una gestora escriba «canjear…» o un cliente pregunte por los puntos, contesta VivaBot.
Para que no invente, enseñarle (con el SÍ de Ernesto) algo así:
- `cv aprender "¿Cómo canjeo los puntos de mi cliente?" "Dime cuántos puntos quiere canjear tu cliente y su teléfono. Ernesto revisa el saldo y pone el descuento (100 puntos = 2 USD) en su pedido." gestora otro`
- `cv aprender "¿Cuántos puntos tengo?" "Pregúntaselo a tu gestora o gestor: ella o él te dice tu saldo y cuándo caducan." cliente otro`

## Después del piloto (2–4 semanas)
Medir: clientes que entraron al grupo por gestora, pedidos repetidos de esos clientes, canjes hechos. Si funciona: abrirlo a
todas las gestoras y decidir si el canje se automatiza (cupón en Core).
