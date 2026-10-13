# VivaBot — medición y recorte del prompt (12-oct-2026)

**Para qué:** cada respuesta «smart» del bot (gpt-4.1: gestoras, equipo y Lennys) mandaba a OpenAI unos
14.000–16.000 tokens. Con ~125 llamadas smart al día eran **~2,7 USD/día**. Ernesto aprobó recortarlo
(«sí, recorta el bot») sin perder calidad ni las reglas de no inventar.

**Estado:** hecho y probado en una copia aparte en el VPS (`/root/prompt-lab/`, sin tocar `/root/vivabot` ni
reiniciar). Commit local de VivaBot `ba00ea3` (rama `main`). **Falta desplegar** (ver al final).

## Cómo se midió

- `scripts/medir-prompt.mjs` (nuevo) arma exactamente lo que el bot mandaría a la IA para un mensaje real
  (mismo camino que `handleClient`: catálogo, conocimiento, bolsa, tarifas, Curru, historial de ese momento) y
  cuenta los tokens de cada bloque. No llama a la IA ni escribe nada.
- Se comprobó que la medición es fiel: con el código de antes, los 32 prompts salieron **idénticos byte a byte**
  a los que arma el bot en producción (`--igual-que /root/vivabot`).
- Estimación: letras ÷ 3,6. Con lo que contó OpenAI de verdad en la comparación salió 3,59–3,65 letras por token:
  la estimación es buena.
- Muestra: 32 mensajes reales de las últimas 48 h (24 smart: gestoras, Lennys, Nana, Zaymi, un mensajero; 8 de
  clientes). Sin contactos privados de Ernesto (`ignorar` / `personal`).

## Resultado (tokens de entrada por llamada)

### Llamadas smart (gpt-4.1): gestoras, equipo y admin (n=24)

