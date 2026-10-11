Set de iconos de NEXO: 27 iconos de trazo en una retícula de 24 px, con trazo de 2 px y remates redondos.

- Los SVG están en el grupo de assets **Iconos** (`icono-<nombre>.svg`, trazo `#121212`). En código, incrusta el SVG y pon `stroke="currentColor"` para que tome el color del texto.
- Color: `ink` por defecto, `ink-muted` si es secundario, y `success`, `warning`, `danger` o `accent` dentro de su aviso.
- Tamaños: `size-icon` (24 px) o `size-icon-sm` (20 px). Si el icono se puede tocar, el área táctil es de `size-target` (48 px).
- Los estados siempre llevan icono: `bien`, `aviso`, `error`, `info`. La función "Pregunta a NEXO" usa `pregunta`. Sin conexión se indica con `sin-conexion` y la vuelta de la señal con `sincronizar`.
- Si hace falta un icono nuevo, se dibuja con las mismas reglas: nada de robots, cerebros, nodos ni circuitos.
