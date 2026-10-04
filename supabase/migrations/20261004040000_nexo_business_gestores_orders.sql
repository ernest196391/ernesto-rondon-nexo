-- Gestoras, dependientas, orders, commissions and payouts (replaces the
-- BizneCubano gestor program). See docs/nexo-business/ECONOMY_AND_ROLES.md.
--
-- * people: gestoras and dependientas. They sign up themselves (pending) and
--   the owner approves them; the owner can also add them.
-- * orders: a gestora's (or the shop's) order for a client, with delivery and
--   the CUP messenger fee. Pending → paid → completed, or cancelled. When it is
--   completed it becomes an ordinary 'sale.completed' event from the virtual
--   device '<business>-orders', so stock, reports and cash read one source.
-- * commission_entries: an append-only ledger written when a sale event that
--   names a gestora or a dependienta arrives (POS or order). Amounts use the
--   rules in force at that moment; later changes never rewrite history.
--     gestora, normal line: product commission × qty
--     gestora, extra line:  commission split gestora / business / dependienta
--     dependienta:          line total × clerk %
--   Returns void the entries of the returned products.
-- * payouts: a person asks for the available balance; the owner pays it (CUP
--   at the rate of the day, or USD) with a reference, or rejects it.
-- Gestoras and dependientas are never business members: many owner functions
-- only check membership. Their access goes through people.user_id (me()).
-- Additive.

CREATE TABLE IF NOT EXISTS nexo_business.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  user_id UUID,
  kind TEXT NOT NULL CHECK (kind IN ('gestor', 'staff')),
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) BETWEEN 2 AND 80),
  phone TEXT CHECK (phone IS NULL OR length(trim(phone)) BETWEEN 6 AND 20),
  email TEXT,
  payout JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payout) = 'object'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  commission_mode TEXT CHECK (commission_mode IS NULL OR commission_mode IN ('fixed', 'percent')),
  commission_value NUMERIC(10, 2) CHECK (commission_value IS NULL OR commission_value >= 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  UNIQUE (business_id, user_id, kind)
);
CREATE INDEX IF NOT EXISTS people_business ON nexo_business.people (business_id, kind, status);

CREATE SEQUENCE IF NOT EXISTS nexo_business.order_number_seq;
CREATE TABLE IF NOT EXISTS nexo_business.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  number BIGINT NOT NULL DEFAULT nextval('nexo_business.order_number_seq'),
  gestor_id UUID REFERENCES nexo_business.people(id),
  staff_id UUID REFERENCES nexo_business.people(id),
  customer_name TEXT NOT NULL CHECK (length(trim(customer_name)) BETWEEN 1 AND 80),
  customer_phone TEXT,
  delivery TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery IN ('pickup', 'home')),
  address TEXT,
  delivery_fee_cup BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_cup >= 0),
  lines JSONB NOT NULL CHECK (jsonb_typeof(lines) = 'array' AND jsonb_array_length(lines) > 0),
  total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled')),
  payment JSONB,
  note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  sale_event_id TEXT
);
CREATE INDEX IF NOT EXISTS orders_business ON nexo_business.orders (business_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_gestor ON nexo_business.orders (gestor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nexo_business.commission_entries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id TEXT NOT NULL,
  person_id UUID NOT NULL REFERENCES nexo_business.people(id),
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('gestor', 'extra_gestor', 'extra_staff', 'staff')),
  quantity BIGINT NOT NULL,
  amount_usd NUMERIC(12, 4) NOT NULL CHECK (amount_usd >= 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'void')),
  event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  voided_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS commission_person ON nexo_business.commission_entries (person_id, status);
CREATE INDEX IF NOT EXISTS commission_sale ON nexo_business.commission_entries (business_id, sale_id);

CREATE TABLE IF NOT EXISTS nexo_business.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  person_id UUID NOT NULL REFERENCES nexo_business.people(id),
  amount_usd NUMERIC(12, 2) NOT NULL CHECK (amount_usd > 0),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'paid', 'rejected')),
  method TEXT,
  currency TEXT CHECK (currency IS NULL OR currency IN ('USD', 'CUP', 'MLC')),
  rate NUMERIC(14, 4),
  amount_paid NUMERIC(14, 2),
  reference TEXT,
  note TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  decided_by UUID
);
CREATE INDEX IF NOT EXISTS payouts_person ON nexo_business.payouts (person_id, status);

