# Pasos: publicar productos de un proveedor que solo tiene WhatsApp

**Patrón reutilizable: «proveedor sin app (solo WhatsApp)».** Primer caso: Sergio (confirma Ricardo) y LJH, 20-oct-2026.

> **20-oct ~18:50 — HECHO de otra forma (D85, decisión de Ernesto):** se publicó todo lo vigente sin preguntar antes al proveedor (se confirma en cada venta), los dos proveedores también en los repetidos, fotos limpiadas a mano (`bajar-fotos.mjs` → `unicas.mjs` → `limpiar.mjs`), lista `publicar.json` (`armar-publicar.mjs`), ids creados en `bak-20261020-electro-creados.json`, anuncios con `novedades.mjs` + `cola.json` (`armar-cola.mjs`). Detalle: ESTADO L45.

## La idea en 3 líneas (igual que con Kevin, pero sin su app)
| | Kevin (Digital Store) | Proveedor sin app (Sergio, LJH…) |
|---|---|---|
| 1. ¿Existe y a qué precio? | Se mira en **su app** | Se mira en **la bolsa** (`crm_market_items`: lo que anuncia en su grupo, recogido por el bot) |
| 2. ¿Lo tiene de verdad? | **Kevin dice que sí** | **El proveedor dice que sí** por WhatsApp, número por número (o «todo ok» a una lista numerada) |
| 3. Recién ahí | «confirmado» a la gestora | se publica en la web y se anuncia; en cada venta, otra vez 1 → 2 → «confirmado» |

Nunca se publica ni se dice «confirmado» con solo lo que vimos en el grupo.

## Quién hace qué
- **Claude:** prepara la lista y los mensajes, los manda con `cv` cuando Ernesto dice sí, pasa las respuestas a un archivo, ejecuta los scripts y comprueba la web.
- **Ernesto:** dice SÍ a los mensajes, decide lo dudoso (duplicados, comisión pactada, antiguos), revisa los borradores y dice SÍ al anuncio.
- **Ricardo (por Sergio) y LJH:** contestan.
- **Lennys:** nada en el proceso (es admin). Recibe un resumen al final.
- **Dependientas y mensajeros:** nada. Estos proveedores lo llevan al cliente y cobran ellos (fichas del bajo pedido).

## Paso a paso

### 0. Preparar (Claude) — HECHO el 20-oct
- `lista.md`: 293 productos sin repetidos (Sergio 112, LJH 181), con precio del proveedor, precio Casa Viva (`my_price`), comisión, foto y si ya está en la web.
- `productos.json`: los mismos datos para los scripts (texto original, historial de precios, todas las fotos).
- `mensaje-ricardo.txt` y `mensaje-ljh.txt`: un mensaje por proveedor, con la lista numerada.
- `grupos.mjs`: la agrupación hecha a mano (qué ids son el mismo producto), revisada con el texto original de cada anuncio.
- Para otro proveedor: bajar su bolsa (`crm_market_items` filtrado por `group_name`), agrupar igual (mismo producto = misma marca, modelo y capacidad en el texto original; se queda el anuncio más reciente) y repetir.

### 1. Ernesto decide y dice SÍ
1. Lee el resumen de `lista.md` y decide:
   - **Duplicados** (48 productos están en los dos): ¿un solo producto en la web (el más barato) y el otro de respaldo? (propuesta) ¿o los dos?
   - **Antiguos** (24: no se anuncian desde antes del 13-oct): se preguntan al final del mensaje; solo se publican si el proveedor dice que sí.
   - **#128 y #130**: sin identificar, no se publican.
2. Dice **SÍ** a los dos mensajes. (Con Ricardo hay permiso fijo para consultas de producto, pero esto es un catálogo entero: mejor el sí.)

### 2. Mandar los mensajes (Claude, de 9:00 a 17:00, horario de los proveedores)
```bash
ssh -i ~/.ssh/vivabot_vps -o BatchMode=yes root@179.236.242.212 'cv contacto 0817885; cv contacto 3847951'   # comprobar número y nombre
ssh -i ~/.ssh/vivabot_vps -o BatchMode=yes root@179.236.242.212 'cv enviar 5350817885 -' < mensaje-ricardo.txt
ssh -i ~/.ssh/vivabot_vps -o BatchMode=yes root@179.236.242.212 'cv enviar 5353847951 - --ok' < mensaje-ljh.txt
```
- **Ricardo:** el bot ya está en pausa con él hasta el 23-oct (`cv contacto`). Si se acabó la pausa: `cv silenciar 0817885 2880` antes de mandar, para que el bot no le conteste como a un cliente.
- **LJH:** está en modo `ignorar` y en la **línea personal**: `cv enviar` pide `--ok` (= el sí de Ernesto). El bot no le contesta.
- Un solo mensaje cada uno. Nada de mensajes en masa (riesgo de bloqueo de WhatsApp).
- «enviado» = WhatsApp lo aceptó, no que lo leyó.

