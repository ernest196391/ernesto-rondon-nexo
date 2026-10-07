# Digitaliza tus productos (NEXO Business)

Recibir un producto, registrarlo en Core con sus fotos y existencias, y mantener su
**ficha central de conocimiento**, de la que saldrá todo el contenido comercial.
Piloto: Casa Viva. Producto: función de NEXO Business (D07), no app aparte.

## 1. Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Dónde vive | Página `apps/business-dashboard/digitaliza.html` del panel de NEXO Business, módulos en `digitaliza/` | D07 y D16. Mismo despliegue y misma sesión que el panel; sin paso de build. |
| Product Studio viejo (`app/studio`, Render) | No se reutiliza | Otra base (Render) y crea borradores en WooCommerce: choca con "nunca escribir en Woo". |
| Autoridad del stock | Core (libro `sync_events` → `stock_movements`) | No hay segundo inventario. Nuevo/reposición = `inventory.received` (suma). Corrección = `inventory.counted` (fija la cifra contada). |
| Idempotencia | El id de la recepción lo crea el dispositivo y es la clave de operación | Repetir el envío devuelve el mismo resultado (`replayed`); el mismo id con otros datos es `conflict`. Evento con id fijo `intake:<id>`. |
| Variantes | Una fila por variante con `variant_of` común, sin fila padre | Igual que la importación de la web. |
| Permisos | Reponer: dueña, economista, dependienta activa. Crear y corregir: dueña o economista | Igual que `catalog_upsert` y `can_receive`. |
| Fotos originales | Bucket privado `product-intake`, `<negocio>/<recepción>/<n>-<archivo>`, sin retocar | Rutas fijas: reintentar sobrescribe, no duplica. |
| Borradores | IndexedDB en el dispositivo (datos + fotos), guardado al escribir | Recuperación tras cerrar, batería o corte. Core solo recibe la ficha confirmada. |
| Estados | Contenido: Recepción → Datos pendientes → Ficha confirmada → Contenido en producción → Revisión → Listo para distribuir. Core: Solo en este dispositivo / Enviando / Guardado / Sin guardar | Independientes: un producto puede estar en Core con el video pendiente. |
| Ficha de conocimiento | Única fuente de características para plantillas e IA; ningún prompt guarda copias | Pedido del 2026-10-05. |
| Precio y existencias en la ficha | Se leen de Core; **no** son "hechos" | Una sola verdad. Cambiar el precio en Core marca las piezas a revisar (trigger). |
| Letra | Helvetica (sistema visual: Helvetica o equivalente, nunca Inter); colores y títulos del tema Casa Viva | `SISTEMA-VISUAL.md` |

## 2. Contrato con Core (migraciones `20261005010000` y `20261005020000`)

Todo por RPC `SECURITY DEFINER` con `auth.uid()`; ningún secreto en el cliente.

**Recepción**
- `nexo_business_intake_access(business)` → `{receive, create, correct}`
- `nexo_business_intake_catalog(business)` → `{access, products:[{productId, name, sku, variantOf, variantLabel, prices, stock, stockAuthority: core|external}]}`
- `nexo_business_intake_commit(business, intake)`:
  - `intake = {id: uuid, kind: new|restock|correction, product?: {name, sku?, category?, prices:{USD|CUP: menor}}, lines, sheet, aiSuggestions, photos:[{path,name,size,type}]}`
  - `lines`: nuevo `[{label|null, quantity, sku?}]` · reposición `[{productId, quantity≥1}]` · corrección `[{productId, counted≥0}]`
  - respuesta `{ok, id, kind, groupId, eventId|null, lines:[{productId, name, variantLabel, added|difference, stockBefore, stockAfter, stockAuthority, created}], replayed?}` o `{error: forbidden|invalid|conflict, message}`
  - Producto nuevo: `nx-<12 hex del id>` (y `-1`, `-2`… por variante).
- `nexo_business_intakes(business, limit)` → recepciones guardadas.

