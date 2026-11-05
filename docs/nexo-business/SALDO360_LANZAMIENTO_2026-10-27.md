# Saldo 360 — Puesta en marcha del piloto (27-oct-2026)
**Estado al redactar:** interfaz web desplegada en Vercel (build READY). NO procesar operaciones reales ni afirmar registro/proveedor automático.
**Dominio objetivo:** `saldo360.casaviva.company`.

## 1. Dominio — último paso que falta en Hostinger
1. El subdominio ya fue creado en Hostinger. **No recrearlo ni tocar la carpeta** `/home/u824654880/domains/casaviva.company/public_html`: comparte ruta con la web principal de Casa Viva y sobrescribirla dañaría el comercio.
2. En Hostinger: **Dominios → DNS** (o Sitios web → casaviva.company → Avanzado → Editor zona DNS), seleccionar zona `casaviva.company`.
3. Buscar registros específicos cuyo **Nombre sea exactamente `saldo360`**. Si existe A/AAAA/CNAME conflictivo de ese nombre, retirar únicamente ese registro tras comprobarlo. **Nunca eliminar el A `@`, `www`, MX o registros de otros subdominios**.
4. Crear CNAME: **Nombre: `saldo360`** / **Apunta a: `a20442328f1324fb.vercel-dns-017.com.`** / TTL predeterminado. Revisar antes en Vercel → proyecto saldo360-piloto → Settings → Domains por si hubiera cambiado el destino.
5. Esperar propagación DNS, comprobar HTTPS/SSL y que `https://saldo360.casaviva.company` muestra dos tarjetas: **Busco saldo / Tengo saldo**. No cambiar nameservers del dominio principal.
6. Dominio ya agregado al proyecto Vercel ligado a la **rama Saldo 360**, sin cambiar NEXO ni Casa Viva. Vercel Hobby es para uso no comercial: antes de recibir actividad comercial, usar alojamiento/plan que la permita.

## 2. Recorridos preparados
- `/saldo360`: entrada simple.
- `/saldo360/ofertas`: consultar ofertas reales aprobadas (al principio 0, sin falsas).
- `/saldo360/proveedores`: lista de tiendas aprobadas.
- `/saldo360/publicar`: vendedor redacta una oferta y la copia para remitirla al equipo; **no crea cuenta ni la publica automáticamente**.
- `/saldo360/mi-cuenta`: maqueta; registro futuro.
- `/saldo360/demo`: simulación para presentaciones, inequívocamente marcada como ficticia.
- Navegación de `/` del host Saldo360 redirige a `/saldo360` sin alterar otros dominios.

## 3. Mañana: primera carga manual y sin riesgo
1. Elegir 3 proveedores **que acepten voluntariamente participar**. Confirmar autorización para mostrar nombre comercial y teléfono WhatsApp públicamente; registrar prueba del consentimiento.
2. Pedir formato: `SALDO360 / DISPONIBLE 1500 CUP / POR 100 CUP COBRO 430 CUP / PAGO TRANSFERMÓVIL / VIGENTE HASTA ...`. La tarifa es ejemplo ficticio; NO publicar ese valor sin confirmación real.
3. Con su respuesta más reciente, verificar disponibilidad y precio. Si falta un dato, no publicar. No publicar capturas ni contactos de grupos privados sin permiso.
4. Ingresar ofertas **revisadas** en la fuente del marketplace; validar URL de WhatsApp y caducidad, publicar y probar con 2 gestoras que quieran participar.
5. Medir contactos, no inventar venta ni reputación. Recibir quejas por canal acordado. No administrar dinero ni saldo.

## 4. VivaBot: estado y camino de integración
Repositorio separado: `ernest196391/vivabot`, PR #23, rama `feat/saldo360-supplier-feed-20261026`.
- Existe un **parser en rama de prueba** que interpreta ofertas explícitas y exige consentimiento doble y vigencia. Escribe borradores EN REVISIÓN.
- **No está conectado a VivaBot en producción, no lee WhatsApp en vivo, no manda mensajes ni está programado a las 7:00.**
- Para activarlo: decidir origen autorizado (mensajes que los proveedores envíen directamente, opt-in), almacén separado de Casa Viva, consentimiento específico, revisión de términos de WhatsApp, adapter hacia BD Saldo360, envío/comprobación de ofertas y cron horario Cuba. Hacer primero una ejecución manual y comprobar no afectar VivaBot/Casa Viva.
- No hacer minería indiscriminada de grupos, ni anunciar ofertas por mensaje de alguien sin su permiso.

## 5. Siguiente bloque de código
Proyecto Supabase **propio** (no reutilizar `nexo-production`) → registro vendedor/comprador → permisos RLS probados → anuncios y fotos → panel moderador → ingesta VivaBot solo desde proveedores autorizados.

## 6. Comprobaciones para cerrar el piloto
- 3 tiendas verificadas; 3 anuncios vigentes; WhatsApp de los proveedores correcto.
- Desde Android económico: 2 clics desde el inicio a ofertas o al formulario.
- Sin usuarios ficticios en marketplace real.
- Protección/consentimiento de teléfono y fecha de caducidad.
- Hosting comercial compatible, condiciones de operación revisadas, canal de reclamación.
