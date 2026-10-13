# Tienda proveedora de 23 y 42 (Playa): fotos y productos nuevos

Es la tienda donde se compró el split Parker de Harley el 12-oct.

## Qué poner en esta carpeta

- **Las fotos, tal como salieron.** Si un producto tiene varias fotos, van todas.
- **El precio de la tienda (costo) de cada producto.** Sirve cualquiera de estas formas: una foto de la etiqueta, una foto de la lista de precios, o un archivo `precios.txt` con una línea por producto: `nombre — precio USD`.

## El paso a paso (13-oct, con Ernesto, para aprender a hacer la herramienta)

1. **Juntar:** fotos, nombre y costo de cada producto.
2. **Revisar con IA:** la IA pone nota a cada foto y elige la principal. Cuesta unos 0,002 USD por producto.
3. **Arreglar gratis:** se quita el fondo en el VPS con `studio.js` → `cutout`, y sale una foto blanca de 1200×1200.
4. **Foto con IA, solo si hace falta:** cuando la foto real no sirve. Se usa OpenAI con `foto-ia.mjs`, que cuesta unos 0,01–0,04 USD por foto. Antes de gastar, se muestra el costo.
5. **Precio:** se aplica la regla de Lennys (`motor-de-precios.md`) para sacar el precio de venta y la comisión.
6. **Subir a la web:** el producto va a «Bajo pedido», con esta tienda como proveedora. Se publica si pasa la doble revisión automática; Lennys lo revisa después.
7. **Avisar a las gestoras:** con la comisión de cada producto. En el grupo, solo con el sí de Ernesto.

Al final, estos pasos se juntan en un solo comando y, después, en un botón del panel.
