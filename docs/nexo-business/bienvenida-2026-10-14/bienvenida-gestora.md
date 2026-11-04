# Bienvenida de gestora — propuesta (14-oct-2026)

Decisión de Ernesto (14-oct): un mensaje de bienvenida **organizado y con intención**: que la persona sienta que entra a algo bueno, sepa qué gana y qué hacer primero.

Hoy lo arma `welcomeText()` en `C:UsersErnestoivabotsrcgestoras.js` (líneas 57–70). **No se ha tocado el repo**: aquí está el texto exacto y el código para que otro agente lo cambie.

## Qué comprobé antes de escribirlo

| Dato | De dónde | Resultado |
|---|---|---|
| Enlace personal | Core `CVD_Bot_Bridge::partner_welcome()` | `https://casaviva.company/tienda/?ref=CODIGO` |
| Enlace de acceso | Core `CVD_Registration::create_secure_access_link()` | vale **7 días** y **sirve una sola vez** (el token se borra al usarlo) |
| Pestaña Aprende | Core `class-cvd-gestora-app.php` + `assets/gestora-app.js` | `https://casaviva.company/area-gestoras/#aprende` (la app lee el `#` al cargar) |
| Tutoriales públicos | curl | `https://casaviva.company/tutoriales/` responde 200 y tiene «Tu primera venta, paso a paso» |
| Comisión | Core `class-cvd-commissions.php` | 10 % del precio Casa Viva o comisión fija del producto **+ todo lo que la gestora sube de precio** (`margin_amount`) |
| Cobro | Core `class-cvd-aprende.php` (Dudas rápidas) | se aprueba al entregar; la cobra en USD o CUP, efectivo o transferencia |
| Comandos | VivaBot `onboarding-rules.js` `isBotCommand` | *mis pedidos*, *¿cómo va el #N?*, *mi comisión*, *mi enlace*, *mi acceso* |

**Ojo con el enlace de Aprende:** solo abre la pestaña si la persona ya tiene la sesión abierta. Sin sesión, la web la manda a `/mi-cuenta/?acceso=gestoras` y se pierde el `#aprende` (al entrar cae en *Inicio*, donde hay un botón «Aprende · Ver»). Por eso en el mensaje el enlace del panel va **antes** que el de Aprende: primero entra, luego toca Aprende.

## Versión A (corta, ~13 líneas, 1 pantalla)

Ejemplo con «Ana», etiqueta `genero:femenino`:

```text
🎉 *¡Bienvenida a Casa Viva, Ana!*
Desde hoy eres *gestora*: compartes tu enlace y ganas en cada venta, el *10 %* o la comisión fija del producto. Si subes tu precio, lo que subas también es tuyo.

*Tu enlace para vender:*
https://casaviva.company/tienda/?ref=TUCODIGO

*Tu panel*, sin contraseña (vale 7 días y sirve una vez; no lo compartas):
https://casaviva.company/?cvd_gestora_access=Xy7…&cvd_user=123

👉 *Tu primer paso hoy:* mira el video *«Tu primera venta»* en *Aprende* y manda tu enlace a *3 personas*.
https://casaviva.company/area-gestoras/#aprende

Cuando quieras, escríbeme aquí *mis pedidos*, *mi comisión* o *mi enlace* 💛
```

## Versión B (completa, ~29 líneas, pantalla y media / dos)

```text
🎉 *¡Bienvenida a Casa Viva, Ana!*
Desde hoy eres *gestora*: tú compartes tu enlace, la tienda prepara el pedido y un mensajero lo lleva.

*Lo que ganas*
• El *10 %* de cada venta, o la comisión fija que tenga el producto
• Si subes tu precio, lo que subas también es tuyo
• Se aprueba cuando tu cliente recibe el pedido, y la cobras en CUP o USD, en efectivo o por transferencia

*Tu enlace para vender* (todo lo que compren por aquí queda a tu nombre):
https://casaviva.company/tienda/?ref=TUCODIGO

*Tu panel*, sin contraseña (vale 7 días y sirve una vez; no lo compartas):
https://casaviva.company/?cvd_gestora_access=Xy7…&cvd_user=123

*Tus tutoriales*, en la pestaña *Aprende* de tu panel:
https://casaviva.company/area-gestoras/#aprende
Y para enseñárselos a quien quieras: https://casaviva.company/tutoriales/

👉 *Tu primer paso (hoy):*
1. Mira el video *«Tu primera venta»*
2. Manda tu enlace a *3 personas* que conozcas

*Aquí, en este chat, me puedes escribir:*
• *mis pedidos* → cómo van tus ventas
• *¿cómo va el #2680?* → un pedido en concreto
• *mi comisión* → lo que llevas ganado
• *mi enlace* o *mi acceso* → si los pierdes

Estoy aquí para lo que necesites 💛
```

