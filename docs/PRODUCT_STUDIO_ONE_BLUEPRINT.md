# PRODUCT STUDIO ONE — BLUEPRINT MAESTRO

Versión: 1.0  
Fecha: 11 de septiembre de 2026  
Estado: aprobado para iniciar construcción por bloques  
Nombre de trabajo: Product Studio One / Product Studio 1  

## 1. Visión

Product Studio One será una plataforma independiente, móvil y multiempresa que convierte evidencia comercial desordenada —fotografías, capturas de WhatsApp, etiquetas, cajas, listas de precios, códigos y notas del proveedor— en productos verificados y listos para vender en diferentes canales.

NEXO y Cuyana serán los dos primeros clientes reales de la plataforma, pero no serán propietarios de su lógica. La aplicación debe poder venderse posteriormente a comercios, dependientes, gestoras, marketplaces y agencias que necesiten digitalizar inventario y publicar productos sin realizar manualmente investigación, edición fotográfica, redacción, cálculo de precios y carga.

La promesa central del producto es:

> Sube las fotos o capturas que ya tienes. Product Studio One investiga, organiza, mejora, calcula y prepara el producto para vender donde tú decidas.

## 2. Resultados que debe producir

Una captura debe poder terminar en uno o varios de estos resultados:

1. Ficha canónica del producto.
2. Product Knowledge Record con fuentes, evidencia y confianza.
3. Fotografía profesional fiel al producto.
4. Galería WebP optimizada.
5. Precio calculado por tienda, canal y moneda.
6. Descripción ecommerce.
7. Especificaciones técnicas verificadas.
8. SEO y datos estructurados.
9. Preguntas frecuentes y argumentos de venta.
10. Copy para WhatsApp, Facebook, Instagram y Revolico.
11. Paquete descargable de fotografías y textos.
12. Borrador publicable en NEXO, Cuyana u otro canal.
13. Registro de publicación, actualización y retirada.
14. Base de conocimiento consultable por asistentes de venta.

## 3. Principios que no se pueden romper

1. Una sola fuente de verdad para cada producto.
2. Nunca inventar marca, modelo, precio, garantía, capacidad o prestaciones.
3. Separar siempre dato observado, dato del proveedor, fuente externa, inferencia y dato desconocido.
4. Las inferencias nunca se publican como hechos confirmados.
5. Ningún producto con campos comerciales críticos sin verificar se publica automáticamente.
6. Las imágenes generadas deben conservar forma, controles, marca y características visibles del producto real.
7. El costo del proveedor nunca se muestra al cliente final.
8. El precio público se calcula mediante reglas configurables y conserva historial.
9. Producto, precio, inventario y pedido no se duplican por canal.
10. WhatsApp es evidencia o canal de comunicación, no la fuente de verdad.
11. Toda publicación debe ser idempotente: repetirla no crea duplicados.
12. La experiencia se diseña primero para Android y conexiones móviles limitadas.
13. La IA propone; las reglas, la evidencia y los permisos deciden.
14. Las credenciales nunca se escriben en documentación, prompts, commits ni registros visibles.
15. ChatGPT, Claude Code y cualquier agente futuro deben trabajar desde el repositorio y la base de datos, no desde la memoria de un chat.

## 4. Producto independiente y relación con las marcas

Product Studio One será el motor compartido. Cada negocio será un `tenant` o espacio de trabajo independiente.

### Primeros espacios de trabajo

| Espacio | Finalidad | Marca visible | Monedas | Canal de pedido |
|---|---|---|---|---|
| NEXO | Marketplace y venta en Cuba | NEXO | USD, CUP cuando corresponda | Pedido oficial NEXO/WooCommerce |
| Cuyana | Remesas, alimentos y energía para familiares en Cuba | Cuyana | GYD principal, USD de referencia | Pedido Cuyana con ejecución en Cuba |
| Demostración | Enseñar la plataforma a futuros clientes | Product Studio One | Configurable | Simulado y claramente identificado |

Los comercios futuros podrán tener:

- logotipo y colores propios;
- usuarios y permisos propios;
- reglas de precios propias;
- catálogos separados;
- monedas propias;
- canales de publicación propios;
- inventario y pedidos separados;
- integraciones diferentes.

