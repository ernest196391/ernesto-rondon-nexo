# Plantilla — Propuesta de cliente (Fábrica NEXO)

Sacada del caso Yonar (Rey de Alisados). Todo lo de aquí se copia a `docs/clientes/<slug>/` y se rellena con `cliente.json`.

## Qué hay

| Carpeta | Qué es | Qué se cambia |
|---|---|---|
| `cliente.ejemplo.json` | Datos del cliente (marca, servicios, problemas, oferta) | Todo: es lo único que se escribe a mano |
| `demos/calendario` | Agenda de citas (HTML) | Colores, logo, servicios |
| `demos/tienda` | Tienda con pedido por WhatsApp | Colores, logo, productos |
| `videos/intro-marca` | Letrero que se enciende + voz + música (8 s) | Nombre, lema, colores, voz |
| `videos/asi-llega-clienta` | Recorrido de la clienta (20 s) | Textos, colores, voz |
| `videos/perfil-antes-despues` | Perfil antes/después (10 s) | Capturas del cliente |
| `videos/edicion-muestra` | Su propio video con tarjetas sincronizadas | Video + transcripción |
| `propuesta/index.html` | Página móvil: así quedaría → 3 problemas/solución → valor tachado → precio → garantía → pasos | Textos y precios desde `oferta` |
| `scripts/` | `rebrand.py` (colores/fuentes/logo), `transcribir.py` (Whisper), `musica.py` (base original), `serve.js` (ver en local) | — |

## Orden (con 3 paradas para que Ernesto apruebe)

1. Auditoría + `/analizar-negocio` → rellenar `cliente.json`. **PARADA 1: Ernesto aprueba oferta y precios.**
2. Marca (`/crear-marca`; si ya tiene marca, se respeta). **PARADA 2.**
3. Demos + videos + propuesta desde esta plantilla. Voz: generar y **comprobar con Whisper** antes de usar.
4. Render: `npx hyperframes render -o ...` y comprimir para WhatsApp (ffmpeg crf 26).
5. Publicar la propuesta (Artifact). **PARADA 3: Ernesto la ve antes de mandarla. Nunca enviar sin su sí.**

## Reglas
- No inventar testimonios ni escasez.
- No pegar contraseñas ni claves.
- Una conversación por cliente; al terminar, actualizar `ESTADO.md`.
