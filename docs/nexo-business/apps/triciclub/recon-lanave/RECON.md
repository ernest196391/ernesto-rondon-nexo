# La Nave por dentro: lo que se vio de verdad (3-nov-2026)

**Cómo se hizo:** el Redmi de Ernesto conectado por USB (adb). Se abrieron `app.lanave.user` (cliente, v3.06.01) y
`app.lanave.driver` (chofer, v2.5.6) con la sesión de Ernesto, y se leyó cada pantalla (textos, botones y posición) con
`uiautomator`. Además, las 4 capturas públicas de la App Store (`capturas/tienda-cliente-1..4.jpg`).
**Lo que NO se pudo:**
- **No hay capturas del móvil:** La Nave las bloquea (FLAG_SECURE) y salen en negro. Solo se leen textos y botones.
- **No se pidió ningún viaje.** Se llegó hasta la pantalla de precios y se salió con «Cancelar».
- **Del chofer no se vio** cómo llega un pedido, cómo se acepta ni cómo se navega: para eso hay que ponerse «en línea», y eso son viajes de verdad.
- **No se sabe qué categoría estaba marcada** al leer los precios (la app no lo dice en los datos de la pantalla).
- **No se desarmó el código**, porque es suyo. Solo se miró lo que hace.

## App del cliente: el camino real

| # | Pantalla | Qué hay (visto) |
| --- | --- | --- |
| C1 | **Inicio = mapa/globo** con tu punto | Menú (arriba izq.), campana de avisos (arriba der.), botón «Centrar en mi ubicación», caja **«¿A dónde vamos?»** con el tiempo (32°), botones **Casa** y **Trabajo**, y debajo **chips con tus direcciones recientes**. No hay que escribir nada para empezar. |
| C2 | **Buscar destino** (al tocar «¿A dónde vamos?») | **Origen ya relleno con el GPS**, escrito al estilo cubano: «Calle N e/ Calle 23 (La Rampa) y Calle 25, Plaza de la Revolución». Caja de destino. **«Fijar ubicación en el mapa»** y **«Agregar destino más tarde»**. «Mis destinos» (casa, trabajo) y «Destinos recientes». |
| C3 | **Sugerencias mientras escribes** («Obispo») | Lista de **lugares y calles con su dirección completa**: «Variedades Obispo · Obispo e/ Habana y Compostela, La Habana Vieja», «Soda Obispo · Obispo e/ Villegas y Aguacate»… y **«Fijar ubicación en el mapa» siempre visible debajo**. Nunca se bloquea. |
| C4 | **Confirma el punto de origen** | Al elegir el destino, un mapa con el pin de recogida y la dirección («Ubicación actual»); se mueve el mapa para afinar y se toca **«Confirma el punto de origen»**. |
| C5 | **Elegir vehículo y pedir** | Mapa con la ruta y los coches cerca. Origen y destino. **Carrusel de categorías: Moto, Triciclo, Básico, Confort, Básico XL, Confort XL.** Debajo: **Precio** (p. ej. $2.651,65 y $3.176,55 para ~5 km Vedado→Obispo, con llegada en 1–2 min), **Pago** (Efectivo / Billetera) y **Llegada**. Botón **«Viajar ahora»**. «Cancelar» arriba. |
| C6 | **Información del viaje** (al tocar el precio; visto en la tienda) | Tarifa de la categoría: **base, precio por km, precio por minuto, tamaño máximo**; distancia, tiempo y «Precio estimado: puede variar según la ruta y la hora». |

**Corrección a lo que dijimos antes:** **La Nave YA tiene «Triciclo»** como categoría. El estudio del 23-oct
(`../../nave-investigacion-2026-10-23.md`) decía que no; ya no vale.

## App del chofer: lo que se ve sin ponerse en línea

| # | Pantalla | Qué hay |
| --- | --- | --- |
| D1 | **Inicio (Conducir)** | Arriba: menú, **saldo de la billetera** (0,49 $) y avisos. Botón grande en el centro para conectarse (no se tocó). Pestañas: **Conducir · Vehículos · Mi Nivel**. |
| D2 | **Menú** | **Perfil, Billetera, Historial, Ayuda, Ajustes, Cerrar sesión**. |
| — | Pedido entrante, aceptar, ir a recoger, cobrar | **No visto.** Para verlo hay que ponerse en línea (viajes reales) o que Ernesto lo cuente o lo fotografíe con otro móvil. |

## Triciclub frente a La Nave (con honestidad)

| La Nave | Triciclub hoy (3.14.117) | Hay que |
| --- | --- | --- |
| Abre en el **mapa** con tu punto | Abre en un formulario | Abrir en el mapa, como C1 |
| Origen **solo, por GPS**, en formato cubano | Hay que escribirlo (o tocar el botón del GPS) | GPS al abrir + dirección cubana desde el punto (al revés de lo que hacemos hoy) |
| **Sugerencias** de lugares y calles al escribir | Busca una dirección exacta; si no la entiende, **te bloquea** | Sugerencias + «Fijar en el mapa» siempre; nunca bloquear |
| **Confirmar el punto** en el mapa | No hay | Añadir C4 |
| **Carrusel de categorías** con precio, pago y llegada; un botón | Lista de choferes con su precio | Mantener nuestra diferencia (precio del chofer) pero con la forma de La Nave: primero el triciclo más barato o el más cercano, y «ver otros» |
| Casa / Trabajo / recientes | Recientes en el móvil | Casa y Trabajo |
| Precio «estimado» que puede cambiar | Precio fijo firmado | **Nuestra ventaja: se queda** |
| Billetera con saldo del chofer | No hay | Decidir (Ernesto no quiere el fondo) |

## Qué falta mirar (y cómo)
1. **El lado del chofer en un viaje:** que Ernesto se conecte un rato, o que pida un viaje corto de verdad y lo grabe con otro móvil.
2. **La tarifa de «Triciclo»:** que Ernesto toque Triciclo → el precio, y me lea la base, el km y el minuto (yo no puedo saber cuál está marcado).
3. Menú del cliente, historial y pantalla del viaje en curso: con un viaje real.
