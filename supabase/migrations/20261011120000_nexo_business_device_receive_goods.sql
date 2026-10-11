-- "Llegó mercancía" también en la caja (las dependientas reciben casi toda la mercancía).
-- Una sola lógica: nexo_business.receive_goods_as(...) la usan el panel (sesión) y la caja (clave del equipo).
CREATE OR REPLACE FUNCTION nexo_business.receive_goods_as(p_business TEXT, p_receipt JSONB, p_actor UUID, p_who TEXT)
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
BEGIN
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
          nullif(trim(p_receipt->>'note'), ''), coalesce((p_receipt->>'aiUsed')::BOOLEAN, FALSE), v_event, p_actor, p_who)
  RETURNING id, number INTO v_id, v_number;

  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
  VALUES (p_business, v_device, 'Pedidos de gestoras', encode(extensions.digest(encode(extensions.gen_random_bytes(32), 'hex'), 'sha256'), 'hex'), FALSE)
  ON CONFLICT (business_id, device_id) DO NOTHING;
  INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
  VALUES (v_event, p_business, v_device, 'inventory.received', 'goods_receipt', v_id::text, v_now,
    jsonb_build_object('contract_version', 1, 'source_system', 'nexo-receipts', 'payload', jsonb_build_object(
      'receipt_id', v_id, 'number', v_number, 'supplier', trim(p_receipt->>'supplierName'), 'partner_id', v_partner, 'location_id', NULL,
      'lines', (SELECT jsonb_agg(jsonb_build_object('product_id', x->>'product_id', 'quantity', (x->>'quantity')::INT)) FROM jsonb_array_elements(v_lines) x))));

  INSERT INTO nexo_business.product_costs (business_id, product_id, purchase_amount, purchase_currency, purchase_rate, partner_id, updated_by)
  SELECT p_business, x->>'product_id', (x->>'unit_cost')::NUMERIC, x->>'currency', (x->>'rate')::NUMERIC, v_partner, p_actor
    FROM jsonb_array_elements(v_lines) x
  ON CONFLICT (business_id, product_id) DO UPDATE SET purchase_amount = EXCLUDED.purchase_amount, purchase_currency = EXCLUDED.purchase_currency,
     purchase_rate = EXCLUDED.purchase_rate, partner_id = coalesce(EXCLUDED.partner_id, nexo_business.product_costs.partner_id),
     updated_by = EXCLUDED.updated_by, updated_at = now();
  INSERT INTO nexo_business.cost_audit (business_id, subject, after, changed_by)
  VALUES (p_business, 'receipt:' || v_number, jsonb_build_object('lines', v_lines, 'supplier', p_receipt->>'supplierName', 'by', p_who), p_actor);
  RETURN jsonb_build_object('ok', true, 'number', v_number, 'totalUsd', round(v_total, 2));
EXCEPTION WHEN check_violation OR invalid_text_representation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION nexo_business.receive_goods_as(TEXT, JSONB, UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- Panel (sesión): igual que antes, ahora llama a la lógica común.
CREATE OR REPLACE FUNCTION public.nexo_business_receive_goods(p_business TEXT, p_receipt JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT nexo_business.can_receive(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN nexo_business.receive_goods_as(p_business, p_receipt, auth.uid(),
    coalesce((SELECT full_name FROM nexo_business.people WHERE business_id = p_business AND user_id = auth.uid() LIMIT 1),
             (SELECT email FROM auth.users WHERE id = auth.uid())));
END;
$$;

-- Caja (clave del equipo): firma la dependienta que está en "Atiende" (opcional).
CREATE OR REPLACE FUNCTION public.nexo_business_device_receive_goods(p_token TEXT, p_receipt JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_device nexo_business.devices%ROWTYPE; v_who TEXT;
BEGIN
  SELECT * INTO v_device FROM nexo_business.devices
   WHERE coalesce(length(p_token), 0) >= 32 AND token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') AND active;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'unauthorized'); END IF;
  SELECT full_name INTO v_who FROM nexo_business.people
   WHERE business_id = v_device.business_id AND id::text = p_receipt->>'staffId' AND kind = 'staff';
  RETURN nexo_business.receive_goods_as(v_device.business_id, p_receipt, NULL,
    coalesce(v_who, v_device.label, v_device.device_id) || ' (caja)');
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_device_receive_goods(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_device_receive_goods(TEXT, JSONB) TO service_role;
