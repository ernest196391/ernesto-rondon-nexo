# Estudio de fotos: opciones GRATIS para editar fotos de producto (14-oct-2026)

Investigación web hecha el 14-oct-2026. Todas las fuentes se consultaron ese día. Donde algo no se pudo comprobar, lo digo.

## Resumen (5 líneas)

1. **Por API de Google ya no hay nada gratis para imágenes**: todos los modelos de imagen de Gemini dicen «Free tier: Not available» (el más barato cuesta unos 0,034 USD por foto). Además, **Cuba no está** en la lista de países de la API ni de la app de Gemini.
2. **Recomendación principal: que el estudio prepare la instrucción y la gestora edite la foto en SU app de Gemini** (gratis, con su cuenta de Google). Nuestra web solo hace tres cosas: «Copiar instrucción», «Compartir la foto con Gemini» y «Subir la foto terminada».
3. **Plan B automático y gratis**: Cloudflare Workers AI con el modelo FLUX.2 klein 4B. Da unas 70–80 ediciones al día gratis por cuenta (cálculo nuestro, sin probar), pero la calidad y la fidelidad al producto son peores que Nano Banana. Hay que probarlo con 10 fotos reales antes de usarlo.
4. **Plan C de pago, el más fiable**: una sola clave de Gemini **de Casa Viva** en el servidor (unos 3,40 USD por cada 100 fotos), en vez de una clave por gestora. Tiene un riesgo de términos de uso porque las usuarias están en Cuba (ver la tabla).
5. **No hacer**: automatizar la web o la app de Gemini con cookies o librerías no oficiales. Google lo prohíbe y se puede perder la cuenta de Google.

## Tabla de opciones

| Opción | ¿Edita manteniendo el producto fiel? | Gratis, ¿cuánto? | ¿Desde nuestro servidor (PHP, Hostinger)? | Cuba | Riesgo de términos | Veredicto |
|---|---|---|---|---|---|---|
| **App/web Gemini (gemini.google.com), cuenta de cada gestora** | Sí, muy bien (Nano Banana 2) | Sí. Google no publica cuántas fotos: el límite va por «cómputo», se recarga cada 5 h y tiene un tope semanal. Blogs de terceros calculan unas 20 imágenes/día | **No** (es manual) | **No figura** en la lista oficial, pero en la práctica funciona para muchos cubanos | Bajo si lo usa una persona a mano. **Alto** si se automatiza | **✅ RECOMENDADA** (modo manual asistido) |
| API Gemini / AI Studio (clave de cada gestora, como hoy) | Sí | **No.** «Free tier: Not available» para todos los modelos de imagen | Sí | **No** está en la lista de regiones | Las condiciones solo permiten ofrecer el servicio «within an available region». Gestoras en Cuba = incumplimiento | ❌ Quitar como opción gratis |
| API Gemini con **una clave de pago de Casa Viva** | Sí | No. 0,0336 USD/foto en 1K (0,0168 en lote) | Sí | Mismo problema de región | Medio: la usuaria final está en Cuba | 🟡 Plan C (fiable y barato, con riesgo legal) |
| Vertex AI con 300 USD de prueba | Sí (los mismos modelos Gemini de imagen) | 300 USD durante 90 días, de una vez (unas 4 000–9 000 fotos) | Sí | Hace falta una tarjeta válida (no cubana). Exportación/sanciones: no lo comprobé al detalle | Medio. Solo es para clientes nuevos de Google Cloud; los créditos **no sirven para la API Gemini de AI Studio** | 🟡 Solo como puente temporal |
| Cloudflare Workers AI (FLUX.2 klein 4B / 9B / dev) | Regular. Edita con imagen de referencia, pero es más probable que cambie el producto | 10 000 «neuronas» al día. klein-4B ≈ 70–80 fotos/día; klein-9B ≈ 6/día; FLUX.2 dev ≈ 2/día (cálculos nuestros) | **Sí** (API REST) | La cuenta la abre Ernesto fuera de Cuba. El contrato prohíbe exportar a países restringidos | Medio (cláusula de exportación) | 🟡 Plan B. Probar primero |
| Hugging Face Inference Providers | Sí (FLUX Kontext, Qwen-Image-Edit) | **No** para cuentas gratis («Free Users: None»). PRO da 2 USD/mes | Sí | Hugging Face también cumple las sanciones de EE. UU. (no comprobado al detalle) | Bajo | ❌ No es gratis |
| Puter.js («paga el usuario») | Sí (usa los modelos Nano Banana de Google) | Cada usuario tiene una «cuota mensual gratis», pero **no publican de cuánto** | Se ejecuta en el navegador de la gestora | Cada gestora tendría que crear una cuenta en Puter y pagar ella cuando se acabe la cuota (desde Cuba es difícil) | Bajo para nosotros | 🟡 Interesante pero incierto |
| Pollinations | Las fuentes no lo confirman (dicen que solo genera) | Sistema de «Pollen», en beta y poco claro | Sí | ? | ? | ❌ No fiable para editar |
| Together AI FLUX gratis | No (solo genera) | Fue una promoción de 3 meses en 2024; casi seguro ya terminó | Sí | ? | — | ❌ |
| fal.ai | Sí (Kontext, Qwen Edit, Nano Banana) | Solo créditos de bienvenida (~20 USD según terceros, sin confirmar) | Sí | ? | — | ❌ No es gratis de forma permanente |
| OpenAI gpt-image | Sí | No | Sí | No (Cuba no soportada) | — | ❌ |
| Qwen Chat (chat.qwen.ai) | Bastante bien, pero cambia toda la imagen | ~12 imágenes/día según terceros (sin confirmar) | No (manual) | No comprobado | Bajo si es manual | 🟡 Alternativa manual si Gemini falla |
| Microsoft Copilot / Designer | Sí (editar foto subida) | Límite no publicado (unas 15 «rápidas» al día según terceros) | No | Microsoft no da servicio en Cuba (no comprobado hoy) | — | ❌ |
| Meta AI (WhatsApp / Instagram) | Edita fotos (modelo Muse Image, julio-2026) | Gratis en los países donde está | No | Lista de países sin confirmar; probablemente no está en Cuba | — | ❌ Por ahora |
| Seedream / Doubao, Leonardo | Seedream edita bien | Cuotas pequeñas o de pago | Por API, pagando | ? | — | ❌ No comprobado a fondo |
| **Automatizar la app de Gemini (cookies, `gemini-webapi`)** | Sí | «Gratis» | Técnicamente sí | — | **Prohibido** (ver «Qué NO hacer») | ⛔ NO |