| bloque | antes mediana | antes p90 | ahora mediana | ahora p90 |
|---|---:|---:|---:|---:|
| **TOTAL** | **14 832** | **16 092** | **8 389** | **8 969** |
| parte fija (la que OpenAI cachea) | 10 187 | 10 188 | 6 006 | 6 007 |
| parte variable (cada mensaje) | 4 647 | 5 908 | 2 383 | 3 000 |
| knowledge/*.md | 2 697 | 2 697 | 551 | 551 |
| reglas del sistema | 5 231 | 5 231 | 3 095 | 3 333 |
| perfil del negocio | 401 | 401 | 401 | 401 |
| programa de gestoras (solo gestoras) | 629 | 630 | 730 | 731 |
| aprendizajes | 998 | 998 | 998 | 998 |
| tasa del día | 231 | 231 | 231 | 231 |
| contacto (hora, ficha, notas) | 240 | 743 | 172 | 247 |
| conocimiento (filas) | 1 696 | 2 008 | 838 | 1 159 |
| productos | 1 946 | 2 260 | 523 | 643 |
| lista de productos | 0 | 309 | 0 | 309 |
| bajo pedido | 0 | 198 | 0 | 443 |
| pedidos | 6 | 6 | 0 | 0 |
| mensajería | 0 | 95 | 0 | 95 |
| Curru | 141 | 491 | 110 | 245 |
| historial | 857 | 1 386 | 521 | 758 |
| preguntas abiertas | 0 | 0 | 0 | 0 |
| mensaje nuevo | 34 | 103 | 34 | 103 |

### Todas (con 8 de clientes, gpt-4.1-mini) (n=32)

| bloque | antes mediana | antes p90 | ahora mediana | ahora p90 |
|---|---:|---:|---:|---:|
| **TOTAL** | **14 237** | **16 070** | **8 195** | **8 909** |
| parte fija | 10 184 | 10 188 | 6 002 | 6 007 |
| parte variable | 4 530 | 5 882 | 2 240 | 2 981 |

Fotos: cada foto que manda la persona suma ~765 tokens más (no cambia con esto).
«Bajo pedido» sube en el p90 porque sus reglas ahora viajan con su bloque (antes estaban siempre, en las reglas).

Con OpenAI de verdad (27 pares): smart **14 384 → 8 134** tokens de mediana (p90 15 777 → 8 788).

## Qué se recortó (las reglas duras siguen todas)

1. **Reglas** (5 231 → ~3 100): las mismas en menos palabras. Siguen: no inventar datos, precios ni existencias;
   no prometer lo que no puede hacer («te lo aparto», «queda marcado», «ya lo corregí»); gestora vs cliente
   (cantidades, datos de pago solo a gestoras); bajo pedido; nunca nombrar proveedores; corto y directo; CIERRE sin
   «¿algo más?»; género neutro; preguntar a la tienda (`consultar_tienda`); escalar. Lo de Lennys solo va cuando
   escribe Lennys; lo de gestoras solo a gestoras; las reglas de BAJO PEDIDO solo cuando hay algo de la bolsa.
2. **knowledge/*.md** (2 697 → 551): a la tienda solo le va la parte «Casa Viva» de `02-negocios.md`. El perfil
   de Ernesto y el método de ventas los sigue usando `lines.js` (paneles, mensajería, NEXO).
3. **Conocimiento**: como mucho 8 filas (antes 15 + 3 fijas) y sin repetidas (había dos preguntas distintas con
   la misma respuesta).
4. **Productos**: un renglón por producto (id, precio, existencias, fotos, enlace; descripción solo en los 3 más
   parecidos), 10 a gestoras y 6 al resto (antes 16 y 8). La búsqueda ahora da más peso a lo que pide en este
   mensaje que a lo que salió en el historial (Dany preguntó por el aceite de batana y salían antes paraguas).
   A un cliente, las existencias ya van como «disponible / últimas unidades / agotado» (sin números).
5. **Historial**: 12 mensajes (antes hasta 19); los 4 últimos casi enteros y los vales sin sus renglones fijos
   (dirección de recogida, enlace, «escribe entregado»); lo más viejo, recortado.
6. **Notas del CRM** sin repetidas (Dany tenía 17 casi iguales, ~750 tokens).
7. **Curru**: su respuesta y productos con id, precio, existencias y colores; sin imágenes ni campos internos.
8. **Bloques vacíos fuera** («PEDIDOS: (ninguno)», conocimiento vacío).
9. **Caché de OpenAI**: lo fijo va primero y en el mismo orden para todos (reglas → perfil → aprendizajes → tasa),
   y después lo de cada papel. Antes el bloque de gestoras iba en medio y partía la caché en dos.
10. **Modelo pequeño** para un saludo o un «ok» suelto sin nada pendiente (en 48 h serían ~6 de 317 mensajes del
    equipo y gestoras: ahorro pequeño, sin riesgo).

## Comparación de calidad (viejo vs nuevo, mismo modelo, mismos mensajes)

`scripts/comparar-prompt.mjs` (nuevo) manda el prompt viejo y el nuevo a OpenAI con 27 mensajes reales y guarda
las dos decisiones lado a lado: `/root/archivos/prompt-comparacion/2026-10-12.json` y `.md` (más
`2026-10-12-repetidos-nuevo.*` y `2026-10-12-final-nuevo.*`, la versión final). Gasto total: **~1,12 USD**.

**Resultado final: 6 mejores, 21 iguales, 0 peores.**

- Mejores: «¿Qué tienes de ferretería?» (antes inventaba «tornillos, clavos»; ahora da el producto real con foto);
  Sabrina con todos los datos (ahora resume y pasa el PEDIDO como dicen las reglas); aceite de batana (pregunta a la
  tienda en vez de afirmar un «desfase»); módem bajo pedido (da la parte de la gestora y pide los datos del
  cliente); Oliuska (ya no inventa que «los reportes demoran»); pedido #2936 sin recoger (lo escala).
- En la primera vuelta salieron **4 peores**, se arreglaron y se repitieron:
  1. Ely «no me sale en el vale cuánto es»: el vale estaba en medio de un mensaje largo y se cortaba → ahora los
     4 últimos mensajes van casi enteros y el vale sin relleno; ya calcula 8 635 CUP + 1 600 de mensajería.
  2. Yudi «mándame las otras opciones»: Curru sin id ni colores → la IA se inventaba ids de fotos. Arreglado.
  3. Oliuska: dijo «no aparece ningún pedido tuyo registrado» → regla nueva: tú no ves todos los pedidos, nunca
     digas que uno no existe.
  4. Lennys sobre la comisión de Joyce: «queda guardado a nombre de Joyce» → añadido a las frases prohibidas, y
     regla nueva: no adivinar por qué pasó algo (comisión en 0, color que no sale…), decirlo y escalar.
- Una de 56 respuestas nuevas salió con JSON roto (en producción eso da «en un momento te atendemos» + aviso); al
  repetirla 2 veces salió bien. Por si acaso, el formato del JSON volvió a ir en varias líneas como antes.

**Fallos que ya tenía el bot antes y siguen** (no los trae este cambio):
- A veces promete «te aviso» / «mañana lo reviso y te confirmo» (con prompt viejo y nuevo). La regla está más clara,
  pero con temperatura normal todavía se escapa alguno.
- Una nota de voz larga se toma como «lista de productos» (Sabrina: «que es blanca», «bueno», «mejor» buscados
  como productos) y mete productos sin sentido (`parseProductList`). Conviene arreglarlo aparte.
- Horario: el perfil y `02-negocios.md` dicen 9:00–17:00 y las reglas del bot 10:00–17:00.

## Gasto estimado

- Antes (log real de hoy): 14 164 de entrada (5 935 en caché) + 237 de salida ≈ **0,021 USD por llamada smart** →
  ~2,7 USD/día con ~125 llamadas.
- Ahora: ~8 400 de entrada, de los que ~6 000 son fijos (en la prueba se cacheaban ~5 000) → **~0,011–0,013 USD**
  → **~1,4–1,7 USD/día**. **Ahorro ≈ 1–1,25 USD/día (~40–50 %).** Los clientes (modelo pequeño) también bajan a
  la mitad, pero ya costaban poco.
- La meta era 6 000 de mediana; quedó en ~8 400. Lo que queda fijo es sobre todo **datos**, no reglas:
  aprendizajes (998, con repetidos: BizneCubano sale 4 veces y la comisión del 10 % 3 veces entre perfil, programa
  de gestoras y aprendizajes), programa de gestoras (730) y la parte Casa Viva del .md (551, casi igual al perfil).
  Limpiar esos repetidos en la base (`crm_settings.aprendizajes`, `crm_businesses`) bajaría otros ~600–1 000, pero
  es decisión de Ernesto (son datos que escribe el supervisor). Esa parte, además, se cachea (paga el 25 %).

## Para desplegar

1. VivaBot local (`C:\Users\Ernesto\vivabot`, rama `main`): va **2 commits por delante** de `origin/main`:
   `36cc8e0` (reparto, de otra sesión) y `ba00ea3` (este). `npm run check` sale 0. `git fetch` + rebase → push.
2. VPS: `cd /root/vivabot && git fetch && git merge --ff-only origin/main && cv reiniciar` (solo con chats
   tranquilos), luego `cv estado` y `pm2 logs vivabot --lines 30 --nostream`.
3. Después, mirar en los logs las líneas `[ia] gpt-4.1 smart entrada=…`: deberían rondar 7 500–9 000 (antes
   14 000–16 000) y la caché ~5 000.
4. Para medir de nuevo: `node scripts/medir-prompt.mjs <teléfono> "<texto>"` o `--ids 1,2,3` (solo lectura).
5. La carpeta de prueba `/root/prompt-lab/` (copias `antes/` y `despues/`) se puede borrar cuando esté desplegado.