## 5. Estrategia de dominio

### Piloto sin gasto adicional

Usar inicialmente un subdominio ya controlado:

`productstudio.casavivadecuba.com`

Alternativa más corta:

`studio.casavivadecuba.com`

La aplicación no debe llamarse Casa Viva internamente ni depender de ese dominio. El dominio será solamente una puerta temporal.

### Producto comercial

Comprar un dominio independiente cuando se cumpla una de estas condiciones:

- el flujo completo haya sido utilizado con éxito en NEXO y Cuyana;
- exista el primer comercio externo preparado para probarlo;
- exista el primer cliente dispuesto a pagar;
- el nombre comercial y su disponibilidad legal hayan sido comprobados.

No comprar un dominio antes de validar el flujo. No ligar la arquitectura al nombre definitivo.

## 6. Arquitectura general

### 6.1 Capas

1. **Captura**: cámara, galería, archivo y captura de WhatsApp.
2. **Ingesta**: agrupa evidencia y detecta cuántos productos contiene.
3. **Comprensión**: visión, OCR, código de barras y QR.
4. **Investigación**: fabricante, manuales, distribuidores y fuentes comerciales.
5. **Normalización**: crea la ficha canónica y detecta duplicados.
6. **Contenido**: descripciones, SEO, preguntas frecuentes y copies por canal.
7. **Activos**: fondo blanco, recorte, WebP, galería y control de fidelidad.
8. **Precios**: costo, reserva, margen, comisiones, moneda y redondeo.
9. **Revisión**: confianza, contradicciones, campos faltantes y aprobación humana.
10. **Publicación**: adaptadores para NEXO, Cuyana, WooCommerce, redes y clasificados.
11. **Operación**: inventario, precio vencido, pedidos, retirada y republicación.
12. **Auditoría**: quién hizo qué, cuándo, con qué evidencia y mediante qué regla.

### 6.2 Componentes

- Aplicación web móvil en Next.js.
- Supabase para autenticación, datos, permisos, almacenamiento y auditoría.
- Trabajos asíncronos para OCR, investigación e imágenes.
- Motor de IA con enrutamiento por costo y complejidad.
- API interna versionada.
- Adaptadores de publicación desacoplados.
- WooCommerce como fuente operativa de catálogo y pedidos de NEXO durante la transición.
- Cuyana como escaparate propio, sin mostrar la marca NEXO.

### 6.3 Enrutamiento de IA

- Reglas deterministas para precios, duplicados, permisos y estados.
- Modelo económico para OCR sencillo, clasificación y copys básicos.
- Modelo avanzado para contradicciones, investigación compleja y razonamiento técnico.
- Generación de imagen solamente cuando sea necesaria.
- Caché por producto y fuente para no pagar dos veces la misma investigación.
- Registro del proveedor, modelo, costo estimado y resultado de cada ejecución.

## 7. Modelo mínimo de datos

### Identidad y permisos

- `organizations`
- `stores`
- `users`
- `memberships`
- `roles`
- `permissions`

### Producto y evidencia

- `products`
- `product_variants`
- `product_evidence`
- `product_sources`
- `product_facts`
- `product_contradictions`
- `product_knowledge`
- `product_images`
- `product_reviews_internal`

### Comercio

- `channels`
- `product_channels`
- `price_rules`
- `price_calculations`
- `channel_prices`
- `exchange_rates`
- `inventory_snapshots`
- `promotions`
- `commissions`

### Publicación y pedidos

- `publication_jobs`
- `publication_records`
- `content_variants`
- `orders`
- `order_items`
- `order_attribution`
- `fulfillment_events`

### Control

- `audit_log`
- `ai_runs`
- `project_events`
- `feature_flags`
- `integration_credentials` como referencias cifradas, nunca secretos en texto plano.

Todas las tablas con datos de clientes o de un comercio deben aplicar Row Level Security. Cada registro debe incluir `organization_id` o una relación inequívoca con la organización propietaria.

## 8. Estados del producto

`detectado → analizando → investigando → requiere_informacion → preparado → pendiente_revision → verificado → borrador_publicado → publicado → disponibilidad_por_confirmar → agotado → retirado`

Reglas:

