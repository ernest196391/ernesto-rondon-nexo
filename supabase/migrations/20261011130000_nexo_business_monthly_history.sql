-- Historial por meses (como BizneCubano): ventas de la tienda (caja) por mes, hora de La Habana.
-- La parte de la web la añade el panel con nexo-panel-web (action "history").
CREATE OR REPLACE FUNCTION public.nexo_business_monthly(p_business TEXT, p_months INT DEFAULT 12)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object('month', m.month, 'sales', coalesce(s.n, 0), 'usdMinor', coalesce(s.minor, 0), 'refundsMinor', coalesce(r.minor, 0)) ORDER BY m.month DESC)
      FROM (SELECT to_char(date_trunc('month', (now() AT TIME ZONE 'America/Havana')) - (g || ' months')::interval, 'YYYY-MM') AS month
              FROM generate_series(0, greatest(1, least(p_months, 36)) - 1) g) m
      LEFT JOIN (SELECT to_char(occurred_at AT TIME ZONE 'America/Havana', 'YYYY-MM') AS month, count(*) n, sum(total_minor) minor
                   FROM nexo_business.sales WHERE business_id = p_business GROUP BY 1) s USING (month)
      LEFT JOIN (SELECT to_char(occurred_at AT TIME ZONE 'America/Havana', 'YYYY-MM') AS month, sum(refund_minor) minor
                   FROM nexo_business.sale_returns WHERE business_id = p_business GROUP BY 1) r USING (month)), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_monthly(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_monthly(TEXT, INT) TO authenticated;
