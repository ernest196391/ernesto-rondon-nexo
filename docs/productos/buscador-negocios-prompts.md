# Buscador de negocios: los 4 prompts (versión NEXO, para Cuba)

**Fecha:** 2026-10-11 · **Autor:** Claude (solo investigación y plan; no se construyó nada ni se mandó ningún mensaje) · **Ficha:** `buscador-negocios.md`

El video usaba Google AI Studio y Google Places. Aquí van nuestros 4 prompts, con nuestras piezas: Claude Code, Claude Design (Artifact), Supabase `nexo-production`, VivaBot y las skills que ya existen.
**Dos cambios grandes respecto al video:**
1. **No usamos Google Places.** Cuba está en la lista de "Territorios prohibidos" de Google Maps Platform, y además están las reglas de la OFAC (D14).
2. **El primer contacto lo hace una persona.** Nada de envíos masivos: tandas pequeñas y el "sí" de Ernesto.

Cada prompt está listo para pegarlo en Claude Code (o en Claude Design, si dice "diseño"). Las etapas 1 y 2 de `idea-a-producto` van primero.

---

## Prompt 1 — El buscador (Claude Code; pantallas en Claude Design)

```
Lee docs/00-FUENTE-DE-VERDAD/LEEME.md (y su orden), docs/herramientas/MAPA.md y docs/productos/buscador-negocios.md.
Construye el "Buscador de negocios" INTERNO de NEXO (solo Ernesto). Etapa 3 de idea-a-producto. Hazlo en el orden de abajo.

VERSIÓN 0 (esta semana, sin app):
- Un script: scripts/buscador-negocios/buscar.mjs <municipio> <nicho> [--max 50].
- Fuente: OpenStreetMap con la API Overpass (gratis). Una consulta por municipio y nicho, con
  User-Agent propio. Guarda la respuesta en caché 7 días (no repitas consultas). Si el servidor
  responde "too busy" o da error 429/504, espera 60 s y reintenta como mucho 3 veces.
- Nichos → etiquetas OSM: cafeterías amenity=cafe; restaurantes amenity=restaurant|fast_food;
  barberías y peluquerías shop=hairdresser|beauty; talleres shop=car_repair|craft=*;
  tiendas shop=*; clínicas amenity=clinic|dentist; móviles y electrónica shop=mobile_phone|electronics|computer.
- Por cada negocio, una ficha: nombre, nicho, municipio, dirección, teléfono, web, facebook,
  instagram, horario, enlace de OSM, enlace de búsqueda de Google Maps
  (https://www.google.com/maps/search/?api=1&query=<nombre>+<municipio> — solo para que Ernesto
  lo abra a mano; NUNCA se lee Google Maps por programa).
- Marca "posible_estatal" si el nombre, el operador o la marca contienen CIMEX, Caribe, TRD,
  ETECSA, Palmares, Habaguanex, Gaviota, Cupet, Artex, Panamericana o El Rápido. Esos se excluyen
  (PAGOS-Y-LEGAL: nada con entidades de la Lista Restringida).
- Puntuación de oportunidad de 0 a 100, con su motivo en una frase:
    +30 tiene teléfono (se le puede escribir)
    +20 no tiene web
    +15 no tiene redes en OSM
    +15 nicho que encaja con NEXO (vende productos: caja, inventario, catálogo, gestoras)
    +10 tiene horario o dirección (negocio vivo y concreto)
    +10 está en el municipio donde ya trabaja Casa Viva o hay mensajeros
    −100 posible_estatal
- Salida: un CSV y una página HTML con tarjetas para el móvil, en docs/prospectos/<municipio>-<nicho>-<fecha>.*
  (privada, no se publica). Columnas de seguimiento vacías: verificado, contactado, respondió, demo, pagando, BAJA, notas.
- Pie: "Datos © colaboradores de OpenStreetMap (ODbL)".
- Pruebas: Plaza de la Revolución × (restaurantes+cafeterías, barberías+peluquerías,
  móviles+electrónica) → 50 fichas con teléfono. Enseña a Ernesto 5 ejemplos antes de seguir.

VERSIÓN 1 (solo si la versión 0 consiguió al menos 1 demo en 2 semanas):
- Tabla en Supabase nexo-production, esquema interno (no lo leen las gestoras), con RLS solo
  para el rol de NEXO: prospect_businesses (los campos de la ficha + fuente, fecha_dato,
  puntuacion, motivo, estado nuevo|verificado|contactado|respondio|demo|pagando|no|baja,
  consentimiento si|no|sin_respuesta, notas, business_id). Migración nueva, sin tocar nada de
  Casa Viva. Regístralo en ESTADO.md y en DECISIONES.md.
- Sumar dos fuentes propias: (a) los negocios que ya están en crm_suppliers y crm_people con rol
  proveedor o mayorista (vivabot/src/groups.js), solo si canStorePhone() lo permite;
  (b) "AÑADE <enlace FB/IG>" desde el chat "Tú": Claude abre la página pública en el navegador
  integrado (sin iniciar sesión), saca nombre, nicho, contacto público y fecha de la última
  publicación, y crea la ficha.
- Pantallas: primero en Claude Design (Artifact quickstart, intent design), con móvil primero:
  1) elegir ciudad o municipio y nicho; 2) lista de tarjetas ordenadas por puntuación;
  3) ficha con botones "Verificado", "Abrir en Maps", "Preparar mensaje", "No interesa", "BAJA".
- Contacto: "Preparar mensaje" crea un borrador personalizado (con algo real del negocio y el
  gancho de conseguir-clientes) y lo deja en una tanda como hace vivabot/src/market.js: vista
  previa, SÍ de Ernesto, máximo 30 por tanda y 80 al día, entre 45 y 110 s de pausa, de 8:00 a
  21:00, y BAJA para siempre. Las 2 primeras semanas lo manda Ernesto desde su teléfono, no el bot.

NO hagas: Google Places API ni ninguna llave de Google; leer Revolico, Cubísima, Facebook o
Instagram con robots; guardar perfiles personales (solo negocios); mandar nada sin el SÍ.
Mide desde el día 1: fichas → verificadas → contactadas → respondieron → demo → pagando.
```

