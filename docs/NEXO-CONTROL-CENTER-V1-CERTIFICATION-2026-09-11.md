# NEXO — Centro de Control v1 · Certificación

Fecha: 11 septiembre 2026

## Estado
**CERRADO — Centro de Control v1**

Esta certificación cubre la etapa administrativa acordada después de Productos/Inventario. WooCommerce continúa siendo la fuente de verdad de catálogo, precio, stock y pedidos. NEXO conserva la capa comercial/operativa: gestoras, atribución, snapshots, ledger, payouts, configuración, campañas y reconciliación.

## 1. Gestoras — CERRADO
- `/admin/gestoras`: búsqueda por nombre, correo, WhatsApp, slug o referido; filtro por estado.
- Activar/suspender desde sesión administrativa.
- Ventas atribuidas y comisión disponible.
- Enlace de tienda y código referido visibles.
- `/admin/gestoras/[id]`: perfil, estado, tienda, pedidos atribuidos, ingresos, productos seleccionados, reglas de precio, ledger y payouts.
- Solicitud de payout disponible desde el detalle cuando existen fondos disponibles.

FIX: centralizar el control de la red de gestoras en NEXO Admin.  
RULE: estado y datos de gestora viven en NEXO DB; pedidos siguen viniendo de Woo/snapshots.  
TEST: rutas compiladas, esquema disponible y lectura de 15 perfiles en QA productivo.

## 2. Clientes — CERRADO v1
- `/admin/clientes` deriva clientes de pedidos NEXO; no crea una base de clientes paralela.
- Nombre, teléfono, email, último pedido, cantidad de pedidos y gasto acumulado.

FIX: convertir los pedidos en un directorio operativo de clientes.  
RULE: no duplicar una fuente comercial de cliente cuando el origen es WooCommerce.  
TEST: ruta dinámica incluida en build productivo.

## 3. Comisiones y pagos — CERRADO
- `/admin/comisiones` presenta ledger por estado y movimientos.
- KPIs de disponible, provisional, retenida y pagada.
- Creación de payout desde ganancias disponibles.
- Pago de payout con método, referencia y evidencia opcional.
- Se reutilizan `requestPayout` y `payPayout`; no existe un ledger paralelo.

FIX: hacer operativa la administración de comisiones desde NEXO.  
RULE: todo payout debe mover estados del ledger mediante la lógica comercial existente.  
TEST: tablas `nexo_commission_ledger` y `nexo_payouts` presentes y verificadas en producción.

## 4. Marketing — CERRADO v1
- `/admin/marketing`: crear campañas, activar y pausar.
- Solo una campaña puede quedar activa al mismo tiempo.
- Tabla `nexo_marketing_campaigns` administrada por NEXO.
- La campaña activa se proyecta en la portada pública cuando el marketplace está habilitado.

FIX: eliminar la necesidad de tocar código para una campaña simple.  
RULE: nunca mostrar más de una campaña principal activa.  
TEST: tabla creada y ruta compilada; portada consume `activeMarketingCampaign()`.

## 5. Analítica — CERRADO v1
- `/admin/analitica`: ventas, pedidos, ticket promedio, gestoras activas e incidencias.
- Ranking de gestoras por ventas.
- Productos más vendidos por unidades e ingreso.

FIX: concentrar señales comerciales esenciales en una pantalla.  
RULE: analítica v1 se calcula desde pedidos/snapshots reales, no desde cifras manuales.  
TEST: ruta dinámica incluida en build productivo.

## 6. Configuración — CERRADO v1
- `/admin/configuracion` permite persistir parámetros operativos sin editar GitHub/Render.
- Registro seguro en `nexo_admin_settings`.
- Incluye textos de entrega/recogida, WhatsApp de soporte, moneda y comisión base como parámetros administrables.

FIX: crear un registro administrativo central de parámetros operativos.  
RULE: nuevos parámetros operativos deben entrar por esta capa antes de crear constantes dispersas.  
TEST: tabla `nexo_admin_settings` creada y verificada en producción.

Nota: esta v1 cierra el registro y gestión administrativa de configuración. La sustitución progresiva de constantes históricas por estos parámetros queda como evolución, no como bloqueo del Centro de Control v1.

## 7. Incidencias / reconciliación — CERRADO v1
- `/admin/incidencias`: pendientes, intentos, error y fecha de actualización.
- Acción administrativa para marcar una incidencia resuelta.
- Reutiliza `nexo_commercial_reconciliation`.

FIX: hacer visible lo que antes solo podía verse en datos/logs.  
RULE: una incidencia no se borra; cambia de estado y conserva trazabilidad.  
TEST: tabla presente, ruta compilada y QA productivo sin incidencias abiertas al momento de certificación.

## 8. QA final — CERRADO técnicamente
Evidencia de producción:
- Build de Render exitoso.
- Servicio LIVE en el dominio principal.
- Build registra las rutas:
  - `/admin/gestoras`
  - `/admin/gestoras/[id]`
  - `/admin/clientes`
  - `/admin/comisiones`
  - `/admin/marketing`
  - `/admin/analitica`
  - `/admin/configuracion`
  - `/admin/incidencias`
  - `/api/admin/control`
- Smoke productivo ejecutado en el último despliegue de esta etapa:
  `NEXO_ADMIN_V1_QA_RESULT {"status":"passed","missing":[],"counts":{"nexo_gestora_profiles":15,"nexo_order_commercial_snapshots":8,"nexo_commission_ledger":7,"nexo_payouts":0,"nexo_commercial_reconciliation":0,"nexo_admin_settings":0,"nexo_marketing_campaigns":0}}`
- CSS administrativo conserva reglas responsive para tablet/móvil y navegación horizontal desplazable.

No se simula una auditoría visual humana en navegador: la certificación de esta etapa es de build, rutas, datos, permisos y contratos productivos. Una revisión visual con capturas puede producir mejoras de UX posteriores sin reabrir la arquitectura del Centro de Control v1.

## Resultado
El **Centro de Control v1** deja de ser un dashboard parcial. Desde NEXO Admin ya existe control funcional de pedidos, productos/inventario, gestoras, clientes, comisiones/pagos, marketing, analítica, configuración e incidencias.

## Fuera de esta etapa
Continúan deliberadamente fuera del cierre por decisión previa:
- Bloque 0: migración/continuidad de la base de datos Render.
- Bloque 0: enforcement completo de verificación de email de gestoras.
- Evoluciones futuras: sustituir constantes históricas por `nexo_admin_settings`, analítica histórica paginada/BI, automatización de reintentos de reconciliación y ampliación del módulo de marketing.
