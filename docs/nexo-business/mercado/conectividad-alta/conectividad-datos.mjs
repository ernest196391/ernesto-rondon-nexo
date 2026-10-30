// Datos de la tanda «Redes y conectividad» (29-oct-2026). Solo lo que dijo el proveedor (Tecnology) o la ficha del fabricante/TecnoCenter (SUGERIDO).
// Los precios del proveedor son los que él publicó; my_price se calcula con myPrice() del bot (regla D43), no está aquí.
export const BIZ = '8771c6ed-9dbf-497d-b3df-be6697ba2693';
export const DEPTS = ['redes-y-conectividad', 'tecnologia'];

const TEC = {
  seller_jid: '5354741004@s.whatsapp.net', seller_phone: '5354741004', seller_name: 'Tecnology',
  group_jid: '5354741004-1610742560@g.us', group_name: 'Compra Venta 😎',
};
const DARIO = { seller_jid: '5358169359@s.whatsapp.net', seller_phone: '5358169359', seller_name: 'Dario', group_jid: '120363406059938006@g.us', group_name: 'Gestores DS 🪄' };
const MSG = {
  71023: { wa: 'A5F97831EC302BF8D477B6B80C01B935', fecha: '27-oct-2026' },
  75540: { wa: 'A5A32E6AE47B770292CCB5F10C610C7E', fecha: '29-oct-2026' },
  64570: { wa: 'A5C25C44D3FF313376631ACF69DC5FB4', fecha: '4-oct-2026' },
  64399: { wa: 'A562961269FEEC96BDEC39390E75F999', fecha: '5-oct-2026' },
  64517: { wa: 'A5ED390C49BE73A353303ED8D38506C2', fecha: '5-oct-2026' },
  64564: { wa: 'A581FCB8F51D8F4DCB298B0312BD9437', fecha: '4-oct-2026' },
  30458: { wa: 'A59FD97509355C82C6F96DF4B791CC97', fecha: '23-oct-2026' },
};
const FOTO_TC = 'foto de catálogo de TecnoCenter (tienda que vende lo mismo); falta foto real';

