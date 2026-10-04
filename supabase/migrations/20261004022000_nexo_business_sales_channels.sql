-- Sales channels in the cost sheet. Most sales come through gestoras: each
-- product carries the gestora's commission (USD). When a gestora's client buys
-- an extra product, that commission is split gestora / business / clerk
-- (33 % each by default, editable). Clerks earn a % per product set by the
-- owner (business default + per-product override). Additive.

ALTER TABLE nexo_business.cost_settings
  ADD COLUMN IF NOT EXISTS staff_pct NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (staff_pct BETWEEN 0 AND 50),
  ADD COLUMN IF NOT EXISTS split_gestor_pct NUMERIC(5, 2) NOT NULL DEFAULT 33.34,
  ADD COLUMN IF NOT EXISTS split_business_pct NUMERIC(5, 2) NOT NULL DEFAULT 33.33,
  ADD COLUMN IF NOT EXISTS split_staff_pct NUMERIC(5, 2) NOT NULL DEFAULT 33.33;
ALTER TABLE nexo_business.cost_settings DROP CONSTRAINT IF EXISTS cost_settings_split_100;
ALTER TABLE nexo_business.cost_settings ADD CONSTRAINT cost_settings_split_100
  CHECK (split_gestor_pct >= 0 AND split_business_pct >= 0 AND split_staff_pct >= 0
         AND split_gestor_pct + split_business_pct + split_staff_pct = 100);

ALTER TABLE nexo_business.product_costs
  ADD COLUMN IF NOT EXISTS staff_pct NUMERIC(5, 2) CHECK (staff_pct IS NULL OR staff_pct BETWEEN 0 AND 50);

-- Settings: only the keys sent change; everything is validated by the table.
CREATE OR REPLACE FUNCTION public.nexo_business_set_cost_settings(p_business TEXT, p_settings JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_before nexo_business.cost_settings;
  v_after nexo_business.cost_settings;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') NOT IN ('owner', 'economist') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  INSERT INTO nexo_business.cost_settings (business_id) VALUES (p_business) ON CONFLICT DO NOTHING;
  SELECT * INTO v_before FROM nexo_business.cost_settings WHERE business_id = p_business;
  v_after := jsonb_populate_record(v_before, coalesce(p_settings, '{}'::jsonb) - 'business_id' - 'updated_by' - 'updated_at');
  IF v_after.target_margin_pct + v_after.other_pct + v_after.staff_pct >= 95 THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'El margen más los porcentajes no pueden llegar al 95 %');
  END IF;
  UPDATE nexo_business.cost_settings SET
      contingency_pct = v_after.contingency_pct, target_margin_pct = v_after.target_margin_pct,
      other_pct = v_after.other_pct, other_label = trim(v_after.other_label),
      commission_mode = v_after.commission_mode, commission_value = v_after.commission_value,
      units_mode = v_after.units_mode, manual_units = v_after.manual_units, rounding = v_after.rounding,
      staff_pct = v_after.staff_pct, split_gestor_pct = v_after.split_gestor_pct,
      split_business_pct = v_after.split_business_pct, split_staff_pct = v_after.split_staff_pct,
      updated_by = auth.uid(), updated_at = now()
   WHERE business_id = p_business
  RETURNING * INTO v_after;
  INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
  VALUES (p_business, 'settings', to_jsonb(v_before) - 'updated_at' - 'updated_by',
          to_jsonb(v_after) - 'updated_at' - 'updated_by', auth.uid());
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN check_violation OR invalid_text_representation OR numeric_value_out_of_range OR not_null_violation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.nexo_business_set_product_cost(p_business TEXT, p_product TEXT, p_cost JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_before JSONB;
  v_currency TEXT := upper(coalesce(p_cost->>'purchaseCurrency', 'USD'));
  v_rate NUMERIC;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') NOT IN ('owner', 'economist') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = p_product) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  v_rate := coalesce(nullif(p_cost->>'purchaseRate', '')::numeric, nexo_business.rate_now(p_business, v_currency));
  IF v_rate IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'No hay tasa para ' || v_currency);
  END IF;
  SELECT to_jsonb(c) INTO v_before FROM nexo_business.product_costs c WHERE business_id = p_business AND product_id = p_product;
  INSERT INTO nexo_business.product_costs (business_id, product_id, purchase_amount, purchase_currency, purchase_rate,
      freight_usd, commission_usd, staff_pct, updated_by, updated_at)
  VALUES (p_business, p_product, (p_cost->>'purchaseAmount')::numeric, v_currency, v_rate,
      coalesce(nullif(p_cost->>'freightUsd', '')::numeric, 0), nullif(p_cost->>'commissionUsd', '')::numeric,
      nullif(p_cost->>'staffPct', '')::numeric, auth.uid(), now())
  ON CONFLICT (business_id, product_id) DO UPDATE SET
      purchase_amount = EXCLUDED.purchase_amount, purchase_currency = EXCLUDED.purchase_currency,
      purchase_rate = EXCLUDED.purchase_rate, freight_usd = EXCLUDED.freight_usd,
      commission_usd = EXCLUDED.commission_usd, staff_pct = EXCLUDED.staff_pct,
      updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at;
  INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
  SELECT p_business, 'product:' || p_product, v_before - 'updated_at' - 'updated_by', to_jsonb(c) - 'updated_at' - 'updated_by', auth.uid()
    FROM nexo_business.product_costs c WHERE business_id = p_business AND product_id = p_product;
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN check_violation OR not_null_violation OR invalid_text_representation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;

