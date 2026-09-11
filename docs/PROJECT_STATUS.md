# Estado real — Product Studio One

Fecha de auditoría: 2026-09-11 UTC. Rama documental: `docs/product-studio-one-block-0`.

## Diagnóstico

Product Studio One aún no existe como repositorio ni aplicación independiente. Su implementación más cercana es NEXO Product Studio dentro de `ernest196391/ernesto-rondon-nexo`. NEXO combina escaparate, oficina de gestoras, administración, Product Studio, Postgres de Render y WooCommerce. Cuyana vive en `ernest196391/cuyana-app`, se despliega separadamente y usa Supabase. Casa Viva conserva el modelo operativo más maduro para pedidos, atribución, comisiones, inventario y mensajería.

La extracción segura es progresiva: definir contratos en NEXO, crear después un repositorio independiente y migrar módulos probados sin alterar los canales operativos.

## Despliegues comprobados

| Sistema | URL comprobada | Escritorio | Android/UA móvil | Resultado |
|---|---|---:|---:|---|
| NEXO | `https://nexotienda.casavivadecuba.com` | 200 | 200 | funcional; título NEXO |
| Product Studio | `https://nexotienda.casavivadecuba.com/studio/products` | 200 tras redirección | 200 tras redirección | acceso protegido; redirige a `/studio/login?next=%2Fstudio%2Fproducts` |
| Cuyana | `https://cuyana.casavivadecuba.com` | 200 | 200 | funcional; título Cuyana |

La comprobación móvil validó respuesta/redirect con user-agent Android. No hubo sesión autenticada ni prueba visual interactiva a 390 px; queda explícitamente pendiente.

## NEXO — inventario

| Capacidad | Ubicación exacta | Estado | Dependencias / pruebas | Reutilización, riesgo y recomendación |
|---|---|---|---|---|
| catálogo | `lib/commerce/store-api.ts`, `storefront.ts`, `/api/marketplace/products` | funcional/parcial | WooCommerce; pruebas storefront/catalog | Adaptar detrás de contrato; hoy mezcla canal NEXO |
| Product Studio | `app/studio/products`, `/api/studio/products/*`, `lib/commerce/db.ts` | parcial | Postgres Render, IA, Woo; build y tests | Extraer progresivamente; schema se crea en runtime |
| conocimiento | `lib/commerce/knowledge*.ts`, `/api/knowledge/*` | parcial | seeds/DB; 22+ pruebas relacionadas | Reutilizar modelo, adaptar multiempresa |
| imágenes | `lib/commerce/images.ts`, `catalog-images.ts`, `public/catalog` | parcial | Sharp/archivos; tests catálogo | Adaptar; almacenamiento local y rutas NEXO son riesgo |
| precios | `lib/commerce/pricing.ts`, `lib/commercial/pricing.ts` | funcional para NEXO | Woo/DB; pruebas pricing | Reutilizar reglas tras contrato monetario/tenant |
| publicación Woo | `/api/studio/products/captures/[id]/woocommerce`, `lib/commerce/woocommerce.ts` | parcial | credenciales Woo | Adaptar como conector idempotente; probar E2E |
| asistente ventas | `GlobalCommerceAssistant.tsx`, `/api/assistant/*`, `lib/commerce/assistant*` | parcial | OpenAI/Google, knowledge; tests | Adaptar núcleo; sustituir UI/branding NEXO |
| roles | `lib/commercial/*auth*`, rutas admin/gestoras | parcial | DB/sesiones/email | Sustituir por RBAC multiempresa; onboarding email roto |
| atribución | checkout + `lib/commercial/*` | parcial no certificado E2E | Woo metadata/Postgres | Adaptar contrato; no copiar acoplamiento de metadatos |
| carrito | `app/carrito`, `/api/commerce/cart`, `lib/commerce/cart.ts` | funcional por pruebas | Woo/session | Conservar en NEXO; adaptar solo contrato de canal |
| checkout | `app/checkout`, `/api/commerce/checkout` | funcional por código; E2E pendiente | Woo/Postgres/WhatsApp | Conservar y exponer adaptador; no extraer lógica pública |
| pedidos | `/api/commerce/order`, `/api/admin/orders`, `app/admin/pedidos` | parcial | Woo/Postgres | Woo sigue fuente operativa; adaptar lectura/eventos |
| mensajería | `/api/commerce/delivery`, `config/shipping-rates.csv` | parcial | matriz local/Woo | Sustituir por contrato; Casa Viva es referencia madura |
| despliegue | Render `ernesto-rondon-nexo`, worker `nexo-content-worker` | funcional | Node 20, env de Render | Conservar; Postgres Free documentado con expiración 2026-09-23 |
| pruebas | 33 archivos Vitest/144 tests | funcional | Node declarado 20 | Reutilizar; faltan visual 390 y E2E transaccional |

