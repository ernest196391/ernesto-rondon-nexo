# Saldo 360 — arquitectura del marketplace tipo clasificados
Fecha: 2026-10-26 · Estado: plan de implementación, no cuentas funcionales todavía.

## Visión del producto
Marketplace vertical inspirado en la familiaridad de Revolico: lista de anuncios rápida, tiendas de vendedores, contacto directo por WhatsApp y confianza verificable. No copiar imagen, logo ni código de Revolico. El producto es exclusivo para ofertas de saldo móvil de acuerdo con las normas aplicables.

## Roles
- Visitante: ver ofertas y perfiles, buscar, filtrar, contactar.
- Comprador con cuenta: guardar favoritos, registrar solicitud, consultar estado, reportar incidencia y valorar **solo tras operación confirmada**.
- Proveedor con cuenta verificada: avatar/foto, nombre público, descripción corta, localidad, WhatsApp consentido, anuncios editables, stock declarado, precios, horarios y transacciones.
- Moderación: verificar identidad con consentimiento y controles de acceso, ocultar fraude, revisar disputas y operaciones.

## Pantallas y copy mínimo
- Explorar: «Encuentra saldo. Sin vueltas.» · «Compara precios. Elige tu proveedor.» · «Ofertas vigentes» · «Hablar por WhatsApp».
- Tiendas: «Tiendas de saldo» · «Conoce a quién le compras.»
- Perfil: nombre, foto, localidad, ofertas, confirmación de disponibilidad, reputación verificable y «Consultar por WhatsApp».
- Mi cuenta: «Compra, vende y construye tu reputación.» · entrar / crear cuenta (solo cuando auth funcione).
- Mis anuncios (proveedor, fase siguiente): «Publicar oferta» · «Mis ofertas» · «Pausar» · «Editar».
- Mis operaciones: «Solicitudes», «En curso», «Completadas», «En disputa».
- Reputación: «Operaciones confirmadas» y «Opiniones verificadas»; sin reseñas de quien no compró y sin puntuación inventada.

## Contrato de datos sugerido (para un proyecto Supabase aislado)
- profiles: user_id (auth.uid), display_name, role, avatar_path, locality, created_at.
- seller_profiles: user_id, shop_slug, bio, whatsapp_e164, consent_at, verification_state.
- offers: id, seller_id, title, cup_per_cup, min_cup, max_cup, payment_methods, availability_state, verified_at, expires_at, created_at.
- requests: id, buyer_id, offer_id, amount_cup, agreed_price_cup, state, created_at; no almacenar datos de pago innecesarios.
- transaction_confirmations: request_id, actor_id, evidence_reference, decision; confirmaciones de ambas partes y resolución de disputas.
- reviews: id, request_id único por comprador, buyer_id, seller_id, rating, text, moderation_state, created_at.
- reports/audit_events: incidencias, cambios de oferta, trazabilidad y moderación.

## Seguridad antes de abrir el registro
Autenticación segura; políticas RLS por propietario; nunca confiar en el rol definido por el usuario como permiso; nunca mostrar teléfonos privados salvo autorización; separar el proyecto de Casa Viva; limitar publicación masiva, spam, reportes y reseñas fraudulentas; borrar datos según política de privacidad; comprobantes y revisión de fraude. No conectar cuentas ni publicar anuncios de terceros sin consentimiento.

## Reputación genuina
Operaciones confirmadas = solo requests con conciliación de comprador y proveedor más reglas antifraude. Total = COUNT de operaciones confirmadas, no volumen declarado ni clics a WhatsApp. Si el trato ocurre completamente fuera de la plataforma sin confirmación, mostrar «No verificado» y no sumar operaciones.

## Blockchain (posterior)
No implementarla ahora. Primero probar registro, integridad de eventos, moderación, informes y la economía. Si después existe caso real de necesidad, evaluar pruebas criptográficas de registros (hashes), no identidades ni información personal en blockchain pública.

## Estado del código
El directorio existente usa un JSON manual con proveedores consentidos, validación de vigencia y enlace de WhatsApp. Se añadieron pantallas de «Tiendas», «Perfil» y «Mi cuenta» como estructura de UX, **sin registro ni almacenamiento remoto todavía**. Mantenerlo así hasta que exista auth y RLS probada; no presentar formulario falso que simule crear cuenta.

## Siguiente bloque de implementación
1. Elegir proyecto Supabase separado y presupuesto/hosting comercial.
2. Implementar migración y políticas RLS con pruebas aisladas.
3. Crear registro/login real para comprador y proveedor.
4. CRUD de anuncios del propio proveedor y cargas de avatar.
5. Estados de operación e incidencias; reputación solo con comprobación.
6. Prueba cerrada con proveedores reales, restricciones y revisión legal de transferencia/reventa de saldo.
