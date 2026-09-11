---
name: nexo-product-studio-1
description: Ejecuta el flujo verificable NEXO Product Studio 1 para convertir fotografías y notas de proveedor en productos investigados, con imágenes profesionales, precio público y costo interno separados, Product Knowledge Record sincronizado, borrador WooCommerce y publicación validada. Activar cuando el usuario diga “activar Product Studio 1”, entregue fotos/notas de productos para NEXO, o pida investigar, preparar, depurar imágenes y subir un lote al catálogo.
---

# NEXO Product Studio 1

## Objetivo

Convertir evidencia comercial incompleta en productos vendibles sin inventar datos ni duplicar registros. Tratar WooCommerce como catálogo/pedido oficial y el Product Knowledge Record como fuente del asistente.

## Antes de ejecutar

1. Leer `AGENTS.md` y la documentación NEXO vigente.
2. Localizar el repositorio, WooCommerce, la base de conocimiento y los adaptadores actuales.
3. Leer [flujo-operativo.md](references/flujo-operativo.md) y [contrato-producto.md](references/contrato-producto.md).
4. Agrupar fotos y notas por producto; conservar originales como evidencia.
5. Resolver por SKU/modelo si el producto ya existe. Actualizar; nunca crear un duplicado por defecto.

## Flujo obligatorio

1. **Extraer evidencia.** Leer marca, modelo, placa, código, potencia, capacidad, voltaje, garantía, precio base, transporte y accesorios. Separar lo visible, lo dicho por el proveedor y lo inferido.
2. **Investigar.** Priorizar fabricante y manual del modelo exacto; después distribuidor autorizado. Registrar URL, fecha, campos respaldados y contradicciones. Una coincidencia de familia no confirma un modelo.
3. **Construir conocimiento.** Crear o actualizar el Product Knowledge Record con nombres de campos reales, unidades, confianza, evidencia, fuentes, preguntas frecuentes, advertencias y faltantes. Comprobar que el asistente lo recupera por nombre, SKU, marca y alias.
4. **Calcular precio.** Mantener el precio/costo del proveedor solo para administración y contabilidad. Aplicar la regla comercial vigente y registrar cada componente. No exponer costo ni margen al cliente.
5. **Redactar.** Crear título claro, resumen orientado a uso, descripción original, beneficios verificables, especificaciones estructuradas, compatibilidad, contenido del paquete, garantía, entrega, SEO, texto alternativo y preguntas frecuentes.
6. **Preparar imágenes.** Auditar cada foto; seleccionar la referencia que muestre el producto exacto. Crear portada cuadrada premium, limpia y fiel, preferentemente sobre fondo blanco. No inventar puertos, accesorios, logos, colores ni geometría. Exportar WebP optimizado y conservar la evidencia original aparte.
7. **Crear borrador.** Subir o actualizar WooCommerce con SKU estable, descripción completa, atributos estructurados, imagen principal y metadatos internos. Mantener los faltantes críticos como borrador.
8. **Validar y publicar.** Ejecutar las puertas de publicación descritas en el flujo. Probar página móvil, imagen, precio, carrito, atribución y respuesta del asistente. Publicar solo cuando todas las puertas aplicables pasen.
9. **Entregar.** Informar por producto: ID/SKU/URL, estado, evidencia, precio base interno, regla, precio público, imagen, fuentes, conocimiento sincronizado y limitaciones reales.

## Reglas no negociables

- No publicar automáticamente sin identidad razonablemente resuelta, precio público, imagen válida, descripción completa, especificaciones estructuradas y conocimiento sincronizado.
- No convertir afirmaciones del proveedor en hechos de fabricante.
- Si dos fuentes discrepan, mostrar la contradicción internamente y usar la evidencia más directa; bloquear lo crítico.
- No mostrar precio de proveedor, margen, comisión ni notas internas al cliente.
- No afirmar autonomía, compatibilidad, potencia, garantía o disponibilidad sin evidencia.
- Archivar de forma recuperable una publicación defectuosa; no borrar permanentemente salvo orden inequívoca.
- Al modificar código o la habilidad, validar, versionar y sincronizar con Git.

## Activación

Cuando el usuario diga **“activar Product Studio 1”**, empezar inmediatamente con este flujo usando los adjuntos y notas más recientes. No pedir confirmaciones entre pasos ordinarios. Pedir intervención solo por credenciales ausentes, decisión comercial irreversible, autorización legal o un dato crítico que impida publicar; mientras tanto continuar con el resto del lote.