## Cuyana — inventario

| Capacidad | Ubicación exacta | Estado | Dependencias / pruebas | Reutilización, riesgo y recomendación |
|---|---|---|---|---|
| calculadora remesas | `src/components/Calculator.tsx` | funcional | Supabase rates | Conservar; adaptar contrato de tasa |
| monedas/tasas | `delivery_methods`, `rate_config`, `rate_history`, `src/lib/useDeliveryMethods.ts` | funcional/parcial | Supabase | Adaptar; asegurar GYD principal/USD referencia para ecommerce |
| formulario | `Calculator.tsx`, tabla `orders` | funcional | Supabase RLS | Conservar en remesas; no usar como checkout ecommerce |
| WhatsApp | `NEXT_PUBLIC_WHATSAPP_NUMBER`, `sent_to_whatsapp` | parcial | cliente/WhatsApp | Adaptar; pedido debe persistir antes de abrir WhatsApp |
| autenticación | `src/lib/useAdminAuth.ts`, `/admin/login` | parcial | Supabase Auth | Adaptar RBAC; solo admin actual |
| Supabase | proyecto `dkiiknsfbefpkrnmbzid` (`cuyana`) | funcional | 7 migraciones, RLS | Conservar; no convertirlo aún en DB central |
| almacenamiento | sin Storage usado en código/tablas auditadas | inexistente | — | Implementar luego en PS1, no simular |
| analítica | sin proveedor/eventos localizados | inexistente | — | Implementar por contrato posterior |
| legales | sin rutas legales en build | inexistente | — | Crear en bloque comercial posterior |
| SEO | metadata/layout + activos OG/favicon | parcial | Next metadata | Adaptar/completar |
| Vercel | repo/documentación atribuyen Cuyana a Vercel; dominio responde | parcialmente verificado | configuración externa no accesible | Conservar; confirmar project ID/commit en panel |
| ecommerce | no hay tienda/producto/carrito/checkout en rutas construidas | inexistente | — | Construir como consumidor del catálogo central, no copiar remesas |

## Casa Viva reutilizable

`wordpress/casa-viva-dropship-core/` contiene contratos operativos probados de pedidos, estados, inventario, atribución, comisiones, payouts, tienda gestora y mensajería. Reutilizar conceptos, fixtures y estados; no copiar PHP/JS directamente al núcleo TypeScript sin contrato. Riesgos: metadatos Woo específicos, estados multidimensionales, datos históricos y reglas de negocio Casa Viva.

## Fallos y límites con evidencia

- NEXO: onboarding de gestoras no fuerza verificación de email (`docs/NEXO-BLOCK-0-CERTIFICATION-2026-09-11.md`).
- NEXO: E2E pedido→Woo→stock→atribución→comisión no certificado.
- NEXO: Postgres Render Free documentado para expirar 2026-09-23; requiere decisión/migración independiente de este bloque.
- NEXO: 27 warnings lint, 0 errores; 144/144 tests pasan.
- Cuyana: no existen rutas ecommerce ni páginas legales; no hay tests automatizados declarados.
- Cuyana: identificación exacta del proyecto Vercel/commit desplegado queda bloqueada por falta de conector/panel Vercel en esta sesión.
- Verificación visual real a 390 px autenticada queda pendiente; HTTP móvil sí pasó.
