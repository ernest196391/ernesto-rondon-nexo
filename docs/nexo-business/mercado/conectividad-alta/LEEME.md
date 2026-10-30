# Alta de «Redes y conectividad» bajo pedido (29-oct-2026)

Scripts que se corrieron en el VPS (`/root/supervisor/tareas/`): `node conectividad-alta.mjs --prueba | --crear | --publicar [--solo clave,clave] [--republicar]`.
- Datos y textos: `conectividad-datos.mjs` (precios del proveedor = lo que dijo Tecnology en `crm_wa_messages` 64517/64564/30458 y Dario 71023/75540; `my_price` sale de `myPrice()` del bot, regla D43).
- Crea filas en `crm_market_items` (status `nuevo`, `photos_ok=false`, `raw_text` empieza por «RUTA ·»: proveedor, grupo, mensaje, fecha, precio dicho) y publica por `POST /bot/market/publish` (el mismo camino del bot) con `departments=[redes-y-conectividad, tecnologia]`.
- Los 8 sin foto (Asus RT-AC1200, Nauta Hogar ADSL2+, Jancane WF002, extensor 300 Mbps, Tenda N300, Deco D2, adaptador WiFi/Bluetooth PC, OTG de Dario) quedan en la bolsa como `nuevo`: cuando haya foto, `--publicar --solo <clave>` o el botón de Lennys.
- Fotos de los 16 publicados: catálogo de TecnoCenter (12), fabricante MikroTik (2: hEX y SXTsq 5ac), tienda extranjera (Archer A54 y Nano Loco 5AC). Todas marcadas «falta foto real» en `photos_quality`.