### 3. Esperar y leer la respuesta (Claude)
```bash
ssh … 'cv chat 0817885 30'    # Ricardo
ssh … 'cv chat 3847951 30'    # LJH
```
- Si no contesta en 24 h: **un** recordatorio corto («¿Pudiste mirar la lista? Con los números que no tengas me basta 🙏»).
- Preguntas abiertas (A comisión / precio de revendedor, B recogida, C garantía): se anotan en la ficha del proveedor desde el chat «Tú» (lo hace Ernesto o Claude con su sí), por ejemplo:
  `FICHA 5358474247 dirección: …; horario: 9-17; atiende: Ricardo 5350817885; acuerdo: …`
- **Ojo (decisión de Ernesto):** el bajo pedido le pregunta al teléfono de la ficha, y la ficha de Sergio (id 21) tiene el de **Sergio** (5358474247), no el de Ricardo. Si todas las confirmaciones tienen que ir a Ricardo, hay que cambiar el teléfono de esa ficha en la base (`crm_suppliers`); `FICHA` no cambia teléfonos.

### 4. Pasar las respuestas a un archivo (Claude)
Copiar `respuestas.ejemplo.json` como `respuestas.json` y rellenar por proveedor (`S` = Sergio/Ricardo, `L` = LJH):
- `respondio: true`, `quien`, `fecha`;
- `todo_ok: true` si dijo «todo ok» o solo dio cambios (lo que no nombró queda confirmado);
- `cambios`: por número del mensaje, `{"agotado": true}` o `{"precio": 380}` (precio nuevo del proveedor: el precio Casa Viva y la comisión se recalculan solos con la regla del bot);
- `antiguos_si`: los números de la lista «hace días que no los veo» a los que dijo que sí;
- si se pacta un precio de venta distinto, `{"precio": X, "precio_venta": Y}` (sale marcado como precio manual).
- Si la respuesta no es clara para un número, **no se confirma**: se pregunta otra vez solo ese.

### 5. Armar los confirmados (Claude, en el VPS)
```bash
ssh … 'mkdir -p /root/archivos/electro-2026-10-20'
scp -i ~/.ssh/vivabot_vps productos.json respuestas.json armar-confirmados.mjs root@179.236.242.212:/root/archivos/electro-2026-10-20/
ssh … 'cd /root/archivos/electro-2026-10-20 && node armar-confirmados.mjs'
```
- Sale `confirmados.json` (solo lo confirmado, sin duplicados, sin lo que ya está en la web) y `fuera.txt` (lo que se queda fuera y por qué).
- Las fotos van como enlaces firmados de Supabase **válidos 7 días** (como cuando publica el bot). Si caducan, se vuelve a ejecutar.
- Firma las fotos de una en una por producto, con pausas: el 20-oct, firmándolas todas seguidas, Supabase contestó «Too many connections». Para probar: `--max 3` o `--sin-fotos`.
- La descripción se hace con el texto del proveedor **sin** precios, transporte, garantía del proveedor ni teléfonos, y con la garantía que dijo el proveedor.

### 6. Crear los borradores en la web (Claude)
```bash
scp -i ~/.ssh/vivabot_vps root@179.236.242.212:/root/archivos/electro-2026-10-20/confirmados.json .
ssh -i ~/.ssh/casa-viva-github-actions -p 65002 -o BatchMode=yes u824654880@88.223.85.72 'mkdir -p ~/electro-2026-10-20'
scp -i ~/.ssh/casa-viva-github-actions -P 65002 crear-productos.php confirmados.json u824654880@88.223.85.72:electro-2026-10-20/
ssh … 'cd ~/domains/casaviva.company/public_html && wp eval-file ~/electro-2026-10-20/crear-productos.php ~/electro-2026-10-20/confirmados.json'          # prueba en seco
ssh … 'cd ~/domains/casaviva.company/public_html && wp eval-file ~/electro-2026-10-20/crear-productos.php ~/electro-2026-10-20/confirmados.json hacer'    # crea BORRADORES
```
- Igual que los MK- del bot (MK-1192): SKU `MK-<id>`, «Bajo pedido» + su departamento, sin control de stock, comisión fija, costo = precio del proveedor. **En borrador**: nadie los ve todavía.
- Si un SKU ya existe (también con otro id del mismo producto, p. ej. el split MK-131), no lo toca.
- Probado en seco en el servidor el 20-oct (5 de prueba + 3 casos de error): funciona. **Todavía no se ha creado nada.**
- Fotos: también vale subirlas antes al servidor (`scp` a `~/electro-fotos/<id>/1.jpg`) y poner esas rutas en `fotos`.

