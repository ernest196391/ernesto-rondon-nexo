# menu-360

Fábrica de menús 360° para restaurantes, cafeterías y kioscos (primer caso: Panda26, 3-nov-2026).
Las órdenes, costes, errores aprendidos y mejoras están en la skill `~/.claude/skills/menu-360/SKILL.md`.

```
npm install                                  # solo la primera vez (qrcode, jsqr, pngjs)
node apps/menu-360/construir.mjs <slug>      # desde la raíz del repo; lee docs/clientes/<slug>/negocio.json
```
Sale `dist/<slug>/` (menú + `propuesta/` para el dueño), lista para subir a `casaviva.company/<slug>/`.
Prompts de IA que funcionaron: `plantilla/prompts.md`.
