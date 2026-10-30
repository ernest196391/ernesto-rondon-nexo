# Fuentes exactas de routers, antenas y adaptadores (29-oct-2026)

Sacado de los mensajes reales de los grupos de WhatsApp donde está el bot (tabla `crm_wa_messages`). Cada producto lleva su «ruta»: quién lo vende, en qué grupo lo publicó, en qué mensaje y qué precio dijo. Así, si hay demanda, se sabe a quién y dónde preguntar.

## Proveedor principal: Tecnology (WhatsApp 54741004 · wa.me/+5354741004)
- «Todo nuevo 0 km · tienda física en el Vedado · con garantía». «Al WhatsApp se le atienden más modelos».
- Grupo/canal: `5354741004-1610742560@g.us` (el bot está dentro). Enlace del grupo: https://chat.whatsapp.com/GsR5GYxULkfGGuYrxql9Ot
- Catálogos completos publicados el 5-oct (se repiten): mensaje `crm_wa_messages.id = 64517` («Redes») y `64399` («Accesorios PC y laptop»).
- Oferta por cantidad: «a partir de 15 unidades se hacen ofertas» (mensaje `30458`, 23-oct).
- Mensajes más nuevos: `76789` (29-oct, foto «Mini router LTE compatible 5G si sale del país», sin precio).
- **TecnoCenter** (https://tecnocentercuba.com, WhatsApp 5350365089) vende el mismo catálogo con los mismos precios. Es muy probable que sea la tienda de Tecnology; hay que confirmarlo. Sus fotos están en la web (CSV `tecnocenter-2026-10-29.csv`).

### Routers (precio del proveedor en USD → nuestro precio con la regla D43)
| Producto | Costo | Nuestro precio |
|---|---|---|
| Olax Scorpion X60 AC1200 (dual band, EasyMesh, gigabit; «sellado, garantía») | 60 | 80 |
| WiFi DBIT T1 Pro N300 | 65 | 85 |
| DBIT WiFi AC1200 dual band | 80 | 100 |
| Cudy AC1200 WiFi 5 | 80 | 100 |
| Tenda F3 | 80 | 100 |
| TP-Link A54 | 80 | 100 |
| U-Speed WiFi AX1500 (WiFi 6) | 85 | 105 |
| Cudy AX1500 WiFi 6 dual band | 85 | 105 |
| Asus RT-AC1200 | 135 | 155 |
| TP-Link TL-MR100 (LTE, con línea) | 130 | 150 |
| MikroTik hEX RB750Gr3 (mensaje `64564`) | 170 | 190 |
| Router Nauta Hogar ADSL2+ (mensaje `64570`: «muy pocos, no hay en ningún lado, garantía») | 200 | 220 |

### Extensores / boosters
| Jancane WF002 | 50 | 67 |
| WiFi 300 Mbps 2,4 GHz | 50 | 67 |
| Tenda N300 | 50 | 67 |
| Deco D2 | 200 | 220 |

### Antenas, PoE y adaptadores
| Producto | Costo | Nuestro precio |
|---|---|---|
| Ubiquiti PoE 48 V 24 W | 35 | 49 |
| Antena WiFi/Bluetooth para PC (adaptador) | 25 | 35 |
| Adaptador WiFi o Bluetooth | 25 | 35 |
| AirCube AC punto de acceso WiFi | 130 | 150 |
| MikroTik SXTsq Lite2 | 150 | 170 |
| MikroTik SXTsq 5ax | 185 | 205 |
| MikroTik SXTsq 5ac | 190 | 210 |
| Nano Loco 5ac | 200 | 220 |

(La columna «Nuestro precio» sale de `myPrice()` en `/root/vivabot/src/market-price.js`: por debajo de 60 USD, +40 % con mínimo 5 y máximo 17; de 60 en adelante, +17 USD; redondeo hacia arriba. Hay que recalcular con esa función, no con esta tabla.)

## Otros vendedores
| Producto | Vendedor | Precio | Dónde |
|---|---|---|---|
| Adaptador OTG tipo C a USB / V8 a USB | Dario (5358169359) | 5 USD · «comisión fija: 1000 CUP» | grupo `12036340605993`, mensajes `75540` y `71023` |
| Antena de disco LTE con base de madera y 10 m de cable, transporte incluido | rosalesperezmaritza7 (…4013) | 25 USD | grupo `12036329301836`, mensaje `29826` |
| OTG de varias medidas | Ada Hernandez (…8475) | 1,50 USD / 400 CUP | grupo `12036340333816`, mensaje `73019` |

## Lo que se vende en nuestras ventas hoy
- Nuestra web: 0 routers reales, 11 adaptadores, 2 cámaras. En el mercado propio solo hay un «Modem Logic ML8» de Kevin (55→72, sin publicar).
- Solicitud real: una gestora (el 20-oct, en el General) preguntó si un repetidor WiFi servía para Nauta Hogar; Lennys respondió «agotado».
