# NEXO Content Studio — SPEC

## Fuente
Adaptación del Kit 05 — Editor de vídeo.

## Flujo objetivo heredado
vídeo → transcripción palabra a palabra → plan de cortes → encuadre → vertical 9:16 → subtítulos karaoke → rótulos/zooms → composición → audio -14 LUFS → exportación.

## Estado funcional actual
1. validación de fuente;
2. análisis técnico en worker aislado;
3. transcripción real opcional mediante proveedor STT configurado;
4. timestamps por palabra;
5. plan de cortes determinista basado en pausas detectadas;
6. transformación 1080×1920;
7. normalización de audio a -14 LUFS cuando existe pista;
8. H.264/AAC + faststart;
9. revisión y descarga desde navegador.

## Contrato de verdad
- nunca inventar transcripción, timestamps o contenido semántico;
- una propuesta de corte debe citar evidencia temporal real;
- si STT falla, la edición base puede continuar, pero subtítulos/cortes dependientes de texto quedan bloqueados;
- el consumo del proveedor STT ocurre únicamente tras una acción explícita del usuario;
- antes de aplicar edición semántica o publicación externa debe existir revisión humana.

## Límites todavía abiertos
- cortes renderizados desde edit plan aprobado;
- subtítulos karaoke quemados en vídeo;
- encuadre con seguimiento de sujeto;
- rótulos/zooms y composición avanzada;
- SFX/música y mezcla final más allá de loudness;
- prueba E2E con vídeo real representativo.

## Seguridad
- máximo 25 MB en esta fase;
- tipos permitidos explícitamente;
- temporales eliminados al terminar;
- timeouts en worker y proveedor;
- no ejecuta comandos aportados por el usuario;
- secretos solo server-side;
- errores de proveedor se recortan y no exponen credenciales.

## Gate
No marcar el Kit 05 como completo hasta probar un vídeo real y completar la cadena avanzada o documentar explícitamente cada limitación operativa del runtime.
