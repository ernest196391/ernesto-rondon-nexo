-- Compra de personal ("VTTA A TRABAJADORES" in the Excel): a worker takes
-- products at purchase cost. The owner records it in one step: an order of
-- kind 'staff_purchase' (completed at once) and a sale event with channel
-- 'staff_purchase' and no gestora/dependienta, so stock and reports follow and
-- no commission is paid. Payment is cash/transfer, or 'deduction': a paid
-- payout for the amount, which lowers the worker's balance (it can go below
-- zero: a debt that later commissions cover). Additive.
ALTER TABLE nexo_business.orders
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'customer' CHECK (kind IN ('customer', 'staff_purchase')),
  ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES nexo_business.people(id);

CREATE OR REPLACE FUNCTION public.nexo_business_staff_purchase(p_business TEXT, p_buyer UUID, p_lines JSONB, p_payment JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_buyer nexo_business.people;
  v_lines JSONB := '[]'::jsonb;
  v_total BIGINT := 0;
  l JSONB;
  v_unit BIGINT;
  v_name TEXT;
  v_order UUID;
  v_number BIGINT;
  v_event TEXT := gen_random_uuid()::text;
  v_device TEXT := p_business || '-orders';
  v_method TEXT := coalesce(p_payment->>'method', 'cash');
  v_currency TEXT := upper(coalesce(p_payment->>'currency', 'USD'));
  v_rate NUMERIC;
  v_now TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  SELECT * INTO v_buyer FROM nexo_business.people WHERE id = p_buyer AND business_id = p_business AND status = 'active';
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Elige una persona activa del equipo'); END IF;
  IF v_method NOT IN ('cash', 'transfer', 'deduction') THEN RETURN jsonb_build_object('error', 'invalid'); END IF;

  FOR l IN SELECT * FROM jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) LOOP
    SELECT round(c.purchase_amount / c.purchase_rate * 100)::BIGINT, p.name INTO v_unit, v_name
      FROM nexo_business.catalog_products p
      LEFT JOIN nexo_business.product_costs c ON c.business_id = p.business_id AND c.product_id = p.product_id
     WHERE p.business_id = p_business AND p.product_id = l->>'productId' AND p.active;
    IF v_name IS NULL OR coalesce((l->>'quantity')::INT, 0) < 1 THEN
      RETURN jsonb_build_object('error', 'invalid', 'message', 'Producto o cantidad no válidos');
    END IF;
    IF v_unit IS NULL THEN
      RETURN jsonb_build_object('error', 'invalid', 'message', v_name || ' no tiene costo: ponlo en su ficha');
    END IF;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('product_id', l->>'productId', 'name', v_name,
      'quantity', (l->>'quantity')::INT, 'unit_price_minor', v_unit, 'extra', FALSE));
    v_total := v_total + v_unit * (l->>'quantity')::INT;
  END LOOP;
  IF jsonb_array_length(v_lines) = 0 THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Añade al menos un producto'); END IF;

  v_rate := CASE WHEN v_currency = 'USD' THEN 1 ELSE nexo_business.rate_now(p_business, v_currency) END;
  IF v_rate IS NULL THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'No hay tasa para ' || v_currency); END IF;

  INSERT INTO nexo_business.orders (business_id, kind, buyer_id, customer_name, customer_phone, lines, total_minor, status,
      payment, created_by, completed_at, sale_event_id, note)
  VALUES (p_business, 'staff_purchase', v_buyer.id, v_buyer.full_name, v_buyer.phone, v_lines, v_total, 'completed',
      coalesce(p_payment, '{}'::jsonb) || jsonb_build_object('amountMinor', round(v_total * v_rate), 'rate', v_rate),
      auth.uid(), now(), v_event, 'Compra de personal a precio de costo')
  RETURNING id, number INTO v_order, v_number;

  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
  VALUES (p_business, v_device, 'Pedidos de gestoras', encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
  ON CONFLICT (business_id, device_id) DO NOTHING;
  INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
  VALUES (v_event, p_business, v_device, 'sale.completed', 'sale', v_order::text, v_now,
    jsonb_build_object('contract_version', 1, 'event_id', v_event, 'business_id', p_business, 'source_system', 'nexo-orders',
      'source_entity_id', v_order, 'occurred_at', v_now, 'idempotency_key', v_order,
      'payload', jsonb_build_object('sale_id', v_order, 'order_number', v_number, 'channel', 'staff_purchase', 'buyer_id', v_buyer.id,
        'currency', 'USD', 'total_minor', v_total,
        'lines', (SELECT jsonb_agg(jsonb_build_object('product_id', x->>'product_id', 'quantity', (x->>'quantity')::BIGINT,
                    'unit_price_minor', (x->>'unit_price_minor')::BIGINT, 'line_total_minor', (x->>'quantity')::BIGINT * (x->>'unit_price_minor')::BIGINT))
                  FROM jsonb_array_elements(v_lines) x),
        'payment_method', v_method,
        'payments', jsonb_build_array(jsonb_build_object('payment_id', gen_random_uuid(), 'method', v_method,
          'rail', CASE v_method WHEN 'cash' THEN 'cash' WHEN 'deduction' THEN 'internal' ELSE 'transfer' END,
          'currency', v_currency, 'amount_minor', round(v_total * v_rate), 'usd_minor', v_total,
          'exchange_rate', CASE WHEN v_currency = 'USD' THEN NULL ELSE v_rate::text END,
          'provider', p_payment->>'provider', 'external_ref', nullif(trim(p_payment->>'reference'), ''))))));

  IF v_method = 'deduction' THEN
    INSERT INTO nexo_business.payouts (business_id, person_id, amount_usd, status, method, currency, rate, amount_paid, note, decided_at, decided_by)
    VALUES (p_business, v_buyer.id, v_total / 100.0, 'paid', 'deduction', 'USD', 1, v_total / 100.0,
            'Compra de personal #' || v_number || ' descontada de su saldo', now(), auth.uid());
  END IF;
  RETURN jsonb_build_object('ok', true, 'number', v_number, 'totalMinor', v_total,
    'balance', nexo_business.person_balance(v_buyer.id));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_staff_purchase(TEXT, UUID, JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_staff_purchase(TEXT, UUID, JSONB, JSONB) TO authenticated;
