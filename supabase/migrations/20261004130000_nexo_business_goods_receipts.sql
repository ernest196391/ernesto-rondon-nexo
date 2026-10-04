-- Recepción de mercancía: the clerk (or the owner) records goods that arrive
-- with their invoice photo. Confirming writes an 'inventory.received' event
-- (stock goes up), updates each product's purchase cost and, when the
-- supplier is a socio, the owner of the merchandise. The photo stays with the
-- receipt for the economist. Curru (AI) can prefill the lines from the photo
-- through the nexo-curru function; the person always reviews before confirming.
-- Note: while BizneCubano is the stock authority, the hourly import re-counts
-- stock to its figures. Additive.

CREATE TABLE IF NOT EXISTS nexo_business.goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  number BIGINT GENERATED ALWAYS AS IDENTITY,
  supplier_name TEXT NOT NULL CHECK (length(trim(supplier_name)) BETWEEN 1 AND 80),
  partner_id UUID REFERENCES nexo_business.people(id),
  lines JSONB NOT NULL CHECK (jsonb_typeof(lines) = 'array' AND jsonb_array_length(lines) > 0),
  total_usd NUMERIC(14, 2) NOT NULL,
  photo TEXT CHECK (photo IS NULL OR length(photo) < 1500000),
  note TEXT,
  ai_used BOOLEAN NOT NULL DEFAULT FALSE,
  event_id TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS goods_receipts_business ON nexo_business.goods_receipts (business_id, created_at DESC);
ALTER TABLE nexo_business.goods_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.goods_receipts FROM PUBLIC, anon, authenticated;

-- Stock: goods received count up.
CREATE OR REPLACE VIEW nexo_business.stock_movements AS
SELECT e.business_id, l->>'product_id' AS product_id, NULL::text AS location_id,
       -(l->>'quantity')::BIGINT AS quantity_delta, 'sale' AS reason, e.occurred_at::timestamptz AS occurred_at, e.event_id
FROM nexo_business.sync_events e, jsonb_array_elements(e.envelope->'payload'->'lines') l
WHERE e.operation_type = 'sale.completed' AND jsonb_typeof(e.envelope->'payload'->'lines') = 'array'
UNION ALL
SELECT e.business_id, e.envelope->'payload'->>'product_id', NULL,
       -(e.envelope->'payload'->>'quantity')::BIGINT, 'sale', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e
WHERE e.operation_type = 'sale.completed' AND e.envelope->'payload'->'lines' IS NULL
  AND e.envelope->'payload'->>'product_id' IS NOT NULL
UNION ALL
SELECT e.business_id, l->>'product_id', NULL,
       (l->>'quantity')::BIGINT, 'return', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e, jsonb_array_elements(e.envelope->'payload'->'lines') l
WHERE e.operation_type = 'sale.returned' AND jsonb_typeof(e.envelope->'payload'->'lines') = 'array'
UNION ALL
SELECT e.business_id, e.envelope->'payload'->>'product_id', e.envelope->'payload'->>'location_id',
       (e.envelope->'payload'->>'difference_quantity')::BIGINT, 'count', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e
WHERE e.operation_type = 'inventory.counted' AND (e.envelope->'payload'->>'difference_quantity')::BIGINT <> 0
UNION ALL
SELECT e.business_id, e.envelope->'payload'->>'product_id', e.envelope->'payload'->>'from_location_id',
       -(e.envelope->'payload'->>'quantity')::BIGINT, 'transfer_out', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e WHERE e.operation_type = 'inventory.transferred'
UNION ALL
SELECT e.business_id, e.envelope->'payload'->>'product_id', e.envelope->'payload'->>'to_location_id',
       (e.envelope->'payload'->>'quantity')::BIGINT, 'transfer_in', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e WHERE e.operation_type = 'inventory.transferred'
UNION ALL
SELECT e.business_id, l->>'product_id', e.envelope->'payload'->>'location_id',
       -(l->>'quantity')::BIGINT, 'consignment_sale', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e, jsonb_array_elements(e.envelope->'payload'->'lines') l
