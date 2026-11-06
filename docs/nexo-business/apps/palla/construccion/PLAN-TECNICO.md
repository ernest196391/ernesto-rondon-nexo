# Pa'llá transporte · plan técnico corto (5-nov-2026)

Para Ernesto, en sencillo. Lo de diseño y precios ya está aprobado (D138, D139, D140). Esto es **cómo** se construye.

## 1. Dónde vive cada pantalla (sin romper a los mensajeros de Casa Viva)

| Dirección | Para quién | Qué cambia |
|---|---|---|
| `casaviva.company/palla/` | Mensajeros de Casa Viva (web y app Android 1.4) | **Nada.** Sigue exactamente igual. |
| `casaviva.company/palla/ir/` | **Clientes nuevos**: Taxi, Triciclo, Moto, Mensajero | Nueva. Es la app del cliente. |
| `casaviva.company/palla/chofer/` | **Choferes** (taxi, triciclo, moto, mensajero de envíos) | Nueva. Conectarse, ofertas, viaje, ganancias, lo que debo. |
| `casaviva.company/palla/triciclub` | Choferes que se están dando de alta | Sigue (es el alta con carné y selfie). Se le añaden taxi, moto y mensajero. Cuando el chofer está aprobado, lo manda a `/palla/chofer/`. |
| `casaviva.company/triciclub/` | Triciclub viejo (solo pruebas) | Cuando se encienda Pa'llá, manda a `/palla/ir/`. |

Por qué así: `/palla/` es hoy la app de los mensajeros y la abre la app Android 1.4. Si el cliente entrara en `/palla/` mismo, habría que tocar la entrada de los mensajeros. Con `/palla/ir/` el cliente tiene su propia app (su propio «guardado sin conexión») y los mensajeros no notan nada.
Un solo arreglo invisible en la app de mensajeros: que su guardado sin conexión solo guarde la página `/palla/`, para que abrir el enlace del cliente en el mismo teléfono no la pise. Ellos no ven ningún cambio.
Más adelante, cuando los mensajeros pasen a la app nueva de chofer, `/palla/` podrá ser la del cliente.

## 2. Interruptor y modo prueba

- Interruptor nuevo `cvd_pv`: **no** (al subir) → **prueba** (solo los teléfonos de prueba: el tuyo ya está) → **sí**.
- Choferes de prueba: la lista que ya existe de Triciclub. Clientes de prueba: la lista que ya existe.
- Comisión: `0 %` (opción). El 8 % empieza en la fecha que pongas tú.

## 3. Tablas (las de Triciclub, ampliadas; nada de Casa Viva se toca)

- **choferes**: + clase de vehículo (Taxi Básico/Clásico/XL, Bici, Eléctrico, Eléctrico XL, Carga, Moto, Mensajero), chapa, foto de licencia y de la LOT (obligatorias en taxi), «también hago envíos».
- **viajes**: + servicio (taxi, triciclo, moto, envío), precio justo, oferta del cliente, precio acordado, «coger la 1.ª oferta», noche, espera, comisión. Datos del envío: qué mandas, tamaño, quién recibe, cobrar al entregar, código de entrega, foto de entrega.
- **ofertas** (nueva): cada «Acepto» o «+10/+20/+30 %» de un chofer, con su precio, minutos y hasta cuándo vale.
- **cuenta** (nueva): lo que cada chofer debe (comisión de cada viaje) y lo que paga por Transfermóvil (con el número de la transferencia; tú lo confirmas en el panel).

## 4. El precio (D140) en el servidor, nunca en el móvil

- Precio justo = mínimo (con sus km) + CUP por km, por calles con nuestro OSRM. Noche (22:00–6:00) +20 %. Redondeo a 10.
- El cliente sube o baja de 10 en 10, entre −20 % y +50 %, **nunca por debajo del mínimo**.
- El chofer: «Acepto» o +10/+20/+30 %. El precio acordado queda fijo y firmado.
- Espera: 5 min gratis desde «Llegué»; después 50 CUP/min, se suma al final.
- La tabla vive en una opción (`cvd_pv_tarifas`): si cambias un precio no hay que programar.

## 5. Ofertas en vivo sin tumbar la web

La web (Hostinger) no tiene conexión en vivo. Por eso:
- **El aviso va por nuestro ntfy del VPS** (ya existe y ya avisa a los mensajeros). Cada viaje tiene un canal secreto. Cuando un chofer hace una oferta, Core la publica allí y el móvil del cliente la ve al momento.
- **Si esa conexión se corta** (pasa con ETECSA), el móvil pregunta a la web cada 4 s mientras busca chofer y cada 15 s durante el viaje. Cada pregunta es una sola consulta corta. Con el móvil en segundo plano, pregunta menos.
- Los choferes reciben el pedido igual: por ntfy (la app Android ya lo escucha) y en su pantalla abierta.

## 6. Entrada del cliente

- Su móvil → código de 4 cifras por **WhatsApp** (lo manda VivaBot, ya funciona) → su nombre → dentro (90 días).
- **SMS de reserva:** la web deja el código en una cola «SMS» y un teléfono con SIM (tu Redmi con la 2.ª SIM y una app de pasarela de SMS) lo manda. Yo hago la parte de la web; poner la SIM y la app en el teléfono necesita tu mano. Ojo: cada SMS cuesta saldo de ETECSA.

## 7. Comisión y deuda

- Piloto + 2 meses: 0 %. Luego 8 %, que el chofer paga cada semana por Transfermóvil.
- Si debe más de 2.000 CUP, **solo se pausan sus viajes en efectivo** (los pagados por transferencia le siguen llegando).
- ⚠️ **Aviso:** con estos precios ese tope se alcanza rápido. Un taxi con 8 viajes al día (≈ 4.000 CUP cada uno) genera ≈ 2.560 CUP de comisión **en un solo día**; un triciclo con 6 viajes (≈ 2.100) ≈ 1.000 al día → **2 días**; bici o moto ≈ 3–4 días. Recomiendo, cuando empiece el 8 %: tope de **1 semana de comisión por tipo** (taxi 15.000, triciclo 6.000, bici/moto/mensajero 3.000) o cobrar cada 2–3 días. Queda como opción, se cambia sin programar.

## 8. Orden de trabajo

1. Servidor: tablas, precio, pedido → ofertas → elegir → viaje → espera → cobro → comisión; canal ntfy; pruebas automáticas.
2. App del cliente `/palla/ir/` (16 pantallas + 6 del envío), letra Geist, un solo amarillo, oscuro automático, vehículos 3D, barra animada, mapa que no frena (plano de reserva).
3. App del chofer `/palla/chofer/` (9 pantallas) + alta con taxi (licencia y LOT obligatorias), moto y mensajero.
4. Panel `/triciclub/admin`: viajes, ofertas, deudas y pagos.
5. Pruebas en un WordPress de prueba en este PC, luego **con tu SÍ** se sube apagado, se pone en prueba y lo probamos en tu Redmi por USB.

Nada se manda a nadie. Nada se sube sin tu SÍ.
