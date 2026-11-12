# Saldo 360 — corrección de alcance tras revisar la demo
Fecha: 2026-10-26. Rama: `casa-viva/saldo360-piloto-20261026`.

**Corrección importante:** la hipótesis anterior de que Saldo 360 era «Mi dinero» para gestoras fue equivocada. La demo existente es un **marketplace de transferencias de saldo principal Cubacel** entre solicitantes y proveedores; no es el sistema contable/comisiones de Casa Viva. La URL de demostración es `https://saldo-360-recargas-demo-ernesto.fullpackage.chatgpt.site/`.

## Evidencia directa de la demo
Se revisó el texto de la página abierta en el navegador del usuario, en la sección `#cliente`. Navegación: «Recargar», «Mis pedidos», «Soy proveedor», «Visión 360». Flujo del cliente: introduce cantidad CUP, elige medio de pago (Transfermóvil, EnZona, efectivo, USDT, Zelle, Clásica), consulta proveedor habitual o compara ofertas. Muestra reputación, disponibilidad y precio. Contiene asistente de IA **simulado**. Banner: «Datos ficticios · No envía mensajes, dinero ni recargas». Datos y pedidos locales en navegador. **No hay operaciones reales ni verificación real de identidad/dinero.**

## Hallazgos UX
1. Demasiada narrativa en primer pantallazo: «hecho para el día a día», «menos mensajes», «una idea», «tu saldo...», «diseñado para Cuba», bloque explicativo, asistente simulado.
2. Precio / disponibilidad / confianza existen pero su jerarquía se diluye.
3. La interfaz de compra debe priorizar importe → forma de pago → ofertas verificadas → confirmación → seguimiento. El destinatario se captura/valida explícitamente antes de confirmar.
4. El CTA «Elegir proveedor» debe estar deshabilitado para proveedores desconectados sin stock/aceptación, con alternativa clara.
5. «Visión 360» y herramientas avanzadas deben quedar fuera del flujo principal del cliente.

## UX mínimo propuesto
Cliente: «¿Cuánto saldo necesitas?» [100][300][500][Otro] → «¿Cómo pagarás?» → «Ver ofertas». Resultados: «Recibes X CUP», «Pagas Y CUP», «Proveedor», «Disponible/En espera», «Tiempo estimado», «Elegir». Comprobante / historial con estados «Solicitado», «Aceptado», «Saldo enviado», «Confirmado» o «Incidencia». Sin prometer entrega hasta confirmación verificable.
Proveedor: publicar saldo disponible verificable, precio, medios, horario; aceptar/rechazar; adjuntar evidencia; ver historial.
Administración: cola de proveedores a verificar, reclamos y reconciliación; límites de abuso y fraude.

## Modelo comercial para validar
Primeros proveedores potenciales: red cercana de Casa Viva, **no confundir automáticamente gestoras comerciales con proveedoras de saldo**. Piloto cerrado de 3 proveedores y 10 compradores, sin procesar dinero a través de la plataforma hasta completar evaluación legal, pagos, seguridad y reclamaciones. Comisión de intermediación cobrada al proveedor solo por operación completada (porcentaje **por definir** tras medir márgenes y costes); alternativa de suscripción para proveedores frecuentes. No cobrar por anuncios ni priorización pagada de ofertas antes de tener suficientes proveedores y confianza.

## Puertas obligatorias antes del lanzamiento transaccional
- Derechos de uso y recuperación/exportación del código de la demo Sites: no está en el repo comprobado; no suponer que el enlace equivale a código de GitHub.
- Verificar condiciones actuales de ETECSA para transferencia de saldo, límites y cargos; examinar permisos aplicables para intermediación/reventa y cobro antes de aceptar transacciones.
- KYC/identidad proporcional, antifraude, privacidad, disputas, fondos y comprobantes; no exponer números completos.
- Probar precios coherentes, stock/estado real, bloqueo de doble asignación, registro de cada estado y reversión.
- Separación de datos de Casa Viva/NEXO Business, roles y consentimiento.
- Pruebas con compradores reales y proveedores identificados, pero pagos y envíos manuales y controlados solo cuando la operación esté autorizada y legalmente verificada.

No se modificó la demo publicada ni se puso nada en producción.