WHERE e.operation_type = 'consignment.settled' AND jsonb_typeof(e.envelope->'payload'->'lines') = 'array'
UNION ALL
SELECT e.business_id, l->>'product_id', e.envelope->'payload'->>'location_id',
       (l->>'quantity')::BIGINT, 'received', e.occurred_at::timestamptz, e.event_id
FROM nexo_business.sync_events e, jsonb_array_elements(e.envelope->'payload'->'lines') l
WHERE e.operation_type = 'inventory.received' AND jsonb_typeof(e.envelope->'payload'->'lines') = 'array';

-- Owner, economist or an active dependienta may receive goods.
CREATE OR REPLACE FUNCTION nexo_business.can_receive(p_business TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT nexo_business.is_admin(p_business)
      OR EXISTS (SELECT 1 FROM nexo_business.people WHERE business_id = p_business AND user_id = auth.uid() AND kind = 'staff' AND status = 'active');
$$;
REVOKE ALL ON FUNCTION nexo_business.can_receive(TEXT) FROM PUBLIC, anon, authenticated;

-- p_receipt: {supplierName, partnerId?, photo? (data URL, jpeg), note?, aiUsed?,
--             lines: [{productId, quantity, unitCost, currency (USD|CUP|MLC)}]}
CREATE OR REPLACE FUNCTION public.nexo_business_receive_goods(p_business TEXT, p_receipt JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_partner UUID := nullif(p_receipt->>'partnerId', '')::uuid;
  v_lines JSONB := '[]'::jsonb;
  v_total NUMERIC := 0;
  l JSONB;
  v_name TEXT;
  v_cur TEXT;
  v_rate NUMERIC;
  v_id UUID;
  v_number BIGINT;
  v_event TEXT := gen_random_uuid()::text;
  v_device TEXT := p_business || '-orders';
  v_now TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_who TEXT := coalesce((SELECT full_name FROM nexo_business.people WHERE business_id = p_business AND user_id = auth.uid() LIMIT 1),
                         (SELECT email FROM auth.users WHERE id = auth.uid()));
BEGIN
  IF NOT nexo_business.can_receive(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF v_partner IS NOT NULL AND NOT EXISTS (SELECT 1 FROM nexo_business.people WHERE id = v_partner AND business_id = p_business AND kind = 'partner') THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Socio desconocido');
  END IF;
  FOR l IN SELECT * FROM jsonb_array_elements(coalesce(p_receipt->'lines', '[]'::jsonb)) LOOP
    SELECT name INTO v_name FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = l->>'productId';
    v_cur := upper(coalesce(l->>'currency', 'USD'));
    v_rate := CASE WHEN v_cur = 'USD' THEN 1 ELSE nexo_business.rate_now(p_business, v_cur) END;
    IF v_name IS NULL OR coalesce((l->>'quantity')::INT, 0) < 1 OR coalesce((l->>'unitCost')::NUMERIC, -1) < 0 OR v_rate IS NULL THEN
      RETURN jsonb_build_object('error', 'invalid', 'message', 'Revisa los productos: cantidad, costo y moneda');
    END IF;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('product_id', l->>'productId', 'name', v_name, 'quantity', (l->>'quantity')::INT,
      'unit_cost', (l->>'unitCost')::NUMERIC, 'currency', v_cur, 'rate', v_rate));
    v_total := v_total + (l->>'quantity')::INT * (l->>'unitCost')::NUMERIC / v_rate;
  END LOOP;
  IF jsonb_array_length(v_lines) = 0 THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Añade al menos un producto'); END IF;

  INSERT INTO nexo_business.goods_receipts (business_id, supplier_name, partner_id, lines, total_usd, photo, note, ai_used, event_id, created_by, created_by_name)
  VALUES (p_business, trim(p_receipt->>'supplierName'), v_partner, v_lines, round(v_total, 2), nullif(p_receipt->>'photo', ''),
          nullif(trim(p_receipt->>'note'), ''), coalesce((p_receipt->>'aiUsed')::BOOLEAN, FALSE), v_event, auth.uid(), v_who)
  RETURNING id, number INTO v_id, v_number;

  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
  VALUES (p_business, v_device, 'Pedidos de gestoras', encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
  ON CONFLICT (business_id, device_id) DO NOTHING;
  INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
  VALUES (v_event, p_business, v_device, 'inventory.received', 'goods_receipt', v_id::text, v_now,
    jsonb_build_object('contract_version', 1, 'source_system', 'nexo-receipts', 'payload', jsonb_build_object(
      'receipt_id', v_id, 'number', v_number, 'supplier', trim(p_receipt->>'supplierName'), 'partner_id', v_partner, 'location_id', NULL,
      'lines', (SELECT jsonb_agg(jsonb_build_object('product_id', x->>'product_id', 'quantity', (x->>'quantity')::INT)) FROM jsonb_array_elements(v_lines) x))));

  -- Purchase cost (and owner) on every received product; freight and commission are kept.
  INSERT INTO nexo_business.product_costs (business_id, product_id, purchase_amount, purchase_currency, purchase_rate, partner_id, updated_by)
  SELECT p_business, x->>'product_id', (x->>'unit_cost')::NUMERIC, x->>'currency', (x->>'rate')::NUMERIC, v_partner, auth.uid()
    FROM jsonb_array_elements(v_lines) x
  ON CONFLICT (business_id, product_id) DO UPDATE SET purchase_amount = EXCLUDED.purchase_amount, purchase_currency = EXCLUDED.purchase_currency,
     purchase_rate = EXCLUDED.purchase_rate, partner_id = coalesce(EXCLUDED.partner_id, nexo_business.product_costs.partner_id),
     updated_by = EXCLUDED.updated_by, updated_at = now();
  INSERT INTO nexo_business.cost_audit (business_id, subject, after, changed_by)
  VALUES (p_business, 'receipt:' || v_number, jsonb_build_object('lines', v_lines, 'supplier', p_receipt->>'supplierName'), auth.uid());
  RETURN jsonb_build_object('ok', true, 'number', v_number, 'totalUsd', round(v_total, 2));
EXCEPTION WHEN check_violation OR invalid_text_representation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_receive_goods(TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_receive_goods(TEXT, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_receipts(p_business TEXT, p_limit INT DEFAULT 50)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF NOT nexo_business.can_receive(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'number', number, 'supplier', supplier_name, 'partnerId', partner_id,
      'lines', lines, 'totalUsd', total_usd, 'hasPhoto', photo IS NOT NULL, 'note', note, 'aiUsed', ai_used,
      'by', created_by_name, 'at', created_at) ORDER BY created_at DESC)
    FROM (SELECT * FROM nexo_business.goods_receipts WHERE business_id = p_business ORDER BY created_at DESC LIMIT least(greatest(coalesce(p_limit, 50), 1), 200)) r), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_receipts(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_receipts(TEXT, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_receipt_photo(p_business TEXT, p_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF NOT nexo_business.can_receive(p_business) THEN RETURN NULL; END IF;
  RETURN (SELECT photo FROM nexo_business.goods_receipts WHERE id = p_id AND business_id = p_business);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_receipt_photo(TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_receipt_photo(TEXT, UUID) TO authenticated;

-- For Curru: match the invoice names it read to catalog products (service role).
CREATE OR REPLACE FUNCTION public.nexo_business_match_names(p_business TEXT, p_names TEXT[])
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('name', n, 'productId', m.product_id, 'productName', m.name, 'score', m.score)), '[]'::jsonb)
    FROM unnest(p_names) n
    LEFT JOIN LATERAL (
      SELECT p.product_id, p.name, round(nexo_business.name_score(nexo_business.name_words(n), nexo_business.name_words(p.name)), 2) AS score
        FROM nexo_business.catalog_products p WHERE p.business_id = p_business AND p.active
       ORDER BY 3 DESC LIMIT 1) m ON TRUE;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_match_names(TEXT, TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_match_names(TEXT, TEXT[]) TO service_role;
