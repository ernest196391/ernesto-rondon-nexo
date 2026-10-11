# Sistemas de diseño

Copia local de los sistemas de diseño de las marcas, para que cualquier agente (Claude, Codex, ChatGPT) los use sin depender de claude.ai. Copiado el 6 de octubre de 2026.

| Marca | Carpeta | Empieza por | Original en Claude |
|---|---|---|---|
| NEXO | `nexo/` | `nexo/README.md` | Sistema de diseño «NEXO» (fase 3 de 5) |
| Casa Viva | `casa-viva/` | `casa-viva/README.md` | «Manual de marca Casa Viva» |

## NEXO (`nexo/`)

- `README.md`: el manual de marca (logo, color, tipografía, iconos, fotografía, tono, marca del comercio).
- `tokens.json` y `tokens.css`: todos los tokens. El CSS ya trae tema claro y oscuro, las fuentes y las clases de texto (`.display`, `.body`…).
- `assets/Logo/`: 18 SVG del logo. `assets/Iconos/`: 27 iconos.
- `fonts/`: Archivo 400–800 (woff2).
- `components/*/`: guía y vista previa de cada ficha (Color, Estados, Iconos, Logo…).
- `design-system.json`: índice del sistema en Claude (no editar a mano).

Regla: si cambia el sistema en Claude, esta copia se vuelve a exportar; no se edita aquí por separado.
