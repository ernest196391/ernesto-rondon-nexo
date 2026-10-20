# Anuncios diarios de productos: cómo funciona

**Desde:** miércoles 21-oct-2026. **Decisión de Ernesto (20-oct):** cada día salen hasta **30 productos distintos** al grupo **«Actualización de productos»**, **1 por minuto**, para que las gestoras los suban a su estado.

## Cómo es un día

1. **8:40.** El sistema prepara la lista del día. Elige hasta 30 productos, cada uno con su motivo.
2. **8:40.** A Ernesto le llega por privado un resumen de 6 líneas, por ejemplo:
   «salen 30: 10 por noticias (agua, apagones…), 8 pedidos por clientes y gestoras, 8 recién llegados, 4 para variar categorías» y la noticia que se usó.
3. **9:00.** El bot manda su mensaje de siempre, con 3 productos.
4. **De 9:02 en adelante.** Sale un producto por minuto (foto + texto) hasta acabar la lista, hacia las 9:35. Después se para hasta el día siguiente.

## Cómo elige (en este orden)

| Motivo | De dónde sale | Cuántos |
|---|---|---|
| **Noticia** | Titulares de hoy de 14ymedio, Cubadebate, OnCuba, elTOQUE, Diario de Cuba, Granma y CiberCuba (gratis). Una sola consulta barata a la IA dice qué problema hay hoy en Cuba (apagones, calor, lluvia o ciclón, falta de agua, falta de gas, mosquitos, comida, escuela, Navidad desde noviembre, frío en invierno). Luego se eligen los productos que lo resuelven. | hasta 10 |
| **Pedido** | Lo que clientes y gestoras preguntaron en los últimos 7 días (chats privados y grupo General), las búsquedas de la bolsa y lo más vendido en la web en 14 días. | hasta 8 |
| **Nuevo** | Lo que entró en la web esta semana y los 267 electrodomésticos del 20-oct (la cola de antes ahora entra aquí). | hasta 8 |
| **Categoría** | Uno de cada categoría que todavía no haya salido, para que haya variedad. | el resto, hasta 30 |

**Siempre se cumplen estas reglas:**
- El producto tiene que estar **publicado en la web**, tener **existencias** (o ser «Bajo pedido» publicado en la bolsa) y tener una **foto buena**: la foto principal de la web, de 400 px o más.
- **No se repite** nada anunciado en los últimos 7 días. Eso incluye los 3 productos de las 9:00 del bot y lo que otras sesiones mandaron a mano al grupo.
- Como mucho salen 7 productos por categoría y 2 del mismo tipo (por ejemplo, 2 bombas de agua).
- Se guardan 6 **reservas**: si un producto se agota antes de su turno, se salta y sale una reserva.
- El texto se escribe **justo antes de enviar**, con el precio de ese momento en la web.

**Cómo es el texto:**
```
💧 Para cuando falta el agua
*Bomba de Agua Sumergible 0.75 kW*
Precio: *180 USD*
Ganas: *7,78 USD* por cada uno
Bajo pedido (24 h)
```
- El texto lleva como mucho 2 emojis y nunca el nombre del proveedor ni el costo.
- No lleva ningún aviso de IA.
- La cantidad de «Ganas» se calcula igual que en el mensaje de las 9:00 del bot: la comisión de la ficha o, si no tiene, el 10 %.

**Si algo falla:**
- Si no hay noticias o la IA falla, la lista se hace igual, solo con pedidos, nuevos y categorías.
- Si un envío da error, los anuncios se paran y Ernesto recibe un aviso. Ese aviso llega una sola vez al día.
- Si el bot está caído, el sistema espera y no amontona mensajes.

## Cómo parar, cambiar el número o el ritmo

Estos ajustes están en Supabase (`crm_settings`). Si se lo pides a Claude, lo cambia en un minuto.

| Qué quieres | Ajuste | Valor |
|---|---|---|
| **Parar todo** | `novedades_auto` | `no` (para seguir: `si`) |
| Que salgan menos o más productos al día | `novedades_max_dia` | 30 por defecto (por ejemplo, `15`) |
| Más tiempo entre un producto y otro | `novedades_cada_min` | 1 por defecto (por ejemplo, `3` = uno cada 3 minutos) |

- **Para cambiar la hora:** se cambia el cron del VPS. Ahora la lista se prepara a las `40 8` (8:40) y los envíos empiezan a las 9:02 y terminan como tarde a las 19:00. Para la hora de inicio hay que tocar `HORA_INI` en `novedades.mjs`.
- **Para rehacer la lista de hoy:** `node /root/supervisor/tareas/seleccion-diaria.mjs --rehacer`.
- **Para ver la lista sin enviar nada:** `node /root/supervisor/tareas/seleccion-diaria.mjs --prueba --dia AAAA-MM-DD`.

## Cuánto cuesta

- **Noticias:** gratis (RSS).
- **IA:** una llamada al día con gpt-4.1-mini, unos **0,001 USD** al día (menos de 0,03 USD al mes). Queda apuntada en `cv gastos` como «novedades-noticias» y en la lista del día.
- **Envíos:** salen por el buzón del bot, como siempre, sin coste extra.

## Dónde está cada cosa (VPS)

- **Programas:**
  - `/root/supervisor/tareas/seleccion-diaria.mjs` prepara la lista.
  - `/root/supervisor/tareas/novedades.mjs` manda los anuncios.
  - `/root/supervisor/tareas/novedades-comun.mjs` tiene las piezas comunes.
  - La copia está en esta carpeta.
- **Lista de cada día:** `/root/archivos/novedades/dias/AAAA-MM-DD.json`, también en `crm_settings novedades_hoy`.
- **Lo enviado y lo saltado:** `/root/archivos/novedades/enviados.jsonl`.
- **Noticias leídas:** `/root/archivos/novedades/noticias/AAAA-MM-DD.json`.
- **Fotos:** `/root/archivos/novedades/fotos/`.
- **Registros:** `/root/supervisor/logs/seleccion-diaria.log` y `/root/supervisor/logs/novedades.log`.
- **Copias de antes del cambio:** `/root/backups/crontab.bak-20261020-novedades` y `/root/backups/novedades.mjs.bak-20261020-antes-seleccion`.