---

## Prompt 2 — La demo para cada negocio: web y asistente de WhatsApp (Claude Code)

```
Lee docs/plantillas/propuesta-cliente/LEEME.md y las skills kit-demo y propuesta-cliente.
Prospecto: <slug>, sacado de la ficha del buscador (docs/prospectos/... o prospect_businesses).

1. Crea docs/clientes/<slug>/cliente.json desde cliente.ejemplo.json, solo con datos públicos de
   la ficha y de sus redes (lo que no se ve se marca "de ejemplo" o se deja como pregunta).
2. Elige la demo según el nicho:
   - Vende productos (tienda, cafetería, mipyme): demos/tienda con pedido por WhatsApp y 6–12
     productos de su menú o perfil público, con precios marcados "de ejemplo" si no los publica.
   - Da servicios (barbería, taller, clínica): demos/calendario de citas con sus servicios.
3. Asistente de WhatsApp de demo: una página "Pruébalo" con un chat simulado que contesta 5
   preguntas típicas de su negocio (precio, horario, dónde están, a domicilio, cómo pagar). Usa
   SOLO los datos de cliente.json; si un dato no está, el asistente dice "eso te lo confirma el
   dueño" (D11). No se conecta a ningún número real.
4. python docs/plantillas/propuesta-cliente/scripts/kit_demo.py docs\clientes\<slug>, y mira el
   resultado a 375 px con scripts/serve.js.
5. Coste primero: si hacen falta fotos con IA, voz o video, enseña el coste y espera el SÍ.
6. Publica (Vercel o Artifact privado) SOLO con el SÍ de Ernesto. Nunca se lo mandes al negocio:
   el enlace lo manda Ernesto.
Tiempo objetivo: menos de 1 hora por demo. Si algo se hizo a mano dos veces, conviértelo en script.
```

---

## Prompt 3 — El panel de gestión: IA encendida o apagada, bandeja y citas (Claude Code; diseño en Claude Design)