- `requiere_informacion` bloquea la publicación si falta precio, identidad o condición comercial crítica.
- `preparado` significa que la IA terminó, no que el producto sea verdadero.
- `verificado` exige aprobación de una persona autorizada.
- `publicado` debe registrar canal, identificador remoto, URL y fecha.
- `agotado` oculta el producto en todos los canales configurados o lo presenta como agotado según la regla de cada tienda.

## 9. Flujo principal: fotografía a producto

1. Usuario pulsa `Capturar producto`.
2. Toma o sube varias imágenes.
3. Clasifica opcionalmente cada foto: general, etiqueta, precio, caja, garantía, código.
4. El sistema determina si las imágenes pertenecen a uno o varios productos.
5. OCR extrae textos sin interpretarlos como hechos todavía.
6. Se identifica marca, modelo y categoría con niveles de confianza.
7. Se buscan duplicados existentes.
8. Se investiga en fuentes actuales y se guardan URL y fecha.
9. Se comparan fotografía, proveedor y fuentes externas.
10. Se muestran contradicciones y campos faltantes.
11. Se crea una imagen comercial fiel y optimizada.
12. Se generan título, descripción, especificaciones, FAQ y SEO.
13. El motor calcula precios por tienda y moneda.
14. Una persona revisa y corrige.
15. Se eligen canales de publicación.
16. Se crea un borrador idempotente.
17. Se publica cuando los controles obligatorios pasan.
18. Se guarda URL, estado, precio y fecha de verificación.

## 10. Flujo: captura de WhatsApp a producto

1. El usuario sube una o varias capturas de una conversación o grupo de proveedor.
2. El sistema advierte que deben eliminarse datos personales innecesarios.
3. OCR separa nombre, descripción, precio, garantía, transporte y disponibilidad.
4. Detecta si la captura contiene uno o varios productos.
5. Los datos se etiquetan como `declarado_por_proveedor`, no como confirmados.
6. Se vinculan fotografías adicionales del producto.
7. Se investiga marca y modelo.
8. Se señalan contradicciones.
9. Se aplica el flujo normal de revisión, precio y publicación.

No deben conservarse números de teléfono, nombres de terceros o conversaciones completas cuando no sean necesarios como evidencia comercial.

## 11. Generador de contenido por canal

Cada producto tendrá una ficha canónica y distintas presentaciones.

### Ecommerce

- título claro;
- descripción corta;
- descripción completa;
- especificaciones;
- garantía;
- entrega;
- disponibilidad;
- SEO;
- datos estructurados;
- preguntas frecuentes.

### Revolico

- un anuncio por oferta concreta;
- título cargado de términos relevantes, sin spam;
- precio público del canal;
- copy cercano y escaneable;
- condiciones verificadas;
- palabras clave pertinentes;
- enlace a la ficha del comercio;
- paquete de imágenes listo para subir;
- botón `Copiar anuncio`;
- botón `Descargar fotos`;
- botón `Compartir` mediante las capacidades nativas del móvil.

La publicación directa en Revolico solo se implementará si existe una API o un mecanismo permitido y estable. Si hay verificación anti-bot, el producto debe preparar el paquete y guiar la carga manual; nunca debe intentar saltarse la protección.

### WhatsApp

- versión corta para estado;
- versión completa para grupos;
- mensaje personalizable para un cliente;
- enlace directo al producto;
- imágenes optimizadas para compartir.

### Redes sociales

- Facebook Marketplace/post;
- Instagram caption;
- historia vertical;
- ficha para gestoras;
- variantes por tono y audiencia.

## 12. Motor de precios multiempresa

Prioridad de reglas:

1. producto;
2. canal;
3. categoría;
4. tienda;
5. organización;
6. regla general.

Fórmula conceptual:

`precio = costo + reserva + gastos + margen + comisiones + ajuste_moneda`

Debe admitir:

- cantidad fija;
- porcentaje;
- margen mínimo;
- redondeo;
- vigencia;
- promociones;
- costo de procesamiento;
- entrega separada o incluida;
- precio manual con motivo obligatorio;
- monedas múltiples;
- historial y reversión.

Para Cuyana:

- USD será la moneda canónica interna del producto;
- GYD será el precio principal visible para el pagador;
- USD aparecerá como referencia secundaria;
- la tasa comercial tendrá fuente, fecha y vigencia;
- el precio se bloqueará durante el periodo definido para el pedido.

