# Lista de números sospechosos de estafa

**Pedido de Ernesto, 20-oct-2026.** Etapas 1 y 3 hechas; está **EN VIVO**. Ver D83 y ESTADO L43.

| | |
|---|---|
| **Quién** | Todo el equipo de Casa Viva (mensajeros, dependientas, gestoras) y, después, cualquier negocio NEXO. Una sola lista para toda la red: cuantos más negocios, más números. |
| **Problema** | Los estafadores repiten la jugada con varios vendedores: piden un artículo, dan una dirección falsa y pagan con billetes falsos o no pagan. Los avisos salen sueltos en grupos de WhatsApp y nadie los junta. |
| **Evidencia** | 20-oct: 56280375 (billetes falsos de 100 USD) y la bici del #4220 (51249823, 52579138). 06-oct: asalto a un mensajero (59495089). Una lista de unos 20 números y direcciones que circula en un grupo de gestores (15-oct). 14-oct: alguien pidió «una base de datos de los números calientes». |
| **Qué hace** | 1) Si un número de la lista escribe al bot, aviso a Ernesto (una vez al día), y la IA no promete entregas ni confirma pedidos, sin acusar a nadie. 2) Si sale en un pedido de la web, aviso a Ernesto (una vez por pedido). 3) Un aviso de estafa con teléfono en un grupo o en un privado del equipo añade el número solo, como «sospechoso». 4) En Billete Seguro: campo «Teléfono del cliente» que se consulta en la lista, y botón «Reportar este número» cuando sale «No lo aceptes» o «Dudoso». 5) Búsqueda diaria a las 9:00 en la web pública y en los grupos. |
| **Área de gestoras (Core 3.14.42)** | «¿Es de confianza este número?» en Herramientas: mirar un número, la lista con un filtro (se actualiza sola) y «Reportar un número». Guía de 4 pasos en `docs/nexo-business/guias/numero-de-confianza/`, mandada al General el 20-oct. |
| **Ernesto decide** | En «Tú»: *SOSPECHOSO 5XXXXXXX motivo* (confirmado), *NO SOSPECHOSO 5XXXXXXX* (descartado), *SOSPECHOSOS* (la lista) y *SOSPECHOSO 5XXXXXXX ?* (la ficha). |
| **Gratis o premium** | Gratis para Casa Viva y las gestoras. Para otros negocios NEXO va dentro de Billete Seguro (su código de equipo). |
| **Cómo se mide** | Números en la lista, cuántas veces escribió o pidió uno de la lista, y reportes desde Billete Seguro. |
| **Dónde vive** | Tabla `crm_sospechosos` (Supabase nexo-production; migración `20261020210000_crm_sospechosos.sql`). VivaBot: `src/sospechosos.js` y `src/sospechosos-rules.js` (pruebas en `test/sospechosos.test.js`). Función `billete-seguro-revisa` (acciones `telefono` y `reportar`). App: `apps/billete-seguro/app.js`. Tarea programada `sospechosos-busqueda-diaria`. |

## Reglas
- **Interna.** A un cliente nunca se le dice que está en la lista. El bot solo deja de prometer entregas y escala.
- Lo que entra solo es «sospechoso». «Confirmado» lo dice Ernesto (o venía del propio equipo en la semilla).
- Un número que Ernesto descartó no vuelve a avisar aunque lo reporten otra vez: solo suma reportes.
- Los números del equipo (gestoras, mensajeros, dependientas, admin) nunca entran solos.
- **Facebook:** solo lo que es público y sale en el buscador. Nada de entrar con una cuenta ni de saltarse protecciones. Lo que alguien vea en Facebook se añade con *SOSPECHOSO <número> motivo* en «Tú».
