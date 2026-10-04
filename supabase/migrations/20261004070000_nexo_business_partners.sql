-- Socios: suppliers on consignment (Casa Bella, Cítricos Caribe) and investors
-- (Maryta, Dayra, Nana, Joyce). A socio is one more kind of person, so sign-up,
-- approval, balance, payouts and the own panel are shared with gestoras.
-- * people.partner_type: 'consignment' | 'investor'; partner_rule + value:
--     supplier_price   — the product's purchase cost per unit sold (consignment)
--     percent_of_sale  — value % of the line total
--     fixed_per_unit   — value USD per unit sold
--     percent_of_profit— value % of the line profit (price − cost − commission − %)
-- * product_costs.partner_id: whose merchandise the product is.
-- * The sale trigger now also writes a 'partner' entry for each line of a
--   socio's product; returns void it like any other entry.
-- Additive.

ALTER TABLE nexo_business.people DROP CONSTRAINT IF EXISTS people_kind_check;
ALTER TABLE nexo_business.people ADD CONSTRAINT people_kind_check CHECK (kind IN ('gestor', 'staff', 'partner'));
ALTER TABLE nexo_business.people
  ADD COLUMN IF NOT EXISTS partner_type TEXT CHECK (partner_type IS NULL OR partner_type IN ('consignment', 'investor')),
  ADD COLUMN IF NOT EXISTS partner_rule TEXT CHECK (partner_rule IS NULL OR partner_rule IN ('supplier_price', 'percent_of_sale', 'fixed_per_unit', 'percent_of_profit')),
  ADD COLUMN IF NOT EXISTS partner_value NUMERIC(10, 2) CHECK (partner_value IS NULL OR partner_value >= 0);
ALTER TABLE nexo_business.commission_entries DROP CONSTRAINT IF EXISTS commission_entries_kind_check;
ALTER TABLE nexo_business.commission_entries ADD CONSTRAINT commission_entries_kind_check
  CHECK (kind IN ('gestor', 'extra_gestor', 'extra_staff', 'staff', 'partner'));
ALTER TABLE nexo_business.product_costs ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES nexo_business.people(id);

-- Socio share of one sold line.
CREATE OR REPLACE FUNCTION nexo_business.partner_share(p_business TEXT, p_product TEXT, p_qty BIGINT, p_line_minor BIGINT)
RETURNS TABLE (person_id UUID, amount_usd NUMERIC)
LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT p.id,
    CASE p.partner_rule
      WHEN 'supplier_price' THEN p_qty * c.purchase_amount / c.purchase_rate
      WHEN 'percent_of_sale' THEN p_line_minor / 100.0 * coalesce(p.partner_value, 0) / 100
      WHEN 'fixed_per_unit' THEN p_qty * coalesce(p.partner_value, 0)
      WHEN 'percent_of_profit' THEN greatest(0, p_line_minor / 100.0 - p_qty * (x.total_cost + x.commission) - p_line_minor / 100.0 * x.pct / 100)
                                    * coalesce(p.partner_value, 0) / 100
      ELSE 0 END
    FROM nexo_business.product_costs c
    JOIN nexo_business.people p ON p.id = c.partner_id AND p.kind = 'partner' AND p.status = 'active'
    LEFT JOIN nexo_business.product_unit_economics(p_business) x ON x.product_id = c.product_id
   WHERE c.business_id = p_business AND c.product_id = p_product;
