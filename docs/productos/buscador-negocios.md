# Buscador de negocios por ciudad y nicho: ficha de la etapa 1

**Fecha:** 2026-10-11 · **Autor:** Claude (solo investigación; no se construyó nada ni se mandó ningún mensaje) · **Prompts:** `buscador-negocios-prompts.md` · **Etapa 2 (diseño):** pendiente

**La idea:** eliges ciudad o municipio y nicho, y sale una tarjeta por negocio con su contacto, si tiene web o redes, qué hace y una puntuación de "oportunidad". Después se prepara el contacto. Viene de un video que usaba Google AI Studio y Google Places.

**Quién lo usa:**
1. **Primero A, NEXO interno (Ernesto):** para encontrar comercios a los que vender NEXO (meta: 1.000 pagando 10–20 USD/mes). Es el "Cazador" de D42, en su versión de negocios.
2. **B, gestoras: ahora no.**
   - Sus clientes son personas, no negocios. Buscarlas sería guardar perfiles personales.
   - `herramientas-gestoras.md` §9 dice "no construir la Cazadora", por spam, bloqueo del número y privacidad.
   - Su "buscador de competidores" ya existe a medias: es **Buscar precios** (Core, 15 al día). Le falta guardar lo que encuentra.
   - Más adelante, una gestora afiliada podría recibir fichas de comercios para traerlos a NEXO, con comisión (D42).

**El problema:** hoy los comercios para NEXO salen de contactos cálidos y de ir uno a uno (Yonar, Colo Shop). No hay una lista ordenada, y nadie sabe a quién escribir primero ni qué decirle.

**Evidencia:**
- A:
  - la meta de 1.000 comercios (`nexo-fabrica`);
  - el paso 7 de la fábrica pide una "lista de comercios parecidos";
  - `conseguir-clientes` pide "100 prospectos" y la Regla de 100.
  - Todavía no hay ningún comercio NEXO pagando por esta vía.
- B: en 412 mensajes de 27 gestoras, nadie pidió buscar negocios. Hubo un solo "¡Más clientes! ¿Me puedes ayudar?", y eso se refiere a compradores.

**Gratis o premium:** A es interno y no tiene precio. B, si un día llega, gratis (D42). Venderlo a otras agencias: no, por ahora (D10: primero cobrar).

**Cómo se mide:** fichas → verificadas → contactadas (con "sí") → respondieron → demo → pagando, y lo que cuesta cada cliente que paga.
- Meta de la prueba: 50 fichas, 20 contactos y 3 demos en 2 semanas.

**Qué existe ya:**
- VivaBot:
  - `groups.js`: clasifica a la gente de los grupos (proveedor, mayorista…) y tiene cazas;
  - `market.js`: tandas con vista previa y SÍ, 30 por tanda, 80 al día, 45–110 s de pausa, de 8:00 a 21:00, y BAJA;
  - `suppliers-rules.canStorePhone`: cuándo se puede guardar un teléfono.
- Las skills `analizar-negocio`, `conseguir-clientes`, `kit-demo`, `propuesta-cliente` y `cerrar-venta`.
- La plantilla de propuesta (caso Yonar). Falta lo de "ciudad + nicho → fichas".

**Fuentes de datos (probadas el 11-oct-2026):**

