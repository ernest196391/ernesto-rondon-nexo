-- Per-product rule for a socio ("MITAD" in the Excel: the solar lamps shared
-- 50/50). A product may carry its own rule and value that override its
-- owner's general rule; empty means "the socio's rule". Additive.
ALTER TABLE nexo_business.product_costs
  ADD COLUMN IF NOT EXISTS partner_rule TEXT CHECK (partner_rule IS NULL OR partner_rule IN ('supplier_price', 'percent_of_sale', 'fixed_per_unit', 'percent_of_profit')),
  ADD COLUMN IF NOT EXISTS partner_value NUMERIC(10, 2) CHECK (partner_value IS NULL OR partner_value >= 0);

CREATE OR REPLACE FUNCTION nexo_business.partner_share(p_business TEXT, p_product TEXT, p_qty BIGINT, p_line_minor BIGINT)
RETURNS TABLE (person_id UUID, amount_usd NUMERIC)
LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT p.id,
    CASE coalesce(c.partner_rule, p.partner_rule)
      WHEN 'supplier_price' THEN p_qty * c.purchase_amount / c.purchase_rate
      WHEN 'percent_of_sale' THEN p_line_minor / 100.0 * coalesce(CASE WHEN c.partner_rule IS NOT NULL THEN c.partner_value ELSE p.partner_value END, 0) / 100
      WHEN 'fixed_per_unit' THEN p_qty * coalesce(CASE WHEN c.partner_rule IS NOT NULL THEN c.partner_value ELSE p.partner_value END, 0)
      WHEN 'percent_of_profit' THEN greatest(0, p_line_minor / 100.0 - p_qty * (x.total_cost + x.commission) - p_line_minor / 100.0 * x.pct / 100)
                                    * coalesce(CASE WHEN c.partner_rule IS NOT NULL THEN c.partner_value ELSE p.partner_value END, 0) / 100
      ELSE 0 END
    FROM nexo_business.product_costs c
    JOIN nexo_business.people p ON p.id = c.partner_id AND p.kind = 'partner' AND p.status = 'active'
    LEFT JOIN nexo_business.product_unit_economics(p_business) x ON x.product_id = c.product_id
   WHERE c.business_id = p_business AND c.product_id = p_product;
$$;
REVOKE ALL ON FUNCTION nexo_business.partner_share(TEXT, TEXT, BIGINT, BIGINT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_set_product_partner_rule(p_business TEXT, p_product TEXT, p_rule TEXT, p_value NUMERIC)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_rule IS NOT NULL AND p_rule LIKE 'percent%' AND coalesce(p_value, -1) NOT BETWEEN 0 AND 100 THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'El porcentaje va de 0 a 100');
  END IF;
  UPDATE nexo_business.product_costs SET partner_rule = nullif(p_rule, ''),
         partner_value = CASE WHEN nullif(p_rule, '') IS NULL OR p_rule = 'supplier_price' THEN NULL ELSE p_value END,
         updated_by = auth.uid(), updated_at = now()
   WHERE business_id = p_business AND product_id = p_product;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Primero guarda el costo del producto'); END IF;
  INSERT INTO nexo_business.cost_audit (business_id, subject, after, changed_by)
  VALUES (p_business, 'product_partner_rule:' || p_product, jsonb_build_object('rule', p_rule, 'value', p_value), auth.uid());
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN check_violation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_set_product_partner_rule(TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_product_partner_rule(TEXT, TEXT, TEXT, NUMERIC) TO authenticated;

-- product_partners() now returns owner and rule per product.
CREATE OR REPLACE FUNCTION public.nexo_business_product_partners(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_object_agg(product_id, partner_id) FROM nexo_business.product_costs
                    WHERE business_id = p_business AND partner_id IS NOT NULL), '{}'::jsonb)
      || jsonb_build_object('_rules', coalesce((SELECT jsonb_object_agg(product_id, jsonb_build_object('rule', partner_rule, 'value', partner_value))
                    FROM nexo_business.product_costs WHERE business_id = p_business AND partner_rule IS NOT NULL), '{}'::jsonb));
END;
$$;
