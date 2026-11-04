# Botón «Precios de mensajería» en el área de la gestora — encargo para otro agente

Decisión de Ernesto (14-oct). **No está programado.** Este documento dice exactamente qué cambiar. Lo hace otro agente cuando el que está tocando Core termine (hoy el servidor ya va por **3.13.98** y la copia local por 3.13.97: primero `git pull` en `C:\Users\Ernesto\Casa-Viva` y comparar).

## Qué tiene que ver la gestora

En su área (`/area-gestoras/`, app de gestoras), pestaña **Herramientas**, una tarjeta nueva, la primera de la lista:

- Icono: camioncito (`truck`, ya existe en `CVD_Gestora_App::icon()`).
- Título: **Precios de mensajería**
- Texto: «Cuánto cuesta llevar el pedido a cada reparto, en CUP. La mensajería es del mensajero.»
- Dos botones:
  1. **Calcular** → `https://casaviva.company/cotizar-mensajeria/` (misma pestaña; es la página que da el precio exacto, eligiendo municipio y reparto).
  2. **Ver PDF** → el PDF subido a la web (nueva pestaña, `target="_blank" rel="noopener"`). Al lado, en pequeño: «Actualizado: 14 oct 2026» (fecha del archivo).

Opcional (recomendado): en la vista **Calculadora** (`calculadora()`, mismo archivo), junto al campo de «mensajería en CUP», un enlace pequeño «¿Cuánto es? Ver precios» que lleve a `/cotizar-mensajeria/`.

## 1. Subir el PDF a la web (nombre fijo)

Archivo generado: `C:\Users\Ernesto\ernesto-rondon-nexo\docs\nexo-business\bienvenida-2026-10-14\precios-mensajeria-casa-viva-2026-10-14.pdf`
(se rehace con `node docs/nexo-business/bienvenida-2026-10-14/generar-pdf.mjs`).

Subirlo **siempre con el mismo nombre**, para que el enlace no cambie nunca:

```bash
scp -i ~/.ssh/casa-viva-github-actions -P 65002 \
  "docs/nexo-business/bienvenida-2026-10-14/precios-mensajeria-casa-viva-2026-10-14.pdf" \
  u824654880@88.223.85.72:domains/casaviva.company/public_html/wp-content/uploads/casa-viva/precios-mensajeria.pdf
ssh -i ~/.ssh/casa-viva-github-actions -p 65002 -o BatchMode=yes u824654880@88.223.85.72 \
  'cd ~/domains/casaviva.company/public_html && wp litespeed-purge all'
curl -sI https://casaviva.company/wp-content/uploads/casa-viva/precios-mensajeria.pdf   # debe dar 200 y application/pdf
```

URL pública: `https://casaviva.company/wp-content/uploads/casa-viva/precios-mensajeria.pdf`
(La carpeta `wp-content/uploads/casa-viva/` ya existe: tiene `hero-habana.webp`.)

## 2. Cambio en Core

**Archivo:** `wordpress/casa-viva-dropship-core/includes/class-cvd-gestora-app.php`
**Función:** `private static function herramientas(): string`

a) Al principio de la función, antes de `$tools = array(`:

```php
// 3.13.xx: precios de mensajería (decisión de Ernesto, 14-oct). PDF con nombre fijo en uploads/casa-viva/,
// generado con las tarifas vivas (docs/nexo-business/bienvenida-2026-10-14/generar-pdf.mjs en ernesto-rondon-nexo).
$uploads  = wp_get_upload_dir();
$pdf_path = trailingslashit( $uploads['basedir'] ) . 'casa-viva/precios-mensajeria.pdf';
$pdf_url  = is_readable( $pdf_path ) ? add_query_arg( 'v', (string) filemtime( $pdf_path ), trailingslashit( $uploads['baseurl'] ) . 'casa-viva/precios-mensajeria.pdf' ) : '';
$pdf_date = $pdf_url ? wp_date( 'j M Y', (int) filemtime( $pdf_path ) ) : '';
```

b) Primera fila del array `$tools`:

```php
array( 'truck', 'Precios de mensajería', 'Cuánto cuesta llevar el pedido a cada reparto, en CUP. La mensajería es del mensajero.', 'ready', 'precios-mensajeria' ),
```

c) En la plantilla, dentro de `<div class="cvga-actions">`, una rama nueva **antes** de `elseif ( 'curru' === $t[4] )`:

```php
<?php elseif ( 'precios-mensajeria' === $t[4] ) : ?>
	<a class="cvga-btn cvga-btn-sm" href="<?php echo esc_url( home_url( '/cotizar-mensajeria/' ) ); ?>">Calcular</a>
	<?php if ( $pdf_url ) : ?><a class="cvga-btn cvga-btn-soft cvga-btn-sm" href="<?php echo esc_url( $pdf_url ); ?>" target="_blank" rel="noopener">Ver PDF</a><span class="cvga-note"><?php echo esc_html( 'Actualizado: ' . $pdf_date ); ?></span><?php endif; ?>
```

Ojo:
- **No usar la clave `mensajeria`**: en `assets/gestora-app.js` el alias `mensajeria` lleva a la vista *Ventas*. Por eso la clave es `precios-mensajeria` y no lleva `data-cvga-go` (son enlaces normales, no una vista de la app).
- Si el PDF no está subido, la tarjeta sale solo con **Calcular** (no se rompe nada).
- `cvga-btn-soft` y `cvga-note` ya existen en `assets/gestora-app.css`.

## 3. Subirlo (proceso de siempre de Core)

1. Subir la versión del plugin (cabecera `Version:` y `CVD_VERSION` en `casa-viva-dropship-core.php`) a la siguiente de la que haya en el servidor.
   (No tocar `CVD_Shipping_Rates::VERSION` = `2026-09-23-v3`: si cambia, `install_defaults()` vuelve a cargar el CSV viejo y pisa las tarifas que Lennys cambió desde el panel.)
2. Comprobar que la copia del servidor de `class-cvd-gestora-app.php` no tiene cambios de otros (md5 sin CR; hoy, 14-oct 9:30, local y servidor coinciden: `117f28378b3768d785f827c4cbc93f18`).
3. `php -l`, copia de seguridad `~/bak-20261014-cvd-<vieja>-antes-<nueva>`, copiar, `wp litespeed-purge all`.
4. Probar: curl 200 a la home, `/tienda/` y `/cotizar-mensajeria/`; entrar como gestora de prueba → Herramientas → ver la tarjeta → **Calcular** abre la página y da precio (p. ej. Bauta / Bauta = 5.500 CUP) → **Ver PDF** abre el PDF.
5. Push a `ernest196391/Casa-Viva` main y apuntarlo en `docs/00-FUENTE-DE-VERDAD/ESTADO.md`.

## Después

- Mandar al General el mensaje de `mensaje-general-mensajeria.txt` con el PDF adjunto **solo con el SÍ de Ernesto**, y **después** de publicar el botón (la última línea dice que ya lo tienen en su área).
- Cuando cambien las tarifas: rehacer el PDF con `generar-pdf.mjs` y volver a subirlo con el mismo nombre (paso 1). El botón no hay que tocarlo.
