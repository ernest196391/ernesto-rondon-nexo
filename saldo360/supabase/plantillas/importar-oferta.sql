-- SALDO 360 — importación supervisada de UNA oferta real (piloto, antes de que haya cuentas).
-- Proyecto Supabase: saldo360 (zgjycphcugbiyoluqsry). NUNCA nexo-production.
-- Úsala solo si: (1) el proveedor autorizó publicar su nombre y WhatsApp (guarda la prueba
-- fuera del repo y resúmela en consent_evidence), (2) confirmó HOY saldo, precio y forma de pago.
-- Se ejecuta en el editor SQL de Supabase (o por la herramienta de Claude) con el rol del servicio.
-- Cambia los valores marcados con ⟵ y ejecuta todo junto.

with tienda as (
  insert into public.shops (owner_id, slug, name, locality, whatsapp_e164, whatsapp_consent_at, consent_evidence, status, verified_at)
  values (
    null,                         -- tienda gestionada (el proveedor aún no tiene cuenta)
    'nombre-tienda',              -- ⟵ minúsculas y guiones, único
    'Nombre de la tienda',        -- ⟵ como quiere aparecer
    'Municipio',                  -- ⟵ opcional
    '53XXXXXXXX',                 -- ⟵ su WhatsApp (53 + 8 cifras)
    now(),
    'WhatsApp 27-oct 10:15: «Autorizo…»',  -- ⟵ resumen de la prueba del consentimiento
    'approved', now())
  on conflict (slug) do update set updated_at = now()
  returning id
)
select public.admin_publish_offer(
  (select id from tienda),
  1,                              -- ⟵ mínimo que vende (CUP)
  1000,                           -- ⟵ saldo disponible (CUP)
  43,                             -- ⟵ CUP que cobra por cada 100 CUP de saldo
  array['transfermovil'],         -- ⟵ transfermovil | enzona | efectivo
  24,                             -- vigencia en horas (máx. 72)
  'admin_import') as oferta_id;

-- Para retirar una oferta antes de que venza:
--   update public.offers set status = 'paused' where id = '…';
