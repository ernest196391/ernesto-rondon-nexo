-- Cost sheet (ficha de costo): the owner sets the business variables, the
-- monthly fixed costs and each product's purchase cost; one function computes
-- cost, suggested price and profit per product. Replaces the Excel "F COSTO".
-- See docs/nexo-business/ECONOMY_AND_ROLES.md. Additive.

-- Roles: economist manages costs; partner (phase 2) sees only its own account.
ALTER TABLE nexo_business.members DROP CONSTRAINT IF EXISTS members_role_check;
ALTER TABLE nexo_business.members
  ADD CONSTRAINT members_role_check CHECK (role IN ('owner', 'economist', 'viewer', 'partner'));
ALTER TABLE nexo_business.members ADD COLUMN IF NOT EXISTS partner_id TEXT;

CREATE OR REPLACE FUNCTION nexo_business.role_of(p_business TEXT)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT role FROM nexo_business.members WHERE user_id = auth.uid() AND business_id = p_business;
$$;
REVOKE ALL ON FUNCTION nexo_business.role_of(TEXT) FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS nexo_business.cost_settings (
  business_id TEXT PRIMARY KEY CHECK (length(trim(business_id)) > 0),
  contingency_pct NUMERIC(6, 3) NOT NULL DEFAULT 1 CHECK (contingency_pct BETWEEN 0 AND 50),
  target_margin_pct NUMERIC(6, 3) NOT NULL DEFAULT 30 CHECK (target_margin_pct BETWEEN 0 AND 90),
  other_pct NUMERIC(6, 3) NOT NULL DEFAULT 2 CHECK (other_pct BETWEEN 0 AND 50),
  other_label TEXT NOT NULL DEFAULT 'Otros cargos' CHECK (length(trim(other_label)) BETWEEN 1 AND 40),
  commission_mode TEXT NOT NULL DEFAULT 'fixed' CHECK (commission_mode IN ('fixed', 'percent')),
  commission_value NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (commission_value >= 0),
  units_mode TEXT NOT NULL DEFAULT 'auto' CHECK (units_mode IN ('auto', 'manual')),
  manual_units INTEGER NOT NULL DEFAULT 330 CHECK (manual_units > 0),
  rounding NUMERIC(6, 2) NOT NULL DEFAULT 0.5 CHECK (rounding IN (0.01, 0.1, 0.25, 0.5, 1, 5)),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexo_business.fixed_costs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id TEXT NOT NULL,
  label TEXT NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 60),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'CUP', 'MLC', 'USDT')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fixed_costs_business ON nexo_business.fixed_costs (business_id);

CREATE TABLE IF NOT EXISTS nexo_business.product_costs (
  business_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  purchase_amount NUMERIC(14, 2) NOT NULL CHECK (purchase_amount >= 0),
  purchase_currency TEXT NOT NULL CHECK (purchase_currency IN ('USD', 'CUP', 'MLC', 'USDT')),
  purchase_rate NUMERIC(14, 4) NOT NULL DEFAULT 1 CHECK (purchase_rate > 0),
  freight_usd NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (freight_usd >= 0),
  commission_usd NUMERIC(10, 2) CHECK (commission_usd IS NULL OR commission_usd >= 0),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, product_id)
);

-- Every change is kept: who changed which variable, from what, to what.
CREATE TABLE IF NOT EXISTS nexo_business.cost_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  before JSONB,
  after JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE nexo_business.cost_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexo_business.fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexo_business.product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexo_business.cost_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.cost_settings, nexo_business.fixed_costs, nexo_business.product_costs,
  nexo_business.cost_audit FROM PUBLIC, anon, authenticated;

-- Casa Viva starts with the values of its Excel.
INSERT INTO nexo_business.cost_settings (business_id) VALUES ('casa-viva') ON CONFLICT DO NOTHING;
INSERT INTO nexo_business.fixed_costs (business_id, label, amount, currency)
SELECT 'casa-viva', l, a, 'CUP' FROM (VALUES
  ('Salarios', 110000), ('Material de oficina', 2500), ('Electricidad y renta', 159000),
  ('Teléfono', 26500), ('Café', 5200), ('Papel sanitario', 800), ('Depreciación', 52708.5),
  ('Javas', 6950), ('Jabón', 400), ('Mantenimiento del local', 20000), ('Detergente', 350),
  ('Frazada', 350), ('Escoba', 150), ('Cubo', 1500), ('Atención a proveedores', 6000), ('Viáticos', 15000)) v(l, a)
WHERE NOT EXISTS (SELECT 1 FROM nexo_business.fixed_costs WHERE business_id = 'casa-viva');

-- Rate of a currency (units per USD) now; USD is 1.
CREATE OR REPLACE FUNCTION nexo_business.rate_now(p_business TEXT, p_currency TEXT)
RETURNS NUMERIC LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT CASE WHEN p_currency = 'USD' THEN 1 ELSE (
    SELECT per_usd FROM nexo_business.exchange_rates
     WHERE business_id = p_business AND currency = p_currency ORDER BY set_at DESC, id DESC LIMIT 1) END;