## Detalle por opción

### 1. Gemini API / Google AI Studio

- **No hay capa gratis para imágenes.** En la página oficial de precios, todos los modelos de imagen dicen «Free tier: Not available»: `gemini-nano-banana-2.1` (0,0336 USD por foto 1K; 0,0168 USD en lote), `gemini-3.1-flash-image` (Nano Banana 2, 0,067 USD en 1K), `gemini-3.1-flash-lite-image` (0,0336 USD), `gemini-3-pro-image` (Nano Banana Pro, 0,134 USD) y `gemini-2.5-flash-image` (se apagó el 2-oct-2026). Imagen-4 ya ni aparece en la página. Fuente: https://ai.google.dev/gemini-api/docs/pricing (actualizada el 14-oct-2026, consultada el 14-oct-2026).
- **AI Studio a mano:** la página de precios dice que el uso de AI Studio «es gratis en todas las regiones disponibles», pero no aclara si eso incluye imágenes. Los blogs se contradicen: unos dicen que el área de pruebas de imágenes pide una clave de pago y otros hablan de unas 50–100 al día. **No lo pude comprobar.** De todos modos no sirve para Cuba, porque Cuba no está en la lista.
- **Cuba NO está** en la lista de regiones de la API ni de AI Studio, y tampoco Irán, Corea del Norte ni Siria. Fuente: https://ai.google.dev/gemini-api/docs/available-regions (actualizada el 28-abr-2026, consultada el 14-oct-2026).
- **Términos:** «You may only access the Services (or make API Clients available to users) within an available region». Es decir: solo se puede usar el servicio, u ofrecerlo a usuarios, dentro de una región disponible. Hay que tener 18 años o más. En los servicios gratis, Google usa lo que se le envía. Fuente: https://ai.google.dev/gemini-api/terms (actualizada el 28-abr-2026).
- **Consecuencia para nosotros:** el modelo de hoy («cada gestora pone su clave») no funciona gratis, y además choca con los términos de región.

