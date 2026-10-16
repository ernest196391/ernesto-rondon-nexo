-- 2026-10-16 · Pedidos de Lennys (noche 15/16-oct), aprobados por Ernesto («revisa sus chats y corrige lo que necesita»).
--
-- 1) Gastos fijos por unidad PROPORCIONALES AL COSTO (no iguales para todos).
--    Antes: gastos fijos del mes ÷ unidades al mes = 1,59 USD en cada producto (un producto de 4,55 cargaba lo mismo
--    que un topper de 32,07). Ahora: gastos fijos del mes ÷ (unidades al mes × costo medio) = un % del costo
--    (≈ 8 %), y cada producto carga ese % de su costo. El total del mes se sigue cubriendo: unidades × costo medio × % =
--    gastos fijos del mes. Ajuste visible en Ajustes → Costos: «Gastos fijos: según el costo / iguales por unidad».
--    Volver a lo de antes: UPDATE nexo_business.cost_settings SET fixed_alloc = 'unit' (o el botón en Ajustes).
--
-- 2) Los costos que Lennys pone a mano NO se pisan («debes dejar el dato tal y como lo dejo»).
--    product_costs.manual_at = cuándo lo puso a mano (panel «Guardar costo»). Un disparador impide que cualquier otro
--    proceso (entradas de mercancía leídas de una factura, unir filas del Excel, scripts) cambie la compra, la moneda,
--    la tasa o el transporte de esa fila: deja lo de Lennys y apunta el intento en cost_audit ('kept:<producto>').
--    Solo nexo_business_set_product_cost (el panel) abre la puerta, con set_config('nexo.cost_manual','on', local).

ALTER TABLE nexo_business.cost_settings
  ADD COLUMN IF NOT EXISTS fixed_alloc TEXT NOT NULL DEFAULT 'cost';
