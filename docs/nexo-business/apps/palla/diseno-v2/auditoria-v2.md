# Pa'llá · auditoría de diseño v1 → v2 (4-nov-2026, Claude como diseñador senior)

Pedido de Ernesto: **más minimalista, letra moderna tipo Helvética, muy fácil de cargar, menos texto, quitar botones de más**,
y la **barra de progreso del viaje animada como Yandex Go**. Las pantallas en general le gustan: se conservan los flujos.

## Reglas nuevas (aplican a todas las pantallas)
1. **Letra:** neo-grotesca tipo Helvética. Geist variable (latin, autoalojada, ~30 KB) con respaldo
   `"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif`. Sin ancho expandido. Solo 2 pesos: 500 (texto) y 600 (títulos,
   precios). Títulos 22–24 px, no 32+. Precio grande 40 px peso 600, «CUP» pequeño y gris.
2. **Un solo amarillo por pantalla:** el botón principal. Sellos, chips y etiquetas en gris neutro; los colores de servicio
   solo en el icono pequeño del servicio.
3. **Menos cajas:** listas con separadores finos en vez de tarjetas con borde; radio único 14 px; sombras solo en la hoja
   inferior y en el botón flotante.
4. **Texto:** máximo 1 línea de ayuda por pantalla, y solo si sin ella no se entiende. Fuera las explicaciones largas.
5. **Nada de «EJEMPLO» en cada pantalla** ni botones «Demo: …». El prototipo avanza solo (temporizadores) o tocando el mapa;
   un único sello discreto «Prototipo» en el lienzo, no en el móvil.
6. **Carga:** nada de librerías nuevas; iconos en el `iconos.svg` que ya existe; vehículos como imagen pequeña (WebP ≤ 15 KB
   cuando lleguen las 3D).

## Qué QUITO (pantalla por pantalla)
- **Carga:** el pie «Taxi · Triciclo · Mensajero».
- **Entrar:** el botón grande «Mejor por SMS» → enlace pequeño «¿Sin WhatsApp? Por SMS». Texto de ayuda a 1 línea.
- **Código:** «El chofer solo ve tu nombre y tus estrellas» → fuera (va al perfil).
- **Inicio:** el icono del reloj (historial) arriba → ya está en el menú; el chip «Guardar lugar» → se hace en el perfil;
  las flechas «›» de los recientes.
- **Destino:** la etiqueta «GPS» → un punto azul basta.
- **Tipo de vehículo:** «precio justo» repetido debajo de cada precio y la nota «En el paso siguiente puedes subir o bajar el
  precio»; el texto «4 personas · Llega en 2 min» queda en una línea: «4 · 2 min».
- **Precio:** la regla deslizante (duplica los botones − / +), la línea «Precio justo: sale rápido» y el sello «Triciclub».
  El interruptor queda «Coger la 1.ª oferta» sin explicación. Efectivo / Transfermóvil pasa a una fila compacta
  «💵 Efectivo ›» (abre una hoja).
- **Buscando / ofertas:** el botón «No» de cada oferta (la oferta caduca sola o se desliza), la frase «3 ofertas. Elige por
  precio, tiempo y estrellas», el color del carro y los «60 s» escritos → una línea fina que se vacía.
- **Viene:** los 3 botones Llamar / WhatsApp / Compartir → 2 iconos redondos en la fila del chofer (llamar, mensaje);
  «Compartir» arriba junto a «Ayuda». Fuera «Demo: se subió».
- **Llegada:** las 4 etiquetas (Puntual, Amable…) y la propina salen solo después de tocar las estrellas, en la misma hoja.
- **Mis viajes:** el botón «Repetir» en cada fila → al tocar la fila.
- **Perfil:** la explicación del modo oscuro y «Qué pasa sin conexión».
- **Sin conexión:** el texto largo → «Sin señal. Tu pedido sale solo cuando vuelva.» y fuera «Volvió la señal (demo)».
- **Envío:** el aviso naranja de 3 líneas → 1 línea gris «Nada prohibido. Si mandas dinero, dilo.».
- **Chofer · pedidos:** la frase de arriba («En línea · un toque…»).
- **Chofer · conectar:** «Te llegan pedidos aunque la app esté cerrada».
- **Chofer · lo que debo:** de 4 bloques a 3 líneas: cuánto, tope, botón «Pagar por Transfermóvil» (los pasos dentro).
- **Chofer · perfil:** el párrafo final de privacidad.

## Qué REDUZCO
- Títulos y precios más pequeños; menos negrita.
- Tarjetas de oferta: de 4 líneas a 2 (nombre ★ · vehículo · min | precio grande) + 1 botón «Aceptar 120».
- Chips del tipo de vehículo: las pestañas Triciclo / Taxi / Moto pasan a un selector fino de texto.
- Avatares con iniciales: más pequeños (32 px).

## Qué AÑADO
1. **Barra de progreso del viaje animada (como Yandex Go)** en «Viene» (el chofer acercándose), «Viaje» (camino al destino)
   y «Envío · seguimiento»: una barra fina a lo ancho con el **vehículo pequeño que avanza encima**, el % recorrido y la hora
   de llegada; se mueve sincronizada con el vehículo en el mapa; al llegar al 100 % la barra se llena y la pantalla pasa sola
   a la siguiente.
2. **Ruta bien hecha:** hoy la ruta de 0,8 km a Coppelia da una vuelta enorme (calles de un sentido para carro). Para triciclo,
   bici y moto usar el recorrido corto; para taxi el de carro.
3. **Esqueletos de carga** (bloques grises suaves) en vez de esperas en blanco.
4. **Vehículos 3D** en el estilo que elija Ernesto (4 ejemplos en camino).
