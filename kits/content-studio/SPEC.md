# NEXO Content Studio — SPEC

## Fuente
Adaptación del Kit 05 — Editor de vídeo.

## Flujo objetivo heredado
vídeo → transcripción → plan de cortes → encuadre → subtítulos → rótulos → composición → sonido → exportación.

## MVP funcional de esta versión
vídeo → validación → worker aislado → FFmpeg → 1080×1920 → H.264/AAC → revisión/descarga.

## Límites explícitos
Todavía no implementa transcripción, detección de silencios/tomas repetidas, subtítulos karaoke, rótulos animados ni mezcla de SFX. Esas capas se añadirán sobre el worker después de validar la transformación base.

## Seguridad
- máximo 25 MB;
- tipos de vídeo permitidos explícitamente;
- archivos temporales eliminados al terminar;
- timeout del proceso;
- no ejecuta comandos aportados por el usuario;
- el frontend no conoce secretos del worker.

## Gate
No marcar como completo el Kit 05 hasta probar un vídeo real y completar la cadena avanzada o documentar las limitaciones operativas del runtime.