## 13. Cuyana como primer escaparate de marca blanca

Cuyana conservará su identidad y no mostrará NEXO.

La portada presentará tres recorridos:

1. Enviar dinero.
2. Enviar alimentos.
3. Enviar energía y equipos.

Rutas mínimas:

- `/tienda`
- `/tienda/energia`
- `/tienda/alimentos`
- `/producto/[slug]`
- `/carrito`
- `/checkout`
- `/pedido/[codigo]`

Cuyana leerá el catálogo central mediante una API o vista autorizada. El pedido debe registrarse antes de abrir WhatsApp. El precio, la entrega y la moneda deben conservarse como instantánea del pedido.

## 14. NEXO como primer canal operativo

- Conservar WooCommerce como fuente operativa de sus productos y pedidos.
- Sincronizar por SKU e identificador canónico.
- No duplicar fichas ya existentes.
- Publicar primero como borrador cuando el producto sea nuevo.
- Ocultar o agotar de forma coordinada.
- Mantener costo y evidencia fuera de la ficha pública.
- Alimentar al asistente de ventas desde `product_knowledge`.

## 15. Roles mínimos del producto comercial

### Superadministrador de la plataforma

- administra organizaciones e integraciones;
- consulta uso, costos y salud;
- no accede a datos comerciales innecesarios de clientes.

### Administrador del negocio

- configura tiendas, precios y usuarios;
- revisa y publica;
- administra integraciones;
- consulta auditoría.

### Dueño de tienda

- administra su catálogo y reglas autorizadas;
- consulta ventas e inventario.

### Dependiente o capturador

- crea capturas;
- corrige datos permitidos;
- envía a revisión;
- no publica ni cambia márgenes.

### Gestora o vendedora

- consulta productos autorizados;
- genera copys;
- comparte enlaces atribuibles;
- consulta pedidos y comisiones propias.

## 16. Memoria compartida entre ChatGPT, Claude Code y otros agentes

El repositorio y la base de datos son la memoria. Los chats no lo son.

### Archivos obligatorios en la raíz y `docs/`

- `AGENTS.md`: reglas universales para cualquier agente.
- `CLAUDE.md`: instrucciones específicas de Claude que apuntan al mismo blueprint.
- `docs/PRODUCT_STUDIO_ONE_BLUEPRINT.md`: este documento, fuente estratégica.
- `docs/PROJECT_STATUS.md`: qué funciona, qué está roto y qué está desplegado.
- `docs/ROADMAP.md`: bloques, orden y criterios de terminado.
- `docs/TASKS.md`: tareas con estado, responsable y dependencias.
- `docs/HANDOFF.md`: último relevo entre agentes.
- `docs/DECISIONS.md`: decisiones de arquitectura con fecha y motivo.
- `docs/DATA_CONTRACTS.md`: tablas, eventos, API y estados.
- `docs/INTEGRATIONS.md`: contratos de NEXO, Cuyana, WooCommerce y canales.
- `docs/DEPLOYMENTS.md`: proyectos, dominios y variables requeridas, nunca valores secretos.
- `docs/TEST_MATRIX.md`: pruebas obligatorias y resultados.
- `docs/CHANGELOG.md`: cambios visibles del producto.

### Regla de autoridad documental

1. Código y migraciones ejecutadas.
2. Base de datos y contratos versionados.
3. `PROJECT_STATUS.md`.
4. `DECISIONS.md`.
5. Blueprint.
6. Conversaciones y notas, únicamente como evidencia pendiente de consolidar.

Si dos fuentes se contradicen, el agente debe comprobar el estado ejecutable y actualizar la documentación. Nunca debe elegir silenciosamente.

### Protocolo de inicio para cualquier IA

Antes de cambiar nada:

1. Leer `AGENTS.md` y su archivo específico de agente.
2. Leer el blueprint completo.
3. Leer `PROJECT_STATUS.md`, `ROADMAP.md`, `TASKS.md` y `HANDOFF.md`.
4. Leer las decisiones recientes.
5. Comprobar rama, commit, cambios locales y remoto.
6. Localizar instrucciones adicionales dentro del repositorio.
7. Verificar el despliegue público afectado.
8. Elegir una tarea `ready` sin responsable o continuar la marcada `in_progress`.
9. Registrar quién toma la tarea y en qué momento.
10. No reconstruir funcionalidades existentes sin demostrar que están rotas.