```
Lee LEEME.md, MAPA.md (secciones 6 y 9) y el repo vivabot (index.js, lines.js, handoff.js,
campaigns.js, knowledge.js) y la skill silencia.
Objetivo: convertir lo que VivaBot ya hace para Casa Viva en un MÓDULO MULTI-NEGOCIO de NEXO,
para vendérselo a cualquier comercio. Casa Viva es el primer inquilino y NO se puede romper.

Ya existe (reutilízalo, no lo reescribas):
- crm_contacts.bot_mode (ignorar/personal) y la skill /silencia → IA apagada por chat.
- crm_messages y crm_outbox → historial y salida.
- crm_knowledge + /aprende → lo que sabe el bot, con business_id.
- handoff.js → pase a una persona con el mensaje ya escrito.
- campaigns.js → envíos lentos, solo a quien dijo que sí.
- Chatwoot local y el kit conversations (puntuación de leads): solo como referencia.

Construye en este orden y para cada paso enseña el plan antes de tocar producción:
1. Diseño (Claude Design, móvil primero): 3 pantallas para el dueño:
   a) Bandeja: chats por estado (nuevo, esperando al dueño, resuelto) y un interruptor
      "IA encendida / apagada" por chat y otro para todo el negocio.
   b) Chat: historial, respuesta rápida del dueño y "Enseñar esta respuesta al bot".
   c) Citas: agenda del día, confirmar o cambiar (para barberías, talleres y clínicas).
2. Datos en Supabase nexo-production: todo con business_id y RLS por negocio. Citas en una
   tabla nueva (appointments: business_id, contacto, servicio, inicio, fin, estado, origen).
   La IA solo propone huecos libres; reservar lo confirma la persona o el dueño (D11).
3. VivaBot multi-negocio: un número por negocio (o una línea en lines.js mientras tanto). El
   interruptor del panel escribe bot_mode o bot_paused_until. Nada de mensajes al cliente
   de una gestora (P6).
4. Panel: una sección "Mensajes" dentro de apps/business-dashboard (el panel de la dueña), no
   una app nueva.
5. Pruebas con casos reales en un negocio de PRUEBA, con la marca PRUEBA (lección del día 1).
   Despliegue con el patrón de casa-viva-ops (copia, comprobación, reinicio tranquilo).
Al terminar: ESTADO.md y DECISIONES.md. Mide: chats contestados sin el dueño, tiempo de
respuesta y citas hechas por semana.
```

---

## Prompt 4 — La propuesta centrada en el dolor (Claude Code + skills de venta)

```
Prospecto: <slug>. Ya tiene ficha del buscador y demo (prompt 2).
1. /analizar-negocio con sus enlaces públicos (sin iniciar sesión). De la ficha saca los dolores
   probables y apúntalos como PREGUNTAS, no como hechos:
   - "No tienes web ni redes": la gente que te busca no te encuentra y le compra al de al lado.
   - "Solo teléfono": contestas "¿precio?" y "¿tienes?" mil veces al día.
   - "Negocio de productos": no sabes cuánto ganaste hoy ni qué te queda.
   - "Negocio de citas": huecos vacíos y clientes que no vienen.
2. oferta-irresistible: el resultado en sus palabras ("Tu negocio contesta solo y cuadra solo")
   con los números de su nicho; precio 10–20 USD/mes (NEGOCIO.md); garantía condicional solo si
   Ernesto la aprueba; nada de escasez ni testimonios falsos. Caso real: Casa Viva.
3. propuesta-cliente: página móvil con este orden: así estás hoy (sus capturas) → lo que estás
   perdiendo (3 dolores, en horas y dinero) → así quedaría (su demo) → precio → garantía → los
   3 pasos para empezar. El cobro es local (efectivo, Transfermóvil, EnZona; D14), nunca con la LLC.
4. cerrar-venta: guion CLOSER de 10 minutos y las 5 excusas más probables en su nicho.
5. PARA: Ernesto revisa y es él quien lo manda. Anota en la ficha del buscador:
   estado "demo" y la fecha en que se le vuelve a escribir (2–3 días, máximo 3 veces).
```
