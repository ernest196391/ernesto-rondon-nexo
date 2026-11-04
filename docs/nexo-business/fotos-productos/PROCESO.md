# Fotos de producto para la web — cómo hacerlo con los ~680 productos

**Estado:** PROPUESTA (2026-10-12). Probado con 12 productos en `piloto/` (ver `piloto/informe.md` y `piloto/hoja-piloto.jpg`). Nada se ha publicado.

**Regla de Ernesto:** un producto solo va a la web cuando sus fotos son buenas.

## Las reglas de una foto buena

1. **Foto principal:** el producto entero, solo, sobre **blanco puro**. Sin texto, precio, teléfono, logo de otra tienda, marca de agua ni collage. Nítida.
2. **Es el mismo producto:** mismo modelo, color y versión. No enseña cosas que no vienen (caja, juego, funda, auriculares).
3. **De 1 a 4 fotos:** la principal y, si hay, otros ángulos limpios (de lado, puertos, detrás, accesorios que sí vienen). Nada de infografías en inglés: su información va al texto de la ficha.
4. **Formato final:** cuadrada 1200×1200, JPG, producto centrado con 8 % de margen. Sin logo de Casa Viva encima (Google y Meta lo rechazan); la marca va en la web y en redes.
5. **Nota de 0 a 10.** Se publica solo si la principal tiene **7 o más** y una persona aprobó la hoja.
6. **Si no hay foto buena:** se busca en internet solo si el producto tiene **marca y modelo**, en la web del fabricante o en tiendas grandes, y se apunta el enlace. Si es **genérico** (sin marca), no se busca: hace falta foto real.

## Los pasos

| Paso | Qué pasa | Quién | Tiempo para 680 |
|---|---|---|---|
| 1. Bajar | El VPS baja las ~2 600 fotos del catálogo (≈160 MB). | Automático | 15 min |
| 2. Medir | Descarta lo diminuto (lado corto < 400 px) y las fotos repetidas. | Automático | 2 min |
| 3. Revisar con IA | Una consulta por producto con **todas sus fotos juntas**, el nombre y la descripción. Devuelve nota y motivo de cada foto, cuál es la principal y si hay que buscar en internet. | Automático (OpenAI `gpt-4.1-mini`) | 15 min |
| 4. Buscar en internet | Solo productos con marca y modelo sin ninguna foto de 7. Claude busca la foto oficial, la baja y se revisa igual que en el paso 3. | Claude Code, en tandas de 20 | ≈5 min por producto; ~4-5 h con varios agentes |
| 5. Arreglar | Cuadrado 1200×1200, fondo blanco puro, centrado, tapar logos de fabricante (AMD, copyright) y un poco de enfoque si se amplió. Avisa si el producto toca el borde (puede estar cortado). | Automático (sharp) | 5 min |
| 6. Aprobar | Hojas de **20 productos** (como `piloto/hoja-piloto.jpg`). Ernesto o Lennys contestan «todo bien» o «mal la 3 y la 15». | **Persona** | ≈3 min por hoja → 35 hojas ≈ 2 h en total |
| 7. Publicar | Las fotos aprobadas van a la ficha en **borrador «[REVISAR]»** (regla D44), con nombre de archivo y texto alternativo con el nombre del producto. | Automático + aprobación de la ficha | — |

**Qué esperar** (según el piloto): ~75 % listos (unos 500 productos); ~25 % bloqueados por falta de foto (unos 170, sobre todo genéricos). Del proveedor sirve solo 1 de cada 3 fotos.

**Productos bloqueados:** se quedan fuera de la web. Por la regla D45, el bot solo escribe al proveedor cuando hay un pedido o una consulta real; en ese momento se le pide «una foto del producto sobre una hoja blanca, con luz de día». Si Ernesto prefiere, puede pedirle a Kevin (Digital Store) de una vez las fotos de la lista.

**Por dónde empezar:** energía (estaciones, paneles), móviles, laptops y electrodomésticos: lo que más se pide.

## Lo que cuesta

- **IA (paso 3):** ≈0,002 USD por producto (≈0,0006 por foto, reducida a 768 px). Todo el catálogo ≈ **2 USD**; con repeticiones y fotos de internet, **menos de 5 USD**. Con la «Batch API» de OpenAI, la mitad. Hace falta saldo en OpenAI (el 12-oct se quedó sin saldo y Ernesto lo recargó).
- **Búsqueda en internet (paso 4):** dentro de la suscripción de Claude; no gasta créditos aparte.
- **Higgsfield u otras IA de imagen:** no hacen falta.
- **Tiempo de Ernesto/Lennys:** ≈2 h de aprobar hojas, repartidas en varios días.

