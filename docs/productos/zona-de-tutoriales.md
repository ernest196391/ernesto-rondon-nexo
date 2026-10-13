# Zona de tutoriales en el área de la gestora (y del mensajero)

**Idea de Ernesto, 13-oct-2026 12:55:** «crear una zona de tutoriales en su área de gestoras y que ellos mismos vayan y vean todo: la información, los vídeos y los audios». Es una de las próximas tareas. Etapa 1 hecha; falta el boceto.

| | |
|---|---|
| **Quién** | Gestoras y gestores, sobre todo los nuevos, y mensajeros. Es gratis: lo básico de la gestora (D42). |
| **Problema** | Los tutoriales se mandaron una sola vez al grupo, y quien entra después no ve los mensajes viejos de un grupo de WhatsApp. Hoy entraron 6 personas nuevas (Kamila, Enrique, Mel López, Yai-26, Yanet y Hector), y sus dudas se contestan una por una a mano. |
| **Evidencia (13-oct)** | Kamila: «para ver si puede explicar cómo es todo». Enrique preguntó 5 veces cómo compra el cliente, quién busca al mensajero y si hay mínimo. Lennys: «crea información general para las gestoras que entran nuevas… paso a paso». Nadielys preguntó por comisiones y mensajeros. |
| **Qué es** | Una pestaña **«Aprende»** en el área de la gestora, y otra en la del mensajero. Lleva los vídeos por orden, las notas de voz, las 4 guías en imagen y las preguntas frecuentes por tema. Cada vídeo tiene un botón «✓ Ya lo vi». |
| **Cómo se mide** | Vídeos vistos por persona, cuántas preguntas «¿cómo hago…?» llegan al bot en sus 3 primeros días (debería bajar) y días hasta su primera venta. |
| **Qué existe ya** | La página pública casaviva.company/tutoriales/ (página 2942) con 5 vídeos: primera venta, fotos para publicar, dudas del primer día, cómo comprar y mensajeros. Además: las guías PNG en `/root/archivos/guias/`, la nota de voz `audio-como-funciona-pedidos.ogg`, las preguntas resueltas en `crm_knowledge` y la bienvenida paso a paso del bot (`src/onboarding.js`, apagada hasta que Ernesto vea la prueba). |
| **Unión con el bot** | El «✓ Ya lo vi» y lo que el bot ya mandó por WhatsApp se cuentan juntos. Así el bot no repite un vídeo que ya vio en la web, y en la web sale marcado lo que le llegó por WhatsApp. |

## Siguiente paso

Hacer el boceto para el móvil: una pantalla con la lista «1. Tu primera venta ▶ · 2. Cómo compra tu cliente ▶ · …», una barra de avance y las dudas por tema. Ernesto lo ve y, con su visto bueno, se construye en Core: la pestaña en el área de gestora y en la de mensajero, reutilizando la página 2942.
