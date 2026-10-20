# Tasa del día automática (desde el 21-oct-2026)

Regla de Ernesto (20-oct):

- **El toque** = tasa informal del dólar que publica elToque.
- **Efectivo CUP** (tasa de la tienda) = el toque **+ 10**.
- **Transferencia CUP** = efectivo **× 1,20** (redondeado).

Ejemplo: el toque 805 → efectivo **815 CUP** → transferencia **978 CUP** por cada dólar.

## Cómo funciona cada día

1. **8:50 (hora de Cuba):** el VPS pregunta a elToque el dólar.
2. Calcula efectivo y transferencia.
3. Lo pone en la **web** (Core) y la **caja** lo coge de ahí.
4. Les manda un mensaje **privado** a Ernesto y a Lennys con:
   - de dónde salió,
   - efectivo y transferencia,
   - «para cambiarla escribe: tasa 820».
5. **9:00:** el mensaje de siempre al grupo General ya dice
   «Efectivo X CUP · Transferencia Y CUP por USD». No sale ningún mensaje de más al grupo.

### Si elToque falla

- Si Maryta ya mandó «FORMAS DE PAGO Y SUS CAMBIOS» hoy → se usa su número (ya es el de efectivo).
- Si no → se queda la de **ayer**, y el mensaje de las 9:00 dice «sale en cuanto la mande la tienda».
- En los dos casos, el aviso privado dice claro: **«SIN elToque»**.

### Si Maryta manda la tasa después

- La web se queda con la de Maryta (es la más nueva).
- Si se aleja **más de 5 CUP** de la calculada, a Ernesto le llega un aviso.

## Cómo la cambia Lennys (o Ernesto)

Por WhatsApp al número de Casa Viva, escribe:

```
tasa 820
```

- 820 = el número de **efectivo**.
- El bot contesta con efectivo y transferencia, y la cambia en la web y la caja.
- Escribir solo `tasa` = ver la de hoy sin cambiarla.
- Solo funciona desde el número de Ernesto y el de Lennys.
- Si Lennys la cambia, a Ernesto le llega un aviso.
- También se puede cambiar en el panel: **Ajustes → Tasas** (campo CUP = efectivo).

## Lo que tiene que hacer Ernesto: pedir el token de elToque

Sin token, elToque no responde y el sistema usa la de Maryta o la de ayer.

1. Abre el formulario oficial: **https://tasas-token.eltoque.com/**
   (explicación de elToque: https://eltoque.com/eltoque-abre-acceso-a-su-api-de-las-tasas-de-cambio)
2. Rellénalo **tú** con tus datos (nombre, correo, para qué lo usas: «tienda en La Habana, mostrar la tasa del día»).
3. Te llega el token por correo (un texto largo que empieza por `eyJ…`).
4. Ponlo en el VPS. Pásaselo a Claude o hazlo tú:
   ```
   ssh -i ~/.ssh/vivabot_vps root@179.236.242.212
   nano /root/vivabot/.env
   ```
   Añade una línea al final:
   ```
   ELTOQUE_TOKEN=eyJ...tu token...
   ```
   Guarda (Ctrl+O, Enter, Ctrl+X).
5. Prueba sin tocar nada:
   ```
   cd /root/vivabot && node scripts/tasa-diaria.mjs --prueba
   ```
   Tiene que decir `toque=…` con un número.
6. Reinicia el bot con los chats tranquilos: `cv tranquilo` y luego `pm2 restart vivabot`.
   (El trabajo de las 8:50 lee el `.env` solo; el reinicio es para el bot.)

## Cómo pararlo

- **Pausa (recomendado):** en Supabase, tabla `crm_settings`, clave `tasa_auto` = `no`.
  Para volver: `si` (o borrar la fila).
- **Quitarlo del todo:** en el VPS `crontab -e` y borrar la línea de `tasa-diaria.mjs`.
  Copia del crontab de antes: `/root/backups/crontab-20261020-antes-tasa-diaria.txt`.

## Dónde está cada cosa (técnico)

- Cron VPS: `50 8 * * * cd /root/vivabot && /usr/bin/node scripts/tasa-diaria.mjs >> /root/supervisor/logs/tasa-diaria.log 2>&1`
- Código VivaBot: `scripts/tasa-diaria.mjs`, `src/tasa.js`, `src/tasa-rules.js` (pruebas: `test/tasa.test.js`).
- Lo guardado del día: Supabase `crm_settings` clave `tasa_hoy`
  `{ fecha, toque, efectivo, transferencia, fuente: eltoque | maryta | ayer | manual, at }`.
- Core 3.14.43: transferencia CUP = `cup` × 1,20 en el checkout, el vale y la app de gestoras.
  El 1,20 se puede cambiar con la opción de WordPress `cvd_cup_transfer_factor`.
- Repetir hoy a la fuerza: `node scripts/tasa-diaria.mjs --forzar` (pisa una tasa puesta a mano).