/** k = clave de foto en /tmp/tc/img (preparada por el paso --fotos). */
export const PRODUCTOS = [
  // ---------- Routers ----------
  { k: 'olax', foto: 'olax.bin', fotoNota: FOTO_TC, costo: 60, msg: [30458, 64517], lineaProv: 'Router wifi scorpion dual band · A gigabi easymesh · Malla · Wam y lam · Sellado garantia · Precio 60 usd unidad · X cantidad se hace ofertas apartir de 15 Unidades o mas',
    title: 'Router WiFi Olax Scorpion X60 AC1200 doble banda EasyMesh', categoria: 'routers',
    intro: 'Router WiFi Olax Scorpion X60 AC1200, nuevo y sellado, para llevar buena señal a toda la casa.',
    specs: ['Doble banda AC1200: hasta 1200 Mbps combinados (867 Mbps en 5 GHz y 400 Mbps en 2,4 GHz)', 'Puertos Gigabit (WAN y LAN)', 'EasyMesh: se puede formar una red en malla con otros routers compatibles', 'MU-MIMO y cifrado WPA3'] },
  { k: 'dbit1', foto: 'dbit1-800.webp', fotoNota: FOTO_TC, costo: 65, msg: [64517], lineaProv: 'WiFi DBIT T1 Pro N300 - 65 usd',
    title: 'Router WiFi DBIT T1 Pro N300 con 2 antenas de 3 dBi', categoria: 'routers',
    intro: 'Router WiFi DBIT T1 Pro N300, sencillo y económico para una casa o un apartamento.',
    specs: ['WiFi de 2,4 GHz hasta 300 Mbps (802.11n)', '2 antenas externas de 3 dBi', 'Funciona como router, punto de acceso o WISP', '2 puertos Ethernet 10/100 Mbps', 'Control parental, control de ancho de banda por IP y botón WPS'] },
  { k: 'dbitac', foto: 'dbitac.bin', fotoNota: FOTO_TC, costo: 80, msg: [64517], lineaProv: 'Dbi wifi ac1200 dual band - 80 usd',
    title: 'Router WiFi DBIT AC1200 doble banda con MU-MIMO y EasyMesh', categoria: 'routers',
    intro: 'Router WiFi DBIT AC1200 de doble banda para hogares y oficinas.',
    specs: ['Doble banda AC1200 (2,4 GHz y 5 GHz)', '4 antenas de alta ganancia para más alcance', 'Tecnología MU-MIMO para varios equipos a la vez', 'EasyMesh para ampliar la red con otros routers compatibles'] },
  { k: 'cudyac', foto: 'cudyac.bin', fotoNota: FOTO_TC, costo: 80, msg: [64517], lineaProv: 'Cudy ac1200 wifi 5 - 80 usd',
    title: 'Router WiFi 5 Cudy AC1200 doble banda con 5 puertos', categoria: 'routers',
    intro: 'Router Cudy AC1200 WiFi 5 de doble banda con 4 antenas de alta ganancia.',
    specs: ['867 Mbps en 5 GHz + 300 Mbps en 2,4 GHz', '5 puertos Fast Ethernet', 'Pensado para unos 40 dispositivos conectados y hasta 100 m² de cobertura', 'Modos router, punto de acceso, repetidor, WISP y cliente', 'Se configura con la aplicación Cudy'] },
  { k: 'tendaf3', foto: 'tendaf3.bin', fotoNota: FOTO_TC, costo: 80, msg: [64517], lineaProv: 'Tenda f3 - 80 usd',
    title: 'Router WiFi Tenda F3 con 3 antenas externas de 5 dBi', categoria: 'routers',
    intro: 'Router WiFi Tenda F3, diseñado para el hogar, con 3 antenas externas.',
    specs: ['3 antenas externas de 5 dBi para llevar la señal a todos los cuartos', 'Cifrado WPA, WPA2 y WPA-PSK/WPA2-PSK', 'Rendimiento WiFi estable en el hogar'] },
  { k: 'a54', foto: 'a54.jpg', fotoNota: 'foto del fabricante/tienda de otro país (TP-Link Archer A54); falta foto real', costo: 80, msg: [64517], lineaProv: 'tp-link a54 - 80 usd',
    title: 'Router WiFi TP-Link Archer A54 AC1200 doble banda', categoria: 'routers',
    intro: 'Router TP-Link Archer A54 AC1200 de doble banda con 4 antenas externas.',
    specs: ['867 Mbps en 5 GHz y 300 Mbps en 2,4 GHz (velocidades máximas del fabricante)', '1 puerto WAN y 4 puertos LAN Fast Ethernet', 'Modos router, punto de acceso y repetidor', 'Cifrado WPA3 y compatible con EasyMesh'] },
  { k: 'uspeed', foto: 'uspeed.bin', fotoNota: FOTO_TC, costo: 85, msg: [64517], lineaProv: 'U-peed wifi ax1500 Wifi 6 - 85 usd',
    title: 'Router WiFi 6 U-Speed AX1500 doble banda con EasyMesh', categoria: 'routers',
    intro: 'Router U-Speed AX1500 WiFi 6 de doble banda, puertos Gigabit.',
    specs: ['Doble banda (2,4 GHz y 5 GHz) con puertos Gigabit', 'Modos router, punto de acceso, repetidor e invitado', 'Control parental, IPv6 y EasyMesh', 'El modelo exacto (AX1500 / AC1500) se confirma antes de cobrar'] },
  { k: 'cudyax', foto: 'cudyax.bin', fotoNota: FOTO_TC, costo: 85, msg: [64517], lineaProv: 'Cudy ax1500 wifi 6 dual band - 85 usd',
    title: 'Router WiFi 6 Cudy AX1500 doble banda para 60 dispositivos', categoria: 'routers',
    intro: 'Router Cudy AX1500 con WiFi 6, doble banda, para actualizar la red de casa.',
    specs: ['Hasta 1200 Mbps en 5 GHz y hasta 300 Mbps en 2,4 GHz', 'Pensado para conectar más de 60 dispositivos', 'Formación de haz (beamforming) para enfocar la señal hacia cada equipo', 'Funciona como router o como punto de acceso'] },
  { k: 'mr100', foto: 'mr100.bin', fotoNota: FOTO_TC, costo: 130, msg: [64517], lineaProv: 'Router lte Con linea: TP-Link TL-MR100 lte - 130 usd',
    title: 'Router 4G LTE TP-Link TL-MR100 con ranura para SIM', categoria: 'routers',
    intro: 'Router 4G LTE TP-Link TL-MR100: pones la SIM y tienes WiFi.',
    specs: ['4G LTE con descargas de hasta 150 Mbps', 'Hasta 32 dispositivos conectados a la vez', '2 antenas LTE desmontables', 'Puerto LAN/WAN para usar también con cable Ethernet', 'El proveedor lo anuncia «con línea»: confirmamos qué incluye antes de cobrar'] },
  { k: 'hex', foto: 'hex.png', fotoNota: 'foto del fabricante (MikroTik); falta foto real', costo: 170, msg: [64564], lineaProv: 'MikroTik hex rb750gr3 ethernet enrutador a gigabit 170 usd',
    title: 'Router MikroTik hEX RB750Gr3 con 5 puertos Gigabit', categoria: 'routers',
    intro: 'Router MikroTik hEX RB750Gr3, un enrutador cableado a Gigabit para redes de más control.',
    specs: ['5 puertos Gigabit Ethernet y 1 puerto USB', 'Procesador de 2 núcleos a 880 MHz y 256 MB de RAM', 'Sistema RouterOS (licencia nivel 4)', 'No trae WiFi: es un enrutador cableado'] },
  // ---------- PoE ----------
  { k: 'poe', foto: 'poe-800.webp', fotoNota: FOTO_TC, costo: 35, msg: [64517], lineaProv: 'POE - Ubiquiti 48V 24W - 35 USD',
    title: 'Inyector PoE Ubiquiti 48 V 24 W para antenas y cámaras', categoria: 'poe',
    intro: 'Inyector PoE Ubiquiti de 48 V y 24 W para alimentar por el cable de red equipos compatibles.',
    specs: ['Salida de 48 V y 24 W', 'Protección contra descargas (ESD) y sobretensiones', 'Compatible con equipos airMAX, UniFi y airFiber, entre otros PoE'] },
  // ---------- Antenas y puntos de acceso ----------
  { k: 'aircube', foto: 'aircube.bin', fotoNota: FOTO_TC, costo: 130, msg: [64517], lineaProv: 'AirCube ac punto d acceso wifi - 130 usd',
    title: 'Punto de acceso WiFi Ubiquiti AirCube AC doble banda', categoria: 'antenas',
    intro: 'Punto de acceso WiFi AirCube AC de Ubiquiti, compacto, para casa o un negocio pequeño.',
    specs: ['Doble banda 2,4 GHz y 5 GHz', 'PoE de entrada y salida de 24 V para alimentar equipos airMAX', 'Se configura con la aplicación UNMS desde el móvil', 'Diseño compacto'] },
  { k: 'sxtlite2', foto: 'sxtlite2.bin', fotoNota: FOTO_TC, costo: 150, msg: [64517], lineaProv: 'MikroTik SXTsq Lite2 - 150 USD',
    title: 'Antena MikroTik SXTsq Lite2 RBSXTsq2nD para enlaces WiFi', categoria: 'antenas',
    intro: 'Antena MikroTik SXTsq Lite2 (RBSXTsq2nD), versión internacional, para enlaces WiFi y conexión de casas.',
    specs: ['Código de producto RBSXTsq2nD, banda de 2,4 GHz', 'Procesador de 650 MHz, 64 MB de RAM y 16 MB de almacenamiento', 'Sistema RouterOS (licencia nivel 3)', 'Tamaño 129 x 129 x 34 mm, trabaja de -40 a 70 °C'] },
  { k: 'sxt5ax', foto: 'sxt5ax.bin', fotoNota: FOTO_TC, costo: 185, msg: [64517], lineaProv: 'MikroTik SXTsq 5ax - 185 USD',
    title: 'Antena MikroTik SXTsq 5ax WiFi 6 de 16 dBi para enlaces', categoria: 'antenas',
    intro: 'Antena MikroTik SXTsq 5ax con WiFi 6 en la banda de 5 GHz.',
    specs: ['Antena integrada direccional de 16 dBi, para enlaces de hasta unos 3 km en ciudad', 'Procesador de 4 núcleos y 256 MB de RAM, 16 MB de almacenamiento', '1 puerto Gigabit Ethernet con PoE de entrada', 'Sistema RouterOS (licencia nivel 4), modo punto de acceso'] },
  { k: 'sxt5ac', foto: 'sxt5ac.png', fotoNota: 'foto del fabricante (MikroTik SXTsq 5 ac); falta foto real', costo: 190, msg: [64517], lineaProv: 'MikroTik sxtsq 5ac - 190 usd',
    title: 'Antena MikroTik SXTsq 5ac de 16 dBi para enlaces en 5 GHz', categoria: 'antenas',
    intro: 'Antena MikroTik SXTsq 5 ac (RBSXTsqG-5acD), modelo compacto de 5 GHz.',
    specs: ['802.11ac en la banda de 5 GHz con antena integrada de 16 dBi', '1 puerto Gigabit Ethernet con PoE', 'Sistema RouterOS', 'Tamaño compacto, hecha para estar a la intemperie'] },
  { k: 'loco', foto: 'loco.jpg', fotoNota: 'foto de tienda extranjera (Ubiquiti NanoStation Loco5AC); falta foto real', costo: 200, msg: [64517], lineaProv: 'Nano loco 5ac - 200 usd',
    title: 'Antena Ubiquiti Nano Loco 5AC airMAX para enlaces de 5 GHz', categoria: 'antenas',
    intro: 'Antena Ubiquiti NanoStation Loco 5AC, para enlaces punto a punto y como cliente en 5 GHz.',
    specs: ['airMAX AC en la banda de 5 GHz con antena integrada de 13 dBi', 'Hasta 450 Mbps y enlaces de más de 10 km con vista directa (datos del fabricante)', 'Se alimenta por PoE; el inyector se vende aparte (puedes añadir el inyector PoE de nuestra tienda)'] },
];