| Fuente | Resultado | Uso |
|---|---|---|
| **OpenStreetMap (Overpass)**, gratis, provincia La Habana | Comida: 2.625 (19 % con teléfono, 6 % con web, 1 % con redes). Tiendas: 4.634 (22 %, 5 %, 1 %). Clínicas y oficios: 562 (15 % con teléfono). **Plaza de la Revolución:** 1.316 (27 % con teléfono). **Con teléfono y sin web ni redes:** 105 de comida, 28 barberías, 34 de móviles y electrónica | **Fuente principal.** Hay que quitar unos 304 posibles estatales (CIMEX, Caribe, ETECSA…; 4 %). Los datos no traen fecha: hay que verificar cada uno. 2 de 5 consultas fallaron porque el servidor estaba ocupado (hay que usar caché y reintentos) |
| **Google Places API (New)** | Teléfono y web van en Text Search Enterprise: 35 USD por cada 1.000, con 1.000 gratis al mes. **Cuba está en los "Territorios prohibidos"** de Google Maps Platform, y además están la OFAC y D14 | **No usar.** Solo un enlace de Maps para que Ernesto lo abra a mano |
| Facebook e Instagram | No hay API para esto | A mano o con ayuda: el navegador integrado, sin iniciar sesión (`analizar-negocio`, paso 1) |
| Revolico / Cubísima | Revolico bloquea el acceso automático (error 403) y prohíbe el scraping. Los términos de Cubísima prohíben "copiar los datos" | Solo para mirar a mano |
| Cubanos.co / AlaMesa | Cubanos.co es un dominio en venta, no un directorio. AlaMesa es una guía de restaurantes, sin teléfono en las fichas | Solo como referencia |
| Grupos de WhatsApp propios | `crm_people` y `crm_suppliers` (proveedores y mayoristas) | Segunda fuente, la "cálida" |

**Riesgos:**
1. Que bloqueen el número de WhatsApp. Por eso: tandas pequeñas, las 2 primeras semanas desde el teléfono de Ernesto, y BAJA para siempre.
2. Datos viejos de OSM: paladares que ya cerraron.
3. Escribir a negocios del Estado (Lista Restringida, `PAGOS-Y-LEGAL.md`). Por eso se filtran, y las clínicas se dejan fuera: casi todas son estatales.
4. El teléfono de un cuentapropista suele ser personal: se guarda solo como contacto del negocio y se trata con BAJA.
5. La licencia ODbL de OSM: hay que citar la fuente, y si algún día se publica la base, compartirla igual.
6. Construir demasiado antes de cobrar (D10). Por eso la versión 0 es un script y una lista, no una app.

**Lo que se construye primero (etapa 3):**
- Un script con OSM para **Plaza de la Revolución (Vedado)** y 3 nichos: comida (restaurantes y cafeterías), barberías y peluquerías, y móviles y electrónica.
- 167 candidatos → **50 fichas** con teléfono, sin web, sin estatales y con su puntuación.
- Un CSV y una página de tarjetas para el móvil, cada ficha con su enlace de Maps para verificarla a mano.
- Ernesto escribe a 10 al día con el gancho "tu tienda demo en 24 h", y se anota cada paso en la tabla.
- Supabase, pantallas y bot: solo si sale al menos 1 demo en 2 semanas.

## Etapa 2 — Diseño (11-oct, pendiente de aprobar)
- Lienzo: https://claude.ai/artifact/CbeRkg4pvHfE3pKRM1pccK — sistema de diseño NEXO. 3 pantallas móviles: 1) Lista de hoy (50 fichas, filtros, meta 10 al día), 2) Ficha (puntuación y motivos, comprobar antes de escribir, mensaje listo, paso del embudo), 3) Cómo vamos (embudo fichas→revisadas→escritas→respondieron→demos→pagando, reglas para cuidar el número). Datos de ejemplo; teléfonos ocultos. **Aprobado por Ernesto el 11-oct.**

## Etapa 3 — Versión 0 construida (12-oct)
- Script: `scripts/cazador/osm-negocios.mjs --fecha 2026-10-12` (OSM/Overpass, 1 consulta, caché 7 días, reintentos). Plantilla de la página: `scripts/cazador/plantilla-cazador.html`.
- 721 negocios → 149 candidatos → 50 fichas (22 comida, 14 belleza, 14 móviles). CSV: `cazador/2026-10-12-plaza-vedado.csv`. Página: `cazador/cazador-v0.html` y Artifact privado https://claude.ai/artifact/64rj4EUFgC7oma1w8n5ghS (no compartir: lleva teléfonos).
- Puntuación (prompt 1, ajustada): celular 30 (fijo 15) · sin web 20 · sin redes 15 · horario 10 (o dirección completa 5) · calle de paso hasta 10 (calle principal 6 + negocios cerca hasta 4) · encaje del nicho hasta 15 · sin calle −5.
- Se quitan estatales (CIMEX, Caribe, Gaviota, Palmares, ETECSA y sus agentes, etc.) y clínicas. Aun así, cada ficha se revisa a mano antes de escribir.
