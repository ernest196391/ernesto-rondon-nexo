-- SOLO LECTURA. Fotos de la nube para el simulador de precios (proyecto nexo-production).
-- Guardar cada resultado (la columna json_agg) en <carpeta>/datos/ con el nombre indicado.

-- 1) datos/nube-productos-con-costo.json  → {"rows": [...]}
select json_agg(r order by r.product_id)::text from (
  select p.product_id, p.name, p.category, p.active, p.variant_of, p.variant_label,
         (p.prices->>'USD')::bigint price_minor, p.regular_minor,
         (p.external_refs->'casaviva.company'->>'wooId')::int woo_id,
         c.purchase_amount::float8 purchase_amount, c.purchase_currency, c.purchase_rate::float8 purchase_rate,
         c.freight_usd::float8 freight_usd, c.commission_usd::float8 cost_commission_usd,
         pc.commission_usd::float8 product_commission_usd, c.partner_rule, c.partner_value::float8 partner_value,
         p.retired_at is not null retired
    from nexo_business.catalog_products p
    join nexo_business.product_costs c on c.business_id = p.business_id and c.product_id = p.product_id
    left join nexo_business.product_commissions pc on pc.business_id = p.business_id and pc.product_id = p.product_id
   where p.business_id = 'casa-viva') r;

-- 2) datos/nube-import-review.json  → {"rows": [...]}
select json_agg(r order by r.source_row)::text from (
  select source_row, excel_name, purchase_usd::float8 purchase_usd, freight_usd::float8 freight_usd,
         commission_usd::float8 commission_usd, owner_name, product_id, product_name, score::float8 score,
         status, reason, resolved_at is not null resolved
    from nexo_business.import_review where business_id = 'casa-viva') r;
