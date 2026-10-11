-- Mensajeros en la caja y clientes unidos (2026-10-11).
-- * Los mensajeros viven en la web (Core, rol cvd_messenger, la dueña los aprueba en el panel).
--   El puente (nexo-stock-bridge) los copia aquí como people.kind='messenger' para que la caja los elija.
-- * Los clientes viven en la web (cvd_clients). El puente envía allí los clientes que la caja anota
--   al cobrar (sale.completed → payload.customer) y los contactos del bot (crm_contacts, rol cliente).

ALTER TABLE nexo_business.people DROP CONSTRAINT IF EXISTS people_kind_check;
ALTER TABLE nexo_business.people ADD CONSTRAINT people_kind_check CHECK (kind IN ('gestor', 'staff', 'partner', 'messenger'));
ALTER TABLE nexo_business.people ADD COLUMN IF NOT EXISTS woo_user_id BIGINT;
CREATE UNIQUE INDEX IF NOT EXISTS people_woo_user_idx ON nexo_business.people (business_id, kind, woo_user_id) WHERE woo_user_id IS NOT NULL;

ALTER TABLE nexo_business.catalog_sources
  ADD COLUMN IF NOT EXISTS customers_checkpoint TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bot_contacts_checkpoint TIMESTAMPTZ;

-- Mensajeros de la web → people. items: [{wooId, name, phone, status}]. Aprobado = activo; lo demás, inactivo.
CREATE OR REPLACE FUNCTION public.nexo_business_sync_messengers(p_business TEXT, p_items JSONB)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE i JSONB; n INT := 0; v_status TEXT; v_name TEXT;
BEGIN
  FOR i IN SELECT * FROM jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) LOOP
    v_status := CASE WHEN i->>'status' = 'approved' THEN 'active' ELSE 'inactive' END;
    v_name := left(coalesce(nullif(trim(i->>'name'), ''), 'Mensajero ' || (i->>'wooId')), 80);
    IF length(v_name) < 2 THEN v_name := 'Mensajero'; END IF;
    UPDATE nexo_business.people SET full_name = v_name, status = v_status,
           phone = CASE WHEN length(coalesce(i->>'phone', '')) BETWEEN 6 AND 20 THEN i->>'phone' ELSE phone END
     WHERE business_id = p_business AND kind = 'messenger' AND woo_user_id = (i->>'wooId')::bigint
       AND (full_name, status, coalesce(phone, '')) IS DISTINCT FROM (v_name, v_status, coalesce(i->>'phone', ''));
    IF NOT FOUND AND NOT EXISTS (SELECT 1 FROM nexo_business.people WHERE business_id = p_business AND kind = 'messenger' AND woo_user_id = (i->>'wooId')::bigint) THEN
      INSERT INTO nexo_business.people (business_id, kind, full_name, phone, status, woo_user_id)
      VALUES (p_business, 'messenger', v_name, CASE WHEN length(coalesce(i->>'phone', '')) BETWEEN 6 AND 20 THEN i->>'phone' END, v_status, (i->>'wooId')::bigint);
    END IF;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

-- Clientes anotados en la caja desde el último envío. Devuelve también el WhatsApp de la gestora de la venta.
CREATE OR REPLACE FUNCTION public.nexo_business_customers_from_sales(p_business TEXT, p_limit INT DEFAULT 300)
RETURNS TABLE(received_at TIMESTAMPTZ, phone TEXT, name TEXT, owner_phone TEXT, usd NUMERIC, at TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT e.received_at, e.envelope->'payload'->'customer'->>'phone', e.envelope->'payload'->'customer'->>'name',
         g.phone, round((e.envelope->'payload'->>'total_minor')::numeric / 100, 2), e.occurred_at
    FROM nexo_business.sync_events e
    JOIN nexo_business.catalog_sources s ON s.business_id = e.business_id
    LEFT JOIN nexo_business.people g ON g.business_id = e.business_id AND g.id::text = e.envelope->'payload'->>'gestor_id'
   WHERE e.business_id = p_business AND e.operation_type = 'sale.completed'
     AND coalesce(e.envelope->'payload'->'customer'->>'phone', '') <> ''
     AND e.received_at > coalesce(s.customers_checkpoint, '-infinity')
   ORDER BY e.received_at LIMIT p_limit;
$$;

-- Contactos del bot que son clientes (no gestoras ni mensajeros), nuevos o con mensajes desde el último envío.
CREATE OR REPLACE FUNCTION public.nexo_business_bot_customers(p_business TEXT, p_limit INT DEFAULT 300)
RETURNS TABLE(changed_at TIMESTAMPTZ, phone TEXT, name TEXT, opt_out BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT greatest(c.created_at, coalesce(c.last_message_at, c.created_at)), c.phone, c.name, c.opt_in_marketing IS FALSE
    FROM public.crm_contacts c, nexo_business.catalog_sources s
   WHERE s.business_id = p_business AND coalesce(c.role, 'cliente') = 'cliente' AND coalesce(c.phone, '') <> ''
     AND greatest(c.created_at, coalesce(c.last_message_at, c.created_at)) > coalesce(s.bot_contacts_checkpoint, '-infinity')
   ORDER BY 1 LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.nexo_business_set_customer_checkpoints(p_business TEXT, p_sales TIMESTAMPTZ, p_bot TIMESTAMPTZ)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE nexo_business.catalog_sources
     SET customers_checkpoint = coalesce(p_sales, customers_checkpoint),
         bot_contacts_checkpoint = coalesce(p_bot, bot_contacts_checkpoint)
   WHERE business_id = p_business;
$$;

REVOKE ALL ON FUNCTION public.nexo_business_sync_messengers(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.nexo_business_customers_from_sales(TEXT, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.nexo_business_bot_customers(TEXT, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.nexo_business_set_customer_checkpoints(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_sync_messengers(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.nexo_business_customers_from_sales(TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.nexo_business_bot_customers(TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_customer_checkpoints(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