### Protocolo de cierre y relevo

Antes de terminar una sesión:

1. Ejecutar las pruebas aplicables.
2. Actualizar el estado de la tarea.
3. Actualizar `PROJECT_STATUS.md` si cambió el sistema real.
4. Registrar decisiones no triviales.
5. Actualizar contratos si cambió una interfaz o tabla.
6. Escribir en `HANDOFF.md`:
   - objetivo trabajado;
   - resultado;
   - archivos modificados;
   - pruebas;
   - commit o PR;
   - despliegue;
   - bloqueos reales;
   - siguiente acción exacta.
7. No declarar terminado algo que no esté probado y desplegado cuando corresponda.

### Formato de tarea compartida

```yaml
id: PS1-B02-T03
title: Publicar un producto en Cuyana
status: ready | in_progress | blocked | review | done
owner: chatgpt | claude | human | none
claimed_at: ISO-8601
depends_on: []
acceptance:
  - El borrador se crea una sola vez.
  - El precio GYD conserva tasa y fecha.
  - La ficha usa identidad Cuyana.
evidence:
  commit: null
  pull_request: null
  deployment: null
  tests: []
blocker: null
next_action: null
```

Dos agentes no deben editar simultáneamente la misma tarea o migración. Si encuentran una tarea reclamada y activa, eligen otra o verifican primero si el reclamo quedó abandonado.

## 17. Estrategia de repositorios

### Recomendación inicial

Crear un repositorio independiente para Product Studio One y mantener adaptadores explícitos para NEXO y Cuyana.

Estructura sugerida:

```text
apps/
  studio-web/
  worker/
packages/
  core-products/
  pricing-engine/
  knowledge/
  publishing/
  ui/
integrations/
  nexo/
  cuyana/
  woocommerce/
  revolico-export/
supabase/
  migrations/
  seed/
docs/
```

No mover inmediatamente todo el código estable de NEXO. Primero identificar, probar y extraer módulos con contratos. La migración debe ser progresiva.

## 18. API y eventos mínimos

### API

- `POST /captures`
- `POST /captures/:id/files`
- `POST /captures/:id/analyze`
- `POST /products/:id/research`
- `POST /products/:id/generate-assets`
- `POST /products/:id/calculate-price`
- `POST /products/:id/review`
- `POST /products/:id/publications`
- `GET /products/:id`
- `GET /stores/:id/catalog`
- `POST /orders`

### Eventos

- `capture.created`
- `capture.analyzed`
- `product.matched`
- `product.requires_information`
- `product.prepared`
- `product.verified`
- `price.calculated`
- `asset.generated`
- `publication.requested`
- `publication.completed`
- `publication.failed`
- `inventory.changed`
- `order.created`

Cada evento debe llevar identificador idempotente, organización, usuario, fecha y correlación con el producto.

## 19. Seguridad y privacidad

- RLS por organización y rol.
- Enlaces firmados para archivos privados.
- Eliminación o difuminado de datos personales en capturas.
- Secretos solamente en gestores de variables de entorno.
- Registro de acciones administrativas.
- Límites de tamaño, tipo y cantidad de archivos.
- Análisis antivirus cuando se permitan documentos.
- URLs externas validadas para impedir solicitudes inseguras.
- Publicación y cambio de precio restringidos por permisos.
- Copias de seguridad y restauración probada.
- Política de retención de evidencia configurable.

## 20. Experiencia móvil mínima

### Inicio

- `Capturar producto` como acción principal.
- `Subir captura de WhatsApp`.
- `Catálogo`.
- `Pendientes de revisión`.
- `Generar publicación`.
- Alertas de precio e inventario.

### Revisión

Debe responder de un vistazo:

- qué producto entendió;
- qué está confirmado;
- qué es solo dato del proveedor;
- qué se contradice;
- qué falta;
- qué precio propone;
- dónde se publicará;
- qué debe revisar la persona.

Las tablas extensas se convierten en tarjetas o secciones desplegables en móvil.