$$;
REVOKE ALL ON FUNCTION nexo_business.rate_now(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- The whole sheet: variables, fixed costs and one computed row per product.
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
  -- Average units sold per month over the last 90 days.
  SELECT coalesce(sum(-quantity_delta), 0) / 3.0 INTO v_auto_units
    FROM nexo_business.stock_movements
   WHERE business_id = p_business AND reason = 'sale' AND occurred_at >= now() - interval '90 days';
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
    'unitsFromSales', s.units_mode = 'auto' AND v_auto_units >= 1,
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

CREATE OR REPLACE FUNCTION public.nexo_business_set_cost_settings(p_business TEXT, p_settings JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_before nexo_business.cost_settings;
  v_after nexo_business.cost_settings;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') NOT IN ('owner', 'economist') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  SELECT * INTO v_before FROM nexo_business.cost_settings WHERE business_id = p_business;
  INSERT INTO nexo_business.cost_settings AS t (business_id, contingency_pct, target_margin_pct, other_pct, other_label,
      commission_mode, commission_value, units_mode, manual_units, rounding, updated_by, updated_at)
  VALUES (p_business,
      coalesce((p_settings->>'contingency_pct')::numeric, v_before.contingency_pct, 1),
      coalesce((p_settings->>'target_margin_pct')::numeric, v_before.target_margin_pct, 30),
      coalesce((p_settings->>'other_pct')::numeric, v_before.other_pct, 2),
      coalesce(nullif(trim(p_settings->>'other_label'), ''), v_before.other_label, 'Otros cargos'),
      coalesce(p_settings->>'commission_mode', v_before.commission_mode, 'fixed'),
      coalesce((p_settings->>'commission_value')::numeric, v_before.commission_value, 0),
      coalesce(p_settings->>'units_mode', v_before.units_mode, 'auto'),
      coalesce((p_settings->>'manual_units')::int, v_before.manual_units, 330),
      coalesce((p_settings->>'rounding')::numeric, v_before.rounding, 0.5),
      auth.uid(), now())
  ON CONFLICT (business_id) DO UPDATE SET
      contingency_pct = EXCLUDED.contingency_pct, target_margin_pct = EXCLUDED.target_margin_pct,
      other_pct = EXCLUDED.other_pct, other_label = EXCLUDED.other_label,
      commission_mode = EXCLUDED.commission_mode, commission_value = EXCLUDED.commission_value,
      units_mode = EXCLUDED.units_mode, manual_units = EXCLUDED.manual_units, rounding = EXCLUDED.rounding,
      updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at
  RETURNING * INTO v_after;
  IF v_after.target_margin_pct + v_after.other_pct >= 95 THEN
    RAISE EXCEPTION 'El margen más los cargos no pueden llegar al 95%%';
  END IF;
  INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
  VALUES (p_business, 'settings', to_jsonb(v_before) - 'updated_at' - 'updated_by',
          to_jsonb(v_after) - 'updated_at' - 'updated_by', auth.uid());
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN check_violation OR invalid_text_representation OR numeric_value_out_of_range OR raise_exception THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_set_cost_settings(TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_cost_settings(TEXT, JSONB) TO authenticated;

-- Create (p_id NULL) or change a fixed cost. Deactivate instead of deleting.
CREATE OR REPLACE FUNCTION public.nexo_business_save_fixed_cost(
  p_business TEXT, p_id BIGINT, p_label TEXT, p_amount NUMERIC, p_currency TEXT, p_active BOOLEAN DEFAULT TRUE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_before JSONB;
  v_id BIGINT;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') NOT IN ('owner', 'economist') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF p_id IS NULL THEN
    INSERT INTO nexo_business.fixed_costs (business_id, label, amount, currency, active, updated_by)
    VALUES (p_business, trim(p_label), p_amount, upper(p_currency), coalesce(p_active, TRUE), auth.uid()) RETURNING id INTO v_id;
  ELSE
    SELECT to_jsonb(f) INTO v_before FROM nexo_business.fixed_costs f WHERE id = p_id AND business_id = p_business;
    IF v_before IS NULL THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
    UPDATE nexo_business.fixed_costs SET label = trim(p_label), amount = p_amount, currency = upper(p_currency),
           active = coalesce(p_active, TRUE), updated_by = auth.uid(), updated_at = now()
     WHERE id = p_id RETURNING id INTO v_id;
  END IF;
  INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
  SELECT p_business, 'fixed_cost:' || v_id, v_before - 'updated_at' - 'updated_by', to_jsonb(f) - 'updated_at' - 'updated_by', auth.uid()
    FROM nexo_business.fixed_costs f WHERE id = v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
EXCEPTION WHEN check_violation OR not_null_violation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_save_fixed_cost(TEXT, BIGINT, TEXT, NUMERIC, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_save_fixed_cost(TEXT, BIGINT, TEXT, NUMERIC, TEXT, BOOLEAN) TO authenticated;

-- Set a product's purchase cost. The rate is the one in force today unless given.
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
  INSERT INTO nexo_business.product_costs AS t (business_id, product_id, purchase_amount, purchase_currency, purchase_rate,
      freight_usd, commission_usd, updated_by, updated_at)
  VALUES (p_business, p_product, (p_cost->>'purchaseAmount')::numeric, v_currency, v_rate,
      coalesce(nullif(p_cost->>'freightUsd', '')::numeric, 0), nullif(p_cost->>'commissionUsd', '')::numeric, auth.uid(), now())
  ON CONFLICT (business_id, product_id) DO UPDATE SET
      purchase_amount = EXCLUDED.purchase_amount, purchase_currency = EXCLUDED.purchase_currency,
      purchase_rate = EXCLUDED.purchase_rate, freight_usd = EXCLUDED.freight_usd,
      commission_usd = EXCLUDED.commission_usd, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at;
  INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
  SELECT p_business, 'product:' || p_product, v_before - 'updated_at' - 'updated_by', to_jsonb(c) - 'updated_at' - 'updated_by', auth.uid()
    FROM nexo_business.product_costs c WHERE business_id = p_business AND product_id = p_product;
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN check_violation OR not_null_violation OR invalid_text_representation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_set_product_cost(TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_product_cost(TEXT, TEXT, JSONB) TO authenticated;