### 7. Revisar los borradores (Ernesto, 10 minutos)
- wp-admin → Productos → filtro «Borrador» → buscar `MK-`.
- Mirar: nombre, precio, comisión (Casa Viva → comisión), **fotos sin el teléfono del proveedor ni marcas de agua de otros**, descripción sin precios del proveedor.
- Lo que esté mal: se corrige en wp-admin o se manda a la papelera (no borrar para siempre).

### 8. Publicar (Claude, con el sí de Ernesto)
```bash
ssh … 'cd ~/domains/casaviva.company/public_html && wp post update <id1> <id2> … --post_status=publish && wp litespeed-purge all'
curl -s -o /dev/null -w "%{http_code}\n" https://casaviva.company/producto/<slug>/   # 3 al azar: 200, con foto y precio
```
- Después, marcar en la bolsa que están publicados, para que *ITEM n*, *PRECIO n*, *AGOTADO n* y el bajo pedido sigan funcionando (escribe en la base: con el sí de Ernesto):
```bash
ssh … "node /root/supervisor/sb.mjs 'const ids=[<market_id>,…]; const out=[]; for (const id of ids){ const {error}=await db.from(\"crm_market_items\").update({status:\"publicado\",published_url:\"https://casaviva.company/?post_type=product&p=<woo id>\"}).eq(\"id\",id); out.push([id,error?.message||\"ok\"]); } return out'"
```
- **Atajo que ya existe:** *APRUEBA n,n* en el chat «Tú» hace los pasos 6–8 de golpe (publica **visible** al momento, texto pulido por la IA, hasta 4 fotos, marca la bolsa). No hay borrador ni revisión: úsalo solo para pocos productos ya confirmados.

### 9. Anunciar (Claude, con el sí de Ernesto)
- Volver a generar `anuncio-grupo.md` con los precios finales y **solo lo publicado**.
- Grupo «Actualización de productos» (`120363283827702479@g.us`), no el General. Siempre con la comisión («Ganas: X USD por cada uno»).
- Una lista por tipo + una foto al día de los más vendibles.
- A Lennys, después, un resumen corto: cuántos, de qué tipo, comisión.

### 10. Cada venta (lo hace el bot: bajo pedido 24 h, D47)
1. Llega el pedido con SKU `MK-` → el bot le pregunta **al proveedor** si lo tiene.
2. A la gestora: «lo estoy confirmando con el proveedor» (nunca «confirmado» antes).
3. El proveedor dice sí → recién ahí «confirmado» a la gestora. El proveedor lo lleva y cobra; luego nos paga nuestra parte (*CUENTAS PROVEEDORES*, *PAGÓ Sergio 85 USD*…).

### 11. Mantenimiento (cada semana, Claude)
- Comparar la bolsa con la web: si el proveedor anuncia otro precio → *PRECIO n* (o volver a crear con el precio nuevo); si no lo anuncia desde hace 7 días → preguntarle y, si no hay, *AGOTADO n*.
- `MK-172` (ventilador recargable 20000 mAh) ya está publicado y Sergio no lo anuncia desde el 12-oct: va en la pregunta de «antiguos».

## Archivos de esta carpeta
| Archivo | Para qué |
|---|---|
| `lista.md` | Lista para leer y decidir (por proveedor y tipo) |
| `productos.json` | Datos completos (los usan los scripts) |
| `grupos.mjs` | Qué ids de la bolsa son el mismo producto |
| `mensaje-ricardo.txt`, `mensaje-ljh.txt` | Los dos mensajes, listos para `cv enviar` |
| `respuestas.ejemplo.json` | Cómo apuntar lo que contesten |
| `armar-confirmados.mjs` | VPS: respuestas → `confirmados.json` (con fotos firmadas) |
| `confirmados.ejemplo.json` | Ejemplo de lo que lee el PHP |
| `crear-productos.php` | Web: crea los borradores (prueba en seco por defecto) |
| `anuncio-grupo.md` | Borradores de los anuncios para «Actualización de productos» |