## 21. Métricas del producto

- minutos desde captura hasta borrador;
- porcentaje de campos completados automáticamente;
- porcentaje de productos que requieren corrección;
- costo de IA por producto;
- tasa de publicaciones exitosas;
- duplicados evitados;
- productos con precio vencido;
- clics y pedidos por canal;
- tiempo ahorrado frente a carga manual;
- organizaciones activas;
- productos procesados por organización;
- conversión de prueba a cliente.

## 22. Modelo comercial futuro

No implementar cobros de SaaS hasta validar el producto con NEXO y Cuyana, pero diseñar para:

- plan por cantidad de productos procesados;
- plan mensual por comercio;
- créditos de generación de imágenes;
- usuarios adicionales;
- conectores premium;
- marca blanca;
- servicio administrado para negocios que no quieren operar la herramienta.

El costo de IA debe medirse por organización para poder fijar precios sostenibles.

## 23. Hoja de ruta por bloques

### Bloque 0 — Fuente de verdad compartida

Objetivo: permitir que ChatGPT y Claude Code continúen el mismo trabajo.

- Crear repositorio o área independiente.
- Añadir documentos obligatorios.
- Inventariar código reutilizable de NEXO.
- Documentar Cuyana, NEXO, WooCommerce, Supabase y Vercel.
- Registrar despliegues sin secretos.
- Crear tablero de tareas versionado.

Terminado cuando un agente nuevo pueda explicar el estado, ejecutar pruebas y elegir la siguiente tarea leyendo únicamente el repositorio.

### Bloque 1 — Núcleo multiempresa

- Organizaciones, tiendas, usuarios y roles.
- RLS.
- Producto canónico.
- Evidencia y conocimiento.
- Auditoría.
- Estados.

Terminado cuando dos organizaciones no puedan leer ni modificar datos entre sí.

### Bloque 2 — Captura e interpretación

- Cámara y subida múltiple.
- Capturas de WhatsApp.
- OCR y clasificación.
- Detección de varios productos.
- Detección de duplicados.
- Separación de fuentes y confianza.

Terminado cuando una captura real termine en una revisión estructurada sin inventar campos.

### Bloque 3 — Investigación y conocimiento

- Fuentes actuales.
- Contradicciones.
- Especificaciones.
- FAQ.
- Caché y costos.

Terminado cuando el asistente pueda responder citando qué está confirmado y qué queda pendiente.

### Bloque 4 — Imágenes y contenido

- Fondo blanco fiel.
- WebP.
- Galería.
- SEO.
- Ecommerce.
- WhatsApp.
- Revolico.
- Redes.

Terminado cuando un producto produzca un paquete completo descargable y verificable.

### Bloque 5 — Precios y monedas

- Reglas jerárquicas.
- Costo y precio separados.
- Comisiones.
- USD, CUP y GYD.
- Tasa con vigencia.
- Historial y reversión.

Terminado cuando el mismo producto tenga precios distintos y trazables en NEXO y Cuyana.

### Bloque 6 — Publicación en NEXO

- Adaptador WooCommerce.
- SKU e idempotencia.
- Borrador, publicación y retirada.
- URLs y sincronización.

Terminado con un producto real creado desde fotos, revisado, publicado una sola vez y visible en móvil.

### Bloque 7 — Marketplace Cuyana

- Reparaciones de la calculadora y confianza.
- Categorías de alimentos y energía.
- Catálogo con marca Cuyana.
- GYD principal y USD de referencia.
- Carrito y pedido.
- Registro antes de WhatsApp.

Terminado con un pedido de prueba completo sin mostrar NEXO al cliente.

### Bloque 8 — Distribución y Revolico

- Plantillas por categoría.
- Palabras clave pertinentes.
- Copiar anuncio.
- Descargar fotografías.
- Compartir desde Android.
- Registro de lo compartido.

Terminado cuando una gestora pueda preparar y compartir un producto en menos de dos minutos.

### Bloque 9 — SaaS comercial

- Onboarding de comercio.
- Límites y medición de consumo.
- Marca blanca.
- Panel de uso.
- Planes y facturación cuando se autorice.
- Dominio comercial definitivo.

Terminado cuando un comercio externo pueda usar un entorno aislado sin ayuda técnica.

