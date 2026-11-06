# TRASPASO · Contabilidad de Casa Viva (4-nov-2026)

## 1. Qué se hacía y para qué
Sacar la contabilidad de octubre (BizneCubano 1–11 oct + web desde el 11), cuadrarla con Arbelio (el económico) y el Excel de Maryta, y dejar la contabilidad diaria y mensual automática, fácil de auditar y bajo el control de Lennys. Maryta ya no lleva el Excel: noviembre lo llevan Ernesto y Claude.

## 2. Hecho y comprobado
- **Cierre FINAL de octubre enviado a Lennys desde cero (#4316, 4-nov 14:23).** PDF: `docs/nexo-business/contabilidad/octubre-2026/cierre-octubre-2026-final.pdf` (lo genera `hacer_final.py`).
  - Tienda: ganancia 2.704,64 USD (base Arbelio + mitad de ELIO − IA − impuestos 43,83). 40 % a inversores: 1.081,86. Queda para Casa Viva: 1.622,78.
  - Bajo pedido: margen 207,95 USD (incluye el split vendido fuera de la web).
  - Ernesto: le tocan 331,46 USD (1,5 % 274,02 + gestor especial 57,44 de la web). Debe 177 (olla 45, 20.000 CUP, 8.000 CUP, 100 USD). Saldo a su favor: 154,46 USD.
- **Conciliación con Arbelio:** `octubre-2026/conciliacion-arbelio-4nov.md` (y el Excel final de Maryta en la misma carpeta).
- **Core en main** (`ernest196391/Casa-Viva`), todo desplegado en casaviva.company. Copias de seguridad `~/bak-20261104-*`.
  - 3.14.125–127: costo guardado en cada venta; `/bot/contabilidad` y `/panel/contabilidad`.
  - 3.14.136: bajo pedido con tienda 2.500 CUP, la dependienta que marca «Listo» queda en el reparto, los pedidos devueltos no cuentan.
  - 3.14.137: botones «pagado» (dependienta, mensajero, proveedor).
  - 3.14.138: «Datos del mes» con historial (octubre ya cargado con los datos de Arbelio).
- **Panel** `casaviva.company/panel/`:
  - Resumen → «Cierre del día y del mes»: día o mes, «Datos del mes» y descarga CSV.
  - Pedidos → «Ventas de proveedor del mes»: botones «Falta / ✓» y el total «Falta pagar».
  - La función `nexo-panel-web` está desplegada con las acciones `contabilidad`, `contabilidad_mes_save` y `supplier_split_paid`.
  - Rama `panel-cierre-contabilidad` (ernesto-rondon-nexo, `318217d`).
- **Servidor del bot (VPS)**, carpeta `/root/supervisor/tareas/`:
  - `contabilidad-dia.mjs`: cada día a las 21:30, a Ernesto y a Lennys.
  - `contabilidad-mes.mjs`: el día 1 a las 9:00 el borrador; el día 3 a las 9:00 el final (`--final`).
  - Los PDF se hacen con puppeteer, en `/root/supervisor/pdf`.
- Mensajeros de octubre marcados como pagados. El 1,5 % ya sale como «Ernesto» en Ajustes (antes «Nati»).
- **Cuenta de gestor especial** (ernesto.gestor, user 137): «Mis ventas de proveedor». Enlace de entrada de un solo uso, válido 7 días desde el 4-nov.
- **Guía «Cierre del mes» para Lennys:** `docs/nexo-business/guias/datos-del-mes/`. Orden al supervisor programada a las 17:05 del 4-nov (`systemd` `orden-guia-cierre-lennys`).

## 3. Pendiente (en orden)
_Hecho el 4-nov 23:50: guía y resumen 21:30 comprobados; costo de las luces Feluz = 7 USD; rama del panel en main (PR #146) y Vercel al día._
1. **8:00 del 5-nov:** que el supervisor mande a Lennys la respuesta de las luces (`crm_supervisor` #1031, `plan.propuesta`): están bajo el mínimo; recomendar 12 USD y esperar su SÍ antes de cambiar el precio.
2. Lennys paga 3.000 CUP a Nana y 3.000 CUP a Zaymi (bajo pedido de octubre) y 18 USD a Lena (#5452), y lo marca en el panel (hoy solo están marcados los mensajeros). Falta confirmar qué se pagó a proveedores (517,80 USD).
3. Pedidos y unidades por gestora en BizneCubano (1–11 oct): necesita el Chrome de Ernesto conectado. La mejor gestora es Nadielys.
4. Mercancía nueva de Maryta con costos (puertas correderas blancas y beige ×6 a 40; sartén 28 cm ×6 a 17, 24 cm a 15, 20 cm a 13): ponerles el costo cuando el supervisor cree los productos (#1034).
5. Cada mes, poner el gasto real de IA (hoy son 270 USD estimados).
6. **Decide Ernesto:** de los 100 USD que cogió, ¿cuánto falta devolver (100 o 7)? ¿Las dos «Zaymi» de «A pagar» son la misma persona?

## 4. Datos fijos
- `ssh vps` (bot y supervisor, `cv …`) · `ssh web` (Hostinger, wp-cli en `~/domains/casaviva.company/public_html`).
- Supabase nexo-production `viwwlriwlwodrfukbgbj`. Desplegar la función: `npx supabase@3.0.0 functions deploy nexo-panel-web --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api --yes` (partir siempre de la versión en vivo).
- Copia de trabajo de Core: `C:\Users\Ernesto\Casa-Viva-contabilidad`.
- Opciones de la web: `cvd_conta_*`, `cvd_conta_mes_AAAA-MM`, `cvd_supplier_split_store` (2500).
- Lennys 5356885368 · Ernesto 5354056173 · tasa usada en octubre: 875.
- Parar los envíos: `crm_settings contabilidad_dia=no` / `contabilidad_mes=no`.

## 5. Reglas de Ernesto (D135–D137)
- Bajo pedido va aparte.
- 0,5 % para dependientas y 1,5 % para Ernesto, solo sobre la tienda y sin la subida de las gestoras.
- IA y herramientas salen de la ganancia de la tienda. La mitad de ELIO es de Casa Viva.
- Ernesto cobra el 1,5 % + lo que gana como gestor especial; Lennys se lo queda y lo resta de lo que él debe.
- Tienda: 2.500 CUP por pedido de bajo pedido. Dependienta: 500 CUP por artículo, con su nombre.
- Lennys tiene el control: «Datos del mes» y botones «pagado». Arbelio no recibe el cierre.
- Preguntar antes de cada tarea nueva. Mensajes cortos. Al hacer cambios, no pisar lo que otras sesiones subieron.

Mensaje para el chat nuevo: «Lee TRASPASO.md y sigue con la contabilidad de Casa Viva: empieza por comprobar que Lennys recibió la respuesta de las luces Feluz.»
