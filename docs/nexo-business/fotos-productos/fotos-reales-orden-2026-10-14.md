# Biblioteca de fotos reales — orden del 14-oct-2026 (noche, Claude)

Biblioteca D70 en el VPS: `/root/archivos/fotos-reales/` (`cv fotos …`). Lennys mandó **~350 fotos** entre las 16:47 y las 16:56 (casi todas «SIN PRODUCTO»).
Método: hojas de contacto de cada foto, comparadas con las fotos de la web (principal, variaciones y galería) de 176 productos candidatos.
Regla: solo se asignó lo que es **el mismo producto y un color que se vende** (`cv fotos asignar`, `product_how: manual`). Nada se subió a la web.

**Resultado:** antes 77 con producto · 361 sin producto · 57 otras → ahora **293 con producto · 146 sin producto · 56 otras**.
**216 fotos asignadas a 95 productos** (215 de «sin producto» + 1 de «otras»).

## 1. Asignadas (producto ← cuántas fotos)

- Textil y baño: Fundas Majestic #2449 ←7 (azul, negro, gris, beige, rosado, blanco) · Sábana camera luxury home #2557 ←8 (gris, rosado, beige, blanco) · Manta 180×220 estampada #2471 ←6 · Manta 180×200 lisa #2497 ←6 · Manta 240×260 lisa #2499 ←4 · Albornoz beige #2391, beige oscuro #2365, azul #2363 ←1 c/u · Bata de baño #463 ←2 (verde, arena) · Toallas Cisne Blanco 40×70 #695 ←4 · Set de 2 alfombras para baño #2529 ←10 (todos sus colores) · Alfombra Bienvenido 45×75 #2397 ←6 · Alfombra de entrada 40×60 #2373 ←4 (verde, azul marino) · Set para baño Casaisla #2573 ←5 (carmelita, rosado, turquesa oscuro, rojo vino, azul marino) · Set cortina + alfombra #2543 ←5 · Cortina de baño 180×180 #2429 ←2 (corazón = rojo) · Alfombra antirresbalante #2369 ←1 (azul) · Alfombra peluche arcos #2401 ←1 (carmelita) · Alfombra de Sala Persa #2399 ←1 · Cortina Royale #290 ←2 (blanco, carmelita) · Cortina roller 172×280 #2433 ←1 (la etiqueta marca 172×280).
- Las 11 alfombras de cocina 3D (#2531, 2533, 2535, 2537, 2539, 2541, 2559, 2561, 2563, 2565, 2567) ←1 c/u.
- Cocina y mesa: Juego de ollas #141 ←2 · Espumadera #477 ←3 · Termo 1 L #746 ←1 (azul) · Set de utensilios 5 piezas #2545 ←1 · Doyle Elegante #346 ←4 (blanco, azul) · Doyle matizado #2437 ←4 · Doyle metalizado #2455 ←3 (dorado, plateado, rosado).
- Casa: Cojín Diseño 1 #117 ←6 (amarillo, carmelita, beige, rojo) · Cojín Diseño 2 #692 ←2 · Cojín decorativo #2701 ←2 · Cojín flor #2413 ←2 · Búcaro blanco #278 ←6 · Cesto encimera #2409 ←4 · Cesto pedal 15 L #2421 ←2 · Cortinero Diseño 2 #405 ←1 (negro) · Azulejo INCEFRA #260 ←1 · Organizador de baño negro #2487 ←1 (caja) · Organizador de baño metal 3 niveles #3564 ←1 (estaba en «otras») · Estante esquinero #2461 ←2 · Tendedero multifuncional #2597 ←3 · Colgador de ropa #2415 ←4 · Tablas de planchar floral #2807 y rayas #2813 ←1 c/u · Árbol de navidad #2381 ←1 · Bolas navideñas #2612 ←3 y #2610 ←3 · Escritorio #2729 ←1 · Silla de oficina #2593 ←1 · Asiento de inodoro #43 ←1.
- Belleza: Luminoliss #410 ←2 · Cápsulas Hair Vitamin #2821 ←1 · Faja #727 ←1 · Masajeador facial y cuello #2475 ←3 · Cepillo alisador #2417 ←2 (Paleshy NEGRO) · Máquina de pelar #2473 ←3 · Perfilador FUGETSU #2823 ←1.
- Electro y otros: Soporte TV 40–80 #2595 ←2 (CP502) · Ventilador F6 verde #2587 ←1 · Lámpara recargable solar #2469 ←2 · Farol solar #2463 ←2 · Power bank #2551 ←1 · Cinta LED 5 m #2423 ←1 · Pesa corporal #2517 ←1 · Cable FV negro #2405 ←2 y rojo #2385 ←2 · Capas de moto #2387 ←6 · Cama plegable #2407 ←3 · Carretón negro #794 ←3 · Sombrilla de auto #2579 ←2 · Riñonera #2527 ←2 · Paraguas infantil #2489 ←2 · Paraguas inverso estampado #2858 ←3 (negro, rosado, morado).
- Mochilas: M-1 #2503, M-2 #2770, M-3 #2757, M-4 #2772, M-5 #2759, M-6 #2774, M-8 #2477, estilo bolsita #2753 ←1 c/u · M-9 #2509 ←2 · M-12 #2479 ←2.

Lista exacta de comandos usados: en la sesión (`asign.sh`); cada foto lleva `assigned_by: cv` en su `.json`.

## 2. Dudosas (NO asignadas) — mejor candidato

| Fotos (id) | Qué se ve | Mejor candidato / por qué no |
|---|---|---|
| 8846b883f4ba, 70e73617e437 | estante de la tienda con ventilador; una piedra | no son producto → `otras` |
| 48274196aebc | caja de carrito blanco 3 niveles (Maryta, «Falta esto», medidas 63×110×23) | #3556 Blanco; las medidas no cuadran |
| 365b1c71901f | sábanas en bolsas (Maryta: «Sábanas king») | #345 King; varios colores juntos |
| 18118bf1c434 | solo el papel de instrucciones FUGETSU | #2823 (no sirve como foto de venta) |
| 39654c055fa4, cee5599dd279 | alfombra peluche gris rectangular | #177 gris o #2401; no es el set de 3 |
| e04b47d9572f, 12dc0365bee7, b8d72ca784c5 | lámpara de emergencia LED (caja verde) | no está en la web |
| abefebc8a406, fac9292bbaa5, 987bf59ec62d, 948c50a1aaf4, fc5e0eae48cb, 82da5db250ed y 8b8e5682c64b, 0abbbd1be4db, 4e1bd99b0c30, 5c7f83a195b5, 69567f3c4153, 476c68b48695, 961f15464be7, 0bb8248bd4a6, 35ca8903fbf0, b237c6ce73ae | sábanas Majestic en bolsa (beige, blanco, camel, azul, gris, rosado, celeste, turquesa, menta…) | #345 King / #465 Queen / #2491 Camera / #577 Twin: **no se sabe la medida** (la web usa las mismas fotos para varias) |
| 76f8dab6ca42 | alfombra «Bienvenido» roja (hexágonos) | #2373 no tiene rojo |
| 6f41f3b84725 · 8e6a59524565 | pila de alfombras · bolsita de piezas blancas | — · #43 (tornillos?) |
| 594056ba90fd, f20f739dd645, 5021106419a2 | exprimidor de limón verde | no está en la web |
| f003474b53af, afa074daf314, fc12f2ccbc6c, b75c6cdf320e | manteles (verde, salmón, blanco) en paquete | #178 cuadrado o #514 circular (misma foto en los dos) |
| cb53a99bcff1, 09d0a7ef80ea, f6c1ad5fbfd4 · ee0ef155f2fb · 867d3fda8e9a | caja organizadora gris · Greenpro · caja con tubos | no identificadas |
| 7d6b927e86aa, f503b648dfe3 | piezas negras / instrucciones del organizador de baño | #2487 |
| f820e272b6dd, bbaeb2044846, d3107d768bda | barras extensibles Homestar negras | #405 negro (el paquete es otro) |
| 850edc328582, 1da22d0d9aca, e3c9acea2d0e · fb22126f7f75, a87ada816c80, a2acc2882406 | perchero «coat rack» · armario «walking wardrobe» | #2547 o #2515 |
| 296944e4de8e | alfombra antirresbalante beige | #2369 solo vende azul |
| ec5993907af6, d376efe26d07 | alfombra peluche crema · etiquetas Majestic | #2377 o #2401 beige |
| 39890a57a853, eb93c650ca0d | almohada Majestic ergonómica 75×50 | no está en la web |
| 04943c91e676, 4ad88e0e523b, e83d7769af18 | soportes negros en caja | no identificados |
| ebd565ad894d, 5f4ed17d896b | cesto gris con tapa basculante (grande) | no está en la web |
| c39e470c7a90, 8cfcdd1c49f8, 2e81b1b12f86, 1360523bb576, cf97ed45e896, df29a4abb2e8 | colchones (EDSM blanco/azul y uno gris) | EDSM / Dawang: no se sabe la medida |
| 031926ab121e, f6409835dddc, eac3669da28b | pieza gris con malla; bolsa azul con mosquitero | #389 Corral cuna Diseño 2 |
| 717a8af335b3 · a8a1cf3501ee · 0464a48e2f91, 2c601f446f89 | cojines estrella · organizador de malla colgante · posa-cucharas | no están en la web |
| bc6707f79421, 7efc4473b630 | kit «Lady Shaver» 4 en 1 | #2825 tiene otra forma |
| f2df220a99e0 | captura de la web de la lámpara solar | es copia → `otras` |
| 0500b3604f69, 44f2b8f4ff41, 1fa1c5bb3be4, f2fbb256ad9a | protector de colchón bambú | #302 Queen / #2523 King (misma foto) |
| c792841ea119 · 3024e035da00 · 25a548eeb9af | manta 240×260 camel · celeste · manta 180×200 roja | #2499 (amarillo?) · #2499 sin celeste · #2497 sin rojo |
| b9172b9fd077, 375558cf612d, ac405e9d98eb | grupo de sábanas · juego beige/gris · etiqueta de albornoz | — |
| c8a4dd562ed5 | alfombras de cocina «especias» | no está en la web |
| d0cfad1e6ec0 · baf05aa789c5 | alfombra chenilla (solo el revés) · morada | #2529 (sin color claro / no vende morado) |
| 33bda514e3f8, 123d781c2ff5, ef7bfb53526f, 0e815ae5ff83, e6dbc9b29631 | sets de cortina + tapete (azul/amarillo, hojas verdes, piedras azul, turquesa, negro) | #2543 solo vende gris, morado, rosado, amarillo |
| b687e9ba1414 · c8fd44a754bb · 15b59bb3696b, 79415b6f3754, acd446fd014a, 1a4ea7a2c120, 0fd2abe8c2ed, bfebb0c8d551 | cortinas roller (beige · negra · grises) | beige → #2431, negra → #2451, gris → #2433/#2453: la medida no se ve |
| e25106322dcd | caja con dibujo | — |
| a1bac931c733 · 7ebcf3eae473 · 279923795035, 2f22fa43e98c | Casaisla verde · azul cielo · verde lima | #2573 no vende verde; el azul podría ser turquesa oscuro |
| 92ff89387efc, 862e99c7a6ae, 7d19dcf89652, fa70740277e2, 34b43870becf, 3147f2588e3b, 55e7a74c007c, 038732214465, c32da6f9a273, b7e8b27b727c, c15592bdc705, 3fbc582ea044 | sobrecamas Majestic en paquete | #118 full / #634 king / #745 queen: la web usa la misma foto en king y queen |
| 37c2d71d52ce, 463c093077d2, 28e61848791d, edf4d1999d8d, 8ad4e181d71a | tablas de planchar (floral negra, grupos, cuadros rosa y azul) | solo hay #2807 floral azul y #2813 rayas |
| 939b0bb578f7 · 65aaa09606f4 · 9c103fe31f19 | mochilas negras | #2766 M-10 o #2768 M-14 · ? · #2755 M-15 |
| 4a2cded23eda, 96f24ef7a7d3, d44d3403814a, af356dfc1f62, c07524b6c5e0, 707c1fc1fb49 | edredones «Full size» (rosa, lunares, azul tejido, grises) | #2439 camero / #2457 queen (el azul tejido = foto de #2457) |
| c0d895db3f84, 561008c8b812, 98a26609d2de, 9461301540db, bce14a66ee4c | cortina blackout blanca con dorado (Royale) | #466 «bw-1/bw-2» o #158 |
| e124ea675969 | tela azul marino | — |
| 4edb2bf6bc95, 90d4fbc0cbaa, a8cce5e57cff | paraguas inverso negro/verde oscuro | #2828 verde? |
| 8581fda10270 | paraguas inverso flor azul | #2858 no vende azul (su foto principal sí) |
| f15e361a498d | captura de la web del escritorio (Lennys: «rectifica la cantidad») | copia → `otras` |

En `otras/`: las 56 que quedan están bien (capturas, local, calle, fotos copiadas de la web). Ojo: **75e212293107 es la foto de una tarjeta con nombre y número**: conviene `cv fotos descartar 75e212293107` (no se borra, el bot deja de usarla). Las de baldosas claras (2d5b6c466eff, 6132885e088c) podrían ser el azulejo INCEFRA #260.

## 3. Fotos reales que pueden ir a la web (fase 2, decide Ernesto — NO se subió nada)

Colores en venta **sin foto propia** en la web que ya tienen foto real asignada:
- **Fundas Majestic #2449**: azul, negro, gris, beige, rosado, blanco (todas con foto real; la web enseña una foto de «Cisne Blanco»).
- **Sábana camera luxury home #2557**: gris, rosado, beige, blanco.
- **Set de 2 alfombras para baño #2529**: rojo, azul, negro, gris, carmelita, beige, azul marino, gris oscuro (los 8).
- **Alfombra Bienvenido 45×75 #2397**: negro, carmelita, carmelita oscuro, azul (y la foto de todos los colores).
- **Alfombra de entrada 40×60 #2373**: verde, azul marino.
- **Set para baño Casaisla #2573**: carmelita, rosado, turquesa oscuro, rojo vino, azul marino.
- **Set cortina + alfombra #2543**: gris/rosado (geométrica), morado, rosado, amarillo.
- **Manta 180×220 estampada #2471**: gris, rosado y demás estampados.
- **Manta 180×200 lisa #2497**: azul, negro. **Manta 240×260 #2499**: azul.
- **Doyle metalizado #2455**: dorado, plateado, rosado. **Doyle matizado #2437**: azul, gris, beige, naranja (hay que mirar cuál es cuál).
- **Cortina de baño 180×180 #2429**: rojo (corazón). **Cortina Royale #290**: blanco.
- **Riñonera #2527**: verde y gris. **Paraguas inverso estampado #2858**: negro, rosado, morado.
- **Alfombra antirresbalante #2369**: azul. **Alfombra peluche arcos #2401**: carmelita. **Cojín flor #2413**: naranja.
- Sigue faltando: **Set de alfombras 3 piezas #177** rojo, rosado y azul (no llegaron fotos de esos colores).

Productos cuya foto de la web es de catálogo/IA y ya tienen foto real buena: #2409 cesto encimera, #2461 estante esquinero, #2423 cinta LED, #2517 pesa, #2579 sombrilla de auto, #2387 capas de moto, #2405/#2385 cables, #2551 power bank, #2475 masajeador, #2469 y #2463 lámparas solares, #2489 paraguas infantil, #2399 alfombra persa, mochilas M-2/M-3/M-4/M-5/M-6.
**Ojo:** #2417 cepillo alisador: la web enseña uno **blanco** y el real (Paleshy) es **negro**; #2473 máquina de pelar: el real es transparente.
