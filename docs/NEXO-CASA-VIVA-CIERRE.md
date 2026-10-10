# Casa Viva — checkpoint de cierre (único, compartido entre Claude, Codex y ChatGPT)

Etiquetas: DESARROLLADO · PROBADO EN CI · INSTALADO · VERIFICADO EN OPERACIÓN · PENDIENTE · BLOQUEADO.
Regla: no confundir compilación con funcionamiento real.

## Corte 2026-10-10 (noche) — Claude Code, bloque 1

### Ramas y commits comprobados
| Repo | Rama de integración real | Commit | Nota |
|---|---|---|---|
| `ernesto-rondon-nexo` | `ccr-f459b3eb-utyhix` | `1b51559` | `main` (`40c4820`) está **22 commits detrás**; se puede avanzar sin conflicto (solo avance rápido). Aún no fusionado. |
| `Casa-Viva` | `main` | `eecbb92` (3.13.27) | PR #160 (borrador Codex, prueba CRLF) abierto |
| `vivabot` | `main` | `523ea4a` (incluye `54e7d54`) | PR #2 (borrador Codex, negocio vacío en la cola) abierto. Despliegue en VPS **sin verificar** |

### Caja (Casa Viva Core)
- 1.0.4: DESARROLLADO · PROBADO EN CI (release `caja-v1.0.4`, run 38085383914).
- Local, rama `ccr` el 2026-10-10: `tsc` de la caja OK; `cargo test` de `packages/business-db/rust` OK (60 pruebas, 0 fallos). La crate de `src-tauri` no tiene pruebas propias.
- INSTALADO en PC de Lennys: **PENDIENTE de confirmar**.
- Aviso de "virus": el instalador **no está firmado** (`tauri.conf.json` sin certificado). Lo más probable es Microsoft SmartScreen ("Windows protegió su PC") o el navegador marcando un .exe sin reputación, no una detección real. Falta ver la captura de Lennys para confirmarlo. No desactivar Defender. Camino correcto: comprobar el SHA-256 publicado y, a medio plazo, firma de código (certificado OV/EV o Azure Trusted Signing).

### Comisiones (issue #133) — causa encontrada (solo lectura, nada cambiado)
- El trigger `sync_events_commissions` → `record_commissions()` **sí funciona**: la venta `7263cbe5…` (22:26 UTC) creó su asiento de dependienta (0,10 USD). Hoy hay **1** asiento, no 0.
- De los 26 `sale.completed`, **21 son ventas demo sin gestora ni dependienta** → 0 asientos es lo correcto.
- Las 3 ventas de prueba (04:02–04:08 UTC) no dejaron asiento de dependienta porque en ese momento el % de dependienta era 0: `cost_settings` de casa-viva se cambió a las **17:02 UTC** (`staff_pct` = 0,50). El trigger calcula al insertar y no recalcula después. (Deducido de `updated_at`; no hay historial de cambios para probarlo al 100 %.)
- La gestora sale con 0 USD porque **D36 se cargó en Casa Viva Core (WordPress), no en NEXO Business**: `product_costs` de casa-viva tiene solo 51 filas (del 2026-10-04), `cv-684` no está, y la regla general es `fixed 0` en lugar de 10 %.
- Corrección propuesta (PENDIENTE de aprobación de Ernesto, toca dinero): (1) poner la regla general en `percent 10`; (2) copiar las comisiones por producto de Core a `product_costs` (por SKU); (3) función de recálculo que añada asientos que falten a ventas pasadas sin duplicar (por `event_id`), probada antes en una rama de Supabase.

### Ventas de prueba sin conciliar
`862e588c` (80 USD), `92188b31` (23 USD), `226ba41d` (49 USD). PENDIENTE: comparar con el conteo físico antes de proponer ajustes. No tocar sin autorización.

