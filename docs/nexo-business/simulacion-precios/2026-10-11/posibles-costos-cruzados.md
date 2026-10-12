# Posibles costos cruzados — importación del Excel de octubre

**Solo lectura: no se cambió ningún costo.** Para cada producto con costo se busca de qué fila del Excel de Maryta salió (tabla `import_review` de la nube) y qué filas se le parecen más por el nombre. Las medidas (40x60, 12 L, 2 piezas…) tienen que coincidir.

- **ALTA** (casi seguro cruzado): 14 productos (18 renglones contando colores) · **MEDIA** (revisar): 2 · sin problema visible: 132 renglones.
- «Podría ser» = el costo de la fila del Excel que mejor coincide. Es una pista, no una corrección: lo confirma Lennys.
- De los 20 que pierden dinero, 9 tienen el costo marcado aquí.
- Lista completa con las 3 mejores alternativas: `posibles-costos-cruzados.csv`.

| Nivel | Producto | Costo hoy | Precio hoy | Salió de la fila | Fila que se parece más | Podría ser | Por qué |
|---|---|---|---|---|---|---|---|
| ALTA | Alfombra antirresbalante — azul | 40 | 11 | 123 «ALFOMBRA 180X200» (40) | 302 «ALFOMBRA ANTIRRESBALANTE DE DUCHA  MARYTA» (7) | **7** | la fila 302 «ALFOMBRA ANTIRRESBALANTE DE DUCHA  MARYTA» se parece más (0.76 contra 0.6) y dice 7, y con el costo de hoy se pierde dinero |
| ALTA | Alfombra peluche 40×60 cm — beige | 35 | 8 | 157 «ALFOMBRA 120 X 180 PELUCHE NUEVAS MAGESTIC» (35) | 66 «Alfombra de peluche 40X60» (5) | **5** | la fila usada tiene otra medida (120x180 y el producto 40x60); la fila 66 «Alfombra de peluche 40X60» coincide al 100 % y dice 5; la fila 66 «Alfombra de peluche 40X60» se parece más (0.97 contra 0.27) y dice 5 |
| ALTA | Set de 2 alfombras para baño — rojo | 20 | 13 | 179 «SET DE BAÑO 15 PC CESTICA NUEVO» (20) | 174 «ALFOMBRA DE BAÑO 2 PIEZAS» (8) | **8** | la fila usada tiene otra medida (15pz y el producto 2pz); la fila 174 «ALFOMBRA DE BAÑO 2 PIEZAS» se parece más (0.85 contra 0.23) y dice 8; la fila usada «SET DE BAÑO 15 PC CESTICA NUEVO» parece otro producto (no dice «alfombra») |
| ALTA | Rasuradora portatil recargable | 19,5 | 14 | 76 «Lampara recargable  PORTATIL redonda» (19,5) | 208 «RASURADORA PORTATL DE HOMBRE» (8) | **8** | la fila usada «Lampara recargable  PORTATIL redonda» parece otro producto (no dice «rasuradora») |
| ALTA | Luminoliss | 12 | 12 | 190 «TRATAMIENTO ALISADO LUMINOLISS» (12) | 195 «% LUMINOLIS» (5) | **5** | la fila 195 «% LUMINOLIS» se parece más (0.89 contra 0.5) y dice 5 |
| ALTA | Cesto de basura encimera | 10 | 6 | 89 «CESTO BASURA 10 LTS REDONDO» (10) | 219 «CESTOS DE BASURA ENCIMERA» (3,5) | **3,5** | la fila 219 «CESTOS DE BASURA ENCIMERA» coincide al 100 % y dice 3.5; la fila 219 «CESTOS DE BASURA ENCIMERA» se parece más (1 contra 0.51) y dice 3.5 |
| ALTA | Cortina de baño 180×180 cm — rojo | 10 | 8 | 177 «CORTINA DE BAÑO CON TAPETE DE DUCHA» (10) | 122 «CORTINA DE BANO A-03H» (4,1) | **4,1** | la fila 122 «CORTINA DE BANO A-03H» se parece más (0.78 contra 0.52) y dice 4.1 |
| ALTA | Alfombra de entrada 40×60 cm — verde | 10 | 8 | 175 «ALFOMBRA DE ENTRADA  (45X75) ENSUEÑO» (10) | 82 «ALFOMBRA 40X60 ROMBO» (5) | **5** | la fila usada tiene otra medida (45x75 y el producto 40x60); la fila 82 «ALFOMBRA 40X60 ROMBO» se parece más (0.63 contra 0.27) y dice 5 |
| ALTA | Lámparas recargables con panel solar | 10 | 25 | 77 «lampara recargable con base» (10) | 231 «LAMPARA RECARGABLE CON PANEL SOLAR» (15) | **15** | la fila 231 «LAMPARA RECARGABLE CON PANEL SOLAR» coincide al 100 % y dice 15; la fila 231 «LAMPARA RECARGABLE CON PANEL SOLAR» se parece más (1 contra 0.7) y dice 15 |
| ALTA | Set de utensilios para cocina (5 piezas) | 6 | 8 | 126 «SET POZUELO DE 5 PIEZAS-JAGUAR» (6) | 47 «SET DE UTENCILIOS DE COCINA 5 PZA» (1,68) | **1,68** | la fila usada «SET POZUELO DE 5 PIEZAS-JAGUAR» parece otro producto (no dice «utensilio») |
| ALTA | Cojín decorativo — Diseño 1 — rojo | 5,63 | 11 | 6 «arbolito decorativo» (5,63) | 129 «CORTINERO METAL DECORATIVO 1.20» (5) | — | la fila usada «arbolito decorativo» parece otro producto (no dice «cojin») |
| ALTA | Cojín decorativo — Diseño 1 — gris | 5,63 | 11 | 6 «arbolito decorativo» (5,63) | 129 «CORTINERO METAL DECORATIVO 1.20» (5) | — | la fila usada «arbolito decorativo» parece otro producto (no dice «cojin») |
| ALTA | Cojín decorativo — Diseño 1 — carmelita | 5,63 | 11 | 6 «arbolito decorativo» (5,63) | 129 «CORTINERO METAL DECORATIVO 1.20» (5) | — | la fila usada «arbolito decorativo» parece otro producto (no dice «cojin») |
| ALTA | Cojín decorativo — Diseño 1 — beige | 5,63 | 11 | 6 «arbolito decorativo» (5,63) | 129 «CORTINERO METAL DECORATIVO 1.20» (5) | — | la fila usada «arbolito decorativo» parece otro producto (no dice «cojin») |
| ALTA | Cojín decorativo — Diseño 1 — amarillo | 5,63 | 11 | 6 «arbolito decorativo» (5,63) | 129 «CORTINERO METAL DECORATIVO 1.20» (5) | — | la fila usada «arbolito decorativo» parece otro producto (no dice «cojin») |
| ALTA | Mochila M- 1 | 10,2 | 13 | 105 «TERMO 1 L» (10,2) | 52 «MOCHILAS  BOLSITA» (9) | — | la fila usada «TERMO 1 L» parece otro producto (no dice «mochila») |
| ALTA | Toallas pequeña | 140 | 10 | 138 «BOCINA  PEQUENA» (140) | 87 «LINTERNA LAMPARA LED PEQUENA» (4,5) | — | la fila usada «BOCINA  PEQUENA» parece otro producto (no dice «toalla») |
| ALTA | Zapatera 5 niveles | 23 | 35 | 43 «MUEBLE ZAPATERA DE 10 NIVELES» (23) | 279 «ORGANIZADOR DE 5 NIVELES DE TELA DAYRA» (9,5) | — | la fila usada tiene otra medida (10niv y el producto 5niv) |
| MEDIA | Árbol de navidad (1,50 m) | 3,85 | 40 | 9 «adorno de navidad arbol cartel» (3,85) | 56 «ARBOL DE NAVIDAD PVC 1.50 MTS» (17,85) | **17,85** | la fila 56 «ARBOL DE NAVIDAD PVC 1.50 MTS» se parece más (0.65 contra 0.51) y dice 17.85 |
| MEDIA | Estante esquinero para baño | 18 | 26 | 176 «ESQUINERO DE BAÑO ENSUEÑO» (18) | 44 «ESQUINERO DE BAÑO» (10) | **10** | la fila 44 «ESQUINERO DE BAÑO» se parece más (0.8 contra 0.67) y dice 10 |
