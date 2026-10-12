# Visión: el mayor marketplace automatizado de Cuba (Ernesto, 11-oct-2026)

**La idea en una frase:** NEXO es el **nexo** entre proveedores, gestoras y clientes. Nosotros hacemos la gestión, las gestoras venden con su tienda (como un dropshipping) y nadie tiene que tener mercancía propia para vender.

Relacionado: D42 (el cliente de NEXO es la gestora), `docs/herramientas/MAPA.md` y `docs/herramientas/entrada-a-ficha.md`.

## Las piezas

| # | Pieza | Qué hace | Qué existe ya (ver MAPA) | Qué falta |
|---|---|---|---|---|
| 1 | **Demanda** | Ver qué se busca más (Revolico por vistas, grupos) | «Buscar precios» de Core (Revolico, Facebook, tiendas, Cubísima; con foto) | «Agente de demanda»: ranking de lo más visto. Solo es una idea |
| 2 | **Proveedores** | Guardar quién vende qué, su número y su precio | VivaBot: `market.js` (quién vende X, PROVEEDORES), `groups.js` (caza en grupos), `crm_market_items` con 480 artículos | Ficha de proveedor con consentimiento, condiciones y quién lo atiende |
| 3 | **Ficha automática** | Foto, factura, etiqueta y manual → título SEO, descripción, copy y fotos mejoradas | Funciones de Product Studio (`analyzeProductImages`, `researchProduct`, `generateProductCopy`), Digitaliza (tablas en producción y vacías), `studio.js` | Paso 1: skill `/ficha` (ver entrada-a-ficha.md) |
| 4 | **Precio y reparto del dinero** | Precio del proveedor + margen NEXO + comisión de la gestora + mensajería | Comisión por producto en Core y % propio de la gestora | **La regla de margen no está escrita en ningún sitio.** Hace falta un motor de precios único |
| 5 | **Tiendas de gestoras (dropshipping)** | Cada gestora con su tienda, añade productos y les hace publicidad | Tienda de la gestora con `?ref=`, % propio y «Mis clientes» | Elegir productos para su tienda, «Compartir ficha» |
| 6 | **Publicar fuera** | Revolico, Facebook, Instagram y estados de WhatsApp | Nada | Herramienta de publicación (empezar por «copiar y pegar listo») |
| 7 | **Atención y pedidos** | Bot, estado del pedido, reparto, cobro | VivaBot, reparto y relevo, estado de pedidos, cierre del día | Multi-negocio |
| 8 | **Red de gestoras** | Sumar el mayor número posible de gestoras | Registro de gestoras, tutoriales, cazador en grupos | Programa de alta y comisiones definido |

## Cuellos de botella (los nombró Ernesto)
1. Las fotos (pieza 3).
2. La descripción y el contenido (pieza 3).
3. Que todo funcione solo y no se rompa (supervisor, `cv`, pruebas).
4. Saber a qué número hay que escribir: el proveedor de cada producto (pieza 2).
5. Cuánto gana cada uno (gestora, NEXO, negocio): el motor de precios (pieza 4).

## Reglas para que dure (riesgos)
- **Fotos:** solo las del proveedor con su permiso, las nuestras o las mejoradas a partir de las nuestras. No usar fotos de internet sin permiso, porque la marca o la tienda pueden reclamar.
- **Revolico y Facebook:**
  - Leer datos públicos con calma: pocas consultas, sin saltarse bloqueos ni condiciones.
  - Publicar a mano asistido (texto listo para copiar) antes que con robots, para no perder las cuentas.
- **Números de proveedores:** guardarlos cuando el proveedor acepta trabajar con nosotros, y apuntar ese «sí».
- **WhatsApp:** unirse a grupos y escribir en tandas pequeñas y con «SÍ». Así está ya en `market.js`, para que no bloqueen el número del bot.
- **Precios y datos:** nada inventado (D11). Cada dato de la ficha va marcado Confirmado, Sugerido o Falta.

## Orden propuesto (con Casa Viva como prueba)
1. **Motor de precios escrito:** la regla de margen de Casa Viva, más la comisión de la gestora y la mensajería.
2. **`/ficha`:** fotos de la dependienta → ficha → revisión → publicar. Primero con 10 productos sin descripción.
3. **Ficha de proveedor** en la bolsa (`crm_market_items`), con su número y su «sí».
4. **«Compartir ficha» y publicar asistido** en Revolico, Facebook y estados, para las gestoras.
5. **Agente de demanda:** ranking semanal de lo más buscado → qué productos traer.
6. **Tiendas de gestoras con catálogo a elegir:** el dropshipping completo.
