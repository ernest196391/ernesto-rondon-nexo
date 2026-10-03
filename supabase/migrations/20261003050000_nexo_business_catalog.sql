-- Cloud catalog and incremental pull to devices (ADR-001 pull side).
--
-- * catalog_products: one row per product with its barcodes and prices per
--   currency. Every insert/update takes a new value from a global sequence
--   (`seq`), so a device asks for "changes after my checkpoint" and applies
--   them in order. Products are deactivated, never deleted.
-- * catalog_upsert(): owners (members with role 'owner') edit the catalog of
--   their business from the dashboard.
-- * catalog_pull(): devices authenticated by their token read changes after a
--   checkpoint (service-role-only wrapper used by the nexo-catalog-pull Edge
--   Function).

CREATE SEQUENCE IF NOT EXISTS nexo_business.catalog_seq;

CREATE TABLE IF NOT EXISTS nexo_business.catalog_products (
  business_id TEXT NOT NULL CHECK (length(trim(business_id)) > 0),
  product_id TEXT NOT NULL CHECK (length(trim(product_id)) > 0),
  sku TEXT,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  barcodes TEXT[] NOT NULL DEFAULT '{}',
  -- {"USD": 12500, "CUP": 300000}: minor units per currency.
  prices JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(prices) = 'object'),
  seq BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  PRIMARY KEY (business_id, product_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS catalog_products_sku_idx
  ON nexo_business.catalog_products (business_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_products_seq_idx
  ON nexo_business.catalog_products (business_id, seq);

ALTER TABLE nexo_business.catalog_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.catalog_products FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON nexo_business.catalog_products TO service_role;
GRANT USAGE ON SEQUENCE nexo_business.catalog_seq TO service_role;

CREATE OR REPLACE FUNCTION nexo_business.catalog_touch() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.seq := nextval('nexo_business.catalog_seq');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS catalog_products_touch ON nexo_business.catalog_products;
CREATE TRIGGER catalog_products_touch
  BEFORE INSERT OR UPDATE ON nexo_business.catalog_products
  FOR EACH ROW EXECUTE FUNCTION nexo_business.catalog_touch();

CREATE OR REPLACE FUNCTION nexo_business.forbid_catalog_delete() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'catalog products are deactivated, never deleted';
END;
$$;
DROP TRIGGER IF EXISTS catalog_products_no_delete ON nexo_business.catalog_products;
CREATE TRIGGER catalog_products_no_delete
  BEFORE DELETE ON nexo_business.catalog_products
  FOR EACH ROW EXECUTE FUNCTION nexo_business.forbid_catalog_delete();

-- Owner edits. Validates prices (non-negative integers, 3–16 char codes).
CREATE OR REPLACE FUNCTION public.nexo_business_catalog_upsert(
  p_business TEXT, p_product_id TEXT, p_name TEXT, p_sku TEXT,
  p_barcodes TEXT[], p_prices JSONB, p_active BOOLEAN DEFAULT TRUE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_key TEXT;
  v_value JSONB;
  v_prices JSONB := '{}'::jsonb;
  v_row nexo_business.catalog_products%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM nexo_business.members
    WHERE user_id = auth.uid() AND business_id = p_business AND role = 'owner') THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF coalesce(trim(p_product_id), '') = '' OR coalesce(trim(p_name), '') = '' THEN
    RETURN jsonb_build_object('error', 'Falta el identificador o el nombre');
  END IF;
  IF jsonb_typeof(coalesce(p_prices, '{}'::jsonb)) <> 'object' THEN
    RETURN jsonb_build_object('error', 'Precios inválidos');
  END IF;
  FOR v_key, v_value IN SELECT * FROM jsonb_each(coalesce(p_prices, '{}'::jsonb)) LOOP
    IF upper(v_key) !~ '^[A-Z0-9]{3,16}$' OR jsonb_typeof(v_value) <> 'number'
       OR (v_value::text)::numeric < 0 OR (v_value::text)::numeric <> trunc((v_value::text)::numeric) THEN
      RETURN jsonb_build_object('error', 'Precio inválido para ' || v_key);
    END IF;
    v_prices := v_prices || jsonb_build_object(upper(v_key), (v_value::text)::bigint);
  END LOOP;

  INSERT INTO nexo_business.catalog_products AS c
    (business_id, product_id, sku, name, active, barcodes, prices, seq, updated_by)
  VALUES
    (p_business, trim(p_product_id), nullif(trim(coalesce(p_sku, '')), ''), trim(p_name), coalesce(p_active, TRUE),
     coalesce((SELECT array_agg(DISTINCT trim(b)) FROM unnest(coalesce(p_barcodes, '{}')) b WHERE trim(b) <> ''), '{}'),
     v_prices, 0, auth.uid())
  ON CONFLICT (business_id, product_id) DO UPDATE SET
    sku = EXCLUDED.sku, name = EXCLUDED.name, active = EXCLUDED.active,
    barcodes = EXCLUDED.barcodes, prices = EXCLUDED.prices, updated_by = EXCLUDED.updated_by
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row) - 'updated_by';
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('error', 'Ese SKU ya lo usa otro producto');
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_catalog_upsert(TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_catalog_upsert(TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB, BOOLEAN) TO authenticated;

-- Owner/viewer listing for the dashboard.
CREATE OR REPLACE FUNCTION public.nexo_business_catalog_list(p_business TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT CASE WHEN EXISTS (SELECT 1 FROM nexo_business.members WHERE user_id = auth.uid() AND business_id = p_business)
    THEN coalesce((SELECT jsonb_agg(to_jsonb(c) - 'updated_by' ORDER BY c.active DESC, c.name)
                   FROM nexo_business.catalog_products c WHERE c.business_id = p_business), '[]'::jsonb)
    ELSE jsonb_build_object('error', 'forbidden') END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_catalog_list(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_catalog_list(TEXT) TO authenticated;

-- Device pull: changes after a checkpoint, oldest first.
CREATE OR REPLACE FUNCTION nexo_business.catalog_pull(p_token TEXT, p_after BIGINT, p_limit INT DEFAULT 200)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_business TEXT;
BEGIN
  IF coalesce(length(p_token), 0) < 32 THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;
  SELECT business_id INTO v_business FROM nexo_business.devices
   WHERE token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') AND active;
  IF v_business IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;
  RETURN jsonb_build_object('changes', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'seq', c.seq, 'productId', c.product_id, 'sku', c.sku, 'name', c.name, 'active', c.active,
      'barcodes', to_jsonb(c.barcodes), 'prices', c.prices, 'updatedAt', c.updated_at) ORDER BY c.seq)
    FROM (SELECT * FROM nexo_business.catalog_products
          WHERE business_id = v_business AND seq > coalesce(p_after, 0)
          ORDER BY seq LIMIT least(greatest(coalesce(p_limit, 200), 1), 500)) c
  ), '[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION nexo_business.catalog_pull(TEXT, BIGINT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION nexo_business.catalog_pull(TEXT, BIGINT, INT) TO service_role;

CREATE OR REPLACE FUNCTION public.nexo_business_catalog_pull(p_token TEXT, p_after BIGINT, p_limit INT DEFAULT 200)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT nexo_business.catalog_pull(p_token, p_after, p_limit);
$$;
REVOKE ALL ON FUNCTION public.nexo_business_catalog_pull(TEXT, BIGINT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_catalog_pull(TEXT, BIGINT, INT) TO service_role;

-- Members list their businesses (dashboard picks the business to edit).
CREATE OR REPLACE FUNCTION public.nexo_business_my_memberships()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('businessId', business_id, 'role', role) ORDER BY business_id), '[]'::jsonb)
  FROM nexo_business.members WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.nexo_business_my_memberships() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_my_memberships() TO authenticated;

-- Seed: the pilot catalog currently hard-coded in the POS, so devices converge
-- on the same product IDs. Re-running only bumps seq.
INSERT INTO nexo_business.catalog_products (business_id, product_id, sku, name, barcodes, prices, seq)
VALUES
  ('casa-viva', 'casa-viva-demo-001', 'CV-DEMO-001', 'Producto Casa Viva Demo', ARRAY['850000000001'], '{"USD": 25000}', 0),
  ('casa-viva', 'nexo-demo-002', 'NX-DEMO-002', 'Producto NEXO Demo', ARRAY['850000000002'], '{"USD": 12500}', 0)
ON CONFLICT (business_id, product_id) DO NOTHING;