ALTER TABLE nexo_business.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexo_business.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexo_business.commission_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexo_business.payouts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.people, nexo_business.orders, nexo_business.commission_entries, nexo_business.payouts FROM PUBLIC, anon, authenticated;

-- ---------- Commission rules (one place) ----------
-- Commission of one line for a gestora: the gestora's own rule, else the
-- product's, else the business default.
CREATE OR REPLACE FUNCTION nexo_business.line_commission(p_business TEXT, p_gestor UUID, p_product TEXT, p_qty BIGINT, p_line_minor BIGINT)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT CASE
    WHEN g.commission_mode = 'fixed' THEN g.commission_value * p_qty
    WHEN g.commission_mode = 'percent' THEN p_line_minor / 100.0 * g.commission_value / 100
    WHEN c.commission_usd IS NOT NULL THEN c.commission_usd * p_qty
    WHEN s.commission_mode = 'percent' THEN p_line_minor / 100.0 * s.commission_value / 100
    ELSE coalesce(s.commission_value, 0) * p_qty END
  FROM (SELECT 1) one
  LEFT JOIN nexo_business.people g ON g.id = p_gestor
  LEFT JOIN nexo_business.product_costs c ON c.business_id = p_business AND c.product_id = p_product
  LEFT JOIN nexo_business.cost_settings s ON s.business_id = p_business;
$$;
REVOKE ALL ON FUNCTION nexo_business.line_commission(TEXT, UUID, TEXT, BIGINT, BIGINT) FROM PUBLIC, anon, authenticated;

-- Entries of one sale line: (person, kind, amount).
CREATE OR REPLACE FUNCTION nexo_business.line_entries(p_business TEXT, p_gestor UUID, p_staff UUID, p_product TEXT,
  p_qty BIGINT, p_line_minor BIGINT, p_extra BOOLEAN)
