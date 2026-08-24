# NEXO Conversations — SPEC

## Fuente
Adaptación del Kit 02 — Agente WhatsApp.

## Conservamos
- configuración por negocio;
- guardrails de precios y enlaces;
- calificación de leads;
- handoff humano;
- proveedor de IA intercambiable;
- diagnóstico antes de conectar un canal real.

## Cambiamos
Baileys/WhatsApp Web no se adopta como dependencia crítica de producción. La capa de transporte queda separada para priorizar WhatsApp Business Platform oficial cuando se conecte el canal real.

## MVP funcional
configuración → mensaje de prueba → IA si existe proveedor → fallback determinista → post-guardrails → intent/lead score/handoff → respuesta visible.

## Seguridad
- no envía mensajes reales;
- no almacena secretos;
- precios y hosts pueden ser allowlist;
- respuestas con importes/enlaces no autorizados se bloquean;
- handoff explícito para casos sensibles.

## Gate siguiente
Conectar almacenamiento persistente y un MessagingProvider oficial antes de considerar mensajería real 24/7.
