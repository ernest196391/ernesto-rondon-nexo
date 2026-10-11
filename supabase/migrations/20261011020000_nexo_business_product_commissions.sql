-- D37: las comisiones de gestoras se gestionan solo desde el panel. Hasta ahora la
-- comisión por producto vivía dentro de la ficha de costo (product_costs), que exige
-- precio de compra: un producto sin costo no podía tener comisión. Ahora tiene su
-- propia tabla, única fuente para la caja, la ficha de costo y (por sincronización) la web.

CREATE TABLE IF NOT EXISTS nexo_business.product_commissions (
  business_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  commission_usd NUMERIC(12, 2) NOT NULL CHECK (commission_usd >= 0),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, product_id)
);
ALTER TABLE nexo_business.product_commissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.product_commissions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON nexo_business.product_commissions TO service_role;

-- Lo que ya había en la ficha de costo pasa a la tabla nueva.
INSERT INTO nexo_business.product_commissions (business_id, product_id, commission_usd, updated_by, updated_at)
SELECT business_id, product_id, commission_usd, updated_by, updated_at
  FROM nexo_business.product_costs WHERE commission_usd IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION nexo_business.product_commission(p_business TEXT, p_product TEXT)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT commission_usd FROM nexo_business.product_commissions WHERE business_id = p_business AND product_id = p_product;
$$;

-- Precedencia: regla de la persona > comisión del producto > regla general.
CREATE OR REPLACE FUNCTION nexo_business.line_commission(p_business TEXT, p_gestor UUID, p_product TEXT, p_qty BIGINT, p_line_minor BIGINT)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE
    WHEN g.commission_mode = 'fixed' THEN g.commission_value * p_qty
    WHEN g.commission_mode = 'percent' THEN p_line_minor / 100.0 * g.commission_value / 100
    WHEN pc.commission_usd IS NOT NULL THEN pc.commission_usd * p_qty
    WHEN s.commission_mode = 'percent' THEN p_line_minor / 100.0 * s.commission_value / 100
    ELSE coalesce(s.commission_value, 0) * p_qty END
  FROM (SELECT 1) one
  LEFT JOIN nexo_business.people g ON g.id = p_gestor
  LEFT JOIN nexo_business.product_commissions pc ON pc.business_id = p_business AND pc.product_id = p_product
  LEFT JOIN nexo_business.cost_settings s ON s.business_id = p_business;
$$;