DO $$ BEGIN
  ALTER TABLE nexo_business.cost_settings ADD CONSTRAINT cost_settings_fixed_alloc_check CHECK (fixed_alloc IN ('unit', 'cost'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE nexo_business.product_costs ADD COLUMN IF NOT EXISTS manual_at TIMESTAMPTZ;

-- Costos que ya están puestos a mano desde el panel (su último cambio fue «Guardar costo» y no lo pisó nada después).
UPDATE nexo_business.product_costs c SET manual_at = a.changed_at
  FROM (SELECT DISTINCT ON (business_id, subject) business_id, subject, changed_at, after
          FROM nexo_business.cost_audit WHERE subject LIKE 'product:%'
         ORDER BY business_id, subject, changed_at DESC) a
 WHERE a.business_id = c.business_id AND a.subject = 'product:' || c.product_id
   AND c.manual_at IS NULL
   AND (a.after->>'purchase_amount')::numeric = c.purchase_amount;

CREATE OR REPLACE FUNCTION nexo_business.product_costs_keep_manual()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $function$
BEGIN
  IF OLD.manual_at IS NOT NULL AND coalesce(current_setting('nexo.cost_manual', true), '') <> 'on' THEN
    IF (NEW.purchase_amount, NEW.purchase_currency, NEW.purchase_rate, NEW.freight_usd)
       IS DISTINCT FROM (OLD.purchase_amount, OLD.purchase_currency, OLD.purchase_rate, OLD.freight_usd) THEN
      INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
      VALUES (OLD.business_id, 'kept:' || OLD.product_id,
              jsonb_build_object('purchase_amount', OLD.purchase_amount, 'purchase_currency', OLD.purchase_currency,
                                 'purchase_rate', OLD.purchase_rate, 'freight_usd', OLD.freight_usd, 'manual_at', OLD.manual_at),
              jsonb_build_object('blocked', true, 'purchase_amount', NEW.purchase_amount, 'purchase_currency', NEW.purchase_currency,
                                 'purchase_rate', NEW.purchase_rate, 'freight_usd', NEW.freight_usd),
              NEW.updated_by);
      NEW.purchase_amount := OLD.purchase_amount;
      NEW.purchase_currency := OLD.purchase_currency;
      NEW.purchase_rate := OLD.purchase_rate;
      NEW.freight_usd := OLD.freight_usd;
      NEW.updated_by := OLD.updated_by;
      NEW.updated_at := OLD.updated_at;
    END IF;
    NEW.manual_at := OLD.manual_at;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS product_costs_keep_manual ON nexo_business.product_costs;
CREATE TRIGGER product_costs_keep_manual BEFORE UPDATE ON nexo_business.product_costs
  FOR EACH ROW EXECUTE FUNCTION nexo_business.product_costs_keep_manual();

CREATE OR REPLACE FUNCTION public.nexo_business_set_product_cost(p_business text, p_product text, p_cost jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  -- Costo puesto a mano por la dueña: es el único camino que puede cambiar un costo marcado como manual.
  PERFORM set_config('nexo.cost_manual', 'on', true);
  INSERT INTO nexo_business.product_costs (business_id, product_id, purchase_amount, purchase_currency, purchase_rate,
      freight_usd, commission_usd, staff_pct, updated_by, updated_at, manual_at)
  VALUES (p_business, p_product, (p_cost->>'purchaseAmount')::numeric, v_currency, v_rate,
      coalesce(nullif(p_cost->>'freightUsd', '')::numeric, 0), NULL,
      nullif(p_cost->>'staffPct', '')::numeric, auth.uid(), now(), now())
  ON CONFLICT (business_id, product_id) DO UPDATE SET
      purchase_amount = EXCLUDED.purchase_amount, purchase_currency = EXCLUDED.purchase_currency,
      purchase_rate = EXCLUDED.purchase_rate, freight_usd = EXCLUDED.freight_usd,
      commission_usd = NULL, staff_pct = EXCLUDED.staff_pct,
      updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at, manual_at = EXCLUDED.manual_at;
  PERFORM set_config('nexo.cost_manual', '', true);
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

CREATE OR REPLACE FUNCTION public.nexo_business_set_cost_settings(p_business text, p_settings jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      fixed_alloc = v_after.fixed_alloc,
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
$function$;

CREATE OR REPLACE FUNCTION public.nexo_business_cost_sheet(p_business text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  s nexo_business.cost_settings;
  v_fixed_usd NUMERIC;
  v_auto_units NUMERIC;
  v_units NUMERIC;
  v_fixed_unit NUMERIC;
  v_days NUMERIC;
  v_avg_landed NUMERIC;
  v_with_cost INT;
  v_base NUMERIC;
  v_fixed_rate NUMERIC;   -- gastos fijos ÷ (unidades × costo medio): fracción del costo de cada producto
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

  SELECT avg(c.purchase_amount / nullif(c.purchase_rate, 0) + c.freight_usd), count(*)
    INTO v_avg_landed, v_with_cost
    FROM nexo_business.product_costs c
    JOIN nexo_business.catalog_products p ON p.business_id = c.business_id AND p.product_id = c.product_id
   WHERE c.business_id = p_business AND p.active;
  v_base := v_units * v_avg_landed;
  v_fixed_rate := CASE WHEN v_base > 0 THEN v_fixed_usd / v_base END;

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
    'fixedAlloc', s.fixed_alloc,
    'avgLandedUsd', round(v_avg_landed, 2),
    'productsWithCost', v_with_cost,
    'costBaseUsd', round(v_base, 2),
    'fixedRate', v_fixed_rate,
    'fixedPctOfCost', round(100 * v_fixed_rate, 2),
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
          'staffPct', c.staff_pct, 'manualAt', c.manual_at) END,
        'calc', CASE WHEN c.product_id IS NULL THEN NULL ELSE (
          SELECT jsonb_build_object(
            'purchaseUsd', round(k.purchase_usd, 2), 'landedUsd', round(k.landed, 2),
            'fixedUsd', round(k.fixed, 2), 'contingencyUsd', round(k.total - k.landed - k.fixed, 2),
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
                       (y.landed + y.fixed) * (1 + s.contingency_pct / 100) AS total
                  FROM (SELECT x.*, s.other_pct + x.staff_pct
                               + CASE WHEN s.commission_mode = 'percent' AND pc.commission_usd IS NULL THEN s.commission_value ELSE 0 END AS pct,
                               CASE WHEN s.fixed_alloc = 'cost' AND v_fixed_rate IS NOT NULL THEN x.landed * v_fixed_rate ELSE v_fixed_unit END AS fixed
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
