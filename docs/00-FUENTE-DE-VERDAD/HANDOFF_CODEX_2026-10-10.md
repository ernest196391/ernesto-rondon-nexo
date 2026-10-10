# Relevo para Codex (ChatGPT) — 2026-10-10

Ernesto se quedó sin crédito en Claude Code. Este documento es todo lo que necesitas para seguir sin el chat anterior. Habla con Ernesto en **español sencillo, paso a paso**. Él trabaja desde el móvil.

## 0. Reglas que no se rompen

- **Fuente de verdad:** `docs/00-FUENTE-DE-VERDAD/LEEME.md`, `ESTADO.md` y `DECISIONS.md` de este repo. Léelos primero. Al terminar cada bloque de trabajo, actualiza `ESTADO.md`.
- **Rama de trabajo** en los 4 repos: `ccr-f459b3eb-utyhix`. Casa-Viva despliega por PR a `main`.
- **El supervisor del VPS** (`/root/supervisor`) nunca hace cambios sin el **SÍ n** de Ernesto en su chat "Tú":
  - Para pedirle algo, inserta una fila en `crm_supervisor` (`kind='pregunta'`, `status='pendiente'`, con `body` y `plan`).
  - Después pon el mensaje "❓ *Pregunta N* … Responde *SÍ N*" en `crm_outbox` para Ernesto (`to_phone 5354056173`).
  - Nunca crees filas directamente en estado `aprobada`.
- **Para escribir por WhatsApp** a alguien, inserta en `crm_outbox` (`business_id 8771c6ed-9dbf-497d-b3df-be6697ba2693`, `to_phone`, `body`, `status 'pendiente'`, `created_by 'supervisor'`, `kind 'texto'`).
- **Nada se publica en el mercado sin `APRUEBA n`.** Al vender un MK-*, se pregunta a Ernesto antes de escribir al proveedor.
- **Contraseñas y voz:** nunca mandes contraseñas por WhatsApp. No uses la voz clonada (VOZ 5). La voz por defecto es la VOZ 1.
- **Claves expuestas:** se cambian al final.
- **Ventas de la caja:** todas son PRUEBAS hasta que Ernesto diga "ya estamos online".

## 1. Piezas y dónde están

| Pieza | Dónde |
|---|---|
| VivaBot (WhatsApp, Node 20, Baileys + Claude) | repo `vivabot`; VPS `/root/vivabot` con pm2 `vivabot` |
| Supervisor 24/7 (cada 5 min) | VPS `/root/supervisor` (CLAUDE.md, check.mjs, run.sh). Copia en `vivabot/supervisor/` |
| Web Casa Viva (WordPress + plugin `casa-viva-dropship-core`) | repo `Casa-Viva`. Deploy: PR → CI verde → squash → workflow `deploy-prototype.yml` con `expected_sha` = sha del merge |
| Caja "Casa Viva Core" (Tauri 2, Windows + Android) | repo `ernesto-rondon-nexo`, `apps/business-pos` + `packages/business-*` |
| Instalador Windows de la caja | workflow `caja-windows.yml` (se lanza solo al tocar la caja en la rama) → Release `caja-vX.Y.Z` |
| Nube | Supabase `nexo-production` (`viwwlriwlwodrfukbgbj`). Esquema `nexo_business.*` y tablas `crm_*` del bot |
| Importación BizneCubano → caja | edge function `nexo-catalog-import`, cron a los :50 de cada hora |

## 2. Lo que se hizo (9–10 oct)

**Web Casa Viva**
- 3.13.25: vale con pago y vuelto, foto de cada producto, WhatsApp de la gestora, descripciones sin precios.
- 3.13.26: mercado "Bajo pedido" (MK-*, puente `class-cvd-market-bridge.php`).
- Fotos de BizneCubano: se sincronizan (42 reemplazadas).
- 3.13.27 (PR #159, publicada): en pedidos de **recogida** no se guardan dirección, municipio, provincia ni vuelto. Ernesto debe responder **X 23**.

**Caja**
- `nexo-catalog-import` v8: `keepProductIds`, conserva el `product_id` de cada SKU.
- 1.0.2: el carrito no deja pasar de las existencias ("Solo quedan N").
- 1.0.3: las existencias usan la hora del propio equipo. El reloj adelantado de la PC de Lennys hacía salir "Agotado" con 1 en stock.
- El instalador Windows ya se compila en GitHub. La 1.0.3 se envió a Lennys.
- El equipo `ernesto-pc-1010-acaf` ahora se llama "Lennys PC".

**Prueba guiada con Lennys (dueña/admin)**
- Sincronizar ✅, existencias ✅, venta ✅, devolución ✅.

**VivaBot**
- Contexto en Curru, respuestas en audio a notas de voz (VOZ 1).
- Rol `admin` para Lennys; trato de género neutro.
- Visión de fotos y bloqueo para no contestar dos veces.
- "SÍ" con Í mayúscula.
- Mercado: captura de 16 grupos, precios +5/+10 USD y +5 % por encima de 300 USD, estudio de fotos gratis.
- **Pendiente de instalar con la Pregunta 149** (commit `e7c3f12`):
  - Audios más naturales (`speakable()` en `voice.js`).
  - No inventa dónde está Ernesto.
  - Ante respuestas a algo que el bot no ve ("no tengo", "agotado"), avisa a Ernesto en vez de ofrecer el menú.
  - Lee el mensaje citado.
  - Guarda las fotos recibidas en la tabla `crm_media`.

## 3. Pendiente, en orden

1. **Comprobar la Pregunta 149.**
   - Que el VPS quedó en `e7c3f12`.
   - Que una foto nueva crea una fila en `crm_media`.
   - Revisar las respuestas del bot en `crm_messages` de las siguientes horas.
2. **Antes de salir en vivo, limpiar las ventas de prueba** del equipo `ernesto-pc-1010-acaf`:
   - 8 Toallas pequeña (`cv-684`) con gestora, que dejaron el stock en −5.
   - Zapatera `cv-2603`.
   - Una venta de 5 productos.
   - Mejor por devoluciones desde la caja. Revisa también la comisión de la gestora.
3. **Confirmar con Lennys el aviso "Solo quedan 2"** en la caja 1.0.3.
4. **APK Android en GitHub.**
   - Hace falta subir como secreto la clave de firma que está en la laptop de Ernesto (`%APPDATA%\com.nexo.business\signing`).
   - Después, añadir un job Android a `caja-windows.yml`.
5. **Cambios de caja que pidió Lennys** (esperando su prioridad):
   - Hacer legible la parte de abajo de la hoja de cobro.
   - Decir "consignataria" en vez de "consignadora".
   - Lupa de búsqueda más visible.
   - Mostrar la versión de la app en "Más".
6. **Web #23:** que Ernesto responda X 23.
7. **Más adelante:**
   - Flujo completo con Dany hasta "Entregado".
   - Primer FOTOS 70 → APRUEBA 70.
   - Flujo de venta de los MK-*.
   - App NEXO Fotos (basada en `vivabot/src/studio.js`).
   - Agente de productos ganadores (`vivabot/docs/PENDIENTES.md`).
   - Cambiar las claves.

## 4. Cómo trabajar

- **Antes de subir:**
  - Bot: `npm run check`.
  - Caja: `npx tsc --noEmit -p apps/business-pos`.
  - Web: tests en `artifacts/tests/*.mjs`.
- **Commits:** en español, claros, en la rama de arriba.
- **Lo que llega a Lennys o a los clientes:** sale por `crm_outbox`, y si hace falta tocar el VPS, por una pregunta al supervisor.