### 2. Vertex AI con 300 USD de prueba

- 300 USD para gastar en **90 días**. Hay que dar una **tarjeta u otro medio de pago válido**: Google hace una retención temporal, no un cobro. Solo vale para quien nunca ha pagado Google Cloud, Maps ni Firebase.
- **Los créditos NO pagan la API Gemini de AI Studio** («The $300 credit can't pay for Gemini API in AI Studio costs»). Tampoco pagan los modelos de «socios» que se ofrecen como API gestionada. Los modelos Gemini propios dentro de Vertex AI **no aparecen como excluidos**, así que en principio sí los cubre. No lo probé.
- Fuente: https://docs.cloud.google.com/free/docs/free-cloud-features (actualizada el 13-oct-2026, consultada el 14-oct-2026).
- Veredicto: sirve como puente de 3 meses si Ernesto tiene una tarjeta no cubana. No es una solución permanente. El tema de los usuarios en Cuba sigue igual.

### 3. Cloudflare Workers AI

- **Gratis: 10 000 neuronas al día** (tanto en el plan gratis como en el de pago). Se reinicia a las 00:00 UTC. Lo que pase de ahí cuesta 0,011 USD por cada 1 000 neuronas, solo en el plan de pago. Fuente: https://developers.cloudflare.com/workers-ai/platform/pricing/ (actualizada el 9-oct-2026).
- **Modelos que aceptan una foto de entrada:** `flux-2-klein-4b` (genera y edita en un mismo modelo), `flux-2-klein-9b` (edición con varias referencias), `flux-2-dev` (varias referencias) y `stable-diffusion-v1-5-inpainting` (necesita una máscara). FLUX.1 schnell, Leonardo Lucid y Phoenix **solo generan**, no editan. Fuente: https://developers.cloudflare.com/workers-ai/models/
- **Cuántas fotos al día, gratis** (cálculo nuestro para una foto de 1024×1024 con 1 foto de entrada):
  - klein-4B: 4 cuadros de salida × 26,05 + 4 de entrada × 5,37 ≈ 126 neuronas → **unas 79/día**.
  - klein-9B: ≈ 1 545 neuronas → **unas 6/día**.
  - FLUX.2 dev: con unos 20 pasos supera las 4 000 neuronas → **unas 2/día**.
  - FLUX.1 schnell (solo genera fondos): ≈ 58 neuronas → **unas 170 fondos/día**.
- **¿Mantiene el producto fiel?** Los modelos FLUX.2 están pensados para editar, pero klein-4B es un modelo pequeño: es probable que cambie estampados, costuras o colores más que Nano Banana. **Hay que probarlo con fotos reales** (sábanas estampadas, cortinas con textura).
- Se llama desde PHP con una petición HTTP normal a la API de Cloudflare, con un token de la cuenta de Casa Viva. La licencia del modelo está en los términos de Black Forest Labs (no la revisé al detalle).
- **Términos:** el contrato de Cloudflare prohíbe usar el servicio para «exportar o reexportar» a países o personas restringidos. Fuente secundaria: https://conductatlas.com/platform/cloudflare/cloudflare-terms-of-use/prohibition-on-unauthorized-export-or-re-export/. No pude leer el texto completo ni confirmar si menciona Cuba.

### 4. Hugging Face Inference Providers

- **Las cuentas gratis no tienen créditos mensuales** («Free Users: None»). PRO tiene 2 USD/mes. Fuente: https://huggingface.co/docs/inference-providers/pricing (consultada el 14-oct-2026).
- Hay buenos modelos de edición (FLUX.1 Kontext, Qwen-Image-Edit) a unos 0,02–0,04 USD por imagen según agregadores, pero eso es de pago.
- Los «Spaces» gratis (ZeroGPU) tienen cuotas pequeñas, se caen a menudo y no sirven para producción.

### 5. Otras

- **Puter.js:** ofrece los modelos Nano Banana (`google/gemini-3.1-flash-image`, `google/gemini-3-pro-image`, etc.) sin clave. Cada usuario paga con su cuenta de Puter, que trae una «cuota mensual gratis» **de tamaño no publicado**. Cuando se acaba, la usuaria tiene que pagar, y desde Cuba eso es difícil. Fuentes: https://developer.puter.com/ai/nano-banana/ y https://docs.puter.com/user-pays-model/
- **Pollinations:** sistema de créditos «Pollen» en beta. Las fuentes no confirman que edite fotos. https://github.com/pollinations
- **Together AI:** el FLUX schnell gratis fue una promoción de 3 meses en 2024. https://together.ai/blog/flux-api-is-now-available-on-together-ai-new-pro-free-access-to-flux-schnell
- **fal.ai:** solo créditos de bienvenida, que no son permanentes (cifras de terceros, sin confirmar).
- **OpenAI gpt-image:** de pago y sin servicio en Cuba.
- **Qwen Chat:** edición gratis a mano en chat.qwen.ai, unas 12 al día según un tutorial (sin confirmar). Edita toda la imagen, así que puede cambiar detalles. https://www.analyticsvidhya.com/blog/2025/08/qwen-image-edit/
- **Microsoft Copilot / Designer:** límite gratis no publicado. https://blog-en.topedia.com/2025/05/ai-image-generation-usage-limit-in-copilot-chat-has-been-changed/
- **Meta AI:** su nuevo modelo Muse Image (julio-2026) edita fotos, pero solo «en países seleccionados». https://www.khaleejtimes.com/business/tech/metas-muse-image-explained-features-uae-availability-and-how-to-use-it
- **Seedream/Doubao, Leonardo:** no los revisé a fondo. Son de pago por API.

### 6. Gemini en la app/web (lo que usan las gestoras)

- **Países:** la lista oficial de la web de Gemini **no incluye Cuba**. Sí incluye casi todo el Caribe y América Latina. Fuente: https://support.google.com/gemini/answer/13575153 (consultada el 14-oct-2026). Que funcione en Cuba sin VPN depende de cómo Google ve la cuenta o la conexión. Ningún medio lo confirma.
- **Límites (fuente oficial):** Google ya no da un número fijo de imágenes. Los límites van por «cómputo», «se recargan cada 5 horas hasta el límite semanal». AI Plus tiene 2 veces el límite estándar, Pro 4 veces y Ultra 5 o 20 veces. Las imágenes se generan «with Nano Banana 2». La función «Redo images with Nano Banana Pro» aparece con otro icono en la columna gratis, así que puede que no esté para cuentas gratis. Fuente: https://support.google.com/gemini/answer/16275805 (consultada el 14-oct-2026).
- **Cifras de terceros (sin confirmar):** unas 20 imágenes al día gratis, en 1K, con Nano Banana 2 (https://ai.zenken.co.jp/en/post/gemini-image-guide/, mayo-2026). Nano Banana Pro: unas 2 al día gratis (https://www.androidauthority.com/gemini-3-pro-high-demand-free-tier-limit-3620382, nov-2025).
- **Marca de agua:** desde el 14-ago-2026 existe el ajuste **Ajustes → «Media watermark»** para quitar la estrellita visible. Está disponible **también para cuentas gratis** en la mayoría de países. Excepciones: en India, Corea del Sur y Vietnam solo con Ultra. No sale en países que exigen marca visible ni en cuentas de trabajo o escuela. **SynthID (marca invisible) y los metadatos C2PA siempre quedan.** El cambio no afecta a las imágenes ya hechas. Fuentes: https://tbreak.com/google-gemini-ai-watermark-optional/ (15-ago-2026) y https://itdaily.com/news/software/google-makes-visible-watermarks-optional-in-gemini/. Por defecto, la marca visible **sí sale**.

## Instrucción para la app de Gemini

### Idioma recomendado: **inglés** (el español también funciona)

- Razón 1: las plantillas oficiales de Google para editar están en inglés. Ejemplo: «Using the provided image, change only the [element]… Keep everything else in the image exactly the same, preserving the original style, lighting, and composition» (https://ai.google.dev/gemini-api/docs/image-generation, consultada el 14-oct-2026).
- Razón 2: Google pone el inglés («EN») primero en la lista de idiomas recomendados para sus modelos de imagen. **El español (es-MX) también está en esa lista** para Gemini 2.5 Flash Image y Gemini 3 Pro Image. No encontré la lista para Nano Banana 2 / 2.1. Fuente: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/gemini-image-generation-limitations (actualizada el 13-oct-2026).
- Para la gestora no cambia nada: ella no escribe la instrucción, solo la copia. **Nadie ha publicado una prueba que compare inglés y español.** Sugerencia: probar 5 fotos en cada idioma y quedarse con el mejor.
- Consejos oficiales: describir la escena con frases completas, no con listas de palabras; decir qué se cambia **y** qué no se toca; seguir corrigiendo en la misma conversación («editar por turnos» es lo que Google recomienda). Fuentes: https://blog.google/products/gemini/nano-banana-tips/ (2-oct-2025) y la guía de la API citada arriba.

### Plantilla (inglés, la que copia la gestora)

```
Using the provided photo of the [PRODUCT, e.g. "double bed sheet set with blue floral print"],
place this exact product in [SCENE, e.g. "a bright, modern bedroom with natural window light"].
Keep the product exactly the same: same colors, pattern, print, texture, stitching, labels,
shape and proportions. Do not redraw, recolor, simplify or restyle the product.
Change only the background and the surroundings. Match the lighting, shadows and perspective
so it looks like a real photo. Photorealistic product photography, square 1:1 format,
no text, no logos, no watermark.
```

Escenas listas para pegar en [SCENE]:
- Fondo blanco: `a clean pure white studio background with a soft natural shadow under the product`
- Cuarto: `a tidy, bright Caribbean-style bedroom, white walls, wooden furniture, daylight from a window`
- Sala: `a cozy modern living room with plants and warm afternoon light`
- Con persona: `a smiling woman in her 30s using the product at home; the product stays fully visible and unchanged`

### Misma plantilla en español (por si se prefiere)

```
Usando la foto que te envío de [PRODUCTO], coloca exactamente este producto en [ESCENA].
Mantén el producto idéntico: mismos colores, estampado, textura, costuras, etiquetas, forma
y proporciones. No lo redibujes, no le cambies el color ni el estilo.
Cambia solo el fondo y lo que lo rodea. Ajusta la luz, las sombras y la perspectiva para que
parezca una foto real. Fotografía de producto realista, formato cuadrado 1:1, sin textos ni logotipos.
```

Si la primera foto sale mal, se sigue **en el mismo chat**: «The print changed. Make the sheets exactly like in my original photo, change nothing else.»

### Cómo abrir Gemini desde nuestra web

- **No hay un enlace oficial que precargue el texto.** `gemini.google.com/app?q=...` o `?prompt=...` solo funcionan con extensiones de Chrome. Gemini no lo soporta por sí solo (https://github.com/elliot79313/gemini-url-prompt y https://news.ycombinator.com/item?id=46761567). Solución: botón **«Copiar instrucción»** (al portapapeles) y la gestora la pega.
- **Android:** el archivo oficial `gemini.google.com/.well-known/assetlinks.json` autoriza a la app de Gemini (`com.google.android.apps.bard`) a abrir **todos** los enlaces de gemini.google.com. Por eso es muy probable que `https://gemini.google.com/app` abra la app si está instalada. **Falta probarlo en un teléfono real**, sobre todo desde el navegador interno de WhatsApp, que a veces no abre apps.
- **iPhone:** el archivo `apple-app-site-association` solo manda a la app algunas rutas (`/app` con `target=agent`, `spark` o `daily_brief`, y rutas de descarga). Un enlace normal a `gemini.google.com/app` **se abre en Safari**, en la versión web. Esto lo deduje del archivo, no lo probé.
- **Mejor truco en Android:** Gemini aparece en el menú «Compartir» de Android para fotos, hasta 10 a la vez (https://www.androidauthority.com/gemini-android-share-images-sharesheet-3486792). Pero **por ahí no recibe texto**. Flujo propuesto: 1) «Copiar instrucción», 2) «Compartir foto» → elegir Gemini, 3) pegar la instrucción, 4) descargar el resultado y subirlo con «Subir foto terminada».

## Qué NO hacer

1. **No automatizar la web ni la app de Gemini** con cookies (`__Secure-1PSID`), Selenium/Playwright o librerías no oficiales como `gemini-webapi` (HanaokaYuzu/Gemini-API, que se describe como «reverse-engineered»). Motivos:
   - El `robots.txt` de gemini.google.com dice `Disallow: /app/`.
   - Los Términos de Google prohíben «using automated means to access content from any of our services in violation of the machine-readable instructions», y también la ingeniería inversa y «interfere with, or disrupt our services» (https://policies.google.com/terms, vigentes desde el 30-jul-2026).
   - **Está prohibido** y Google puede cerrar la cuenta de Google de la gestora (Gmail, fotos, todo).
2. **No pedir ni guardar las contraseñas ni las cookies de Google de las gestoras.**
3. **No seguir vendiendo «pon tu clave de Gemini, es gratis»**: para imágenes la API no tiene capa gratis, y Cuba no es una región permitida.
4. **No usar «quitadores» de SynthID ni de marcas de agua de terceros.** La estrellita se quita legalmente en los Ajustes de Gemini. Quitar SynthID va contra el espíritu de las políticas de Google y no aporta nada.
5. **No usar las cuotas gratis de Spaces de Hugging Face, ni bots de Telegram o webs «Nano Banana gratis ilimitado»** como servicio para clientes: se caen, cambian sin avisar y muchas revenden claves de dudosa procedencia.
6. **No meter el texto de la instrucción en enlaces con datos personales** (nombre o teléfono de la clienta) dentro de la URL.

## Idea técnica extra (opcional, para fidelidad del 100 %)

Para no depender de que la IA «respete» el producto: **recortar el producto** (quitar el fondo) y **pegarlo encima de un fondo generado** (por ejemplo con FLUX.1 schnell gratis en Cloudflare, unos 170 fondos al día). Así los píxeles del producto son los originales. El inconveniente es que la luz y las sombras quedan menos naturales, y que hace falta una herramienta para quitar el fondo (Hostinger con PHP no la tiene). Queda como idea, sin probar.

## Lo que NO pude comprobar

- El número exacto de imágenes gratis al día en la app de Gemini (Google ya no lo publica).
- Si AI Studio permite hoy generar imágenes gratis a mano.
- Si `gemini.google.com/app` abre la app en Android desde WhatsApp (falta la prueba en el teléfono).
- La calidad real de FLUX.2 klein-4B con nuestras sábanas y cortinas.
- El texto exacto de las cláusulas de sanciones de Google Cloud, Cloudflare y Hugging Face sobre Cuba. Para algo comercial con usuarias en Cuba conviene consultar a un abogado: las normas de EE. UU. sobre Cuba tienen permisos generales para servicios de internet, pero no lo analicé.
- La cuota gratis de Puter, Qwen Chat, Copilot y Meta AI.

## Qué se hizo con esto (14-oct, Core 3.14.4, EN VIVO solo para Dany y Dayra)

- **Modo Gemini gratis** programado en «Mi estudio de fotos»: «Copiar instrucción» → «Guardar foto del producto» (o «Mandarla a Gemini», el menú Compartir del móvil) → «Abrir Gemini» (en Android intenta la app) → «Subir mi foto de Gemini» (entra en su galería: Descargar / Compartir / Poner en mi tienda). La clave de Google queda como «Opción avanzada».
- **Idioma de la instrucción: español.** Motivo: la app contesta en el idioma de la instrucción y la gestora tiene que entender la respuesta y poder seguir pidiéndole cambios; Nano Banana entiende bien el español y no hay pruebas publicadas de que el inglés edite mejor. Las reglas son las mismas que en inglés (producto fiel, color real o uno que existe, sin textos ni marcas). **Pendiente:** con las primeras fotos de Dany, comparar 5 en español y 5 en inglés; si el inglés sale claramente más fiel, se cambia con `build()` (ya existe en inglés).
- En pantalla se explica cómo quitar la estrellita con el ajuste oficial de Gemini (sin quitadores de marcas de terceros).
- Plan B (Cloudflare FLUX.2 klein) y Plan C (clave de pago de Casa Viva): sin hacer; esperan a ver cómo les va a Dany y Dayra con la app.
