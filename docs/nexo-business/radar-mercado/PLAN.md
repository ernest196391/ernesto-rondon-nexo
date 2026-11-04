# Radar de mercado: plan completo (27-oct-2026, noche)

**Viene de:** `ANALISIS-2026-10-27.md` · **Decisión:** D119 · **Estado:** plan, SIN construir.

---

## 1. Qué estás construyendo, en palabras sencillas

Un **vigilante del mercado cubano que trabaja para ti**. Tiene 4 partes:

| Parte | Qué hace | ¿Existe ya? |
|---|---|---|
| 👂 **Oído** | Lee los grupos de mayoristas, los canales (Todo en Uno, Mexi Plus, noticias) y las noticias de internet. | Grupos: **sí** (16.160 mensajes en 14 días). Canales: **no**; la librería del bot lo permite, pero hoy el bot los salta a propósito. |
| 📒 **Libreta** | Apunta cada precio: qué, cuánto, en qué moneda, quién lo vende, dónde y cuándo. | No. Hoy son mensajes sueltos. |
| 🧠 **Cerebro** | Compara con ayer y con la semana pasada: qué sube, qué baja, quién tiene lo más barato, qué piden y no hay. Hace predicciones y las apunta para ver si acierta. | No. |
| 🪟 **Ventana** | Una página en tu móvil con buscador, y un correo a las 8:00, 14:00 y 21:00. | No. |

Lo usas **tú solo** (D119). No se publica nada y no se manda nada a nadie más.

---

## 2. Qué va a vigilar

| Mercado | Ejemplos | De dónde sale |
|---|---|---|
| 💱 **Monedas** | USDT, Zelle, MLC, Clásica, prepago, euro, peso mexicano (MXN) | Grupos de cambio (ya llegan: «Compro pesos mexicanos a 52 CUP», «Zelle 0,93 USDT») + canal o web de elTOQUE |
| 📱 **Saldo móvil** | Recargas, saldo por USDT o CUP, promociones de Cubacel | Grupos (ya llegan: «5K de saldo por 27,5 USDT») + promociones de ETECSA |
| ⛽ **Combustible** | Gasolina, diésel, gas licuado | **Canal Todo en Uno** (hoy NO llega) + noticias |
| ⚡ **Energía** | Paneles, baterías, inversores «todo en uno», EcoFlow, plantas | Sergio, LJH y otros (ya llegan: «Inversor MUST 6 kW con 15 kWh, 3.290–3.850 USD») |
| 🏠 **Hogar** | Neveras, splits, lavadoras, TV, artículos de casa | Mayoristas (ya llegan: Nilzer, EKO, neveras con transporte) |
| 🍗 **Alimentos** | Pollo, aceite, arroz, combos | Grupos y canales de mayoristas como **Mexi Plus** (hoy NO llega) |
| 📰 **Noticias** | Apagones, combustible, aduana, tasa, EE. UU. y Cuba, petróleo | Canales de noticias + internet (CiberCuba, 14ymedio, Cubadebate, elTOQUE) |
| 🙋 **Lo que te piden** | «¿Hay paneles?», «busco cafetera» | Tus chats con gestoras y clientes (ya están guardados) |

---

## 3. Lo que me tienes que dar

1. **Los enlaces de los canales** que quieres vigilar: Todo en Uno, Mexi Plus y los de noticias. En WhatsApp: abre el canal → los 3 puntos → «Compartir canal» → «Copiar enlace», y pégamelos aquí.
2. **Los nombres de los grupos de almacenes y mayoristas** que más te importan, si alguno no está ya entre los 92.
3. **Tus 10–20 artículos estrella** (por ejemplo: panel de 550 W, batería de 5 kWh, nevera de 7 pies, saldo de 5K, gasolina especial). Si no me los das, saco yo la lista de lo que más se pide.

---

## 4. Lo que vas a gastar

| Concepto | Al mes | Nota |
|---|---|---|
| Servidor (VPS) | **0 extra** | Ya lo pagas; el radar corre en el mismo. |
| Base de datos (Supabase) | **0 extra** | Unos 15 MB al mes: cabe de sobra. |
| Noticias por internet | **0** | Gratis (RSS). La tasa de elTOQUE tiene una API con clave; si no la dan, se lee de su canal. |
| IA que lee las ofertas | **~3–6 USD** | Modelo barato; primero un filtro por palabras, y la IA solo lee las ofertas con precio. |
| IA que escribe los resúmenes | **~3–6 USD** | Uno completo a las 21:00 y dos cortos a las 8:00 y a las 14:00. |
| **Total** | **~6–12 USD** | **Tope: 15 USD** (D119). Si se acerca, te llega un aviso en el correo de gastos de las 21:00 y se baja a 1 resumen al día. |
| Tu tiempo | ~10 min hoy | Pasarme los enlaces y la lista. |

Son cálculos aproximados. Se miden de verdad con `cv gastos` (etiqueta «radar») desde el primer día.

---

## 5. El riesgo de usar tu número, y cómo lo cuidamos

Elegiste tu número de siempre. Es posible, con estas reglas fijas:
- **Solo leer.** El radar nunca escribe, nunca reacciona y nunca reenvía.
- **Los canales se leen 3 veces al día** (pidiendo los últimos mensajes), no a cada rato.
- **Sin entrar en grupos nuevos de golpe:** como mucho 2 al día, y siempre los entras tú desde el teléfono.
- **Si WhatsApp vuelve a restringir el número, el radar se apaga solo** y te lo digo. Ahí sí pasamos a un número aparte.

---

## 6. Por fases

| Fase | Qué tendrás | Tiempo |
|---|---|---|
| **1** | Correo de las 21:00: tasas (USDT, Zelle, MLC, Clásica, MXN), saldo, energía y hogar, y los «busco» del día, con lo que ya llega. | 1–2 días |
| **2** | Canales (Todo en Uno, Mexi Plus, noticias) + gasolina + noticias de internet. Correos de las 8:00 y las 14:00. | 3–4 días |
| **3** | Diseño de la página (te lo enseño antes de construirla) y después la página con buscador, gráficas y «quién lo tiene más barato». | ~1 semana |
| **4** | Predicciones con marcador de aciertos (después de 30 días de datos) y alertas («avísame si el inversor MUST baja de 3.200»). | Continuo |

**Para recordar:**
- **Remesas:** la tasa sirve para cotizar en Cuyana y Curuguay; comprar y vender USDT o Zelle con desconocidos no (riesgo de estafa y legal, D14). Nada de «cuentas IBAN».
- **Predicciones:** son análisis para tu negocio, no consejo financiero.