Cálculo de la IA: imagen de 768×768 = 576 trozos de 32 px × 1,62 ≈ 930 tokens; ~4 fotos + instrucciones ≈ 4 400 tokens de entrada (0,40 USD por millón) + ~350 de salida (1,60 USD por millón). Comprobar el precio en la web de OpenAI antes de lanzar.

---

## Para el agente que lo construya

Programas del piloto en `scripts/` (Node + sharp): `descargar.js`, `hoja-auditoria.js`, `bajar-web.js`, `imagenes-de-pagina.js`, `normalizar.js`, `hoja-piloto.js`. Son de piloto (rutas fijas); para el VPS hay que pasarlos a un solo script con cola y reintentos.

**Consulta por producto** (paso 3): `POST /v1/chat/completions`, modelo `gpt-4.1-mini`, `temperature: 0`, fotos reducidas a 768 px de lado largo como `image_url` (`detail: "high"`), numeradas en el mismo orden que el texto.

Mensaje de sistema:

```
Eres el revisor de fotos de producto de una tienda online. Recibes el NOMBRE, la CATEGORÍA y la DESCRIPCIÓN
de un producto y sus fotos numeradas (1..N). Para cada foto decide:
- si muestra ESTE producto (mismo modelo, color y versión que el nombre/descripción),
- si tiene texto, precio, teléfono, logo de tienda, marca de agua o es un collage/infografía,
- si el fondo es blanco liso, si el producto sale entero (no cortado por el borde) y nítido,
- si enseña cosas que la descripción no dice que vienen (caja, juego, funda, auriculares...).
Nota 0-10: 9-10 foto de catálogo perfecta; 7-8 buena con un fallo menor que se arregla recortando;
5-6 se entiende pero no sirve de principal; 0-4 no sirve. Producto equivocado = 0.
uso: "principal" (solo una, la mejor con nota >= 7), "galeria" (nota >= 7, ángulo distinto, máx. 3),
"descartar" (resto). Si ninguna llega a 7, necesita_web = true salvo que el producto sea genérico sin marca.
Responde solo con el JSON pedido. Motivos en español sencillo, máximo 15 palabras.
```

Mensaje de usuario: `NOMBRE: … / CATEGORÍA: … / DESCRIPCIÓN: (primeros 600 caracteres) / FOTOS: N` + las imágenes.

`response_format` (JSON Schema estricto):

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "auditoria_fotos",
    "strict": true,
    "schema": {
      "type": "object",
      "additionalProperties": false,
      "required": ["fotos", "foto_principal", "necesita_web", "es_generico", "marca", "modelo", "busqueda", "avisos"],
      "properties": {
        "fotos": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["n", "es_el_producto", "color_ok", "fondo", "texto_encima", "logo_o_marca_de_agua", "collage", "cortado", "borrosa", "extras_no_incluidos", "nota", "uso", "motivo"],
            "properties": {
              "n": { "type": "integer" },
              "es_el_producto": { "type": "string", "enum": ["si", "no", "dudoso"] },
              "color_ok": { "type": "string", "enum": ["si", "no", "no_se_sabe"] },
              "fondo": { "type": "string", "enum": ["blanco", "claro_liso", "color", "negro", "escena"] },
              "texto_encima": { "type": "boolean" },
              "logo_o_marca_de_agua": { "type": "boolean" },
              "collage": { "type": "boolean" },
              "cortado": { "type": "boolean" },
              "borrosa": { "type": "boolean" },
              "extras_no_incluidos": { "type": "boolean" },
              "nota": { "type": "integer" },
              "uso": { "type": "string", "enum": ["principal", "galeria", "descartar"] },
              "motivo": { "type": "string" }
            }
          }
        },
        "foto_principal": { "type": ["integer", "null"] },
        "necesita_web": { "type": "boolean" },
        "es_generico": { "type": "boolean" },
        "marca": { "type": ["string", "null"] },
        "modelo": { "type": ["string", "null"] },
        "busqueda": { "type": ["string", "null"] },
        "avisos": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

Reglas de código que mandan sobre la IA: lado corto < 400 px → descartar sin preguntar; la nota se limita a 0-10 en el código; si al normalizar el producto toca el borde (puede estar cortado) o se amplía más de 1,8×, sale marcado en ámbar en la hoja de aprobación; `avisos` (otra versión, extras, producto equivocado) salen en rojo. Guardar el JSON de cada producto junto a sus fotos para poder repasarlo.
