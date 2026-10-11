-- ¿El puente ya restó en la caja esta línea de pedido web? (para que una edición no reste dos veces)
CREATE OR REPLACE FUNCTION public.nexo_business_web_line_synced(p_business TEXT, p_order BIGINT, p_item BIGINT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM nexo_business.web_stock_sync
                  WHERE business_id = p_business AND stock_key = 'web:' || p_order || ':' || p_item || ':out');
$$;
REVOKE ALL ON FUNCTION public.nexo_business_web_line_synced(TEXT, BIGINT, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_web_line_synced(TEXT, BIGINT, BIGINT) TO service_role;
