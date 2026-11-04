---
message: "Una gestora de Casa Viva puede elegir qué mensajero lleva su pedido; ese pedido no sale al grupo y el vale le llega directo a ese mensajero por WhatsApp."
audience: gestoras de Casa Viva (La Habana), no técnicas, en el teléfono
mode: autonomous
canvas: 1080x1920
duration: 36
---

Arco: pregunta → cómo se hace (app) → alternativa (nota) → consecuencia (vale directo, no al grupo) → confirmación a la gestora → regla por defecto.
Tiempos alineados a las pausas reales de assets/voz.mp3.

## Frame 1
status: built
src: compositions/s1-title.html
time: 0–3.45
motion: waterfall-entry (título por líneas) + spring-pop-entrance (insignia 🛵)
beat: "¿Quieres elegir qué mensajero lleva tu pedido? Es muy fácil."

## Frame 2
status: built
src: compositions/s2-app.html
time: 3.45–14.45
motion: cursor-click-ripple (toques) + anchored-layout-expand (menú lateral / desplegable) + spring-pop-entrance (aviso "Guardado")
beat: "Entra en tu área de gestora, toca el menú y abre Ventas. En tu pedido, en Mensajero que lo lleva, elige a tu mensajero. Listo, queda guardado."

## Frame 3
status: built
src: compositions/s3-nota.html
time: 14.45–19.15
motion: cursor-click-ripple + discrete-text-sequence (escritura "mensajero: Pedri")
beat: "También puedes escribirlo en la nota del pedido: mensajero, y su nombre."

## Frame 4
status: built
src: compositions/s4-vale.html
time: 19.15–24.5
motion: css-marker-patterns (tachado + sello "No sale aquí") + spring-pop-entrance (burbuja del vale) + waterfall-entry (líneas del vale)
beat: "Ese pedido no sale al grupo. El vale le llega directo a tu mensajero por WhatsApp."

## Frame 5
status: built
src: compositions/s5-aviso.html
time: 24.5–28.3
motion: spring-pop-entrance (notificación + burbuja) + css-marker-patterns (resaltado "Pedri", "hoy 4 pm")
beat: "Y a ti te aviso de quién lo lleva y a qué hora."

## Frame 6
status: built
src: compositions/s6-cierre.html
time: 28.3–36
motion: waterfall-entry (líneas sincronizadas con la voz) + spring-pop-entrance (burbuja "Yo 🙋")
beat: "Si no eliges a nadie, la carrera sale al grupo y la coge el primero que diga Yo."