**Ficha de conocimiento** (grupo = `variant_of` o `product_id`)
- `nexo_business_knowledge(business, group)` → `{version, products (precio y stock de Core), facts, experiences, pending, pieces}`
- `nexo_business_fact_save(business, group, fact)` (dueña/economista). `fact = {key, label, kind: feature|warranty|offer|included|documentation|usage|other, value, unit, appliesTo (variante), scope: product|category, status: verified|declared|pending|contradicted, source, evidence:[{url|path, title?, conclusion?}], note, observedOn}`. Reglas: pendiente = sin valor; con valor ≠ pendiente; verificado exige evidencia. Cada cambio crea versión nueva (historial) y sube la versión de la ficha.
- `nexo_business_fact_history(business, group, key)`
- `nexo_business_experience_save(business, group, exp)` (también dependienta): condiciones, cantidades, ajustes, tiempos, resultado, archivos, fecha, quién. Corregir = versión nueva. **No cambia los hechos.**
- `nexo_business_piece_record(business, group, piece)` (bloque 2): guarda `knowledgeVersion` y `factKeys`; rechaza si la ficha cambió. Cambiar un hecho usado, la garantía o la oferta, o el precio en Core, pasa las piezas vivas a `needs_review` con el motivo.

**Límite conocido:** los productos que vienen de BizneCubano se recuentan en la importación de cada hora (`import_catalog`). Una reposición en Core de esos productos se pierde en el siguiente recuento si no se registra también en BizneCubano. La pantalla lo avisa. Cambiarlo es cambiar la autoridad del stock: decisión de Ernesto.

## 3. Ejecutar y verificar (sin tocar Casa Viva)

```
npx.cmd vitest run                       # todo el repo (229)
npx.cmd vitest run supabase/tests apps/business-dashboard
node scripts/digitaliza-local-core.mjs   # Core local de PRUEBA
```
Abrir `http://localhost:54399/digitaliza.html?core=local&como=duena` (o `dependienta`, `sin-permiso`).
El Core local es Postgres en memoria (PGlite) con **todas las migraciones reales**; trae un farol de BizneCubano,
una cortina con variantes y la Olla Reina EON con su ficha. `POST /__test/offline {"on":true}` simula Core caído.
Una franja amarilla "MODO PRUEBA" lo indica siempre.

## 4. Estado por bloques

| Bloque | Qué | Estado (2026-10-07) |
|---|---|---|
| 1 | Recepción: fotos, datos, variantes, borrador, ficha, Core, inventario sin duplicar | Hecho y probado en local (41 pruebas + recorrido en navegador). **No aplicado en producción.** |
| 1b | Ficha de conocimiento, experiencias, versiones, piezas a revisar; piloto Olla Reina EON | Hecho y probado en local (9 pruebas + recorrido). **No aplicado en producción.** |
| 2 | Plantillas versionadas por canal leyendo solo la ficha; imágenes con Higgsfield (presupuesto autorizado, estimación y registro de trabajos) | Siguiente |
| 3 | Video vertical; paquetes descargables por canal (web, gestoras, Instagram/Facebook, Revolico, estados) con instrucciones | Pendiente |
| 4 | Publicación directa solo donde exista integración oficial verificada | Pendiente |

## 5. Pendientes concretos

- Aplicar las dos migraciones en `nexo-production` (crea tablas, RPC y el bucket privado) y desplegar el panel: **espera el visto bueno de Ernesto**.
- Probar subida real de fotos a Storage (solo verificable tras aplicar).
- Olla Reina EON: foto de la placa de características y de la caja para identificar fabricante/modelo; prueba de cocción y consumo con medidor.
- Borradores por usuario: hoy un dispositivo compartido muestra los borradores de todos (Core vuelve a comprobar permisos al guardar).
- Reponer añadiendo una variante nueva a un producto existente.
- IA (nombre, categoría, datos de etiqueta): no hay proveedor verificado activo (Curru necesita `OPENAI_API_KEY`). La ficha ya separa `aiSuggestions` y la fuente de cada dato.
