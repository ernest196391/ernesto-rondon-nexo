# Tutorial mensajeros · «Tu tarjeta de carrera» (23-oct-2026)

- **Para:** todos los mensajeros (grupo Mensajerías) y el bot cuando un mensajero pregunte cómo funciona.
- **Mensaje:** con la tarjeta tienes todo en 1 pantalla y marcas cada paso con un botón.
- **Formato:** vertical 1080×1920, 30 fps, ~73 s, **sin voz**, texto grande en el centro, música suave propia (sin derechos) y efectos suaves.
- **Pantallas:** capturas reales de la tarjeta (Core 3.14.57) con el pedido de PRUEBA #5425, cambiado a datos de ejemplo («Cliente De Ejemplo», «Calle Ejemplo #100», teléfono +53 5000 0000). Sin la franja «PRUEBA» y sin el nombre de Ernesto.
- **Proyecto:** `hf/` (HyperFrames 0.8.189). Se edita `hf/gen.mjs` y se regenera `index.html` con `node gen.mjs`.

## Guion (lo que sale en pantalla)

| Tiempo | Escena | Texto |
|---|---|---|
| 0–3,4 s | Gancho (logo + teléfono con la tarjeta) | «Ahora todo en **1** pantalla» → «Menos mensajes, más carreras» |
| 3,4–19,8 s | ASÍ FUNCIONA (7 pasos con icono y número) | 1 Entra un pedido en la web · 2 Sale al grupo **Mensajerías** · 3 Escribes «**Yo**» (y la carrera es tuya) · 4 Te llega el vale con tu **TARJETA** 🃏 · 5 Recoges en la tienda (Conill A esq. 45 #864 · de 10 a 4) · 6 Entregas al cliente (y lo marcas en la tarjeta) · 7 Llevas el dinero a la tienda (antes de las 4) |
| 19,8–22,4 s | Tarjeta | «Tu **TARJETA** por dentro» |
| 22,4–25,4 s | ① | «Cliente y dirección» (recuadro en nombre y dirección) |
| 25,4–28,6 s | ② | «**Llamar** o abrir el mapa» (toque en Llamar) |
| 28,6–31,6 s | ③ | «Qué recoger y dónde» |
| 31,6–34,2 s | ④ | «Cobras **30 USD**» |
| 34,2–37,6 s | ⑤ | «Traes **40 USD** a la tienda» + «30 de productos + 10 del vuelto» |
| 37,6–45,2 s | LOS 4 BOTONES | «**Recogí** · ya tengo el paquete» → «**Entregado** · ya lo entregué» → «**Problema** · algo salió mal» → «**Ya no puedo** · la suelto» |
| 45,2–48,4 s | ENTREGADO | «Toca «**Sí, entregado**»» (panel abierto) |
| 48,4–51,8 s | PROBLEMA | «Elige qué pasó y **avisa**» (motivos + «Avisar a la tienda») |
| 51,8–54,6 s | Ya no puedo | «**Ya no puedo** · la sueltas» + «antes de recoger · vuelve al grupo» |
| 54,6–62,6 s | ¿Sin conexión? | «Escríbele al bot por WhatsApp:» · «Recogí 5425» · «Entregado 5425» · «Problema 5425 no estaba» · «No puedo 5425» · «Hace lo mismo que los botones» · «**Recogí:** también lo puede marcar la tienda al darte el paquete» |
| 62,6–69 s | 3 REGLAS | 1 El dinero, a la tienda antes de las 4 (si entregas después de las 4: al otro día, antes de las 4) · 2 La mensajería es tuya · 3 ¿Algo salió mal? Toca **Problema** (no lo marques entregado) |
| 69–73,5 s | Cierre | Logo vertical · «¿Dudas?» · «Pregúntale al bot» · «ASÍ DE FÁCIL» (sin número ni enlace) |

## Palabras por WhatsApp (actualizado 23-oct tarde)

- Las 4 palabras para mensajeros las programó otro agente: VivaBot `feat/tarjeta-carrera` `e2789a1` + Core `feat/carrera-palabras` 3.14.59 (se despliegan juntos ANTES de mandar el video). «Recogí 5425» marca recogido igual que el botón (no es la orden RECOGÍ de Ernesto en «Tú»); «Entregado 5425» sin cantidad = lo del vale, con cantidad = lo COBRADO al cliente («Entregado 5425 30 usd»), no lo que se trae con el vuelto; «Problema 5425 no estaba»; «No puedo 5425» (también «suelto 5425»).
- Número de ejemplo 5425 (el de la tarjeta que sale en pantalla), no un pedido real.
- «Ya no puedo» solo vale **antes de recoger** (después, la tarjeta pide «Problema»).

## Comprobado

- `npx hyperframes check`: 0 errores (lint, runtime, layout, motion, contraste, legibilidad).
- Revisión de 1 fotograma por segundo del MP4 final (hojas 3×3) en tamaño de móvil pequeño.
- Ningún dato personal real: solo el pedido de PRUEBA con datos de ejemplo.