-- El panel cambia la comisión de un producto (vacío = usa la regla general).
CREATE OR REPLACE FUNCTION public.nexo_business_set_product_commission(p_business TEXT, p_product TEXT, p_usd NUMERIC)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_before JSONB;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') NOT IN ('owner', 'economist') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = p_product) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF p_usd IS NOT NULL AND p_usd < 0 THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'La comisión no puede ser negativa');
  END IF;
  SELECT to_jsonb(c) INTO v_before FROM nexo_business.product_commissions c WHERE business_id = p_business AND product_id = p_product;
  IF p_usd IS NULL THEN
    DELETE FROM nexo_business.product_commissions WHERE business_id = p_business AND product_id = p_product;
  ELSE
    INSERT INTO nexo_business.product_commissions (business_id, product_id, commission_usd, updated_by, updated_at)
    VALUES (p_business, p_product, p_usd, auth.uid(), now())
    ON CONFLICT (business_id, product_id) DO UPDATE SET commission_usd = EXCLUDED.commission_usd,
      updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at;
  END IF;
  INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
  VALUES (p_business, 'commission:' || p_product, v_before - 'updated_at' - 'updated_by',
          CASE WHEN p_usd IS NULL THEN NULL ELSE jsonb_build_object('commission_usd', p_usd) END, auth.uid());
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_set_product_commission(TEXT, TEXT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_product_commission(TEXT, TEXT, NUMERIC) TO authenticated;

-- La ficha de costo sigue aceptando "commissionUsd", pero ahora lo guarda en la tabla única.
CREATE OR REPLACE FUNCTION public.nexo_business_set_product_cost(p_business TEXT, p_product TEXT, p_cost JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
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
      coalesce(nullif(p_cost->>'freightUsd', '')::numeric, 0), NULL,
      nullif(p_cost->>'staffPct', '')::numeric, auth.uid(), now())
  ON CONFLICT (business_id, product_id) DO UPDATE SET
      purchase_amount = EXCLUDED.purchase_amount, purchase_currency = EXCLUDED.purchase_currency,
      purchase_rate = EXCLUDED.purchase_rate, freight_usd = EXCLUDED.freight_usd,
      commission_usd = NULL, staff_pct = EXCLUDED.staff_pct,
      updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at;
  INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
  SELECT p_business, 'product:' || p_product, v_before - 'updated_at' - 'updated_by', to_jsonb(c) - 'updated_at' - 'updated_by', auth.uid()
    FROM nexo_business.product_costs c WHERE business_id = p_business AND product_id = p_product;
  IF p_cost ? 'commissionUsd' THEN
    PERFORM public.nexo_business_set_product_commission(p_business, p_product, nullif(p_cost->>'commissionUsd', '')::numeric);
  END IF;
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN check_violation OR not_null_violation OR invalid_text_representation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$function$;

-- Ganancia por producto: la comisión sale de la tabla única.
CREATE OR REPLACE FUNCTION nexo_business.product_unit_economics(p_business TEXT)
RETURNS TABLE(product_id TEXT, total_cost NUMERIC, commission NUMERIC, pct NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $function$
DECLARE
  s nexo_business.cost_settings;
  v_fixed_usd NUMERIC;
  v_auto NUMERIC;
  v_days NUMERIC;
  v_units NUMERIC;
BEGIN
  SELECT * INTO s FROM nexo_business.cost_settings WHERE business_id = p_business;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT coalesce(sum(f.amount / nullif(nexo_business.rate_now(p_business, f.currency), 0)), 0)
    INTO v_fixed_usd FROM nexo_business.fixed_costs f WHERE f.business_id = p_business AND f.active;
  SELECT coalesce(sum(-m.quantity_delta), 0), least(90, extract(epoch FROM now() - min(m.occurred_at)) / 86400)
    INTO v_auto, v_days FROM nexo_business.stock_movements m
   WHERE m.business_id = p_business AND m.reason = 'sale' AND m.occurred_at >= now() - interval '90 days';
  v_auto := CASE WHEN coalesce(v_days, 0) >= 30 THEN v_auto * 30 / v_days ELSE NULL END;
  v_units := CASE WHEN s.units_mode = 'auto' AND v_auto >= 1 THEN v_auto ELSE s.manual_units END;
  RETURN QUERY
  SELECT c.product_id,
         (c.purchase_amount / c.purchase_rate + c.freight_usd + v_fixed_usd / v_units) * (1 + s.contingency_pct / 100),
         coalesce(pc.commission_usd, CASE WHEN s.commission_mode = 'fixed' THEN s.commission_value ELSE 0 END),
         s.other_pct + coalesce(c.staff_pct, s.staff_pct)
           + CASE WHEN s.commission_mode = 'percent' AND pc.commission_usd IS NULL THEN s.commission_value ELSE 0 END
    FROM nexo_business.product_costs c
    LEFT JOIN nexo_business.product_commissions pc ON pc.business_id = c.business_id AND pc.product_id = c.product_id
   WHERE c.business_id = p_business;
END;
$function$;

-- Ficha de costo del panel: la comisión de cada producto (tenga o no costo) sale de la tabla única.
CREATE OR REPLACE FUNCTION public.nexo_business_cost_sheet(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
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
        'commissionUsd', pc.commission_usd,
        'cost', CASE WHEN c.product_id IS NULL THEN NULL ELSE jsonb_build_object(
          'purchaseAmount', c.purchase_amount, 'purchaseCurrency', c.purchase_currency,
          'purchaseRate', c.purchase_rate, 'freightUsd', c.freight_usd, 'commissionUsd', pc.commission_usd,
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
                               + CASE WHEN s.commission_mode = 'percent' AND pc.commission_usd IS NULL THEN s.commission_value ELSE 0 END AS pct
                          FROM (SELECT c.purchase_amount / c.purchase_rate AS purchase_usd,
                                       c.purchase_amount / c.purchase_rate + c.freight_usd AS landed,
                                       (p.prices->>'USD')::numeric / 100 AS price,
                                       coalesce(c.staff_pct, s.staff_pct) AS staff_pct,
                                       coalesce(pc.commission_usd, CASE WHEN s.commission_mode = 'fixed' THEN s.commission_value ELSE 0 END) AS commission) x) y) k) END
      ) AS row
      FROM nexo_business.catalog_products p
      LEFT JOIN nexo_business.product_costs c ON c.business_id = p.business_id AND c.product_id = p.product_id
      LEFT JOIN nexo_business.product_commissions pc ON pc.business_id = p.business_id AND pc.product_id = p.product_id
      LEFT JOIN nexo_business.stock_by_product st ON st.business_id = p.business_id AND st.product_id = p.product_id
      WHERE p.business_id = p_business AND p.active) r), '[]'::jsonb)
  );
END;
$function$;

-- Cualquier escritor viejo (p. ej. la revisión del Excel, nexo_business_import_resolve) que
-- ponga una comisión en la ficha de costo la manda a la tabla única; la columna queda vacía.
CREATE OR REPLACE FUNCTION nexo_business.route_cost_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.commission_usd IS NOT NULL THEN
    INSERT INTO nexo_business.product_commissions (business_id, product_id, commission_usd, updated_by, updated_at)
    VALUES (NEW.business_id, NEW.product_id, NEW.commission_usd, NEW.updated_by, now())
    ON CONFLICT (business_id, product_id) DO UPDATE SET commission_usd = EXCLUDED.commission_usd,
      updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at;
    NEW.commission_usd := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS product_costs_route_commission ON nexo_business.product_costs;
CREATE TRIGGER product_costs_route_commission BEFORE INSERT OR UPDATE ON nexo_business.product_costs
  FOR EACH ROW EXECUTE FUNCTION nexo_business.route_cost_commission();

-- La columna vieja queda vacía para que nadie la lea por error (lo ya copiado arriba se mantiene).
UPDATE nexo_business.product_costs SET commission_usd = NULL WHERE commission_usd IS NOT NULL;

-- Lectura para nexo-commission-push (solo service_role), con los números de WooCommerce.
DROP FUNCTION IF EXISTS public.nexo_business_commissions_for_push(TEXT, TEXT[]);
CREATE FUNCTION public.nexo_business_commissions_for_push(p_business TEXT, p_products TEXT[])
RETURNS TABLE(product_id TEXT, commission_usd NUMERIC, woo_id BIGINT, parent_woo_id BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT c.product_id, c.commission_usd,
         (p.external_refs->'casaviva.company'->>'wooId')::bigint,
         (p.external_refs->'casaviva.company'->>'parentWooId')::bigint
    FROM nexo_business.product_commissions c
    LEFT JOIN nexo_business.catalog_products p ON p.business_id = c.business_id AND p.product_id = c.product_id
   WHERE c.business_id = p_business AND (p_products IS NULL OR c.product_id = ANY (p_products))
   ORDER BY c.product_id;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_commissions_for_push(TEXT, TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_commissions_for_push(TEXT, TEXT[]) TO service_role;