### Cómo cambia según el género (las dos versiones)

- `genero:femenino` → «🎉 *¡Bienvenida a Casa Viva, Ana!*» y «Desde hoy eres *gestora*»
- `genero:masculino` → «🎉 *¡Bienvenido a Casa Viva, Ana!*» y «Desde hoy eres *gestor*»
- sin etiqueta (nunca se adivina por el nombre) →

```text
🎉 *¡Hola, Ana! Qué alegría tenerte en Casa Viva.*
Desde hoy vendes con *Casa Viva*: tú compartes tu enlace, la tienda prepara el pedido y un mensajero lo lleva.
```

- Sin enlace personal (cuenta sin código): se quita ese bloque.
- Sin enlace de acceso (cuenta de administración): «*Tu panel:* casaviva.company/area-gestoras/ (si te pide entrar, escríbeme *mi acceso*)».
- Nombre: solo el primero («Ana Pérez» → «Ana»).

Reglas que cumple: negritas con `*`, viñetas, **3 emojis** como mucho (🎉 👉 💛), sin «baratísimo» ni «corre», tono cálido.

## Código propuesto para `welcomeText()`

Sustituye la función entera (líneas 57–70 de `src/gestoras.js`). **La parte del mensajero no cambia** (es la misma línea de hoy). Elegir versión con `WELCOME_VERSION`. No hacen falta importaciones nuevas (`gestorWord` ya se importa).

