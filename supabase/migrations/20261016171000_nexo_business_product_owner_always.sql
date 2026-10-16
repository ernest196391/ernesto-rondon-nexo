-- 2026-10-16 (Lennys): «La parte de proveedores en algunos no me deja poner el que es y en otro sí…
-- muchos están predeterminados para Casa Viva sin poder modificar».
-- Causa: el dueño de la mercancía vivía SOLO en product_costs.partner_id. Un producto sin costo guardado no tiene
-- fila ahí: el panel dejaba el selector apagado y nexo_business_set_product_partner decía «Primero guarda el costo».
-- Arreglo:
--   - product_owners: dueño (y regla especial) de CUALQUIER producto, tenga costo o no, con quién y cuándo lo cambió.
--   - set_product_partner / set_product_partner_rule: guardan siempre en product_owners y, si hay costo, también en
--     product_costs (donde lo leen los repartos y el resumen, sin cambios).
--   - Al guardar el costo por primera vez, la fila nueva de product_costs copia el dueño de product_owners.
--   - product_partners: devuelve el dueño de product_costs y, si no hay costo, el de product_owners.
-- No se borra nada. Deshacer: volver a crear las 3 funciones como en 20261004070000/20261004110000, borrar el
-- disparador product_costs_owner_from_intent y (si se quiere) la tabla product_owners.

CREATE TABLE IF NOT EXISTS nexo_business.product_owners (
  business_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  partner_id UUID REFERENCES nexo_business.people(id),
  partner_rule TEXT CHECK (partner_rule IS NULL OR partner_rule IN ('supplier_price', 'percent_of_sale', 'fixed_per_unit', 'percent_of_profit')),
  partner_value NUMERIC CHECK (partner_value IS NULL OR partner_value >= 0),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, product_id)
);
ALTER TABLE nexo_business.product_owners ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.product_owners FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_set_product_partner(p_business TEXT, p_product TEXT, p_partner UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_has_cost BOOLEAN;
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_partner IS NOT NULL AND NOT EXISTS (SELECT 1 FROM nexo_business.people WHERE id = p_partner AND business_id = p_business AND kind = 'partner') THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Socio desconocido');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = p_product) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  INSERT INTO nexo_business.product_owners (business_id, product_id, partner_id, updated_by, updated_at)
  VALUES (p_business, p_product, p_partner, auth.uid(), now())
  ON CONFLICT (business_id, product_id) DO UPDATE SET partner_id = EXCLUDED.partner_id, updated_by = EXCLUDED.updated_by, updated_at = now();
  UPDATE nexo_business.product_costs SET partner_id = p_partner, updated_by = auth.uid(), updated_at = now()
   WHERE business_id = p_business AND product_id = p_product;
  v_has_cost := FOUND;
  INSERT INTO nexo_business.cost_audit (business_id, subject, after, changed_by)
  VALUES (p_business, 'product_partner:' || p_product, jsonb_build_object('partner_id', p_partner, 'has_cost', v_has_cost), auth.uid());
  RETURN jsonb_build_object('ok', true, 'hasCost', v_has_cost);
END;
$$;

CREATE OR REPLACE FUNCTION public.nexo_business_set_product_partner_rule(p_business TEXT, p_product TEXT, p_rule TEXT, p_value NUMERIC)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_rule TEXT := nullif(p_rule, ''); v_value NUMERIC; v_has_cost BOOLEAN;
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF v_rule IS NOT NULL AND v_rule LIKE 'percent%' AND coalesce(p_value, -1) NOT BETWEEN 0 AND 100 THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'El porcentaje va de 0 a 100');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = p_product) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  v_value := CASE WHEN v_rule IS NULL OR v_rule = 'supplier_price' THEN NULL ELSE p_value END;
  INSERT INTO nexo_business.product_owners (business_id, product_id, partner_rule, partner_value, updated_by, updated_at)
  VALUES (p_business, p_product, v_rule, v_value, auth.uid(), now())
  ON CONFLICT (business_id, product_id) DO UPDATE SET partner_rule = EXCLUDED.partner_rule, partner_value = EXCLUDED.partner_value,
    updated_by = EXCLUDED.updated_by, updated_at = now();
  UPDATE nexo_business.product_costs SET partner_rule = v_rule, partner_value = v_value, updated_by = auth.uid(), updated_at = now()
   WHERE business_id = p_business AND product_id = p_product;
  v_has_cost := FOUND;
  INSERT INTO nexo_business.cost_audit (business_id, subject, after, changed_by)
  VALUES (p_business, 'product_partner_rule:' || p_product, jsonb_build_object('rule', v_rule, 'value', p_value, 'has_cost', v_has_cost), auth.uid());
  RETURN jsonb_build_object('ok', true, 'hasCost', v_has_cost);
EXCEPTION WHEN check_violation THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.nexo_business_product_partners(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((
      SELECT jsonb_object_agg(x.product_id, x.partner_id) FROM (
        SELECT product_id, partner_id FROM nexo_business.product_costs WHERE business_id = p_business AND partner_id IS NOT NULL
        UNION ALL
        SELECT o.product_id, o.partner_id FROM nexo_business.product_owners o
         WHERE o.business_id = p_business AND o.partner_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM nexo_business.product_costs c WHERE c.business_id = o.business_id AND c.product_id = o.product_id)) x),
      '{}'::jsonb)
    || jsonb_build_object('_rules', coalesce((
      SELECT jsonb_object_agg(x.product_id, jsonb_build_object('rule', x.partner_rule, 'value', x.partner_value)) FROM (
        SELECT product_id, partner_rule, partner_value FROM nexo_business.product_costs WHERE business_id = p_business AND partner_rule IS NOT NULL
        UNION ALL
        SELECT o.product_id, o.partner_rule, o.partner_value FROM nexo_business.product_owners o
         WHERE o.business_id = p_business AND o.partner_rule IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM nexo_business.product_costs c WHERE c.business_id = o.business_id AND c.product_id = o.product_id)) x),
      '{}'::jsonb));
END;
$$;

-- Al crear la fila de costo, toma el dueño elegido antes (si la fila no trae uno).
CREATE OR REPLACE FUNCTION nexo_business.product_costs_owner_from_intent()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE o RECORD;
BEGIN
  IF NEW.partner_id IS NULL AND NEW.partner_rule IS NULL THEN
    SELECT partner_id, partner_rule, partner_value INTO o FROM nexo_business.product_owners
     WHERE business_id = NEW.business_id AND product_id = NEW.product_id;
    IF FOUND THEN
      NEW.partner_id := o.partner_id;
      NEW.partner_rule := o.partner_rule;
      NEW.partner_value := o.partner_value;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS product_costs_owner_from_intent ON nexo_business.product_costs;
CREATE TRIGGER product_costs_owner_from_intent BEFORE INSERT ON nexo_business.product_costs
  FOR EACH ROW EXECUTE FUNCTION nexo_business.product_costs_owner_from_intent();
