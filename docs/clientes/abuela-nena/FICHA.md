# Abuela Nena — ficha del personaje (APROBADA 2026-10-12)

Influencer IA del emprendimiento de bienestar de **Ernesto Padre** (WhatsApp 5358222088).
Personaje "Salud y longevidad" de la skill `avatares-cuba`.

## Quién es
- **Nombre:** Abuela Nena.
- **Edad:** 68 años.
- **Barrio:** Santos Suárez, La Habana.
- **Historia (1 línea):** maestra de Educación Física jubilada que sigue entrenando a todo el barrio.
- **Contraste (lo que llama la atención):** 68 años y hace ejercicio en el parque a las 6 de la mañana, baila casino y sube 4 pisos sin ascensor.
- **Personalidad:** cariñosa, pícara, mandona como buena maestra ("¡arriba, que ya sonó el silbato!").
- **Frase de cierre:** "La energía no es cosa de edad, mi'jo: es cosa de costumbre."
- **Por qué está en redes:** sus nietos le dijeron que enseñara sus costumbres a más gente.

## Look (fijo)
Cubana mestiza de piel trigueña, cara de 68 años de verdad (arrugas, patas de gallo, manchitas), delgada y fuerte (no gordita), ropa deportiva modesta en verde salvia y azul marino, tenis blancos sin marca.

**3 anclas (se copian igual en TODOS los prompts):**
1. Silbato de maestra plateado con cordón rojo al cuello.
2. Lunar pequeño oscuro encima del labio superior, lado izquierdo.
3. Pelo corto, rizado, canoso, con una cinta deportiva blanca.

Joyería: exactamente un par de aretes de oro pequeñitos y un reloj sencillo de acero en la muñeca izquierda.

## Cómo habla
Español cubano de La Habana, frases cortas, "mi'jo", "mi'ja", "mira", "oye", "¿tú sabes lo que es…?". Nada de "asere".

## De qué habla
Hábitos cubanos para tener energía: el desayuno, caminar, el agua, dormir con calor y apagones, el cafecito, la siesta, moverse a cualquier edad.

## Límites (no se negocian)
- La bio dice **"personaje IA"** y se activa la etiqueta de contenido IA de cada red.
- Nunca dice que cura, trata o previene nada. Nada de dosis.
- **Nunca** nombra ni enseña productos, logos ni fotos de Vital Health (reglas 7.2, 7.11 y 7.12 de la empresa).
- Nunca dice "yo tomo esto y me funcionó" (sería un testimonio falso).
- Nada de dinero ni de "gana con esto" (regla 7.13).
- Cierre de cada video: "Si quieres que te oriente en lo natural, escríbele a Ernesto: el número está en la bio."

## Bio propuesta
Abuela Nena 🤖 personaje IA · 68 años y más energía que mis nietos 💪 · Costumbres cubanas para vivir con fuerza · Escríbele a Ernesto 👇

## Producción diaria
1 video + 5 historias. Ernesto (hijo) los revisa y aprueba antes de publicar.

## Recursos congelados (se rellenan al aprobar)
- Hoja de personaje (Higgsfield job, opción A, elegida 2026-10-12): `6675bdc5-33c2-4bfd-8404-28fbe54d6f5b` — archivo `hoja/opcion-A.png`. Usarla SIEMPRE como referencia (@image1). No regenerarla nunca.
- Escenarios: _pendiente_
- Voz (elegida 2026-10-12): **voz 1, cálida y algo ronca** — job `fad0032c-ba5d-4e25-8b56-56e8a2b18400` (`voz/voz-1.mp3`).
  Cada audio nuevo: `seed_audio` con `audio_references` = ese job y **solo el guion** (sin la descripción entre corchetes: se cobra por letra, 2,3 en vez de 5,9 créditos por 24 s). No admite `image_references` a la vez. Whisper antes de usarlo. Si un día suena distinto, volver a añadir la descripción.
- Banco de fotos (2026-10-12, 21 fotos, 42 créditos): `banco-fotos/` — números en `banco-fotos/IDS.md`.
  (Descartadas: voz 2 `05c38bac-…`, voz 3 `aa1835c3-…`.)

## Ilimitado de Higgsfield (leído del plan el 2026-10-12)
Solo funciona **en la web** (higgsfield.ai), no desde Claude Code (`unlim_trial_in_mcp_active: false`).
- 7 días: Nano Banana 2 (1K/2K). Con plan anual, también Kling 3.0 (720p, 5 s).
- 365 días: Nano Banana, Seedream 4.5, Seedream 5.0 Lite, GPT Image, Flux.2 Pro 1K, Kling O1 Image; Soul V2: 3.000 generaciones gratis.
- Uso: hacer en la web, de una vez, todo el banco de fotos (escenarios + Nena en muchas escenas). Lo diario (voz + montaje) sale de aquí casi gratis.

## Sistema diario (2026-10-12)
- Fábrica: `fabrica/` (`fabrica.py`, `verificar_voz.py`, `calendario.json`, `estado.json`, `LEEME.md`).
- Skill `/nena-hoy` (`~/.claude/skills/nena-hoy/SKILL.md`): "hoy" produce y manda a Ernesto para aprobar; "publica N" se lo manda a Ernesto Padre.
- Tarea programada "Abuela Nena · contenido del día": todos los días a las 6:11 (corre mientras la app de Claude esté abierta; si está cerrada, corre al abrirla).