```js
// Bienvenida de gestora (14-oct, Ernesto): organizada y con intención — qué gana, sus enlaces, su primer paso y lo
// que puede escribirme. Como mucho 3 emojis. Género solo por la etiqueta (gestorWord); sin etiqueta, sin la palabra.
// WELCOME_VERSION: 'A' (corta) | 'B' (completa).
const WELCOME_VERSION = 'B';
const APRENDE_URL = 'https://casaviva.company/area-gestoras/#aprende';
const TUTORIALES_URL = 'https://casaviva.company/tutoriales/';

async function welcomeText(p) {
  let w = {};
  try { w = await core(`/bot/partners/${p.id}/welcome`, { by: 'bot' }); } catch (e) { console.error('[gestoras] bienvenida', e.message); }
  const g = await genderOfPhone(ctx.business.id, p.phone).catch(() => '');
  const access = w.accessLink ? `\n\n🔑 Entra a tu panel sin contraseña con este enlace (válido 7 días, no lo compartas):\n${w.accessLink}` : `\n\n🔑 Tu panel: ${w.panel || 'casaviva.company'}`;
  if (p.kind === 'mensajero') {
    const hi = g === 'masculino' ? '¡ya eres *mensajero de Casa Viva*!' : g === 'femenino' ? '¡ya eres *mensajera de Casa Viva*!' : '¡ya formas parte de la *mensajería de Casa Viva*!';
    return `🎉 ${p.name}, ${hi}${access}\n\n*Cómo funciona:*\n1. Las carreras salen en el grupo de mensajeros: el primero que escribe solo *Yo* se la lleva (si hay varias: *Yo #número*)\n2. Te mando el vale por aquí (con fotos): me respondes solo la hora a la que vas\n3. Recoges en la tienda (Conill A esq. 45 #864, Nuevo Vedado) antes de las 5:00 p. m.; la dependienta marca *Entregado al mensajero*\n4. Al entregar escribes *entregado* (si cobraste otra cantidad: *entregado 15 usd*). La mensajería es tuya; el dinero de los productos se lleva a la tienda antes de las 4:00 p. m.\n\n¿Dudas? Escríbeme aquí mismo 💛`;
  }
  // ---- gestora / gestor ----
  const n = String(p.name || '').trim().split(/\s+/)[0] || '';
  const coma = n ? `, ${n}` : '';
  const hi = g === 'femenino' ? `🎉 *¡Bienvenida a Casa Viva${coma}!*` : g === 'masculino' ? `🎉 *¡Bienvenido a Casa Viva${coma}!*` : `🎉 *¡Hola${coma}! Qué alegría tenerte en Casa Viva.*`;
  const eres = g ? `Desde hoy eres *${gestorWord(g)}*` : 'Desde hoy vendes con *Casa Viva*';
  const panel = w.accessLink
    ? `*Tu panel*, sin contraseña (vale 7 días y sirve una vez; no lo compartas):\n${w.accessLink}`
    : `*Tu panel:* ${w.panel || 'casaviva.company/area-gestoras/'} (si te pide entrar, escríbeme *mi acceso*)`;

  if (WELCOME_VERSION === 'A') {
    return [
      `${hi}\n${eres}: compartes tu enlace y ganas en cada venta, el *10 %* o la comisión fija del producto. Si subes tu precio, lo que subas también es tuyo.`,
      w.link ? `*Tu enlace para vender:*\n${w.link}` : '',
      panel,
      `👉 *Tu primer paso hoy:* mira el video *«Tu primera venta»* en *Aprende* y manda tu enlace a *3 personas*.\n${APRENDE_URL}`,
      `Cuando quieras, escríbeme aquí *mis pedidos*, *mi comisión* o *mi enlace* 💛`,
    ].filter(Boolean).join('\n\n');
  }
  return [
    `${hi}\n${eres}: tú compartes tu enlace, la tienda prepara el pedido y un mensajero lo lleva.`,
    `*Lo que ganas*\n• El *10 %* de cada venta, o la comisión fija que tenga el producto\n• Si subes tu precio, lo que subas también es tuyo\n• Se aprueba cuando tu cliente recibe el pedido, y la cobras en CUP o USD, en efectivo o por transferencia`,
    w.link ? `*Tu enlace para vender* (todo lo que compren por aquí queda a tu nombre):\n${w.link}` : '',
    panel,
    `*Tus tutoriales*, en la pestaña *Aprende* de tu panel:\n${APRENDE_URL}\nY para enseñárselos a quien quieras: ${TUTORIALES_URL}`,
    `👉 *Tu primer paso (hoy):*\n1. Mira el video *«Tu primera venta»*\n2. Manda tu enlace a *3 personas* que conozcas`,
    `*Aquí, en este chat, me puedes escribir:*\n• *mis pedidos* → cómo van tus ventas\n• *¿cómo va el #2680?* → un pedido en concreto\n• *mi comisión* → lo que llevas ganado\n• *mi enlace* o *mi acceso* → si los pierdes`,
    `Estoy aquí para lo que necesites 💛`,
  ].filter(Boolean).join('\n\n');
}
```

Lo probé fuera del repo con `core` y `genderOfPhone` simulados (script en el scratchpad): sale exactamente el texto de arriba, con 3 emojis en las 6 combinaciones (A/B × femenino/masculino/sin etiqueta), y el texto del mensajero sale igual que hoy.

### Para quien lo programe

1. `npm run check` en VivaBot. Si algún test compara el texto viejo de la bienvenida (`¡ya eres *gestora de Casa Viva*!`), actualizarlo.
2. Probar con `onboarding=prueba` (todo va a Ernesto) antes de dejarlo para todas.
3. **Detalle del paso a paso (`src/onboarding-rules.js`, paso `bienvenida-voz`):** su acción final dice «Para empezar, escribe *mi acceso*». Con la nueva bienvenida ya lleva el enlace de acceso, así que sería mejor «Para empezar, entra con el enlace de tu panel y mira *Tu primera venta* en Aprende». No está roto; solo repite.
4. **Idea opcional (sin probar):** añadir `#aprende` al final del enlace de acceso haría que, al tocarlo, entre y caiga directamente en Aprende (el navegador conserva el `#` tras la redirección). No se puede usar el enlace de acceso dos veces, porque sirve una sola vez.

## Mensajero

No cambia. Revisado: no hay nada roto. Dos detalles menores por si Ernesto quiere tocarlo otro día:
- La pestaña Aprende del mensajero existe (`https://casaviva.company/area-mensajeros/#aprende`) y la bienvenida no la menciona.
- La bienvenida dice escribir *entregado*; Aprende dice *entregado #número*. Las dos cosas funcionan.
