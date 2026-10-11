# Opiniones de la prueba final de mensajería (2026-10-07, pedido #2675)

Recogidas por VivaBot (notas de voz transcritas). Cada opinión tiene su acción y su estado.

## Lennys (dueña y administradora; hizo de clienta)

| # | Lo que dijo | Acción | Estado |
|---|---|---|---|
| L1 | Puso que había que llevar **2 dólares de vuelto** y en el vale no salió | Vale lee el vuelto (3.13.14); la moneda ya no viene preseleccionada y es obligatoria si se pide vuelto (3.13.15) | Hecho |
| L2 | "Generalmente nuestro cliente es el **gestor**": cada gestora debe tener su **enlace personalizado** para que su cliente compre desde ahí | La gestora escribe "mi enlace" al bot y recibe `casaviva.company/?ref=SU-CÓDIGO`; el vale dice de qué gestora es. **Pero en Core solo hay 3 gestoras aprobadas (1 con teléfono)**: las gestoras reales siguen en BizneCubano → hay que darlas de alta en Core antes de dejar BizneCubano | Código hecho · Alta de gestoras pendiente |
| L3 | El bot se nota **seco y repetitivo** | Prompt nuevo: reacciona primero, varía frases, 1–2 emojis, presentación solo al inicio (VivaBot `446aa36`) | Hecho (validar con uso) |
| L4 | Mensajero y dependienta necesitan la **foto del producto** para no confundir productos parecidos al entregar y recibir | El bot manda la foto con el vale | Hecho (3.13.14 · VivaBot 1e15660) |
| L5 | Si hay que esperar la respuesta de alguien sin conexión, **el proceso se para** y el cliente queda esperando | Avisos por tiempo: carrera sin "Yo", mensajero sin hora, cliente sin confirmar → recordatorio y aviso a Ernesto | Hecho (3.13.14 · VivaBot 1e15660) |
| L6 | Al cliente hay que decirle "**te avisamos antes de ir**" | Añadido al mensaje de la hora | Hecho (3.13.14 · VivaBot 1e15660) |
| L7 | ¿A quién le llega el vale para que el bot lo pase a mensajería? | Explicado: el reparto empieza con "Listo para salir" en Core; el vale por WhatsApp solo sirve para verificar el número de quien compró | Respondido |
| L8 | El cliente debería tener el **teléfono de quien le entrega** | El cliente recibe nombre y teléfono del mensajero; la gestora recibe los mismos avisos (3.13.16 · VivaBot `6fe1f4d`) | Hecho |
| L9 | No entendía qué era "mi enlace"; hay que explicarlo al registrar | La bienvenida trae el enlace, explica qué es y lista lo que puede pedir al bot; incluye acceso sin contraseña (no para administración) | Hecho (Core 3.13.19) |
| L10 | Se equivocó en el vuelto, dio "atrás" y el carrito salió vacío: tuvo que rehacer todo (pedidos #2676 duplicado y #2677) | Aprobado por Ernesto: (1) resumen para revisar antes de finalizar, (2) "¿con cuánto paga?" y la web calcula el vuelto, (3) enlace "me equivoqué, corregir" en la página de gracias → bot avisa a Ernesto. #2676 anulado | Hecho (Core 3.13.20) · validar con Lennys |
| L11 | Escribió "¿cómo va el número?" copiando el ejemplo y el bot no entendió | "¿cómo va?" sin número muestra su lista; los ejemplos usan un número real | Hecho (VivaBot `e890bf4`) |
| L12 | Al volver de WhatsApp la página se queda igual: debería decir "pedido finalizado" y llevar a la tienda | Página de gracias: "✅ Pedido #N finalizado", "Último paso: envía el vale", botón "Volver a la tienda" y aviso al volver | Hecho (Core 3.13.21) |
| L13 | Hay que esperar a que envíe el vale por WhatsApp, si no nunca lo tendrá en su chat | El vale por WhatsApp queda marcado como último paso obligatorio en la página de gracias | Hecho (Core 3.13.21) |
| L14 | Si el cliente ya dijo la hora (6pm) no hay que volver a preguntarle: solo confirmar | Solo se confirma; comentarios no reinician la hora; "para Ernesto" = sugerencia | Hecho (VivaBot `be855d0`) |
| L15 | El mensajero no tiene que declarar la mensajería (es suya); declaró 20 USD (billete) en vez de 15 | "entregado" sin cifras declara lo de los productos; cifra mayor = vuelto dado; #2678 corregido a 15 USD | Hecho (VivaBot `c9403b0`) |

## Zaymi (mensajera y dependienta)

| # | Lo que dijo | Acción | Estado |
|---|---|---|---|
| Z1 | "¿Dónde pongo la hora? La hora hasta ahora la da el cliente" | El bot solo acepta horas (hecho). La web ya pide fecha y franja (mañana/tarde): el bot se la dice al mensajero para que confirme la hora exacta | Hecho / arreglando |
| Z2 | En la app no encontraba la oferta (le salía una entrega vieja) | Carreras arriba del todo en "Hoy" (Core 3.13.13) | Hecho |