## 24. Orden inmediato de ejecución

1. Crear el Bloque 0 dentro del repositorio real.
2. Auditar el Product Studio existente en NEXO y listar módulos reutilizables.
3. Localizar el repositorio de Cuyana y documentar su estado.
4. Definir el contrato canónico de producto y canal.
5. Crear las migraciones multiempresa con RLS.
6. Extraer el motor de conocimiento y precios sin romper NEXO.
7. Publicar el primer acceso independiente de Product Studio One.
8. Procesar un producto real desde fotografía hasta NEXO.
9. Añadir el escaparate Cuyana y publicar el mismo producto con precio GYD.
10. Generar y exportar su anuncio de Revolico.
11. Medir tiempo, errores y costo.
12. Corregir antes de incorporar más canales.

## 25. Pruebas obligatorias

- Aislamiento entre organizaciones.
- Permisos por rol.
- Archivos inválidos y sobredimensionados.
- Captura con un producto.
- Captura con varios productos.
- Captura de WhatsApp con datos personales.
- Duplicado por SKU, marca/modelo y similitud.
- Contradicción proveedor/fabricante.
- Campo crítico faltante.
- Generación fiel de imagen.
- Cálculo por producto, canal, moneda y promoción.
- Reversión de precio.
- Publicación repetida sin duplicado.
- Agotado y retirada en todos los canales.
- Creación de pedido antes de WhatsApp.
- Experiencia Android sin desplazamiento horizontal.
- Recuperación de fallos de IA e integración.
- Registro completo de auditoría.

## 26. Definición del MVP comercial

El MVP no estará terminado por tener pantallas. Debe demostrar tres recorridos reales:

### Recorrido A — NEXO

`foto → análisis → investigación → revisión → precio NEXO → borrador → publicación NEXO`

### Recorrido B — Cuyana

`mismo producto → precio GYD → ficha Cuyana → carrito → pedido → WhatsApp`

### Recorrido C — Revolico

`mismo producto → copy buscable → fotografías → copiar/descargar/compartir`

También debe demostrar:

- una sola ficha canónica;
- dos marcas sin contaminación visual;
- dos precios trazables;
- ningún duplicado;
- permisos efectivos;
- historial completo;
- funcionamiento móvil.

## 27. Instrucción maestra para cualquier agente

Actúa como responsable de producto, arquitectura, UX móvil, ingeniería full-stack, datos, ecommerce, integraciones y QA de Product Studio One. Tu obligación es continuar el estado real del proyecto, no reinterpretarlo desde cero.

Antes de actuar, ejecuta el protocolo de inicio de este blueprint. Trabaja por el orden del roadmap y toma únicamente tareas listas. Reutiliza los módulos estables de NEXO y Cuyana mediante contratos; no copies catálogos, pedidos ni lógica sin trazabilidad. Conserva Product Studio One como producto independiente, multiempresa y vendible.

Implementa, prueba, corrige, documenta y despliega dentro del alcance autorizado. No pidas al usuario copiar código ni ejecutar comandos. No solicites autorización entre pasos ordinarios. Detente solamente ante una credencial ausente, una restricción externa, una decisión comercial o legal irreversible, o una publicación externa que exija confirmación en el momento.

No inventes datos. Separa evidencia, proveedor, fuente externa, inferencia y desconocido. Protege datos personales y secretos. Usa estados, permisos, auditoría e idempotencia. Diseña primero para Android.

Al cerrar cada turno, actualiza la memoria compartida del repositorio y deja una siguiente acción inequívoca. No declares una tarea terminada sin cumplir su aceptación, ejecutar sus pruebas y verificar el despliegue cuando corresponda.

## 28. Entrega obligatoria de cada bloque

Cada bloque debe cerrar con:

1. Resultado funcional.
2. Archivos y migraciones modificados.
3. Decisiones tomadas.
4. Pruebas ejecutadas y resultados.
5. Riesgos o campos pendientes reales.
6. Commit y PR cuando corresponda.
7. Estado de CI.
8. URL desplegada.
9. Evidencia móvil.
10. Actualización de `PROJECT_STATUS.md`, `TASKS.md` y `HANDOFF.md`.

La siguiente fase comienza únicamente desde ese estado documentado.
