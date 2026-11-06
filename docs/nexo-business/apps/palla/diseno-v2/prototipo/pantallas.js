/* Pa'llá · la lista de pantallas del prototipo v2: #nombre, grupo, título y POR QUÉ (≤ 15 palabras).
   La usan el prototipo (menú), el lienzo y el informe. */
window.PPANTALLAS = [
	// ---------- Cliente ----------
	{ id: 'carga', g: 'Cliente', t: 'Abriendo', p: 'Logo animado con CSS, 0 KB de imágenes. Sin textos de más.' },
	{ id: 'entrar', g: 'Cliente', t: 'Entrar con el teléfono', p: 'Solo el número; código por WhatsApp. SMS queda como enlace pequeño.' },
	{ id: 'codigo', g: 'Cliente', t: 'Código y nombre', p: 'Un paso por pantalla: 4 cifras grandes y tu nombre. Nada más.' },
	{ id: 'inicio', g: 'Cliente', t: 'Inicio', p: 'Tres servicios y «¿A dónde vamos?» al momento; el mapa entra después.' },
	{ id: 'destino', g: 'Cliente', t: 'Destino', p: 'Origen por GPS (punto azul), sugerencias al escribir y «Fijar en el mapa».' },
	{ id: 'fijar', g: 'Cliente', t: 'Fijar en el mapa', p: 'Como Uber: mueves el mapa, no el pin. Sale la calle real.' },
	{ id: 'recogida', g: 'Cliente', t: 'Confirmar recogida', p: 'Confirmas el punto y, si quieres, una nota corta para el chofer.' },
	{ id: 'tipo', g: 'Cliente', t: 'Elegir tipo', p: 'Selector fino Triciclo / Taxi / Moto. Cada fila: plazas, minutos y precio.' },
	{ id: 'precio', g: 'Cliente', t: 'Precio justo', p: 'Solo − / + de 10 en 10. Pago en una fila que abre hoja.' },
	{ id: 'buscando', g: 'Cliente', t: 'Ofertas en vivo', p: 'Ofertas de 2 líneas y un botón. Amarillo solo en la mejor.' },
	{ id: 'viene', g: 'Cliente', t: 'El chofer viene', p: 'Barra animada tipo Yandex Go, sincronizada con el mapa. Llamar y mensaje: iconos.' },
	{ id: 'viaje', g: 'Cliente', t: 'En viaje', p: 'Hora de llegada y barra de progreso. Al 100 % pasa sola a pagar.' },
	{ id: 'llegada', g: 'Cliente', t: 'Pagar y valorar', p: 'Precio fijo grande. Motivos y propina salen solo después de las estrellas.' },
	{ id: 'viajes', g: 'Cliente', t: 'Mis viajes', p: 'Lista con separadores. Tocar la fila repite el viaje; se ve sin señal.' },
	{ id: 'perfil', g: 'Cliente', t: 'Perfil', p: 'Lo mínimo: lugares, confianza, pantalla y pago. Sin explicaciones largas.' },
	{ id: 'sinconexion', g: 'Cliente', t: 'Sin conexión', p: 'Una línea: tu pedido sale solo al volver la señal. Luego avanza solo.' },
	// ---------- Mensajero ----------
	{ id: 'envio', g: 'Mensajero', t: 'Qué mandas', p: 'Qué es y su tamaño en una pantalla. Aviso de una línea gris.' },
	{ id: 'envio-recibe', g: 'Mensajero', t: 'Quién recibe', p: 'Nombre, teléfono y «¿cobrar al entregar?», como hace hoy Casa Viva.' },
	{ id: 'envio-precio', g: 'Mensajero', t: 'Precio del envío', p: 'El mismo control de precio que el viaje: se aprende una vez.' },
	{ id: 'envio-ofertas', g: 'Mensajero', t: 'Ofertas de mensajeros', p: 'Las mismas ofertas de 2 líneas, con mensajeros en moto con caja.' },
	{ id: 'envio-seguimiento', g: 'Mensajero', t: 'Seguimiento', p: 'Tres etapas, barra de progreso y código de Marta. Al llegar, pasa sola.' },
	{ id: 'envio-entregado', g: 'Mensajero', t: 'Foto de entrega', p: 'Foto, hora y código como prueba. Pagar y valorar en la misma pantalla.' },
	// ---------- Chofer ----------
	{ id: 'ch-alta', g: 'Chofer', t: 'Alta', p: 'Carné, selfie, foto del vehículo y tipo. Se puede dejar a medias.' },
	{ id: 'ch-conectar', g: 'Chofer', t: 'Conectarse', p: 'Un botón grande y qué acepto hoy con interruptores. Nada que leer.' },
	{ id: 'ch-pedidos', g: 'Chofer', t: 'Pedidos con oferta', p: '«Acepto» o +10/+20/+30 % de un toque. Línea fina para el tiempo.' },
	{ id: 'ch-recoger', g: 'Chofer', t: 'Ir a recoger', p: 'Un botón por paso: Llegué, código, Recogí. Llamar y mensaje como iconos.' },
	{ id: 'ch-viaje', g: 'Chofer', t: 'En viaje', p: 'Solo destino, precio acordado y «Terminé». Letra grande mientras maneja.' },
	{ id: 'ch-cobrar', g: 'Chofer', t: 'Cobrar', p: 'Precio acordado en grande, «Cobrado» y valoración rápida del cliente.' },
	{ id: 'ch-ganancias', g: 'Chofer', t: 'Ganancias', p: 'Hoy y la semana de un vistazo. Comisión 0 % en el piloto.' },
	{ id: 'ch-deuda', g: 'Chofer', t: 'Lo que debo a Pa\'llá', p: 'Tres líneas: cuánto, tope y botón de pagar; los pasos van dentro.' },
	{ id: 'ch-perfil', g: 'Chofer', t: 'Perfil y vehículo', p: 'Vehículo y papeles con su estado, en una lista con separadores.' }
];