RETURNS TABLE (person_id UUID, kind TEXT, amount_usd NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
DECLARE
  s nexo_business.cost_settings;
  v_comm NUMERIC;
  v_staff_pct NUMERIC;
BEGIN
  SELECT * INTO s FROM nexo_business.cost_settings WHERE business_id = p_business;
  IF p_gestor IS NOT NULL THEN
    v_comm := coalesce(nexo_business.line_commission(p_business, p_gestor, p_product, p_qty, p_line_minor), 0);
    IF coalesce(p_extra, FALSE) THEN
      person_id := p_gestor; kind := 'extra_gestor'; amount_usd := v_comm * coalesce(s.split_gestor_pct, 33.34) / 100; RETURN NEXT;
      IF p_staff IS NOT NULL THEN
        person_id := p_staff; kind := 'extra_staff'; amount_usd := v_comm * coalesce(s.split_staff_pct, 33.33) / 100; RETURN NEXT;
      END IF;
    ELSE
      person_id := p_gestor; kind := 'gestor'; amount_usd := v_comm; RETURN NEXT;
    END IF;
  END IF;
  IF p_staff IS NOT NULL THEN
    SELECT coalesce(c.staff_pct, s.staff_pct, 0) INTO v_staff_pct
      FROM (SELECT 1) one LEFT JOIN nexo_business.product_costs c ON c.business_id = p_business AND c.product_id = p_product;
    IF v_staff_pct > 0 THEN
      person_id := p_staff; kind := 'staff'; amount_usd := p_line_minor / 100.0 * v_staff_pct / 100; RETURN NEXT;
    END IF;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION nexo_business.line_entries(TEXT, UUID, UUID, TEXT, BIGINT, BIGINT, BOOLEAN) FROM PUBLIC, anon, authenticated;

-- Ledger writer: runs for every new sale or return event.
CREATE OR REPLACE FUNCTION nexo_business.record_commissions() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  p JSONB := NEW.envelope->'payload';
  v_gestor UUID;
  v_staff UUID;
  l JSONB;
BEGIN
  IF NEW.operation_type = 'sale.completed' THEN
    v_gestor := (SELECT id FROM nexo_business.people WHERE id::text = p->>'gestor_id' AND business_id = NEW.business_id);
    v_staff := (SELECT id FROM nexo_business.people WHERE id::text = p->>'staff_id' AND business_id = NEW.business_id);
    IF (v_gestor IS NULL AND v_staff IS NULL) OR jsonb_typeof(p->'lines') <> 'array' THEN RETURN NEW; END IF;
    FOR l IN SELECT * FROM jsonb_array_elements(p->'lines') LOOP
      INSERT INTO nexo_business.commission_entries (business_id, person_id, sale_id, product_id, kind, quantity, amount_usd, event_id)
      SELECT NEW.business_id, e.person_id, p->>'sale_id', l->>'product_id', e.kind, (l->>'quantity')::BIGINT, round(e.amount_usd, 4), NEW.event_id
        FROM nexo_business.line_entries(NEW.business_id, v_gestor, v_staff, l->>'product_id', (l->>'quantity')::BIGINT,
               coalesce((l->>'line_total_minor')::BIGINT, (l->>'quantity')::BIGINT * (l->>'unit_price_minor')::BIGINT),
               coalesce((l->>'extra')::BOOLEAN, FALSE)) e
       WHERE e.amount_usd > 0;
    END LOOP;
  ELSIF NEW.operation_type = 'sale.returned' AND jsonb_typeof(p->'lines') = 'array' THEN
    UPDATE nexo_business.commission_entries ce SET status = 'void', voided_at = now()
     WHERE ce.business_id = NEW.business_id AND ce.sale_id = p->>'sale_id' AND ce.status = 'available'
       AND ce.product_id IN (SELECT x->>'product_id' FROM jsonb_array_elements(p->'lines') x);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_events_commissions ON nexo_business.sync_events;
CREATE TRIGGER sync_events_commissions AFTER INSERT ON nexo_business.sync_events
  FOR EACH ROW WHEN (NEW.operation_type IN ('sale.completed', 'sale.returned'))
  EXECUTE FUNCTION nexo_business.record_commissions();

-- Balance of a person: available entries − payouts asked for or paid.
CREATE OR REPLACE FUNCTION nexo_business.person_balance(p_person UUID)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT jsonb_build_object(
    'earnedUsd', round(coalesce((SELECT sum(amount_usd) FROM nexo_business.commission_entries WHERE person_id = p_person AND status = 'available'), 0), 2),
    'paidUsd', coalesce((SELECT sum(amount_usd) FROM nexo_business.payouts WHERE person_id = p_person AND status = 'paid'), 0),
    'requestedUsd', coalesce((SELECT sum(amount_usd) FROM nexo_business.payouts WHERE person_id = p_person AND status = 'requested'), 0),
    'availableUsd', round(coalesce((SELECT sum(amount_usd) FROM nexo_business.commission_entries WHERE person_id = p_person AND status = 'available'), 0)
                      - coalesce((SELECT sum(amount_usd) FROM nexo_business.payouts WHERE person_id = p_person AND status IN ('requested', 'paid')), 0), 2),
    'pendingUsd', round(coalesce((
        SELECT sum(e.amount_usd) FROM nexo_business.orders o
        CROSS JOIN LATERAL jsonb_array_elements(o.lines) l
        CROSS JOIN LATERAL nexo_business.line_entries(o.business_id, o.gestor_id, o.staff_id, l->>'product_id', (l->>'quantity')::BIGINT,
               (l->>'quantity')::BIGINT * (l->>'unit_price_minor')::BIGINT, coalesce((l->>'extra')::BOOLEAN, FALSE)) e
         WHERE o.status IN ('pending', 'paid') AND (o.gestor_id = p_person OR o.staff_id = p_person) AND e.person_id = p_person), 0), 2),
    'completedOrders', (SELECT count(*) FROM nexo_business.orders WHERE gestor_id = p_person AND status = 'completed'),
    'contributedMinor', coalesce((SELECT sum(total_minor) FROM nexo_business.orders WHERE gestor_id = p_person AND status = 'completed'), 0));
$$;
REVOKE ALL ON FUNCTION nexo_business.person_balance(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION nexo_business.is_admin(p_business TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT coalesce(nexo_business.role_of(p_business) IN ('owner', 'economist'), FALSE);
$$;
REVOKE ALL ON FUNCTION nexo_business.is_admin(TEXT) FROM PUBLIC, anon, authenticated;

-- The signed-in person's record in a business (active or not).
CREATE OR REPLACE FUNCTION nexo_business.me(p_business TEXT)
RETURNS nexo_business.people LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT * FROM nexo_business.people WHERE business_id = p_business AND user_id = auth.uid()
   ORDER BY (status = 'active') DESC, created_at LIMIT 1;
$$;
REVOKE ALL ON FUNCTION nexo_business.me(TEXT) FROM PUBLIC, anon, authenticated;

-- ---------- Sign-up (gestoras / dependientas) ----------
CREATE OR REPLACE FUNCTION public.nexo_business_join(p_business TEXT, p_kind TEXT, p_profile JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_kind NOT IN ('gestor', 'staff') OR NOT EXISTS (SELECT 1 FROM nexo_business.cost_settings WHERE business_id = p_business) THEN
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
REVOKE ALL ON FUNCTION public.nexo_business_join(TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_join(TEXT, TEXT, JSONB) TO authenticated;

-- ---------- Owner: people ----------
CREATE OR REPLACE FUNCTION public.nexo_business_people(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', p.id, 'kind', p.kind, 'fullName', p.full_name, 'phone', p.phone, 'email', p.email, 'payout', p.payout,
      'status', p.status, 'commissionMode', p.commission_mode, 'commissionValue', p.commission_value, 'note', p.note,
      'createdAt', p.created_at, 'hasAccount', p.user_id IS NOT NULL,
      'lastOrderAt', (SELECT max(created_at) FROM nexo_business.orders o WHERE o.gestor_id = p.id),
      'balance', nexo_business.person_balance(p.id)) ORDER BY (p.status = 'pending') DESC, p.full_name)
    FROM nexo_business.people p WHERE p.business_id = p_business), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_people(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_people(TEXT) TO authenticated;

-- Create (p_id NULL) or change a person: status, rule, data. Approving links the account.
CREATE OR REPLACE FUNCTION public.nexo_business_person_save(p_business TEXT, p_id UUID, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v nexo_business.people;
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_id IS NULL THEN
    INSERT INTO nexo_business.people (business_id, kind, full_name, phone, status, approved_by, approved_at)
    VALUES (p_business, p_data->>'kind', trim(p_data->>'fullName'), nullif(trim(p_data->>'phone'), ''), 'active', auth.uid(), now())
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
REVOKE ALL ON FUNCTION public.nexo_business_person_save(TEXT, UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_person_save(TEXT, UUID, JSONB) TO authenticated;

-- ---------- Catalog for gestoras (what they may sell, with their commission) ----------
CREATE OR REPLACE FUNCTION public.nexo_business_shop(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
DECLARE
  v_me nexo_business.people := nexo_business.me(p_business);
BEGIN
  IF NOT nexo_business.is_admin(p_business) AND coalesce(v_me.status, '') <> 'active' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('productId', p.product_id, 'name', p.name, 'category', p.category,
      'imageUrl', p.image_url, 'priceMinor', (p.prices->>'USD')::BIGINT, 'stock', coalesce(st.quantity, 0),
      'commissionUsd', round(nexo_business.line_commission(p_business, CASE WHEN v_me.kind = 'gestor' THEN v_me.id END, p.product_id, 1, (p.prices->>'USD')::BIGINT), 2))
      ORDER BY p.name)
    FROM nexo_business.catalog_products p
    LEFT JOIN nexo_business.stock_by_product st ON st.business_id = p.business_id AND st.product_id = p.product_id
    WHERE p.business_id = p_business AND p.active AND p.prices ? 'USD'), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_shop(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_shop(TEXT) TO authenticated;

-- ---------- Orders ----------
-- Create or edit a pending order. Prices come from the catalog, never from the client.
CREATE OR REPLACE FUNCTION public.nexo_business_order_save(p_business TEXT, p_order JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin BOOLEAN := nexo_business.is_admin(p_business);
  v_me nexo_business.people := nexo_business.me(p_business);
  v_id UUID := nullif(p_order->>'id', '')::uuid;
  v_old nexo_business.orders;
  v_gestor UUID;
  v_lines JSONB := '[]'::jsonb;
  v_total BIGINT := 0;
  l JSONB;
  v_price BIGINT;
  v_name TEXT;
BEGIN
  IF NOT v_admin AND coalesce(v_me.status, '') <> 'active' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  v_gestor := CASE WHEN v_admin THEN nullif(p_order->>'gestorId', '')::uuid WHEN v_me.kind = 'gestor' THEN v_me.id END;
  IF v_gestor IS NOT NULL AND NOT EXISTS (SELECT 1 FROM nexo_business.people WHERE id = v_gestor AND business_id = p_business AND kind = 'gestor') THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Gestora desconocida');
  END IF;
  IF v_id IS NOT NULL THEN
    SELECT * INTO v_old FROM nexo_business.orders WHERE id = v_id AND business_id = p_business;
    IF NOT FOUND OR v_old.status <> 'pending' OR (NOT v_admin AND v_old.gestor_id IS DISTINCT FROM v_me.id) THEN
      RETURN jsonb_build_object('error', 'invalid', 'message', 'Solo se editan pedidos pendientes propios');
    END IF;
  END IF;
  FOR l IN SELECT * FROM jsonb_array_elements(coalesce(p_order->'lines', '[]'::jsonb)) LOOP
    SELECT (prices->>'USD')::BIGINT, name INTO v_price, v_name FROM nexo_business.catalog_products
     WHERE business_id = p_business AND product_id = l->>'productId' AND active;
    IF v_price IS NULL OR coalesce((l->>'quantity')::INT, 0) < 1 THEN
      RETURN jsonb_build_object('error', 'invalid', 'message', 'Producto o cantidad no válidos');
    END IF;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('product_id', l->>'productId', 'name', v_name,
      'quantity', (l->>'quantity')::INT, 'unit_price_minor', v_price, 'extra', coalesce((l->>'extra')::BOOLEAN, FALSE)));
    v_total := v_total + v_price * (l->>'quantity')::INT;
  END LOOP;
  IF jsonb_array_length(v_lines) = 0 THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'El pedido no tiene productos'); END IF;

  IF v_id IS NULL THEN
    INSERT INTO nexo_business.orders (business_id, gestor_id, staff_id, customer_name, customer_phone, delivery, address,
        delivery_fee_cup, lines, total_minor, note, created_by)
    VALUES (p_business, v_gestor, CASE WHEN v_admin THEN nullif(p_order->>'staffId', '')::uuid WHEN v_me.kind = 'staff' THEN v_me.id END,
        trim(p_order->>'customerName'), nullif(trim(p_order->>'customerPhone'), ''), coalesce(p_order->>'delivery', 'pickup'),
        nullif(trim(p_order->>'address'), ''), coalesce((p_order->>'deliveryFeeCup')::BIGINT, 0), v_lines, v_total,
        nullif(trim(p_order->>'note'), ''), auth.uid())
    RETURNING id INTO v_id;
  ELSE
    UPDATE nexo_business.orders SET gestor_id = CASE WHEN v_admin THEN v_gestor ELSE gestor_id END,
        staff_id = CASE WHEN v_admin THEN nullif(p_order->>'staffId', '')::uuid ELSE staff_id END,
        customer_name = trim(p_order->>'customerName'), customer_phone = nullif(trim(p_order->>'customerPhone'), ''),
        delivery = coalesce(p_order->>'delivery', 'pickup'), address = nullif(trim(p_order->>'address'), ''),
        delivery_fee_cup = coalesce((p_order->>'deliveryFeeCup')::BIGINT, 0), lines = v_lines, total_minor = v_total,
        note = nullif(trim(p_order->>'note'), ''), updated_at = now()
     WHERE id = v_id;
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', v_id, 'number', (SELECT number FROM nexo_business.orders WHERE id = v_id));
EXCEPTION WHEN check_violation OR not_null_violation OR invalid_text_representation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', 'Revisa el nombre de la clienta y los datos de entrega');
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_order_save(TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_order_save(TEXT, JSONB) TO authenticated;

-- Owner moves an order: paid, completed (becomes a sale event) or cancelled.
-- p_payment for completion: {method, currency, provider?, reference?}; the amount
-- is the order total converted with the rate in force.
CREATE OR REPLACE FUNCTION public.nexo_business_order_status(p_business TEXT, p_id UUID, p_status TEXT, p_payment JSONB DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  o nexo_business.orders;
  v_device TEXT := p_business || '-orders';
  v_event TEXT;
  v_currency TEXT := upper(coalesce(p_payment->>'currency', 'USD'));
  v_rate NUMERIC;
  v_amount BIGINT;
  v_now TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  SELECT * INTO o FROM nexo_business.orders WHERE id = p_id AND business_id = p_business FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  IF o.status IN ('completed', 'cancelled') THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'El pedido ya está cerrado'); END IF;
  IF p_status = 'paid' OR p_status = 'cancelled' THEN
    UPDATE nexo_business.orders SET status = p_status, updated_at = now(), payment = coalesce(p_payment, payment) WHERE id = p_id;
    RETURN jsonb_build_object('ok', true);
  END IF;
  IF p_status <> 'completed' THEN RETURN jsonb_build_object('error', 'invalid'); END IF;

  v_rate := CASE WHEN v_currency = 'USD' THEN 1 ELSE nexo_business.rate_now(p_business, v_currency) END;
  IF v_rate IS NULL THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'No hay tasa para ' || v_currency); END IF;
  v_amount := round(o.total_minor * v_rate);
  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
  VALUES (p_business, v_device, 'Pedidos de gestoras', encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
  ON CONFLICT (business_id, device_id) DO NOTHING;
  v_event := gen_random_uuid()::text;
  INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
  VALUES (v_event, p_business, v_device, 'sale.completed', 'sale', o.id::text, v_now,
    jsonb_build_object('contract_version', 1, 'event_id', v_event, 'business_id', p_business, 'source_system', 'nexo-orders',
      'source_entity_id', o.id, 'occurred_at', v_now, 'idempotency_key', o.id,
      'payload', jsonb_build_object('sale_id', o.id, 'order_number', o.number, 'channel', CASE WHEN o.gestor_id IS NULL THEN 'store' ELSE 'gestor' END,
        'gestor_id', o.gestor_id, 'staff_id', o.staff_id, 'currency', 'USD', 'total_minor', o.total_minor,
        'lines', (SELECT jsonb_agg(jsonb_build_object('product_id', l->>'product_id', 'quantity', (l->>'quantity')::BIGINT,
                    'unit_price_minor', (l->>'unit_price_minor')::BIGINT, 'line_total_minor', (l->>'quantity')::BIGINT * (l->>'unit_price_minor')::BIGINT,
                    'extra', coalesce((l->>'extra')::BOOLEAN, FALSE))) FROM jsonb_array_elements(o.lines) l),
        'payment_method', coalesce(p_payment->>'method', 'cash'),
        'payments', jsonb_build_array(jsonb_build_object('payment_id', gen_random_uuid(), 'method', coalesce(p_payment->>'method', 'cash'),
          'rail', CASE WHEN coalesce(p_payment->>'method', 'cash') = 'cash' THEN 'cash' ELSE coalesce(p_payment->>'method', 'transfer') END,
          'currency', v_currency, 'amount_minor', v_amount, 'usd_minor', o.total_minor,
          'exchange_rate', CASE WHEN v_currency = 'USD' THEN NULL ELSE v_rate::text END,
          'provider', p_payment->>'provider', 'external_ref', nullif(trim(p_payment->>'reference'), ''))),
        'delivery_fee_cup', o.delivery_fee_cup)));
  UPDATE nexo_business.orders SET status = 'completed', completed_at = now(), updated_at = now(), sale_event_id = v_event,
         payment = coalesce(p_payment, '{}'::jsonb) || jsonb_build_object('amountMinor', v_amount, 'rate', v_rate)
   WHERE id = p_id;
  RETURN jsonb_build_object('ok', true, 'eventId', v_event);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_order_status(TEXT, UUID, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_order_status(TEXT, UUID, TEXT, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_orders(p_business TEXT, p_status TEXT DEFAULT NULL, p_limit INT DEFAULT 100)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
DECLARE
  v_admin BOOLEAN := nexo_business.is_admin(p_business);
  v_me nexo_business.people := nexo_business.me(p_business);
BEGIN
  IF NOT v_admin AND v_me.id IS NULL THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', o.id, 'number', o.number, 'status', o.status,
      'gestorId', o.gestor_id, 'gestor', g.full_name, 'gestorPhone', g.phone, 'staffId', o.staff_id, 'staff', st.full_name,
      'customerName', o.customer_name, 'customerPhone', o.customer_phone, 'delivery', o.delivery, 'address', o.address,
      'deliveryFeeCup', o.delivery_fee_cup, 'lines', o.lines, 'totalMinor', o.total_minor, 'payment', o.payment, 'note', o.note,
      'createdAt', o.created_at, 'completedAt', o.completed_at) ORDER BY o.created_at DESC)
    FROM (SELECT * FROM nexo_business.orders x
           WHERE x.business_id = p_business AND (p_status IS NULL OR x.status = p_status)
             AND (v_admin OR x.gestor_id = v_me.id OR x.staff_id = v_me.id)
           ORDER BY x.created_at DESC LIMIT least(greatest(coalesce(p_limit, 100), 1), 500)) o
    LEFT JOIN nexo_business.people g ON g.id = o.gestor_id
    LEFT JOIN nexo_business.people st ON st.id = o.staff_id), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_orders(TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_orders(TEXT, TEXT, INT) TO authenticated;

-- ---------- Payouts ----------
CREATE OR REPLACE FUNCTION public.nexo_business_request_payout(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_me nexo_business.people := nexo_business.me(p_business);
  v_available NUMERIC;
BEGIN
  IF coalesce(v_me.status, '') <> 'active' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_me.id::text));
  IF EXISTS (SELECT 1 FROM nexo_business.payouts WHERE person_id = v_me.id AND status = 'requested') THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Ya tienes una solicitud en curso');
  END IF;
  v_available := (nexo_business.person_balance(v_me.id)->>'availableUsd')::numeric;
  IF v_available < 1 THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'No hay saldo disponible para retirar'); END IF;
  INSERT INTO nexo_business.payouts (business_id, person_id, amount_usd) VALUES (p_business, v_me.id, v_available);
  RETURN jsonb_build_object('ok', true, 'amountUsd', v_available);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_request_payout(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_request_payout(TEXT) TO authenticated;

-- Owner pays (CUP at the rate in force unless given, or USD/MLC) or rejects.
CREATE OR REPLACE FUNCTION public.nexo_business_payout_decide(p_business TEXT, p_id UUID, p_decision TEXT, p_data JSONB DEFAULT '{}'::jsonb)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v nexo_business.payouts;
  v_currency TEXT := upper(coalesce(p_data->>'currency', 'CUP'));
  v_rate NUMERIC;
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  SELECT * INTO v FROM nexo_business.payouts WHERE id = p_id AND business_id = p_business FOR UPDATE;
  IF NOT FOUND OR v.status <> 'requested' THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'La solicitud ya no está pendiente'); END IF;
  IF p_decision = 'rejected' THEN
    UPDATE nexo_business.payouts SET status = 'rejected', note = nullif(trim(p_data->>'note'), ''), decided_at = now(), decided_by = auth.uid() WHERE id = p_id;
    RETURN jsonb_build_object('ok', true);
  END IF;
  IF p_decision <> 'paid' THEN RETURN jsonb_build_object('error', 'invalid'); END IF;
  v_rate := coalesce(nullif(p_data->>'rate', '')::numeric, CASE WHEN v_currency = 'USD' THEN 1 ELSE nexo_business.rate_now(p_business, v_currency) END);
  IF v_rate IS NULL OR v_rate <= 0 THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Falta la tasa de ' || v_currency); END IF;
  UPDATE nexo_business.payouts SET status = 'paid', method = nullif(p_data->>'method', ''), currency = v_currency, rate = v_rate,
         amount_paid = round(v.amount_usd * v_rate, 2), reference = nullif(trim(p_data->>'reference'), ''),
         note = nullif(trim(p_data->>'note'), ''), decided_at = now(), decided_by = auth.uid()
   WHERE id = p_id;
  RETURN jsonb_build_object('ok', true, 'amountPaid', round(v.amount_usd * v_rate, 2), 'currency', v_currency);
EXCEPTION WHEN check_violation OR invalid_text_representation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_payout_decide(TEXT, UUID, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_payout_decide(TEXT, UUID, TEXT, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_payouts(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
DECLARE
  v_admin BOOLEAN := nexo_business.is_admin(p_business);
  v_me nexo_business.people := nexo_business.me(p_business);
BEGIN
  IF NOT v_admin AND v_me.id IS NULL THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', x.id, 'personId', x.person_id, 'person', p.full_name, 'phone', p.phone,
      'payoutInfo', p.payout, 'amountUsd', x.amount_usd, 'status', x.status, 'method', x.method, 'currency', x.currency, 'rate', x.rate,
      'amountPaid', x.amount_paid, 'reference', x.reference, 'note', x.note, 'requestedAt', x.requested_at, 'decidedAt', x.decided_at)
      ORDER BY (x.status = 'requested') DESC, x.requested_at DESC)
    FROM nexo_business.payouts x JOIN nexo_business.people p ON p.id = x.person_id
    WHERE x.business_id = p_business AND (v_admin OR x.person_id = v_me.id)), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_payouts(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_payouts(TEXT) TO authenticated;

-- ---------- My account (gestora / dependienta) ----------
CREATE OR REPLACE FUNCTION public.nexo_business_my_account(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
DECLARE
  v_me nexo_business.people := nexo_business.me(p_business);
BEGIN
  IF v_me.id IS NULL THEN RETURN jsonb_build_object('registered', false); END IF;
  RETURN jsonb_build_object('registered', true,
    'person', jsonb_build_object('id', v_me.id, 'kind', v_me.kind, 'fullName', v_me.full_name, 'phone', v_me.phone,
       'email', v_me.email, 'payout', v_me.payout, 'status', v_me.status),
    'balance', nexo_business.person_balance(v_me.id),
    'entries', coalesce((SELECT jsonb_agg(jsonb_build_object('at', e.created_at, 'kind', e.kind, 'productId', e.product_id,
        'name', c.name, 'quantity', e.quantity, 'amountUsd', round(e.amount_usd, 2), 'status', e.status) ORDER BY e.created_at DESC)
      FROM (SELECT * FROM nexo_business.commission_entries WHERE person_id = v_me.id ORDER BY created_at DESC LIMIT 100) e
      LEFT JOIN nexo_business.catalog_products c ON c.business_id = p_business AND c.product_id = e.product_id), '[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_my_account(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_my_account(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_my_profile(p_business TEXT, p_profile JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_me nexo_business.people := nexo_business.me(p_business);
BEGIN
  IF v_me.id IS NULL THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  UPDATE nexo_business.people SET full_name = coalesce(nullif(trim(p_profile->>'fullName'), ''), full_name),
         phone = coalesce(nullif(trim(p_profile->>'phone'), ''), phone), payout = coalesce(p_profile->'payout', payout)
   WHERE id = v_me.id;
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN check_violation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', 'Revisa el nombre y el teléfono');
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_my_profile(TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_my_profile(TEXT, JSONB) TO authenticated;

-- Businesses where the signed-in user is a gestora or dependienta.
CREATE OR REPLACE FUNCTION public.nexo_business_my_people()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('businessId', business_id, 'kind', kind, 'status', status, 'fullName', full_name)), '[]'::jsonb)
    FROM nexo_business.people WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.nexo_business_my_people() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_my_people() TO authenticated;
