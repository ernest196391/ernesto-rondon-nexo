# Programa de gestoras · plan para subirlo (Core 3.14.29 + panel)

Estado (16-oct-2026, tarde): **nada subido. Se sube solo con el SÍ de Ernesto.**
- Core: rama `programa-gestoras-1016` en `ernest196391/Casa-Viva` (carpeta `C:\Users\Ernesto\Casa-Viva-programa`), versión **3.14.29**, encima de `main` 3.14.25.
- Panel: rama `programa-gestoras-1016-panel` en `ernesto-rondon-nexo` (carpeta `C:\Users\Ernesto\nexo-programa`), encima de `main`.
- Diseño y datos reales: `DISENO.md` (§10 encaje con lo nuevo, §11 números del 16-oct).

> **Ojo con la versión:** en la web ya va la **3.14.26** («va junto con el #N», subida desde el móvil, todavía no está en GitHub) y hoy sale **3.14.28** (NEXO Busca). Cuando se escribió esto, `main` seguía en 3.14.25. **Rebasar sobre `main` con la 3.14.28 antes de subir** (paso 1).

---

## Lo que Ernesto y Lennys tienen que decidir antes

### Cómo funciona, en 4 líneas
1. Cada venta entregada y cobrada da **puntos** a quien la vendió: 1 punto = 1 USD que le queda a Casa Viva (precio − lo que costó − la comisión de la gestora).
2. Con los puntos del mes de su equipo (ella + sus invitadas + las invitadas de ellas) llega a una **piedra** (Bronce 65 puntos, Plata 130, Oro 195…) y cobra su **bono en CUP** ese mes (Bronce 5.000, Plata 10.000, Oro 15.000…).
3. La que invita (la **madrina**) gana además el **2 %** de lo que vende su invitada durante 12 meses (y el 1 % del segundo nivel si es Plata).
4. Todo eso sale de un **fondo del 15 % de la ganancia** del mes. Primero la red; los bonos, con lo que quede. Casa Viva nunca pone más.

### Ejemplo: María invita a Ana
Supongamos que cada venta deja como la media real de octubre (el 20 % del precio después de pagar el producto y la comisión). Un mes, **María vende 300 USD y Ana 400 USD**, todo entregado y cobrado.

| | Ana (la invitada) | María (la madrina) |
|---|---|---|
| Comisión normal (10 %) | 40 USD | 30 USD |
| Puntos | 80 propios | 60 propios + 78 de Ana (Ana cuenta como mucho el 60 % de lo que pide Plata) = 138 |
| Piedra del mes | **Bronce** | **Plata** |
| Red (2 % de lo que vende Ana) | — | **8 USD** |
| Bono de la tabla | 5.000 CUP | 10.000 CUP |
| Bono que cobra (el fondo no llega entero) | **3.467 CUP** (69 %) | **6.933 CUP** (69 %) |
| Total del mes | 40 USD + 3.467 CUP | 30 USD + 8 USD + 6.933 CUP |

- **Casa Viva:** esas ventas le dejan 140 USD; paga 21 USD del fondo (el 15 %): 8 de red y 13 en bonos. Le quedan 119.
- **Si vendieran el doble** (María 600, Ana 800): Ana Plata y María Oro; red 16 USD; los bonos se cubren al 83 %.
- **Si los puntos restan también los gastos fijos** (decisión 1), con las mismas ventas de 300 y 400: Ana se queda sin piedra (59 puntos), María llega a Bronce y cobra sus 5.000 CUP enteros; Casa Viva paga 14 USD.

### Las decisiones (con mi recomendación)

1. **¿Los puntos restan los gastos fijos de cada producto?** (lo que Lennys calculó el 16-oct, ~8 % del costo)
   - Hoy la regla aprobada (D55) dice que no: puntos = precio − costo − comisión.
   - Restarlos baja los puntos un 27 % (con datos reales: 635 → 463 en octubre) y Bronce pasaría a pedir unos 440 USD del equipo al mes en vez de 325.
   - **Recomiendo: NO restarlos** en la prueba. La tabla de piedras se pensó así, es más fácil de explicar y el tope del 15 % ya protege a Casa Viva: restarlos solo ahorra ~0,8 % de lo vendido. Se cambia con una línea (`cvd_programa_gastos_fijos = si`).
2. **¿Se deja la tabla de piedras como está?** (Bronce 65 puntos → 5.000 CUP … Corona 3.190 → 250.000)
   - El 14-oct parecía imposible llegar (faltaban costos). Con los costos de hoy, del 1 al 16 de octubre **una gestora ya llega a Bronce** y a la segunda le falta 1 punto.
   - **Recomiendo: dejarla** y mirarla otra vez al final de la prueba con Dany.
3. **Cuando el fondo del 15 % no alcanza, los bonos se cobran a medias** (en el ejemplo, al 69 %). La gestora ve «Bono 5.000 CUP, este mes el fondo cubre el 69 %».
   - Opciones: (a) dejarlo así; (b) subir el fondo al 20 %; (c) bajar los bonos.
   - **Recomiendo (a)** para la prueba (Casa Viva no arriesga nada) y decidir con los números reales de 2 semanas. Hay que explicárselo muy claro a Dany: «el bono depende de lo que gane el equipo».
4. **Cómo se paga la red y el bono** cuando el programa pase a «sí».
   - Hoy: a mano, en wp-admin → Programa gestoras → «Pagado» con la referencia.
   - **Recomiendo:** que salgan en **«Pedir mi pago»** como un renglón más (la red en USD, el bono en CUP sin tasa), con el mismo aviso a Lennys y la misma página «Pagar a…». Está sin programar; hace falta antes del primer mes que se pague, no para la prueba.
5. **Ventas de proveedor (bajo pedido).** De su margen ya sale un fondo de ~3.000 CUP (mensajero, dependienta, tienda) y el resto es del gestor especial. Hoy el programa no lo resta, así que esas ventas dan más puntos de lo que de verdad le queda a Casa Viva.
   - **Recomiendo: restarlo** (se programa en un rato, cuando digas).
6. **Costos provisionales** (30 productos: precio ÷ 1,5 o «por confirmar»). **Recomiendo:** que cuenten, con la alerta «Costo provisional» para Lennys. Ya está programado así.
7. **Quién lo ve primero:** la cuenta de prueba y **Dany**. Le escribe Ernesto (o con su sí), con amabilidad y preguntando si tiene tiempo. **Recomiendo** que también invite a 1 o 2 gestoras: hoy solo 2 de 71 tienen madrina y la red no se puede probar sin invitadas.

---

Comandos con el formato de la skill `casa-viva-ops`:
- `SSH_WEB` = `ssh -i ~/.ssh/casa-viva-github-actions -p 65002 -o BatchMode=yes u824654880@88.223.85.72`
- `WP` = `~/domains/casaviva.company/public_html`
- `PLUG` = `$WP/wp-content/plugins/casa-viva-dropship-core`

## 0. Comprobar que se puede empezar

```bash
cd /c/Users/Ernesto/Casa-Viva-programa
git fetch origin
git log origin/main --oneline -5        # debe salir la 3.14.28 (NEXO Busca) y, debajo, la 3.14.26
$SSH_WEB "grep -m1 Version $PLUG/casa-viva-dropship-core.php"   # la web debe ir por la MISMA versión que main
```
Si la web va por una versión que no está en `main` (por ejemplo, algo subido desde el móvil): **parar** y pedir que primero se suba a GitHub.

## 1. Ponerla encima de main

```bash
cd /c/Users/Ernesto/Casa-Viva-programa
git checkout programa-gestoras-1016
git rebase origin/main
```
Conflicto esperado solo en las líneas de versión de `casa-viva-dropship-core.php` (`Version:` y `CVD_VERSION`): **dejar 3.14.29**. Si alguien ya usó la 3.14.29, poner la siguiente libre y cambiarla en todos los sitios: `grep -rn "3\.14\.29" wordpress/casa-viva-dropship-core artifacts/tests`. Todo lo demás de `main` se queda como está (los `require_once` y `register()` del programa van después de `CVD_Supplier_Split`). Después: `git add` y `git rebase --continue`.

## 2. Pruebas (deben salir 84 y 28 OK)

No hay PHP en el PC y **no se usa Docker** (llenó el disco C). Carpeta temporal del servidor, **fuera de la web**, y se borra:
```bash
cd /c/Users/Ernesto/Casa-Viva-programa
tar cf - artifacts/tests/test-programa-gestoras*.php wordpress/casa-viva-dropship-core | $SSH_WEB 'rm -rf ~/tmp-cvd-tests && mkdir ~/tmp-cvd-tests && cd ~/tmp-cvd-tests && tar xf - && for f in wordpress/casa-viva-dropship-core/includes/class-cvd-programa*.php wordpress/casa-viva-dropship-core/includes/class-cvd-gestora-app.php wordpress/casa-viva-dropship-core/casa-viva-dropship-core.php; do php -l $f; done && php artifacts/tests/test-programa-gestoras.php && php artifacts/tests/test-programa-gestoras-wp.php; cd ~; rm -rf ~/tmp-cvd-tests'
```
(77 + 23 son las de la 3.14.1; la 3.14.29 añade 7 + 5.)

## 3. Subir Core 3.14.29 a la web

Archivos (todos dentro de `wordpress/casa-viva-dropship-core/`):
- **nuevos:** `includes/class-cvd-programa-calc.php`, `includes/class-cvd-programa.php`
- **cambiados:** `casa-viva-dropship-core.php`, `includes/class-cvd-gestora-app.php`, `assets/gestora-app.css`, `assets/gestora-app.js`

1. **Nadie más cambió esos archivos en la web.** Comparar el servidor con `origin/main` (no con la rama):
   ```bash
   for f in casa-viva-dropship-core.php includes/class-cvd-gestora-app.php assets/gestora-app.css assets/gestora-app.js; do
     echo "$f  main=$(git show origin/main:wordpress/casa-viva-dropship-core/$f | tr -d '\r' | md5sum | cut -c1-8)  web=$($SSH_WEB "tr -d '\r' < $PLUG/$f | md5sum | cut -c1-8")"
   done
   ```
   Si alguno no coincide: **parar** y ver quién lo cambió.
2. **Copia de seguridad:** `$SSH_WEB "cp -a $PLUG ~/bak-AAAAMMDD-cvd-3.14.28-antes-3.14.29"`.
3. **Primero los interruptores** (antes de copiar, para que nada se vea sin querer):
   ```bash
   $SSH_WEB "cd $WP && wp option update cvd_programa_gestoras sombra && wp option update cvd_programa_ver '' && wp option update cvd_programa_gastos_fijos no"
   ```
   (`gastos_fijos`: `no` o `si` según la decisión 1.)
4. **Copiar** los 6 archivos:
   ```bash
   cd /c/Users/Ernesto/Casa-Viva-programa/wordpress/casa-viva-dropship-core
   tar cf - includes/class-cvd-programa-calc.php includes/class-cvd-programa.php casa-viva-dropship-core.php includes/class-cvd-gestora-app.php assets/gestora-app.css assets/gestora-app.js | $SSH_WEB "cd $PLUG && tar xf - && for f in includes/class-cvd-programa*.php includes/class-cvd-gestora-app.php casa-viva-dropship-core.php; do php -l \$f; done"
   ```
5. `$SSH_WEB "cd $WP && wp litespeed-purge all"`.
6. **Comprobar:**
   - `curl -s -o /dev/null -w '%{http_code}' https://casaviva.company/` y `/tienda/` y `/area-gestoras/` → 200;
   - `$SSH_WEB "cd $WP && wp eval 'echo CVD_VERSION, \" \", class_exists(\"CVD_Programa\") ? \"ok\" : \"falta\";'"` → `3.14.29 ok`;
   - tablas (se crean solas en la primera visita): `wp db query "SHOW TABLES LIKE '%cvd_programa%'"` → 3 tablas;
   - tarea de la noche: `wp cron event list --fields=hook,next_run_relative | grep cvd_programa`;
   - sin errores nuevos: `tail -50 $WP/error_log` (o el log de PHP de Hostinger).
7. **Primer cálculo:** wp-admin → Casa Viva → **Programa gestoras** → «Calcular ahora» (o `wp eval 'echo CVD_Programa::run( wp_date("Y-m"), "manual", 1 );'`). Debe salir parecido a `DISENO.md` §11 (ventas de octubre que cuentan, 1 Bronce, alertas «revisar» y «Costo provisional»).
8. **GitHub:** `git push origin programa-gestoras-1016:main` (después del rebase es avance rápido; si no lo es, `main` avanzó: volver al paso 0). Luego `git push --force-with-lease origin programa-gestoras-1016` para dejar la rama igual.

## 4. Panel de Lennys

1. Poner la rama encima de `main` (otro agente está tocando `index.html`: stock, proveedor, «queda limpio»):
   ```bash
   cd /c/Users/Ernesto/nexo-programa
   git fetch origin && git checkout programa-gestoras-1016-panel && git rebase origin/main
   ```
   Si hay conflicto en `apps/business-dashboard/index.html`: **dejar todo lo de `main`** y añadir lo del programa (botón «Programa» en Equipo, bloque «Programa de gestoras» antes de `loadPeople()` y la línea `teamKind === "programa"` en `renderPeople()`).
2. Comprobar el JavaScript: extraer el `<script type="module">` a un archivo y `node --check` (como en esta rama: OK).
3. Llevarlo a `main` con fast-forward (`git push origin programa-gestoras-1016-panel:main`) y, en la carpeta de donde se despliega el panel, `git pull`.
4. Función: `npx.cmd supabase functions deploy nexo-panel-web --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api` (añade las acciones `programa` y `programa_calcular`; lo demás igual).
5. `index.html`: copia `$SSH_WEB "cp $WP/panel/index.html ~/bak-AAAAMMDD-panel-index-antes-programa.html"` → copiar el nuevo a `$WP/panel/index.html`.
6. Vercel (`negocio.nexocuba.com`): redeploy del último deployment con `withLatestCommit`. Apuntar el id del deployment anterior.
7. Probar a ancho de móvil: panel → Equipo → **Programa** → sale el último cálculo, alertas con su recuento, ficha de cada gestora y «Recalcular ahora».

## 5. Probarlo antes que Dany

1. Con una **cuenta de prueba** (`_cvd_test_account = 1`, la ve siempre): `/area-gestoras/#equipo` y `#piedra`; en la tienda con su `?ref=` debe salir «⭐ N puntos» y el aviso «En prueba».
2. Con una gestora real **que no esté** en la lista: no ve nada nuevo (ni menú, ni ⭐).
3. Comparar 2–3 pedidos a mano con su fila en wp-admin: red = base × 2 %; puntos = precio − costo − comisión (− gastos fijos si la decisión 1 es «sí»).

## 6. Abrírselo a Dany (modo sombra, 2 semanas)

1. `$SSH_WEB "cd $WP && wp option update cvd_programa_ver 18"` (18 = Dany; comprobarlo antes con `wp user get 18 --field=display_name`). Varias: `18,33`; todas: `todas`.
2. El mensaje a Dany lo manda Ernesto o con su sí (regla: probar con Dany primero, con amabilidad, preguntando si tiene tiempo). Con guía paso a paso (skill `guia-paso-a-paso-casa-viva`) y la comisión clara.
3. Cada día: wp-admin → Programa gestoras, mirar alertas y comparar a mano.

## 7. Apuntarlo

`docs/00-FUENTE-DE-VERDAD/ESTADO.md`: versión, commits, copia de seguridad, `cvd_programa_gastos_fijos`, modo sombra y quién lo ve. `DECISIONES.md`: lo que se decidió de la lista de arriba.

## 8. Volver atrás

- **Rápido, sin tocar archivos:** `wp option update cvd_programa_gestoras no` + `wp litespeed-purge all`. No calcula ni enseña nada; las 3 tablas se quedan (no molestan).
- **Completo Core:** `$SSH_WEB "cp -a ~/bak-AAAAMMDD-cvd-3.14.28-antes-3.14.29/. $PLUG/ && rm -f $PLUG/includes/class-cvd-programa-calc.php $PLUG/includes/class-cvd-programa.php && cd $WP && wp cron event unschedule cvd_programa_diario; wp litespeed-purge all"` (la copia no tiene los archivos nuevos: por eso se quitan; las tablas se pueden dejar).
- **Panel:** `cp ~/bak-AAAAMMDD-panel-index-antes-programa.html $WP/panel/index.html`; Vercel al deployment anterior; la función, volver a desplegarla desde el commit anterior de `main` (las dos acciones nuevas no se usan si el panel no las llama).
- **GitHub:** `git revert` de los commits del programa en `main` (nunca `push --force` a `main`).

## 9. Pasar a «sí» (después de las 2 semanas)

Solo si: cero errores de cálculo, Dany entiende sus pantallas sola, ninguna alerta sin explicar, y está decidida (y programada) la forma de pago (decisión 4). Entonces `wp option update cvd_programa_gestoras si`: lo ven todas las gestoras aprobadas, y el **primer cierre que se paga** es el del mes en que se active (se cierra solo del 1 al 5 del mes siguiente). Anunciarlo en el General con la comisión clara, solo con el sí de Ernesto.