export const CIERRE_COMUN = [
  'Incluye: el equipo nuevo (0 km) con garantía del proveedor (plazo: consultar). Cargador, cables o accesorios: lo confirmamos al hacer el pedido.',
  'Cómo se compra: es un producto bajo pedido, confirmamos la disponibilidad en 1 hora antes de cobrar. Lo recoges en Nuevo Vedado (10:00–16:00) o pedimos mensajería (la paga el cliente).',
  'Datos técnicos según el fabricante; confirmamos el modelo exacto antes de cobrar.',
];
export const BUSCA = {
  routers: 'router, enrutador, WiFi, internet para la casa',
  extensores: 'repetidor de WiFi, extensor, amplificador de señal',
  antenas: 'antena WiFi, enlace punto a punto, punto de acceso, CPE',
  poe: 'inyector PoE, alimentador PoE para antenas',
  adaptadores: 'adaptador, OTG, USB',
};

export const norm = (s = '') => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();

export function descripcion(p) {
  return [p.intro, ...p.specs.map((s) => `• ${s}`), '', ...CIERRE_COMUN.map((c) => c)].join('\n');
}

export function rutaTexto(p) {
  const refs = p.msg.map((m) => `crm_wa_messages ${m} (${MSG[m].fecha})`).join(' y ');
  const dario = p.vend === 'dario';
  const quien = dario ? `Proveedor: Dario (WhatsApp 5358169359) · Grupo: «${DARIO.group_name}» ${DARIO.group_jid}` : `Proveedor: Tecnology (WhatsApp 5354741004, tienda física en el Vedado) · Grupo: «${TEC.group_name}» ${TEC.group_jid}`;
  const foto = p.fotoNota || 'SIN FOTO: falta una foto real o de catálogo para poder publicar';
  return [
    `RUTA · ${quien} · Mensaje: ${refs} · Precio que dijo: ${p.costo} USD${p.extraPrecio ? ' (' + p.extraPrecio + ')' : ''} · Garantía: ${p.garantia || 'sí (plazo: consultar)'} · Foto: ${foto} · Descripción: SUGERIDA (de lo que dijo el proveedor y la ficha del fabricante/TecnoCenter), revisar · Comisión D43 · Alta 29-oct-2026 por orden de Ernesto (sin escribir al proveedor)`,
    `Texto del proveedor: «${p.lineaProv}»`,
    dario ? 'Sin confirmar con el proveedor: existencias de hoy. Duda: el anuncio dice «V6 a USB»; se supone V8 (micro USB).' : 'Sin confirmar con el proveedor: precio y existencias de hoy (el catálogo es del 4 y 5 de octubre). Descuento por cantidad: «a partir de 15 unidades se hacen ofertas» (mensaje 30458).',
  ].join('\n');
}

