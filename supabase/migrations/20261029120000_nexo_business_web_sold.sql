-- Lennys 29-oct («Eliminar producto»): ¿la caja ya vendió alguno de estos productos o diseños de la web?
-- nexo-panel-web lo pregunta antes de eliminar: si la caja lo vendió, la web lo OCULTA en vez de mandarlo a la papelera
-- (nunca se rompe una venta). Devuelve los wooId (de la lista) cuyo producto de la caja sale en alguna venta
-- (sale.completed, con líneas o de un solo producto). Solo lectura. Solo la llama la función (service_role).
CREATE OR REPLACE FUNCTION public.nexo_business_web_sold(p_business TEXT, p_woo_ids BIGINT[])
RETURNS BIGINT[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(array_agg(DISTINCT c.woo_id ORDER BY c.woo_id), '{}'::bigint[])
    FROM (
      SELECT x.woo_id, x.product_id FROM (
        SELECT CASE WHEN p.external_refs->'casaviva.company'->>'wooId' ~ '^[0-9]{1,18}$'
                    THEN (p.external_refs->'casaviva.company'->>'wooId')::bigint END AS woo_id, p.product_id
          FROM nexo_business.catalog_products p
         WHERE p.business_id = p_business) x
       WHERE x.woo_id = ANY (p_woo_ids)
    ) c
   WHERE EXISTS (
     SELECT 1 FROM nexo_business.sync_events e
      WHERE e.business_id = p_business AND e.operation_type = 'sale.completed'
        AND (e.envelope->'payload'->>'product_id' = c.product_id
          OR (jsonb_typeof(e.envelope->'payload'->'lines') = 'array'
              AND e.envelope->'payload'->'lines' @> jsonb_build_array(jsonb_build_object('product_id', c.product_id)))));
$$;
REVOKE ALL ON FUNCTION public.nexo_business_web_sold(TEXT, BIGINT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_web_sold(TEXT, BIGINT[]) TO service_role;
