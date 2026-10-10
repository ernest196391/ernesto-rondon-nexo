-- Panel: "Entrar con WhatsApp". The owner types her WhatsApp number; if it
-- belongs to a panel member, VivaBot's outbox sends her a one-time sign-in
-- link (no e-mail, no password). The answer never says whether the number
-- exists. At most one link every 2 minutes and 5 per day per number.

ALTER TABLE nexo_business.members ADD COLUMN IF NOT EXISTS whatsapp TEXT
  CHECK (whatsapp IS NULL OR whatsapp ~ '^[0-9]{8,15}$');
CREATE INDEX IF NOT EXISTS members_whatsapp ON nexo_business.members (whatsapp) WHERE whatsapp IS NOT NULL;

-- Which CRM business (VivaBot) sends WhatsApp messages for a NEXO business.
ALTER TABLE nexo_business.catalog_sources ADD COLUMN IF NOT EXISTS crm_business_id UUID;

-- Returns the e-mail to sign in as, or NULL (unknown number or too many requests).
CREATE OR REPLACE FUNCTION public.nexo_panel_whatsapp_login_target(p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_digits TEXT := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email TEXT;
  v_crm UUID;
BEGIN
  IF length(v_digits) = 8 THEN v_digits := '53' || v_digits; END IF; -- Cuban mobile without country code
  IF length(v_digits) < 8 THEN RETURN NULL; END IF;

  SELECT u.email, s.crm_business_id INTO v_email, v_crm
    FROM nexo_business.members m
    JOIN auth.users u ON u.id = m.user_id
    LEFT JOIN nexo_business.catalog_sources s ON s.business_id = m.business_id
   WHERE m.whatsapp = v_digits
   LIMIT 1;
  IF v_email IS NULL OR v_crm IS NULL THEN RETURN NULL; END IF;

  IF EXISTS (SELECT 1 FROM public.crm_outbox WHERE created_by = 'panel-acceso' AND to_phone = v_digits
              AND created_at > now() - interval '2 minutes')
     OR (SELECT count(*) FROM public.crm_outbox WHERE created_by = 'panel-acceso' AND to_phone = v_digits
              AND created_at > now() - interval '1 day') >= 5 THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object('email', v_email, 'phone', v_digits, 'crm_business_id', v_crm);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_panel_whatsapp_login_target(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_panel_whatsapp_login_target(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.nexo_panel_whatsapp_login_send(p_crm_business UUID, p_phone TEXT, p_body TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.crm_outbox (business_id, to_phone, body, status, created_by, kind)
  VALUES (p_crm_business, p_phone, p_body, 'pendiente', 'panel-acceso', 'texto');
$$;
REVOKE ALL ON FUNCTION public.nexo_panel_whatsapp_login_send(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_panel_whatsapp_login_send(UUID, TEXT, TEXT) TO service_role;

UPDATE nexo_business.catalog_sources SET crm_business_id = '8771c6ed-9dbf-497d-b3df-be6697ba2693'
 WHERE business_id = 'casa-viva';
-- WhatsApp now reaches many people only through their "@lid" chat id; a message
-- to <phone>@s.whatsapp.net is accepted but never shows in their chat. Send to
-- the chat id the bot already knows for that contact (to_group takes any jid).
CREATE OR REPLACE FUNCTION public.nexo_panel_whatsapp_login_send(p_crm_business UUID, p_phone TEXT, p_body TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.crm_outbox (business_id, to_phone, to_group, body, status, created_by, kind)
  SELECT p_crm_business, p_phone,
         (SELECT c.jid FROM public.crm_contacts c
           WHERE c.business_id = p_crm_business AND c.phone = p_phone AND c.jid LIKE '%@%'
           ORDER BY c.last_message_at DESC NULLS LAST LIMIT 1),
         p_body, 'pendiente', 'panel-acceso', 'texto';
$$;

-- Lennys (casaviva070@gmail.com) and Ernesto, owners of Casa Viva.
UPDATE nexo_business.members SET whatsapp = '5356885368'
 WHERE business_id = 'casa-viva' AND user_id = 'd56dd34e-f6e6-4585-8b00-cda6a6b7aef5';
UPDATE nexo_business.members SET whatsapp = '5354056173'
 WHERE business_id = 'casa-viva' AND user_id = 'd4e13a2a-b627-436a-91f6-465cbaf646c9';
