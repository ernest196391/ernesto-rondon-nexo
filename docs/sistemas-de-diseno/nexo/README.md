> **Estado: fase 3 de 5 cerrada.** El logo y los fundamentos están aprobados para producción: color, tipografía, espaciado, radios, iconos, fotografía, tono y marca del comercio. Las aplicaciones (fase 4) y el manual final (fase 5) siguen pendientes.

## Qué es NEXO

NEXO conecta los productos, las ventas y las operaciones de un pequeño negocio para que venda más con menos trabajo. Es una plataforma para comercios de Cuba que trabajan desde el teléfono, con internet inestable y sin equipo técnico: catálogo verificado, caja que vende sin internet, inventario, pedidos, gestoras que venden con comisión y un asistente de WhatsApp que solo responde con datos reales.

El nombre significa "lo que une". **Posicionamiento:** Del producto al cliente, todo conectado. **Frases de apoyo:** Registras una vez. Vendes en todas partes. · Vende sin comprar mercancía.

**Personalidad:** clara, ágil, confiable, cercana, tecnológica, premium, humana y precisa. Tecnología sofisticada detrás, experiencia simple delante.

## Arquitectura de marca

- **Marca madre:** NEXO.
- **Productos:** NEXO Business (dueños) y NEXO Impulsa (gestoras). Siempre llevan la misma letra, el mismo color y la misma altura que NEXO. Usa `nexo-business-*` y `nexo-impulsa-*`; nunca los compongas a mano.
- **Servicio:** Implementación NEXO. Va solo en texto, sin logo.
- **Las funciones no son marcas:** "Digitaliza tus productos", "Pregunta a NEXO" y "Conecta tu sistema" van en texto normal.

## Logo

Son cuatro piezas que empujan hacia un mismo centro, y el hueco entre ellas forma la X. Usa siempre los SVG del grupo **Logo**. Las reglas completas están en las fichas *Logo*; aquí va lo esencial:

- **Principal:** `nexo-horizontal-tinta` sobre blanco o sobre `brand`. Sobre `nexo-tinta` o fotos oscuras, `nexo-horizontal-negativo`.
- **Una tinta:** `nexo-horizontal-tinta` en negro o `nexo-horizontal-blanco`.
- **Construcción:** la unidad u es 1/20 de la altura de mayúscula. El símbolo mide 20u y el hueco de la X 2,5u. Hay 7u entre el símbolo y el nombre, y 5u entre NEXO y el producto.
- **Área de protección:** medio símbolo libre alrededor del logo; un cuarto alrededor del símbolo solo.
- **Tamaños mínimos:** 20 px de alto en pantalla. El símbolo, 24 px; de 16 a 23 px se usa `nexo-simbolo-pequeno`. Impreso: 5 mm; en ticket térmico, 6 mm; bordado, 15 mm.
- **Nunca:** el amarillo sobre blanco, el nombre en amarillo, efectos, contornos, deformaciones ni NEXO escrito con una fuente.

## Color

Usa siempre los tokens. Nunca escribas un hex en un componente.

- **Marca:** `brand` (amarillo `#FFC21A`) con `on-brand` encima. Es la acción más importante de la pantalla y nada más: una sola por pantalla.
- **Acento:** `accent` (azul mar, `#0B5F8A` en claro y `#6EBEEB` en oscuro). Se usa para enlaces, selección, interruptores e información, con `on-accent` encima.
- **Neutros:** grises limpios, sin tinte. Superficies: `surface`, `surface-raised` y `surface-sunken`. Texto: `ink`, `ink-muted` e `ink-subtle`. Bordes: `line` para separar y `line-strong` para delimitar controles.
- **Estados:** `success`, `warning` (naranja, nunca amarillo) y `danger`, cada uno con su `-surface`. Siempre van con icono y palabra.
- **Piezas de marca:** `nexo-amarillo`, `nexo-tinta` y `nexo-blanco` no cambian con el tema. Úsalos en el logo, el ticket, la camiseta, el cartel y el aviso de sin conexión.
- **Contraste:** todo texto supera 4,5:1 sobre su fondo en los dos temas, y los bordes de control y el foco superan 3:1. La tabla completa está en la ficha *Color*. `brand` sobre `surface` claro da 1,6:1, así que nunca se usa como texto, línea fina ni icono sobre fondo claro.
- **Tema oscuro:** está definido en cada token. El amarillo no cambia; el acento y los estados se aclaran.

## Tipografía

Archivo (OFL), en los pesos 400 a 800, va en `fonts/` y se empaqueta en la app. Nunca se carga de internet.

| Estilo | Tamaño / interlínea | Peso | Uso |
|---|---|---|---|
| `display-lg` | 48 / 52 | 800 | Portada web y carteles (≥ 600 px) |
| `display` | 32 / 36 | 800 | Titular en el teléfono |
| `title-lg` | 24 / 30 | 700 | Título de pantalla |
| `title` | 20 / 26 | 700 | Sección o tarjeta |
| `amount` | 28 / 32 | 800 | Totales |
| `body-lg` | 18 / 26 | 400 | Lectura en web |
| `body` | 16 / 24 | 400 | Texto de la app (mínimo de lectura) |
| `body-strong` | 16 / 24 | 600 | Nombres y precios en listas |
| `button` | 16 / 20 | 600 | Botones y pestañas |
| `small` | 14 / 20 | 400 | Metadatos de una línea |
| `label` | 13 / 16 | 600 | Insignias en mayúsculas, máximo dos palabras |

