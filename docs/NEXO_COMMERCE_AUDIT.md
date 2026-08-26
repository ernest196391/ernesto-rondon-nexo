# Auditoría operativa — NEXO Commerce

Fecha: 2026-08-26. Base auditada: `main` en `664f27c622d9fa9b54b73fbeef5dc2035187d5f4`.

| Área | Estado inicial | Evidencia | Acción de esta rama |
|---|---|---|---|
| Render principal | Funciona | `/api/health` HTTP 200, IA Gemini/OpenAI configurada | Se amplía health con estado Commerce |
| NEXO Studio | Funciona para ocho especialistas | `/studio` autenticado, PostgreSQL server-side | Se añade Product Studio como noveno especialista |
| Captura de producto | Falta | No había rutas, modelo ni UI de captura | Captura múltiple real y persistencia BYTEA |
| Identificación/OCR | Falta | No existía respuesta Royal fija en el repositorio canónico; el prototipo externo no era fuente de verdad | Visión multimodal real con evidencia/confianza por campo |
| Investigación | Falta | Commerce Audit solo analizaba una URL | Web search por marca+modelo con fuentes y contradicciones |
| Imagen ecommerce | Parcial | No había pipeline de producto | WebP cuadrado determinista; eliminación semántica avanzada queda separada |
| Motor de precios | Falta | No existía para producto | Motor server-side producto→categoría→comercio→global + auditoría |
| WooCommerce | Bloqueado por secreto | Variables Woo no constan en el checkpoint de Render | Adaptador REST real; health y error 503 explícito mientras falten claves |
| WordPress Media | Bloqueado por secreto | No constan Application Password ni variables WordPress | Adaptador real y subida WebP cuando esté configurado |
| Casa Viva | Funciona y es canónico | `CVD_Attribution`, `CVD_Commissions`, estados y eventos | Se preservan hooks y metadatos; no se duplican pedidos |
| Marketplace | Falta en repo canónico | La raíz era sitio corporativo; prototipo externo era local/demo | Portada ecommerce, búsqueda, catálogo Woo y URL individual |
| Carrito/checkout | Parcial | Next no debe crear pedido paralelo | Añadir lleva al carrito Woo oficial; checkout y atribución quedan en Woo/Casa Viva |
| Dominio NEXO | Defectuoso | `https://nexo.casavivadecuba.com` responde 502 | Requiere corregir origen/DNS después del deploy validado |
| SSH Hostinger | No disponible en este runtime | No existe alias/config accesible en el contenedor actual | Se entregan ZIP; SSH/WP-CLI se reintentará desde el canal configurado |

## Gates de publicación

No se publica un producto con `missingCritical`, sin precio calculable o sin revisión humana. Ninguna integración se declara conectada solamente porque exista el adaptador.