export const base = (p) => ({ ...(p.vend === 'dario' ? DARIO : TEC), first_wa_id: MSG[p.msg[p.msg.length - 1]].wa, last_wa_id: MSG[p.msg[0]].wa });

/** Sin foto todavía: se guardan en la bolsa («nuevo») con su ruta y su ficha, listos para publicar cuando haya foto. */
export const SIN_FOTO = [
  { k: 'asus', costo: 135, msg: [64517], lineaProv: 'Asus RT-AC1200 - 135 usd',
    title: 'Router WiFi Asus RT-AC1200 doble banda con 4 antenas', categoria: 'routers',
    intro: 'Router WiFi Asus RT-AC1200 de doble banda para toda la casa.',
    specs: ['Doble banda: hasta 867 Mbps en 5 GHz y 300 Mbps en 2,4 GHz (velocidades máximas del fabricante)', '4 antenas externas', '4 puertos LAN y 1 puerto WAN', 'Puerto USB para compartir un disco o una impresora', 'La revisión exacta del modelo (RT-AC1200 o V2) se confirma antes de cobrar'] },
  { k: 'nauta', costo: 200, msg: [64570], lineaProv: 'Router Nauta hogar adsl 2 plus aprovecha muy pocos no hay en ningun ldo. Garantía',
    title: 'Router ADSL2+ para Nauta Hogar de ETECSA, con garantía', categoria: 'routers',
    intro: 'Router ADSL2+ para Nauta Hogar de ETECSA, con garantía.',
    specs: ['Tipo de conexión: ADSL2+ (la de Nauta Hogar)', 'El proveedor avisa de que quedan muy pocos y que casi no se consigue', 'Marca, modelo exacto, WiFi y puertos: consultar al pedirlo'] },
  { k: 'jancane', costo: 50, msg: [64517], lineaProv: 'JANCANE WF002 - 50 USD',
    title: 'Extensor WiFi Jancane WF002 de 300 Mbps en 2,4 GHz', categoria: 'extensores',
    intro: 'Extensor (repetidor) WiFi Jancane WF002 para ampliar la señal de tu router.',
    specs: ['Banda de 2,4 GHz, hasta 300 Mbps (velocidad máxima del fabricante)', 'Amplía el alcance de la señal; no hace más rápido el internet de tu router', 'Se conecta a la corriente y se configura sin cables'] },
  { k: 'wifi300', costo: 50, msg: [64517], lineaProv: 'WiFi Aigital 300 Mbps de 2.4 - 50 usd',
    title: 'Extensor WiFi 300 Mbps 2,4 GHz repetidor de señal', categoria: 'extensores',
    intro: 'Extensor (repetidor) WiFi de 300 Mbps en la banda de 2,4 GHz.',
    specs: ['Hasta 300 Mbps en 2,4 GHz (velocidad máxima)', 'Amplía el alcance de la señal de tu router', 'Marca y modelo exacto: consultar al pedirlo'] },
  { k: 'tendan300', costo: 50, msg: [64517], lineaProv: 'Tenda n300 - 50 usd',
    title: 'Extensor WiFi Tenda N300 repetidor de señal 2,4 GHz', categoria: 'extensores',
    intro: 'Extensor (repetidor) WiFi Tenda N300 para ampliar la señal de tu router.',
    specs: ['Clase N300: hasta 300 Mbps en 2,4 GHz', 'Amplía el alcance de la señal de tu router', 'Modelo exacto de Tenda: consultar al pedirlo'] },
  { k: 'deco', costo: 200, msg: [64517], lineaProv: 'Deco d2 - 200 usd',
    title: 'Extensor WiFi Deco D2 para ampliar la señal de la casa', categoria: 'extensores',
    intro: 'Extensor WiFi Deco D2, anunciado por el proveedor entre los extensores.',
    specs: ['El proveedor lo lista como extensor de señal WiFi', 'Marca, velocidad y bandas: consultar al pedirlo (no tenemos ficha confirmada)'] },
  { k: 'adwifi', costo: 25, msg: [64517, 64399], lineaProv: 'Antenas WiFi/Bluetooth PC - 25 USD · Adaptador wifi o Bluetooth 25 usd',
    title: 'Adaptador WiFi o Bluetooth para PC y laptop con garantía', categoria: 'adaptadores',
    intro: 'Adaptador WiFi o Bluetooth para computadora y laptop, nuevo 0 km.',
    specs: ['Sirve para dar WiFi o Bluetooth a una PC o laptop que no lo trae', 'El proveedor lo anuncia como «adaptador WiFi o Bluetooth»: confirmamos cuál es cada uno antes de cobrar', 'Marca y modelo exacto: consultar al pedirlo'] },
  { k: 'otg', vend: 'dario', costo: 5, extraPrecio: 'comisión fija que él pone para gestoras: 1000 CUP', garantia: 'no dice', msg: [75540, 71023], lineaProv: 'OtG adaptador d tipo C a UsB · V6 a USB · Perfecto para reproducir cualquier archivo de tu memoria flash en tu mov · Precio 5 USD · Comisión fija : 1000 cup',
    title: 'Adaptador OTG tipo C y micro USB a USB para el celular', categoria: 'adaptadores',
    intro: 'Adaptador OTG de tipo C a USB y de micro USB (V8) a USB para conectar al celular una memoria flash y reproducir tus archivos.',
    specs: ['Perfecto para reproducir cualquier archivo de tu memoria flash en el móvil', 'Hay de tipo C a USB y de V8 (micro USB) a USB: dinos cuál necesita tu teléfono'] },
];
