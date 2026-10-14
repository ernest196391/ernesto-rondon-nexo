-- 14-oct-2026 (Ernesto): unir una fila del Excel con un producto ya NO pisa el costo ni la comisión.
-- Antes, nexo_business_import_resolve copiaba compra + comisión de la fila a product_costs y el disparador
-- route_cost_commission pasaba la comisión a product_commissions (y la copia nocturna a la web). Así entraron
-- «BOCINA PEQUEÑA» (comisión 5) en «Toallas pequeña» y otras uniones equivocadas el 11-oct.
-- Ahora: p_take_cost / p_take_commission (casillas del panel) deciden; por defecto, ninguno de los dos.
-- La vista previa (nexo_business_import_preview) enseña lo del Excel y lo del producto para comparar.

DROP FUNCTION IF EXISTS public.nexo_business_import_resolve(TEXT, BIGINT, TEXT);

CREATE OR REPLACE FUNCTION public.nexo_business_import_resolve(p_business TEXT, p_id BIGINT, p_product TEXT,
  p_take_cost BOOLEAN DEFAULT false, p_take_commission BOOLEAN DEFAULT false)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE
  r nexo_business.import_review;
  v_ids TEXT[];
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  SELECT * INTO r FROM nexo_business.import_review WHERE id = p_id AND business_id = p_business FOR UPDATE;
  IF NOT FOUND OR r.status NOT IN ('needs_review', 'not_found') THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Ya estaba resuelto'); END IF;
  IF p_product IS NULL THEN
    UPDATE nexo_business.import_review SET status = 'ignored', resolved_by = auth.uid(), resolved_at = now() WHERE id = p_id;
    RETURN jsonb_build_object('ok', true);
  END IF;
  SELECT array_agg(product_id) INTO v_ids FROM nexo_business.catalog_products
   WHERE business_id = p_business AND active AND (product_id = p_product OR variant_of = p_product);
  IF v_ids IS NULL THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Producto no encontrado'); END IF;
  IF p_take_cost THEN
    -- commission_usd NULL: el disparador route_cost_commission no toca la comisión.
    INSERT INTO nexo_business.product_costs (business_id, product_id, purchase_amount, purchase_currency, purchase_rate, freight_usd, commission_usd, partner_id, updated_by)
    SELECT p_business, pid, r.purchase_usd, 'USD', 1, coalesce(r.freight_usd, 0), NULL,
           (SELECT p.id FROM nexo_business.people p WHERE p.business_id = p_business AND p.kind = 'partner' AND p.full_name = r.owner_name), auth.uid()
      FROM unnest(v_ids) pid
    ON CONFLICT (business_id, product_id) DO UPDATE SET purchase_amount = EXCLUDED.purchase_amount, purchase_currency = 'USD', purchase_rate = 1,
       freight_usd = EXCLUDED.freight_usd, commission_usd = NULL,
       partner_id = coalesce(EXCLUDED.partner_id, nexo_business.product_costs.partner_id), updated_by = EXCLUDED.updated_by, updated_at = now();
  END IF;
  IF p_take_commission AND r.commission_usd IS NOT NULL THEN
    INSERT INTO nexo_business.product_commissions (business_id, product_id, commission_usd, updated_by, updated_at)
    SELECT p_business, pid, r.commission_usd, auth.uid(), now() FROM unnest(v_ids) pid
    ON CONFLICT (business_id, product_id) DO UPDATE SET commission_usd = EXCLUDED.commission_usd, updated_by = EXCLUDED.updated_by, updated_at = now();
  END IF;
  UPDATE nexo_business.import_review SET status = 'resolved', product_id = p_product, resolved_by = auth.uid(), resolved_at = now() WHERE id = p_id;
  INSERT INTO nexo_business.cost_audit (business_id, subject, after, changed_by)
  VALUES (p_business, 'import_resolve:' || p_id, jsonb_build_object('product', p_product, 'variants', cardinality(v_ids),
          'cost', p_take_cost, 'commission', p_take_commission AND r.commission_usd IS NOT NULL), auth.uid());
  RETURN jsonb_build_object('ok', true, 'variants', cardinality(v_ids), 'cost', p_take_cost, 'commission', p_take_commission AND r.commission_usd IS NOT NULL);
END;
$function$;
REVOKE ALL ON FUNCTION public.nexo_business_import_resolve(TEXT, BIGINT, TEXT, BOOLEAN, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_import_resolve(TEXT, BIGINT, TEXT, BOOLEAN, BOOLEAN) TO authenticated;

-- Para comparar antes de unir: la fila del Excel y lo que tiene hoy el producto (cada color).
CREATE OR REPLACE FUNCTION public.nexo_business_import_preview(p_business TEXT, p_id BIGINT, p_product TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $function$
DECLARE r nexo_business.import_review;
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  SELECT * INTO r FROM nexo_business.import_review WHERE id = p_id AND business_id = p_business;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  RETURN jsonb_build_object(
    'excel', jsonb_build_object('row', r.source_row, 'name', r.excel_name, 'purchaseUsd', r.purchase_usd, 'freightUsd', r.freight_usd, 'commissionUsd', r.commission_usd, 'owner', r.owner_name),
    'variants', coalesce((SELECT jsonb_agg(jsonb_build_object('productId', p.product_id, 'name', p.name,
        'priceUsd', round(coalesce(p.regular_minor, (p.prices->>'USD')::bigint)::numeric / 100, 2),
        'costUsd', CASE WHEN c.product_id IS NULL THEN NULL ELSE round(c.purchase_amount / nullif(c.purchase_rate, 0) + c.freight_usd, 2) END,
        'commissionUsd', k.commission_usd) ORDER BY p.name)
      FROM nexo_business.catalog_products p
      LEFT JOIN nexo_business.product_costs c ON c.business_id = p.business_id AND c.product_id = p.product_id
      LEFT JOIN nexo_business.product_commissions k ON k.business_id = p.business_id AND k.product_id = p.product_id
     WHERE p.business_id = p_business AND p.active AND (p.product_id = p_product OR p.variant_of = p_product)), '[]'::jsonb),
    'others', coalesce((SELECT jsonb_agg(jsonb_build_object('row', o.source_row, 'name', o.excel_name, 'purchaseUsd', o.purchase_usd) ORDER BY o.source_row)
      FROM nexo_business.import_review o WHERE o.business_id = p_business AND o.product_id = p_product AND o.id <> p_id AND o.status IN ('resolved', 'imported')), '[]'::jsonb));
END;
$function$;
REVOKE ALL ON FUNCTION public.nexo_business_import_preview(TEXT, BIGINT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_import_preview(TEXT, BIGINT, TEXT) TO authenticated;
