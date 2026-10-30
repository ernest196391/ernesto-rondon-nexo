# Taller de fotos para gestoras — lo hecho y los borradores (30-oct-2026)

**Estado:** EN VIVO para todas las gestoras aprobadas (Core 3.14.91). **Nada se ha anunciado.** Todo lo de abajo es borrador, sin enviar.

## Qué se decidió (Ernesto, 29-oct)
- Construir las tres: taller de foto en el móvil, fondo de día en el estudio, texto para Facebook y descripción.
- Texto con la clave gratis de Casa Viva (tope diario) y encender para todas de una vez.
- «Quitar fondo» no entra ahora: en el móvil baja unos 40 MB la primera vez (lento en Cuba) y en el servidor no hay herramienta gratis.

## Cómo se usa (para la guía de 4 pasos)
1. **Menú → Taller de fotos.** Escribe el nombre del producto y tócalo (si es una pieza tuya que no está en la tienda, toca «Usar este nombre»).
2. **Elige la foto del móvil** (o usa la del catálogo). Toca «Cuadrada 1080» para publicar o «Vertical» para el estado. Arrastra la foto con el dedo; «Acercar» la agranda.
3. **Banda con el nombre** (y el precio si quieres) → **Guardar foto**. Sale un JPG listo en tu galería.
4. **Tu texto:** elige Facebook, estado o descripción, escribe lo que sepas de la pieza y toca «Escribir mi texto» → **Copiar texto**.
Para el fondo de día: **Mi estudio de fotos → «Al aire libre, con luz de día»** y sigue los 3 pasos de siempre con Gemini.

## Borrador para Dany (probar primero; ella decide si tiene tiempo)
> Hola Dany 🙏 ¿Tienes un ratito hoy? Quiero que pruebes una herramienta nueva de tu oficina, «Taller de fotos» (en el menú, debajo de «Fotos para publicar»). Subes una foto de tu móvil y te la deja cuadrada y con el nombre del producto, y te escribe el texto para Facebook. Solo dime si algo no se entiende o no funciona. Gracias por ayudarme a probar 💛

## Borrador para el grupo General (SOLO con el sí de Ernesto, y después de la prueba de Dany)
> Gestoras, ya tienen en su oficina una herramienta nueva: **Taller de fotos** 📸
> • Suben una foto del móvil y sale lista para publicar, con el nombre del producto.
> • Les escribe el texto para Facebook o el estado con los datos reales del producto.
> • Es gratis y se hace en el momento.
> Está en el menú, debajo de «Fotos para publicar». Cuéntennos qué tal les va 🙌
> (Adjuntar la guía de 4 imágenes. Recordar comisión/enlace según la regla de cada anuncio.)

## Pruebas que ya pasaron
- Texto: `php artifacts/tests/test-taller-core.php` (Casa-Viva) — plantilla, guarda contra cifras/promesas inventadas, precio y enlace puestos por código, notas internas fuera.
- Pantalla: `node artifacts/tests/test-taller-layout.mjs`; navegador del tamaño de un móvil con foto de 3000×4000, banda larga en 2 líneas, precio, vertical 1080×1920, JPG de ~60 KB.
- IA real (cuenta de prueba 46): 3 productos × facebook/estado/descripción; salieron textos limpios; «Nuevo» y «Llegó» se detectaron y se cerraron.
- Área completa de Dany y Dayra: se arma sin errores.

## Pendiente
- Prueba con el móvil y la sesión real de Dany.
- Guía con capturas reales (skill `guia-paso-a-paso-casa-viva`) y mensaje al General.
- Si Ernesto quiere apagarlo: `wp option update cvd_taller_acceso prueba`.
- Clave de texto: está en la opción `cvd_taller_gemini_key` (copiada del Gemini de VivaBot; si algún día se cambia esa clave, repetir en la web). Sin clave, el Taller sigue funcionando con la plantilla.
