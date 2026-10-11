-- Panel: crear y editar productos (D38: la caja manda). Solo dueñas.
-- Guarda en la nube (las cajas lo descargan por `seq`) sin pisar lo que el formulario no toca:
-- otras monedas, referencias a la web, variantes. Devuelve wooId para que el panel copie el precio a la web.

-- Fotos de productos: bucket público, solo las dueñas suben (ruta "<negocio>/<archivo>").
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('nexo-product-photos', 'nexo-product-photos', TRUE, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Puente público: la regla de storage corre como `authenticated`, que no puede llamar a nexo_business.role_of.
CREATE OR REPLACE FUNCTION public.nexo_business_is_owner(p_business TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(nexo_business.role_of(p_business), '') = 'owner';
$$;
REVOKE ALL ON FUNCTION public.nexo_business_is_owner(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_is_owner(TEXT) TO authenticated;

DROP POLICY IF EXISTS "nexo-product-photos owner insert" ON storage.objects;
CREATE POLICY "nexo-product-photos owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nexo-product-photos' AND public.nexo_business_is_owner(split_part(name, '/', 1)));

CREATE OR REPLACE FUNCTION public.nexo_business_product_save(
  p_business TEXT, p_product_id TEXT, p_name TEXT, p_sku TEXT, p_barcodes TEXT[],
  p_price_usd NUMERIC, p_category TEXT, p_image_url TEXT, p_active BOOLEAN, p_min_stock INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_old nexo_business.catalog_products%ROWTYPE;
  v_row nexo_business.catalog_products%ROWTYPE;
  v_id TEXT := nullif(trim(coalesce(p_product_id, '')), '');
  v_sku TEXT := nullif(trim(coalesce(p_sku, '')), '');
  v_minor BIGINT;
  v_barcodes TEXT[];
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF nullif(trim(coalesce(p_name, '')), '') IS NULL THEN RETURN jsonb_build_object('error', 'Escribe el nombre del producto'); END IF;
  IF p_price_usd IS NULL OR p_price_usd <= 0 THEN RETURN jsonb_build_object('error', 'Escribe un precio mayor que 0'); END IF;
  IF p_min_stock IS NOT NULL AND p_min_stock < 0 THEN RETURN jsonb_build_object('error', 'El aviso de stock no puede ser negativo'); END IF;
  IF p_image_url IS NOT NULL AND p_image_url <> '' AND p_image_url !~ '^https://' THEN RETURN jsonb_build_object('error', 'La foto debe ser un enlace https'); END IF;
  v_minor := round(p_price_usd * 100)::bigint;
  v_barcodes := coalesce((SELECT array_agg(DISTINCT trim(b)) FROM unnest(coalesce(p_barcodes, '{}')) b WHERE trim(b) <> ''), '{}');

  IF v_id IS NOT NULL THEN
    SELECT * INTO v_old FROM nexo_business.catalog_products WHERE business_id = p_business AND product_id = v_id FOR UPDATE;
  END IF;

  IF v_old.product_id IS NULL THEN
    v_id := coalesce(v_id, gen_random_uuid()::text);
    -- SKU automático "nx-<n>" para que se pueda buscar en la caja.
    IF v_sku IS NULL THEN
      SELECT 'nx-' || (coalesce(max(substring(sku FROM '^nx-(\d+)$')::int), 0) + 1)
        INTO v_sku FROM nexo_business.catalog_products WHERE business_id = p_business;
    END IF;
    INSERT INTO nexo_business.catalog_products
      (business_id, product_id, sku, name, active, barcodes, prices, min_stock, category, image_url, seq, updated_by)
    VALUES (p_business, v_id, v_sku, trim(p_name), coalesce(p_active, TRUE), v_barcodes,
      jsonb_build_object('USD', v_minor), p_min_stock, nullif(trim(coalesce(p_category, '')), ''),
      nullif(p_image_url, ''), 0, auth.uid())
    RETURNING * INTO v_row;
  ELSE
    UPDATE nexo_business.catalog_products SET
      name = trim(p_name), sku = v_sku, barcodes = v_barcodes,
      prices = coalesce(prices, '{}'::jsonb) || jsonb_build_object('USD', v_minor),
      category = nullif(trim(coalesce(p_category, '')), ''),
      image_url = coalesce(nullif(p_image_url, ''), image_url),
      active = coalesce(p_active, active), min_stock = p_min_stock, updated_by = auth.uid()
    WHERE business_id = p_business AND product_id = v_id
    RETURNING * INTO v_row;
  END IF;

  IF (v_old.prices->>'USD')::bigint IS DISTINCT FROM v_minor THEN
    INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
    VALUES (p_business, 'price:' || v_id, v_old.prices, jsonb_build_object('USD', v_minor), auth.uid());
  END IF;

  RETURN jsonb_build_object('ok', true, 'created', v_old.product_id IS NULL, 'productId', v_row.product_id,
    'sku', v_row.sku, 'name', v_row.name,
    'priceChanged', (v_old.prices->>'USD')::bigint IS DISTINCT FROM v_minor,
    'wooId', (v_row.external_refs->'casaviva.company'->>'wooId')::bigint);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('error', 'Ese SKU ya lo usa otro producto');
END;
$$;

REVOKE ALL ON FUNCTION public.nexo_business_product_save(TEXT, TEXT, TEXT, TEXT, TEXT[], NUMERIC, TEXT, TEXT, BOOLEAN, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_product_save(TEXT, TEXT, TEXT, TEXT, TEXT[], NUMERIC, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