-- The sheet, now with the clerk % and the gestora split. Per product:
--   total cost   = (purchase/rate + freight + fixed per unit) × (1 + contingency)
--   pct off sale = other % + clerk % (+ commission % when it is a percentage)
--   suggested    = round_up((total cost + commission) / (1 − margin − pct off sale))
--   profit       = price − total cost − commission − price × pct off sale
-- Extra product of a gestora's client: commission × split (gestora/business/clerk).
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
  SELECT coalesce(sum(-quantity_delta), 0), least(90, extract(epoch FROM now() - min(occurred_at)) / 86400)
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
          'purchaseRate', c.purchase_rate, 'freightUsd', c.freight_usd, 'commissionUsd', c.commission_usd,
          'staffPct', c.staff_pct) END,
        'calc', CASE WHEN c.product_id IS NULL THEN NULL ELSE (
          SELECT jsonb_build_object(
            'purchaseUsd', round(k.purchase_usd, 2), 'landedUsd', round(k.landed, 2),
            'fixedUsd', round(v_fixed_unit, 2), 'contingencyUsd', round(k.total - k.landed - v_fixed_unit, 2),
            'totalCostUsd', round(k.total, 2), 'commissionUsd', round(k.commission, 2),
            'staffPct', k.staff_pct, 'staffUsd', round(coalesce(k.price, 0) * k.staff_pct / 100, 2),
            'otherUsd', round(coalesce(k.price, 0) * s.other_pct / 100, 2),
            'suggestedUsd', CASE WHEN k.divisor <= 0 THEN NULL
                              ELSE ceil(((k.total + k.commission) / k.divisor) / s.rounding) * s.rounding END,
            'profitUsd', CASE WHEN k.price IS NOT NULL THEN round(k.price - k.total - k.commission - k.price * k.pct / 100, 2) END,
            'marginPct', CASE WHEN coalesce(k.price, 0) > 0 THEN round(100 * (k.price - k.total - k.commission - k.price * k.pct / 100) / k.price, 1) END,
            'extraSplit', jsonb_build_object(
              'gestorUsd', round(k.commission * s.split_gestor_pct / 100, 2),
              'businessUsd', round(k.commission * s.split_business_pct / 100, 2),
              'staffUsd', round(k.commission * s.split_staff_pct / 100, 2)))
          FROM (SELECT y.*, 1 - (s.target_margin_pct + y.pct) / 100 AS divisor,
                       (y.landed + v_fixed_unit) * (1 + s.contingency_pct / 100) AS total
                  FROM (SELECT x.*, s.other_pct + x.staff_pct
                               + CASE WHEN s.commission_mode = 'percent' AND c.commission_usd IS NULL THEN s.commission_value ELSE 0 END AS pct
                          FROM (SELECT c.purchase_amount / c.purchase_rate AS purchase_usd,
                                       c.purchase_amount / c.purchase_rate + c.freight_usd AS landed,
                                       (p.prices->>'USD')::numeric / 100 AS price,
                                       coalesce(c.staff_pct, s.staff_pct) AS staff_pct,
                                       coalesce(c.commission_usd, CASE WHEN s.commission_mode = 'fixed' THEN s.commission_value ELSE 0 END) AS commission) x) y) k) END
      ) AS row
      FROM nexo_business.catalog_products p
      LEFT JOIN nexo_business.product_costs c ON c.business_id = p.business_id AND c.product_id = p.product_id
      LEFT JOIN nexo_business.stock_by_product st ON st.business_id = p.business_id AND st.product_id = p.product_id
      WHERE p.business_id = p_business AND p.active) r), '[]'::jsonb)
  );
END;
$$;
