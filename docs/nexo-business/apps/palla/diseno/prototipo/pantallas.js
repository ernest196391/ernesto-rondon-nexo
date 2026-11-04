/* Pa'llá · la lista de pantallas del prototipo: #nombre, grupo, título y POR QUÉ está hecha así.
   La usan el prototipo (menú), el lienzo y el informe. */
window.PPANTALLAS = [
	// ---------- Cliente ----------
	{ id: 'carga', g: 'Cliente', t: 'Abriendo', p: 'La «P» se dibuja en menos de 1 s con CSS (0 KB de imágenes). La Nave tarda 3,2 s en tu Redmi solo en enseñar algo; aquí lo siguiente ya está listo debajo.' },
	{ id: 'entrar', g: 'Cliente', t: 'Entrar con el teléfono', p: 'Como inDrive y Yango: solo el número. El código llega por WhatsApp (gratis, ya lo hace el bot); SMS queda de reserva. Sin correo ni contraseña.' },
	{ id: 'codigo', g: 'Cliente', t: 'Código y nombre', p: 'Un paso por pantalla. 4 cifras en cajas grandes que se rellenan solas si Android lo permite. El nombre es lo único que pedimos: el chofer sabe a quién recoge.' },
	{ id: 'inicio', g: 'Cliente', t: 'Inicio', p: 'De La Nave: «¿A dónde vamos?», Casa, Trabajo y recientes. Lo superamos: se ve y se usa al momento sin esperar al mapa (entra después, suave) y los 3 servicios están a un toque.' },
	{ id: 'destino', g: 'Cliente', t: 'Destino', p: 'Origen ya puesto por GPS a la cubana («Calle N e/ 23 y 25»). Sugerencias al escribir, como La Nave, y «Fijar en el mapa» siempre visible: nunca te bloquea (hoy Triciclub sí).' },
	{ id: 'fijar', g: 'Cliente', t: 'Fijar en el mapa', p: 'Como Uber: mueves el mapa, no el pin. Debajo sale el nombre de la calle real (nuestro motor de rutas). Si no hay mapa, escribes «23 y L» y listo.' },
	{ id: 'recogida', g: 'Cliente', t: 'Confirmar recogida', p: 'De La Nave («Confirma el punto de origen»). Mejor: una nota opcional para el chofer («portón verde») en el mismo paso, y el punto se guarda para la próxima vez.' },
	{ id: 'tipo', g: 'Cliente', t: 'Elegir tipo', p: 'Carrusel de La Nave y Bolt, pero con el PRECIO JUSTO de cada uno y cuántos caben. Los vehículos se ven como en Uber (provisionales; mañana en 3D con IA).' },
	{ id: 'precio', g: 'Cliente', t: 'Precio justo', p: 'El modelo de inDrive, con reglas: subes o bajas de 10 en 10 sin teclear, entre −20 % y +50 %. Así no se hunde el precio (lo que pasó en Lagos). Interruptor de la 1.ª oferta, apagado.' },
	{ id: 'buscando', g: 'Cliente', t: 'Ofertas en vivo', p: 'inDrive: eliges por precio, tiempo y estrellas. Mejor: verde «acepta tu precio» y ámbar «pide más» a simple vista, cuenta atrás de 60 s y «Subir 10 %» de un toque.' },
	{ id: 'viene', g: 'Cliente', t: 'El chofer viene', p: 'Uber y Bolt: foto del vehículo, estrellas, código de 4 cifras al subir, llamar, WhatsApp, compartir y ayuda. Lo nuestro: «precio fijo» bien visible; La Nave dice «estimado, puede variar».' },
	{ id: 'viaje', g: 'Cliente', t: 'En viaje', p: 'Hora de llegada grande (Yango), ruta por calles y el vehículo girando con la calle. Botón de ayuda siempre a la vista y compartir el viaje con la familia.' },
	{ id: 'llegada', g: 'Cliente', t: 'Pagar y valorar', p: 'Se paga directo al chofer (como inDrive y La Nave). Con Transfermóvil se ve su número para copiarlo. Estrellas de un toque, motivos en chips y propina opcional.' },
	{ id: 'viajes', g: 'Cliente', t: 'Mis viajes', p: 'Lista limpia con precio acordado y «Repetir» (pide igual en 2 toques). Se guarda en el móvil: se ve sin señal.' },
	{ id: 'perfil', g: 'Cliente', t: 'Perfil', p: 'Lo mínimo: nombre, teléfono, lugares, contactos de confianza y el modo de la pantalla (oscuro solo de noche). Sin billetera ni saldo: Ernesto no quiere fondo.' },
	{ id: 'sinconexion', g: 'Cliente', t: 'Sin conexión', p: 'Idea de Uber Lite, mejor resuelta: sin señal se ve todo lo guardado; el pedido queda en el móvil y sale solo al volver. Plan B: pedir por WhatsApp o llamar.' },
	// ---------- Mensajero ----------
	{ id: 'envio', g: 'Mensajero', t: 'Qué mandas', p: 'Como inDrive Courier y Yango Delivery, en una pantalla: qué es y el tamaño con 3 dibujos. El tamaño decide moto, triciclo o carga.' },
	{ id: 'envio-recibe', g: 'Mensajero', t: 'Quién recibe', p: 'Nombre y teléfono de quien recibe (le llega el aviso por WhatsApp). «¿Cobrar al entregar?» como hace Casa Viva hoy con sus mensajeros.' },
	{ id: 'envio-precio', g: 'Mensajero', t: 'Precio del envío', p: 'El mismo precio justo que el viaje (100 + 60 por km), mismo control: aprender una vez sirve para todo.' },
	{ id: 'envio-ofertas', g: 'Mensajero', t: 'Ofertas de mensajeros', p: 'Las mismas tarjetas de oferta, con el color naranja del servicio y la caja que lleva cada mensajero.' },
	{ id: 'envio-seguimiento', g: 'Mensajero', t: 'Seguimiento', p: 'Tres pasos claros (recogido, en camino, entregado) y la moto moviéndose. Quien recibe tiene su propio código: nadie se lleva el paquete equivocado.' },
	{ id: 'envio-entregado', g: 'Mensajero', t: 'Foto de entrega', p: 'Prueba de entrega con foto, hora y nombre (lo hace Casa Viva hoy). Pagar y valorar en la misma pantalla.' },
	// ---------- Chofer ----------
	{ id: 'ch-alta', g: 'Chofer', t: 'Alta', p: 'Lo que ya existe en Pa\'llá: carné, selfie con el carné, foto del vehículo y tipo. Una lista con lo hecho y lo que falta; se puede dejar a medias.' },
	{ id: 'ch-conectar', g: 'Chofer', t: 'Conectarse', p: 'La pantalla de hoy, más limpia: un botón grande y «qué acepto hoy» (pasaje, envíos, Casa Viva solo si es su mensajero). Zonas con demanda: idea de La Nave.' },
	{ id: 'ch-pedidos', g: 'Chofer', t: 'Pedidos con oferta', p: 'inDrive sin teclear: «Acepto» o +10 / +20 / +30 % de un toque. Antes ve barrio, km y nota, nunca el teléfono. Decir que no no le baja la nota.' },
	{ id: 'ch-recoger', g: 'Chofer', t: 'Ir a recoger', p: 'Un botón grande por paso (Llegué → código → Recogí), como hoy en Pa\'llá. Navegar abre la ruta por calles.' },
	{ id: 'ch-viaje', g: 'Chofer', t: 'En viaje', p: 'Solo lo necesario mientras maneja: destino, precio acordado y «Terminé». Letra grande, nada que leer.' },
	{ id: 'ch-cobrar', g: 'Chofer', t: 'Cobrar', p: 'El precio acordado, fijo, en grande. «Cobrado» y una valoración rápida del cliente (los dos lados se valoran).' },
	{ id: 'ch-ganancias', g: 'Chofer', t: 'Ganancias', p: 'Hoy y la semana de un vistazo (barras simples), como Bolt Driver. Se ve claro que en el piloto la comisión es 0 %.' },
	{ id: 'ch-deuda', g: 'Chofer', t: 'Lo que debo a Pa\'llá', p: 'De Bolt: si la deuda pasa un tope se pausan solo los viajes en efectivo. Mejor: aviso antes, cuánto falta, y se paga cada semana por Transfermóvil sin fondo ni saldo.' },
	{ id: 'ch-perfil', g: 'Chofer', t: 'Perfil y vehículo', p: 'Su vehículo, tipo, plazas, LOT y papeles con su estado. Se dice claro qué ve el cliente: nombre, estrellas, vehículo y su número de Transfermóvil para pagarle.' }
];