Ningún texto que haya que leer baja de 16 px. Las cifras en columnas van con `tabular-nums` y en formato cubano: 1.250 CUP. Mayúscula solo al principio de la frase.

## Espaciado, radios y tamaños

- **Retícula de 4 px.** El margen lateral en el teléfono es `space-4` (16 px). Entre bloques, `space-6`; entre secciones, `space-8`. En web de escritorio, `space-12` de margen.
- **Áreas táctiles:** todo lo que se toca mide al menos `size-target` (48 px). El botón Cobrar de la caja mide `size-button-lg` (56 px).
- **Radios:** `radius-xs` (4) para insignias, `radius-sm` (8) para botones y campos, `radius-md` (12) para tarjetas y `radius-lg` (20) para hojas inferiores. Los botones son rectángulos, nunca píldoras: repiten la forma del símbolo. `radius-full` solo va en interruptores y avatares.
- **Sombras:** solo `shadow-sheet`, en hojas y menús flotantes. Todo lo demás se separa con `line`.
- **Foco:** contorno de `size-focus` (3 px) en `focus`, separado 2 px.

## Iconos

Son 27 iconos de trazo, en una retícula de 24 px, con trazo de 2 px y remates redondos (grupo **Iconos**, ficha *Iconos*). Se usan a `size-icon` o `size-icon-sm` y toman el color del texto. Muestran cosas del negocio (productos, pedidos, dinero), nunca tecnología: nada de robots, cerebros, circuitos ni nodos. Sin emojis. Sin texto al lado, solo en la barra de pestañas y en buscar o cerrar.

## Fotografía

- **Qué se fotografía:** comercios cubanos reales y sus productos reales, como el mostrador, el estante, las manos que cobran, la gestora entregando un pedido o el producto en la mesa donde se vende.
- **Luz:** natural, de día, entrando por la puerta o la ventana. Sin flash directo, sin fondos de estudio y sin filtros de color.
- **Encuadre:** a la altura de los ojos o del mostrador, con aire alrededor. Producto solo: cenital o a 45°, sobre una superficie real (madera, mosaico, mantel), nunca recortado sobre blanco salvo en el catálogo.
- **Personas:** gente que trabaja, con permiso firmado, mirando lo que hace y no a la cámara. Nada de poses de oficina ni de personas mirando una pantalla con sonrisa de anuncio.
- **Nunca:** fotos de banco, imágenes generadas que imiten comercios reales, pantallas con datos inventados, ni tecnología como protagonista (servidores, hologramas, robots).
- **Con la marca:** el logo va sobre una zona tranquila de la foto o sobre una placa sólida de `nexo-tinta` o `nexo-amarillo`.

## Tono de voz

Es el español de Cuba, de tú, en frases cortas, y siempre habla del resultado para el negocio. Los ejemplos están en la ficha *Tono de voz*.

- Una idea por frase y 12 palabras como máximo: primero lo que pasó, después lo que hay que hacer.
- Prohibido: "IA", "inteligencia artificial", "algoritmo", "sincronizar", "servidor", "plataforma", "ecosistema", "innovador" y "disruptivo".
- Las cifras son reales y llevan moneda. Nunca inventes cifras, clientes ni testimonios.
- Sin exclamaciones en los avisos y sin emojis en la interfaz.
- Los botones llevan un verbo y, si se puede, la cifra: "Cobrar 4.500 CUP".

| Así sí | Así no |
|---|---|
| Sin conexión. Sigues vendiendo; lo subimos cuando vuelva la señal. | Error de red: no se pudo sincronizar con el servidor. |
| Te quedan 2 ventiladores. ¿Pedimos más? | Alerta: stock por debajo del umbral mínimo. |
| Vende sin comprar mercancía. Ganas comisión en cada venta. | Únete a nuestro innovador ecosistema de revendedores. |

## Marca del comercio

Cada comercio cliente (por ejemplo, Casa Viva) pone su logo, su nombre y su color en `merchant`. `on-merchant` se elige solo entre `nexo-tinta` y `nexo-blanco` según el contraste, y si ninguno da 4,5:1, el color solo se usa como franja de 4 px.

- En su catálogo público, el color del comercio pinta la cabecera y el botón principal, y NEXO solo aparece en el sello "Hecho con NEXO" del pie.
- En NEXO Business manda NEXO, y el comercio aparece con su logo y una franja de 4 px.
- Nunca cambian con el comercio: la tipografía, los iconos, los estados, el foco, la caja ni el icono de la app.

## Prohibido en toda la marca

Robots, cerebros, circuitos, nodos de red, gradientes morados o azul-violeta, neón, degradados 3D, brillos, dashboards falsos, cifras o testimonios inventados, fotos de banco, emojis como iconos, Inter, Roboto, Arial y paletas cliché de IA.

## Próximas fases

4. Aplicaciones: pantalla de la caja, panel del dueño, portada web, icono de app, ticket, publicación de Instagram, camiseta y cartel de tienda.
5. Manual final con los valores exactos y el nombre de cada token, listo para otros agentes.
