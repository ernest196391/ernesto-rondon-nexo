-- DESHACER en la nube NEXO (caja) los precios y comisiones cambiados el 14-oct-2026.
-- Pegar en Supabase (proyecto nexo-production) → SQL Editor. Las cajas reciben el precio viejo en su próxima sincronización.
-- Después, para que la web cobre la comisión vieja, también hay que correr deshacer.php (o esperar al empuje de las 3:15 UTC).
BEGIN;
WITH old(woo, usd) AS (VALUES
  (210,1500),(212,1500),(214,1500),(216,1500),(218,1500),(220,1500),(226,900),(268,800),(270,700),(391,700),(477,600),
  (570,1800),(572,1800),(761,800),(763,800),(765,800),(767,800),(769,800),(771,800),(807,3000),(2383,800),(2389,1600),
  (2409,600),(2441,800),(2463,1100),(2465,800),(2585,7000),(2593,7500),(2690,800),(2697,800),(2699,800),(2703,2500),
  (2790,1300),(2798,1500))
UPDATE nexo_business.catalog_products p SET prices = coalesce(p.prices, '{}'::jsonb) || jsonb_build_object('USD', old.usd)
  FROM old WHERE p.business_id = 'casa-viva' AND (p.external_refs->'casaviva.company'->>'wooId')::bigint = old.woo;

WITH old(woo, usd) AS (VALUES (684,5.00),(761,2.00),(763,2.00),(765,2.00),(767,2.00),(769,2.00),(771,2.00),(2441,1.49),(2465,2.00),(2699,5.00))
UPDATE nexo_business.product_commissions c SET commission_usd = old.usd, updated_at = now()
  FROM old, nexo_business.catalog_products p
 WHERE p.business_id = 'casa-viva' AND (p.external_refs->'casaviva.company'->>'wooId')::bigint = old.woo
   AND c.business_id = p.business_id AND c.product_id = p.product_id;
COMMIT;
