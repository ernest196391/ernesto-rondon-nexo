-- Monthly units for the fixed cost per unit: from real sales only once there
-- are 30 days of them (demo sales made 16 units/month look real).
CREATE OR REPLACE FUNCTION public.nexo_business_cost_sheet(p_business TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  s nexo_business.cost_settings;
  v_fixed_usd NUMERIC;
  v_auto_units NUMERIC;
  v_units NUMERIC;
  v_fixed_unit NUMERIC;
  v_days NUMERIC;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') NOT IN ('owner', 'economist') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  SELECT * INTO s FROM nexo_business.cost_settings WHERE business_id = p_business;
  IF NOT FOUND THEN
    INSERT INTO nexo_business.cost_settings (business_id) VALUES (p_business) RETURNING * INTO s;
  END IF;

  SELECT coalesce(sum(amount / nullif(nexo_business.rate_now(p_business, currency), 0)), 0)
    INTO v_fixed_usd FROM nexo_business.fixed_costs WHERE business_id = p_business AND active;
  -- Units sold per month, from the sales of the last 90 days. Trusted only
  -- once there are 30 days of sales; until then the manual figure is used.
  SELECT coalesce(sum(-quantity_delta), 0),
         least(90, extract(epoch FROM now() - min(occurred_at)) / 86400)
    INTO v_auto_units, v_days
    FROM nexo_business.stock_movements
   WHERE business_id = p_business AND reason = 'sale' AND occurred_at >= now() - interval '90 days';
  v_auto_units := CASE WHEN coalesce(v_days, 0) >= 30 THEN v_auto_units * 30 / v_days ELSE NULL END;
  v_units := CASE WHEN s.units_mode = 'auto' AND v_auto_units >= 1 THEN v_auto_units ELSE s.manual_units END;
  v_fixed_unit := v_fixed_usd / v_units;

  RETURN jsonb_build_object(
    'settings', to_jsonb(s) - 'business_id' - 'updated_by',
    'fixedCosts', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'label', label, 'amount', amount,
                     'currency', currency, 'active', active,
                     'usd', round(amount / nullif(nexo_business.rate_now(p_business, currency), 0), 2)) ORDER BY id)
                   FROM nexo_business.fixed_costs WHERE business_id = p_business), '[]'::jsonb),
    'fixedUsd', round(v_fixed_usd, 2),
    'autoUnits', round(v_auto_units, 1),
    'units', round(v_units, 1),
    'unitsFromSales', coalesce(s.units_mode = 'auto' AND v_auto_units >= 1, false),
    'salesDays', round(coalesce(v_days, 0)),
    'fixedPerUnit', round(v_fixed_unit, 2),
    'rates', nexo_business.current_rates(p_business),
    'products', coalesce((SELECT jsonb_agg(row ORDER BY (row->>'name')) FROM (
      SELECT jsonb_build_object(
        'productId', p.product_id, 'name', p.name, 'category', p.category, 'imageUrl', p.image_url,
        'variantLabel', p.variant_label, 'stock', coalesce(st.quantity, 0),
        'priceUsd', round((p.prices->>'USD')::numeric / 100, 2),
        'cost', CASE WHEN c.product_id IS NULL THEN NULL ELSE jsonb_build_object(
          'purchaseAmount', c.purchase_amount, 'purchaseCurrency', c.purchase_currency,
          'purchaseRate', c.purchase_rate, 'freightUsd', c.freight_usd, 'commissionUsd', c.commission_usd) END,
        'calc', CASE WHEN c.product_id IS NULL THEN NULL ELSE (
          SELECT jsonb_build_object(
            'purchaseUsd', round(k.purchase_usd, 2), 'landedUsd', round(k.landed, 2),
            'fixedUsd', round(v_fixed_unit, 2), 'contingencyUsd', round(k.total - k.landed - v_fixed_unit, 2),
            'totalCostUsd', round(k.total, 2), 'commissionUsd', round(k.commission, 2),
            'suggestedUsd', CASE WHEN k.divisor <= 0 THEN NULL
                              ELSE ceil(((k.total + k.commission) / k.divisor) / s.rounding) * s.rounding END,
            'profitUsd', CASE WHEN p.prices ? 'USD' THEN round(k.price - k.total - k.commission
                              - k.price * (s.other_pct + CASE WHEN s.commission_mode = 'percent' AND c.commission_usd IS NULL THEN s.commission_value ELSE 0 END) / 100, 2) END,
            'marginPct', CASE WHEN coalesce(k.price, 0) > 0 THEN round(100 * (k.price - k.total - k.commission
                              - k.price * (s.other_pct + CASE WHEN s.commission_mode = 'percent' AND c.commission_usd IS NULL THEN s.commission_value ELSE 0 END) / 100) / k.price, 1) END)
          FROM (SELECT x.*, (x.landed + v_fixed_unit) * (1 + s.contingency_pct / 100) AS total
                  FROM (SELECT c.purchase_amount / c.purchase_rate AS purchase_usd,
                               c.purchase_amount / c.purchase_rate + c.freight_usd AS landed,
                               (p.prices->>'USD')::numeric / 100 AS price,
                               coalesce(c.commission_usd, CASE WHEN s.commission_mode = 'fixed' THEN s.commission_value ELSE 0 END) AS commission,
                               1 - (s.target_margin_pct + s.other_pct
                                    + CASE WHEN s.commission_mode = 'percent' AND c.commission_usd IS NULL THEN s.commission_value ELSE 0 END) / 100 AS divisor) x) k) END
      ) AS row
      FROM nexo_business.catalog_products p
      LEFT JOIN nexo_business.product_costs c ON c.business_id = p.business_id AND c.product_id = p.product_id
      LEFT JOIN nexo_business.stock_by_product st ON st.business_id = p.business_id AND st.product_id = p.product_id
      WHERE p.business_id = p_business AND p.active) r), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_cost_sheet(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_cost_sheet(TEXT) TO authenticated;
