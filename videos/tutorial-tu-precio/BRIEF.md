---
workflow: general-video
flow: automation
storyboard: no
message: "Tu precio: en tu área → Mis precios pones tu precio (Aumento general o un producto) y Guardar. Tus clientes lo ven solo con tu enlace; en la tienda general sale el de Casa Viva. Tu propio pedido, desde Ver la tienda o tu enlace. Si quitas tu aumento, tu cliente deja de verlo."
destination: whatsapp
aspect: 1080x1920
language: es-CU
audience: gestoras de Casa Viva (La Habana), no técnicas, en el teléfono dentro de WhatsApp
length: ~49s
narration: yes
---

## Intent

Tutorial «Tu precio», para GESTORAS (pedido por Ernesto el 13-oct, `docs/nexo-business/tutoriales/pendientes-2026-10-13.md`; duda de Thaly 14:09 y de Rafael).
Fuente: Core 3.13.96 — `includes/class-cvd-gestora-app.php` (menú «Mis precios», «Ver la tienda»), `includes/class-cvd-portal.php`
(«Aumento general», «Aplicar a mi tienda», «Ver y cambiar precios de un producto», «Tu precio», «Guardar», «Precio guardado.»),
`includes/class-cvd-gestora-store.php` (el precio de la gestora solo con ?ref= en la URL; se calcula en cada visita con lo guardado).
Hecho con la skill video-tutorial-casa-viva: marca exacta, subtítulos quemados, voz B «cercano».

## Assets

- assets/screens/p-menu, p-top, p-list, p-typed, p-saved: área real de una gestora aprobada (con precio propio de 35 en el organizador),
  renderizada en el servidor con wp eval-file (sin contraseña), limpiada con _work/capture-sanitize-precios.py (solo «Mis precios»,
  nombre → «Tu nombre», ?ref= → TUCODIGO, sin zona, sin clientes ni ventas) y capturada con Chrome sin interfaz (iframe 375x812 @2x,
  _work/capture-frame-tu-precio.html + capture-inject-tu-precio.html). En p-list/p-typed/p-saved el valor del campo y «Precio guardado.» se
  ponen con el script inyectado (no se guardó nada).
- assets/screens/p-gen (30 USD, tienda general), p-ref y p-ref-mid (35 USD con ?ref=), p-cart (Diseño Rosa, «Añadir al carrito»):
  ficha real del producto 3556 bajada con curl, limpiada con _work/capture-sanitize-prod.py (nombre, código y WhatsApp de la gestora).
  La barra de dirección es un añadido del video (las capturas no la tienen), con la dirección real y el código anonimizado.
- Voz: ElevenLabs eleven_multilingual_v2, voz por defecto del negocio, perfil B «cercano»; toma 3 (Whisper perfecta), montaje _work/build-voz.mjs.
- Música: make-music.mjs (propia). SFX: Pixabay (CREDITS.md). Logo: SVG oficiales.

## Notes

- No se crearon pedidos ni cuentas; no se guardó ningún precio; no se entró con contraseña. Temporales borrados de Hostinger. Nada enviado.