$$;
REVOKE ALL ON FUNCTION nexo_business.partner_share(TEXT, TEXT, BIGINT, BIGINT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION nexo_business.record_commissions() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  p JSONB := NEW.envelope->'payload';
  v_gestor UUID;
  v_staff UUID;
  l JSONB;
  v_qty BIGINT;
  v_line BIGINT;
BEGIN
  IF NEW.operation_type = 'sale.completed' THEN
    IF jsonb_typeof(p->'lines') <> 'array' THEN RETURN NEW; END IF;
    v_gestor := (SELECT id FROM nexo_business.people WHERE id::text = p->>'gestor_id' AND business_id = NEW.business_id AND kind = 'gestor');
    v_staff := (SELECT id FROM nexo_business.people WHERE id::text = p->>'staff_id' AND business_id = NEW.business_id AND kind = 'staff');
    FOR l IN SELECT * FROM jsonb_array_elements(p->'lines') LOOP
      v_qty := (l->>'quantity')::BIGINT;
      v_line := coalesce((l->>'line_total_minor')::BIGINT, v_qty * (l->>'unit_price_minor')::BIGINT);
      IF v_gestor IS NOT NULL OR v_staff IS NOT NULL THEN
        INSERT INTO nexo_business.commission_entries (business_id, person_id, sale_id, product_id, kind, quantity, amount_usd, event_id)
        SELECT NEW.business_id, e.person_id, p->>'sale_id', l->>'product_id', e.kind, v_qty, round(e.amount_usd, 4), NEW.event_id
          FROM nexo_business.line_entries(NEW.business_id, v_gestor, v_staff, l->>'product_id', v_qty, v_line,
                 coalesce((l->>'extra')::BOOLEAN, FALSE)) e
         WHERE e.amount_usd > 0;
      END IF;
      INSERT INTO nexo_business.commission_entries (business_id, person_id, sale_id, product_id, kind, quantity, amount_usd, event_id)
      SELECT NEW.business_id, s.person_id, p->>'sale_id', l->>'product_id', 'partner', v_qty, round(s.amount_usd, 4), NEW.event_id
        FROM nexo_business.partner_share(NEW.business_id, l->>'product_id', v_qty, v_line) s
       WHERE s.amount_usd > 0;
    END LOOP;
  ELSIF NEW.operation_type = 'sale.returned' AND jsonb_typeof(p->'lines') = 'array' THEN
    UPDATE nexo_business.commission_entries ce SET status = 'void', voided_at = now()
     WHERE ce.business_id = NEW.business_id AND ce.sale_id = p->>'sale_id' AND ce.status = 'available'
       AND ce.product_id IN (SELECT x->>'product_id' FROM jsonb_array_elements(p->'lines') x);
  END IF;
  RETURN NEW;
END;
$$;

-- Owner: product ownership (Casa Viva = NULL).
CREATE OR REPLACE FUNCTION public.nexo_business_set_product_partner(p_business TEXT, p_product TEXT, p_partner UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_partner IS NOT NULL AND NOT EXISTS (SELECT 1 FROM nexo_business.people WHERE id = p_partner AND business_id = p_business AND kind = 'partner') THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Socio desconocido');
  END IF;
  UPDATE nexo_business.product_costs SET partner_id = p_partner, updated_by = auth.uid(), updated_at = now()
   WHERE business_id = p_business AND product_id = p_product;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Primero guarda el costo del producto'); END IF;
  INSERT INTO nexo_business.cost_audit (business_id, subject, after, changed_by)
  VALUES (p_business, 'product_partner:' || p_product, jsonb_build_object('partner_id', p_partner), auth.uid());
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_set_product_partner(TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_product_partner(TEXT, TEXT, UUID) TO authenticated;

-- people(), person_save(), join() and my_account() learn the socio fields.
CREATE OR REPLACE FUNCTION public.nexo_business_people(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', p.id, 'kind', p.kind, 'fullName', p.full_name, 'phone', p.phone, 'email', p.email, 'payout', p.payout,
      'status', p.status, 'commissionMode', p.commission_mode, 'commissionValue', p.commission_value, 'note', p.note,
      'partnerType', p.partner_type, 'partnerRule', p.partner_rule, 'partnerValue', p.partner_value,
      'products', CASE WHEN p.kind = 'partner' THEN (SELECT count(*) FROM nexo_business.product_costs c WHERE c.partner_id = p.id) END,
      'createdAt', p.created_at, 'hasAccount', p.user_id IS NOT NULL,
      'lastOrderAt', (SELECT max(created_at) FROM nexo_business.orders o WHERE o.gestor_id = p.id),
      'balance', nexo_business.person_balance(p.id)) ORDER BY (p.status = 'pending') DESC, p.full_name)
    FROM nexo_business.people p WHERE p.business_id = p_business), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.nexo_business_person_save(p_business TEXT, p_id UUID, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v nexo_business.people;
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_id IS NULL THEN
    INSERT INTO nexo_business.people (business_id, kind, full_name, phone, status, approved_by, approved_at, partner_type, partner_rule, partner_value)
    VALUES (p_business, p_data->>'kind', trim(p_data->>'fullName'), nullif(trim(p_data->>'phone'), ''), 'active', auth.uid(), now(),
            nullif(p_data->>'partnerType', ''), nullif(p_data->>'partnerRule', ''), nullif(p_data->>'partnerValue', '')::numeric)
    RETURNING * INTO v;
  ELSE
    SELECT * INTO v FROM nexo_business.people WHERE id = p_id AND business_id = p_business;
    IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
    UPDATE nexo_business.people SET
      full_name = coalesce(nullif(trim(p_data->>'fullName'), ''), full_name),
      phone = CASE WHEN p_data ? 'phone' THEN nullif(trim(p_data->>'phone'), '') ELSE phone END,
      status = coalesce(p_data->>'status', status),
      commission_mode = CASE WHEN p_data ? 'commissionMode' THEN nullif(p_data->>'commissionMode', '') ELSE commission_mode END,
      commission_value = CASE WHEN p_data ? 'commissionValue' THEN nullif(p_data->>'commissionValue', '')::numeric ELSE commission_value END,
      partner_type = CASE WHEN p_data ? 'partnerType' THEN nullif(p_data->>'partnerType', '') ELSE partner_type END,
      partner_rule = CASE WHEN p_data ? 'partnerRule' THEN nullif(p_data->>'partnerRule', '') ELSE partner_rule END,
      partner_value = CASE WHEN p_data ? 'partnerValue' THEN nullif(p_data->>'partnerValue', '')::numeric ELSE partner_value END,
      note = CASE WHEN p_data ? 'note' THEN nullif(trim(p_data->>'note'), '') ELSE note END,
      approved_by = CASE WHEN p_data->>'status' = 'active' AND status <> 'active' THEN auth.uid() ELSE approved_by END,
      approved_at = CASE WHEN p_data->>'status' = 'active' AND status <> 'active' THEN now() ELSE approved_at END
    WHERE id = p_id RETURNING * INTO v;
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', v.id);
EXCEPTION WHEN check_violation OR not_null_violation OR invalid_text_representation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.nexo_business_join(p_business TEXT, p_kind TEXT, p_profile JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_kind NOT IN ('gestor', 'staff', 'partner') OR NOT EXISTS (SELECT 1 FROM nexo_business.cost_settings WHERE business_id = p_business) THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Enlace de registro no válido');
  END IF;
  INSERT INTO nexo_business.people (business_id, user_id, kind, full_name, phone, email, payout)
  VALUES (p_business, auth.uid(), p_kind, trim(p_profile->>'fullName'), nullif(trim(p_profile->>'phone'), ''),
          (SELECT email FROM auth.users WHERE id = auth.uid()), coalesce(p_profile->'payout', '{}'::jsonb))
  ON CONFLICT (business_id, user_id, kind) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, payout = EXCLUDED.payout
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
EXCEPTION WHEN check_violation OR not_null_violation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', 'Revisa el nombre (2 a 80 letras) y el teléfono');
END;
$$;

-- A registered socio links to the record the owner already created: the
-- owner gives that record's link (…&socio=<id>) and the first sign-in claims it.
CREATE OR REPLACE FUNCTION public.nexo_business_claim_partner(p_business TEXT, p_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  UPDATE nexo_business.people SET user_id = auth.uid(), email = (SELECT email FROM auth.users WHERE id = auth.uid())
   WHERE id = p_id AND business_id = p_business AND kind = 'partner' AND user_id IS NULL;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Este enlace ya se usó o no es válido'); END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_claim_partner(TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_claim_partner(TEXT, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_my_account(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
DECLARE
  v_me nexo_business.people := nexo_business.me(p_business);
BEGIN
  IF v_me.id IS NULL THEN RETURN jsonb_build_object('registered', false); END IF;
  RETURN jsonb_build_object('registered', true,
    'person', jsonb_build_object('id', v_me.id, 'kind', v_me.kind, 'fullName', v_me.full_name, 'phone', v_me.phone,
       'email', v_me.email, 'payout', v_me.payout, 'status', v_me.status,
       'partnerType', v_me.partner_type, 'partnerRule', v_me.partner_rule, 'partnerValue', v_me.partner_value),
    'balance', nexo_business.person_balance(v_me.id),
    'products', CASE WHEN v_me.kind = 'partner' THEN coalesce((
        SELECT jsonb_agg(jsonb_build_object('productId', c.product_id, 'name', p.name, 'imageUrl', p.image_url,
          'stock', coalesce(st.quantity, 0), 'priceMinor', (p.prices->>'USD')::BIGINT,
          'soldUnits', (SELECT coalesce(sum(quantity), 0) FROM nexo_business.commission_entries e WHERE e.person_id = v_me.id AND e.product_id = c.product_id AND e.status = 'available'))
          ORDER BY p.name)
          FROM nexo_business.product_costs c JOIN nexo_business.catalog_products p ON p.business_id = c.business_id AND p.product_id = c.product_id
          LEFT JOIN nexo_business.stock_by_product st ON st.business_id = c.business_id AND st.product_id = c.product_id
         WHERE c.partner_id = v_me.id), '[]'::jsonb) END,
    'entries', coalesce((SELECT jsonb_agg(jsonb_build_object('at', e.created_at, 'kind', e.kind, 'productId', e.product_id,
        'name', c.name, 'quantity', e.quantity, 'amountUsd', round(e.amount_usd, 2), 'status', e.status) ORDER BY e.created_at DESC)
      FROM (SELECT * FROM nexo_business.commission_entries WHERE person_id = v_me.id ORDER BY created_at DESC LIMIT 100) e
      LEFT JOIN nexo_business.catalog_products c ON c.business_id = p_business AND c.product_id = e.product_id), '[]'::jsonb));
END;
$$;

-- The cost sheet shows each product's owner.
CREATE OR REPLACE FUNCTION public.nexo_business_product_partners(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_object_agg(product_id, partner_id) FROM nexo_business.product_costs
                    WHERE business_id = p_business AND partner_id IS NOT NULL), '{}'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_product_partners(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_product_partners(TEXT) TO authenticated;