### Reinicio a cero (2026-10-10 22:30 UTC, autorizado por Ernesto: "todo lo hecho es de prueba")
- Copia: esquema privado `nexo_backup` → `sync_events_20261010` (481 filas) y `commission_entries_20261010` (2).
- Borrado en `casa-viva`: todas las ventas, devoluciones, turnos y conteos de existencias; comisiones. El candado `sync_events_append_only` se desactivó solo dentro de esa transacción y se comprobó reactivado.
- Existencias recargadas con la importación programada (`run_scheduled_catalog_imports`) desde la foto de BizneCubano de las **22:34 UTC**: 217 productos con stock. Toalla pequeña `cv-684` = **3** (coincide con el conteo físico de Lennys).
- Con esto las 3 ventas de prueba sin conciliar dejan de existir: VERIFICADO.
- Cada equipo de caja debe borrar su base local (`%APPDATA%\com.nexo.business\nexo-business.db`, renombrarla) y darse de alta otra vez.

### PC de Ernesto (2026-10-10 22:55 UTC)
- Caja **1.0.4 INSTALADA** (instalador comprobado por SHA-256 `4d7cfddf…e787`; sin firma → "NotSigned"; Defender sin detecciones). Antes tenía 1.0.0.
- Base local nueva: identidad `windows-pilot-01`, 318 productos, 217 existencias, 0 ventas.
- Ruido: entre 22:35 y 22:40 UTC una compilación de pruebas de Codex (`Documents\Chat Gpt codex\NEXO\build\tauri-qa\debug`) abrió/cerró 2 turnos vacíos. Sin dinero ni stock; se dejan.

### Comisiones: regla general aplicada
- `cost_settings` casa-viva → `percent 10` (D36), autorizado por Ernesto.
- Venta simulada y deshecha (transacción revertida): 2 toallas 20 USD → gestora 2,00 + dependienta 0,10; `cv-2409` → gestora 1,00 fijo (por producto) + dependienta 0,095. Devolución de las toallas → sus 2 asientos pasan a `void`. VERIFICADO en la base, 0 restos.
- PENDIENTE: copiar las ~209 comisiones fijas de Core a `product_costs` (hoy solo hay 51). El permiso para leer el servidor de la web fue denegado en esta sesión; hace falta que Ernesto lo autorice o exportarlas desde WooCommerce.

### Prueba de caja 1.0.4 en PC de Ernesto (2026-10-10 ~23:00 UTC)
- Control: la app se abre con `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333` y se maneja por CDP (sin control de pantalla).
- Turno abierto con fondo 0: OK.
- Sobreventa: 4 toques sobre "Toallas pequeña" (stock 3) → el carrito se queda en 3 y aparece "Solo quedan 3 de Toallas pequeña". **VERIFICADO EN OPERACIÓN.**
- Cobro: Ernesto cobró 3 toallas (30 USD, venta directa). Nube: stock 3 → 0, dependienta 0,15. VERIFICADO.
- Devolución parcial (1 de 3, 10 USD efectivo): caja 30 → 20, stock nube 0 → 1. VERIFICADO.
  - **Fallo encontrado y arreglado:** la devolución parcial anulaba la comisión entera. Migración `20261010230000_nexo_business_partial_return_commissions.sql` (aplicada en producción): anula y vuelve a crear la parte proporcional. Simulada antes (3 → 2 → 1 → 0, revertida) y aplicada.
  - Mejora pendiente (UX): el campo "Reembolso" no se rellena solo con el precio de lo devuelto (aparece 0).
- Venta con gestora Claudia (1 toalla, 10 USD): gestora 1,00 (10 %) + dependienta 0,05; stock 1 → 0. VERIFICADO.
- Cierre de turno: debe haber 30 (40 ventas − 10 devolución), contado 30, "USD cuadra". VERIFICADO.
- Panel de la dueña (`summary_for`): 2 ventas, 40 USD, 10 USD devueltos. VERIFICADO.
- Venta sin internet: NO probada en el equipo (habría que cortar la red cambiando el cortafuegos; no se toca). Cubierta por las pruebas automáticas de Rust (stock offline, devoluciones offline).
- Estas ventas son de prueba: hay que borrarlas antes de entregar a Lennys (mismo procedimiento con copia en `nexo_backup`).

### Pendiente inmediato (en orden)
1. Ernesto: pedir a Lennys la captura del aviso y si instaló 1.0.4.
2. Fusionar `ccr` → `main` (avance rápido) y los borradores de Codex tras revisarlos.
3. Rama Supabase de prueba para la corrección de comisiones.
4. Issue #132: actualizar Next.js.
5. Prueba de la tienda de principio a fin (sin pedido real hasta tener aprobación).
