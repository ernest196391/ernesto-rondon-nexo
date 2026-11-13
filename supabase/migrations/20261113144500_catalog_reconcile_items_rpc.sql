-- Control OS / Casa Viva: catálogo mínimo para reconciliación NEXO → Woo.
-- Mantiene el esquema nexo_business fuera de PostgREST; solo service_role puede leer este RPC.
create or replace function public.nexo_business_catalog_reconcile_items(p_business text)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'productId', p.product_id,
          'name', p.name,
          'sku', p.sku,
          'active', p.active,
          'variantLabel', p.variant_label,
          'wooId', case
            when coalesce(p.external_refs->'casaviva.company'->>'wooId','') ~ '^\d+$'
            then (p.external_refs->'casaviva.company'->>'wooId')::bigint
          end,
          'parentWooId', case
            when coalesce(p.external_refs->'casaviva.company'->>'parentWooId','') ~ '^\d+$'
            then (p.external_refs->'casaviva.company'->>'parentWooId')::bigint
          end
        )
      )
      order by p.product_id
    ) filter (
      where coalesce(p.external_refs->'casaviva.company'->>'wooId','') ~ '^\d+$'
    ),
    '[]'::jsonb
  )
  from nexo_business.catalog_products p
  where p.business_id = p_business;
$$;

revoke all on function public.nexo_business_catalog_reconcile_items(text)
from public, anon, authenticated;
grant execute on function public.nexo_business_catalog_reconcile_items(text)
to service_role;
