# Pa'llá · prompts para los vehículos 3D (Higgsfield) · 4-nov-2026

**Para qué:** cambiar los dibujos provisionales (`*-lado.svg` y `*-arriba.svg` de esta carpeta) por imágenes 3D
realistas, como las de Uber. Son **10 imágenes como máximo**: 9 en vista 3/4 (para elegir el tipo) + 1 hoja con las 9
vistas desde arriba (para el mapa).

**No se generó nada aquí** (en el VPS no hay Higgsfield y no se gastan créditos sin que lo digas). Se hacen mañana desde el PC.

## Cómo hacerlo (pasos)
1. En Higgsfield, generador de imágenes, el modelo de imagen más realista que tengas (foto de producto). Formato **4:3**,
   la mejor calidad. Para la imagen 10, formato **1:1**.
2. Pega el **bloque común** + el **prompt de cada vehículo** (en inglés: estos modelos entienden mejor el inglés).
3. Genera 4 variantes, elige la que tenga **el mismo ángulo y la misma luz** que la imagen 1 (la primera que elijas
   es la referencia: súbela como «imagen de referencia de estilo» para las siguientes).
4. Quita el fondo (herramienta «remove background» de Higgsfield) → PNG transparente.
5. Exporta a **WebP**: vista 3/4 a 480×280 px (≈ 20–30 KB cada una); vistas de arriba a 80×160 px (≈ 4 KB cada una).
   Así todo junto pesa menos de 300 KB.
6. Pon los archivos con estos nombres en `vehiculos/` (los mismos que los SVG, con `.webp`) y el código solo cambia la extensión.

## Bloque común (va delante de cada prompt 1–9)
```
Hyper-realistic 3D product render of a single vehicle, three-quarter front view from the left (camera at 35 degrees
to the side, slightly above, about 15 degrees down), vehicle facing right, whole vehicle visible and centered, same
scale as a compact car filling 80% of the width. Soft studio light from the upper left, large soft box, gentle
reflections, soft contact shadow on the ground directly under the wheels, no other shadows. Clean neutral light grey
seamless background (#EDEDEA) so the background can be removed. Sober, realistic colors, clean and well kept, no
logos, no text, no license plate numbers, no people, no driver, no passengers. Premium minimalist style like Uber
app vehicle images. Sharp, high detail, 4k.
```

## 1 · Taxi Básico → `taxi-basico.webp`
```
A modern compact 4-door sedan (similar to a recent Asian compact sedan used as a taxi in Havana), pearl white paint,
dark tinted windows, simple black alloy wheels, a small black roof sign with a thin warm yellow (#FFC21A) light strip.
```

## 2 · Taxi Clásico → `taxi-clasico.webp`
```
A 1950s American classic car as used in Havana (an "almendrón", like a 1955 Chevrolet Bel Air 4-door sedan),
restored, two-tone paint: muted petrol teal-blue body (#4F7E86) and cream white roof, chrome bumpers and trim, white
wall tires, rounded fenders and small rear fins. Elegant and clean, not a cartoon.
```

## 3 · Taxi XL → `taxi-xl.webp`
```
A modern 7-seat passenger minivan with sliding side door, graphite dark grey paint (#41454C), tinted windows, black
wheels, small black roof sign with a thin warm yellow (#FFC21A) light strip.
```

## 4 · Triciclo Bici → `tric-bici.webp`
```
A Havana pedal bicycle-taxi (bicitaxi): a bicycle in front pulling a two-seat passenger bench at the back on two
wheels, black steel frame, black padded bench, a light cream canvas canopy roof on thin black poles, thin spoked
bicycle wheels. Simple, sturdy, well kept.
```

## 5 · Triciclo Eléctrico → `tric-electrico.webp`
```
A Chinese-style electric passenger tricycle (tuk-tuk) as used in Havana in 2026: one front wheel, two rear wheels,
open sides, a flat dark graphite roof over the driver and two benches for 4 passengers, white body panels, dark grey
seats, small curved windshield in front, small green lightning detail. Clean, modern, realistic.
```

## 6 · Eléctrico XL → `tric-xl.webp`
```
A longer electric passenger tricycle (6 to 8 seats) as used in Havana: one front wheel, two rear wheels, three rows
of dark grey benches, open sides, a long flat dark graphite roof on thin posts, white body panels, small curved
windshield, small green lightning detail. Same style as a tuk-tuk but longer.
```

## 7 · Carga → `tric-carga.webp`
```
An electric cargo tricycle as used in Havana: small closed driver cab in front (dark graphite) with windshield, one
front wheel and two rear wheels, and a closed brushed aluminum box on the back with vertical ribs. Practical, clean,
sober colors.
```

## 8 · Moto → `moto.webp`
```
A modern electric scooter-motorcycle (step-through, like a premium electric moped), matte graphite black body with
satin silver details, black seat, round LED headlight, small green lightning detail, no top box.
```

## 9 · Mensajero → `mensajero.webp`
```
The same modern electric scooter-motorcycle in matte graphite black, with a square delivery top box mounted behind the
seat. The box is warm yellow (#FFC21A), matte, clean, with a simple black letter "P" on its side and no other text.
```

## 10 · Hoja de vistas desde arriba (para el mapa) → `arriba-hoja.webp`
Formato 1:1. Después se recorta cada vehículo en su archivo (`taxi-basico-arriba.webp`, etc.).
```
A clean sprite sheet of 9 hyper-realistic 3D vehicles seen exactly from directly above (top-down orthographic view,
90 degrees), all pointing up, arranged in a 3 by 3 grid with plenty of empty space between them, all at the same
scale. Row 1: pearl white compact sedan taxi with small yellow roof sign; 1950s American classic sedan in petrol teal
with cream roof and chrome; graphite 7-seat minivan with small yellow roof sign. Row 2: pedal bicycle-taxi with cream
canopy; electric passenger tuk-tuk with dark graphite roof; long electric passenger tuk-tuk with dark graphite roof.
Row 3: electric cargo tricycle with aluminum box; matte graphite electric scooter; the same scooter with a yellow
square top box. Soft light from the upper left, tiny soft shadow under each vehicle, plain light grey background
(#EDEDEA), no text, no people, no logos.
```

## Comprobar antes de usarlas
- Las 9 vistas 3/4: **mismo ángulo, misma luz, misma escala** (pon las 9 juntas y mira que no «salte» ninguna).
- Que no salga ningún texto, marca ni matrícula inventada; ni personas.
- En el mapa se ven a 20×40 px: lo que importa es la forma y el color, no el detalle.
