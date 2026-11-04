-- 027 · Estrellas del equipo y fondo de la caja en el cierre (Ernesto y Lennys, 20-oct-2026).
-- Pegar en Supabase → proyecto nexo-production → SQL Editor (traductor de Chrome apagado). Se puede pegar dos veces.
--
-- 1) crm_estrellas: el registro de las estrellas de cada día (3, 2 y 1 a las 3 primeras gestoras y mensajeros al
--    cierre de las 17:00). Lo escribe el bot UNA vez por día (scripts/resumen-diario.mjs → src/estrellas.js); la clave
--    única impide duplicar aunque el cierre se repita. Mientras esta tabla no exista, el bot guarda lo mismo en
--    crm_settings «estrellas:AAAA-MM»; el punto 2 lo copia aquí.
-- 3) crm_cierre_caja: igual que antes + «shifts» (abrir y cerrar turno de la caja) para enseñar el fondo del día en el
--    cuadre de Lennys. Solo lectura, como antes.

create table if not exists crm_estrellas (
  id bigserial primary key,
  business_id uuid not null references crm_businesses(id),
  day date not null,                        -- día de Cuba del cierre (lo entregado de 17:00 de ayer a 17:00 de hoy)
  role text not null check (role in ('gestora', 'mensajero')),
  user_id text not null,                    -- usuario de la web; «caja:<id>» o «n:<nombre>» si no tiene
  phone text,                               -- por si un día hace falta (hoy el bot no lo guarda)
  name text not null,                       -- nombre corto con el que la conoce el equipo
  place smallint not null check (place between 1 and 3),
  stars smallint not null check (stars between 1 and 3),
  deliveries integer not null default 0,    -- pedidos entregados (gestora) o entregas hechas (mensajero) ese día
  created_at timestamptz not null default now(),
  unique (business_id, day, role, user_id)
);
create index if not exists crm_estrellas_mes on crm_estrellas (business_id, day desc, role);
alter table crm_estrellas enable row level security;
revoke all on crm_estrellas from anon, authenticated;

-- 2) Lo que el bot guardó antes de existir la tabla (crm_settings «estrellas:AAAA-MM») pasa a la tabla, sin duplicar.
insert into crm_estrellas (business_id, day, role, user_id, name, place, stars, deliveries)
select s.business_id, d.key::date, f ->> 'role', f ->> 'user_id', coalesce(f ->> 'name', ''),
       (f ->> 'place')::smallint, (f ->> 'stars')::smallint, coalesce((f ->> 'deliveries')::int, 0)
from crm_settings s
cross join lateral jsonb_each(s.value::jsonb -> 'dias') d
cross join lateral jsonb_array_elements(d.value) f
where s.key like 'estrellas:%' and s.value ~ '^\s*\{'
on conflict (business_id, day, role, user_id) do nothing;

-- 3) crm_cierre_caja con los turnos de la caja (fondo). El resto queda exactamente igual.
create or replace function public.crm_cierre_caja(p_business text, p_from timestamp with time zone, p_to timestamp with time zone)
 returns jsonb
 language sql
 stable security definer
 set search_path to 'nexo_business', 'public'
as $function$
  select jsonb_build_object(
    'sales', coalesce((
      select jsonb_agg(jsonb_build_object('occurred_at', e.occurred_at, 'payload', e.envelope -> 'payload') order by e.occurred_at)
      from nexo_business.sync_events e
      where e.business_id = p_business and e.operation_type = 'sale.completed'
        and e.occurred_at::timestamptz >= p_from and e.occurred_at::timestamptz < p_to), '[]'::jsonb),
    'returns', coalesce((
      select jsonb_agg(to_jsonb(r)) from nexo_business.sale_returns r
      where r.business_id = p_business and r.occurred_at >= p_from and r.occurred_at < p_to), '[]'::jsonb),
    'counts', coalesce((
      select jsonb_agg(jsonb_build_object('occurred_at', e.occurred_at, 'payload', e.envelope -> 'payload'))
      from nexo_business.sync_events e
      where e.business_id = p_business and e.operation_type = 'inventory.counted'
        and e.occurred_at::timestamptz >= p_from and e.occurred_at::timestamptz < p_to
        and coalesce((e.envelope -> 'payload' ->> 'difference_quantity')::numeric, 0) <> 0), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.product_id, 'name', c.name, 'active', c.active and c.retired_at is null,
        'min_stock', c.min_stock, 'variant_of', c.variant_of, 'updated_at', c.updated_at,
        'stock', s.quantity, 'commission_usd', pc.commission_usd))
      from nexo_business.catalog_products c
      left join nexo_business.stock_by_product s on s.business_id = c.business_id and s.product_id = c.product_id
      left join nexo_business.product_commissions pc on pc.business_id = c.business_id and pc.product_id = c.product_id
      where c.business_id = p_business), '[]'::jsonb),
    'people', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'kind', p.kind, 'name', p.full_name, 'phone', p.phone,
        'status', p.status, 'woo_user_id', p.woo_user_id))
      from nexo_business.people p where p.business_id = p_business), '[]'::jsonb),
    'commissions', coalesce((
      select jsonb_agg(jsonb_build_object('person_id', x.person_id, 'kind', x.kind, 'earned_usd', x.earned))
      from (select ce.person_id, ce.kind, sum(ce.amount_usd) earned from nexo_business.commission_entries ce
            where ce.business_id = p_business and ce.status = 'available' and ce.voided_at is null group by 1, 2) x), '[]'::jsonb),
    'payouts_paid', coalesce((
      select jsonb_agg(jsonb_build_object('person_id', y.person_id, 'paid_usd', y.paid))
      from (select po.person_id, sum(po.amount_usd) paid from nexo_business.payouts po
            where po.business_id = p_business and po.status = 'paid' group by 1) y), '[]'::jsonb),
    'custody', coalesce((
      select jsonb_agg(to_jsonb(m)) from nexo_business.messenger_custody m
      where m.business_id = p_business and m.outstanding_minor <> 0), '[]'::jsonb),
    'settings', (select jsonb_build_object('commission_mode', cs.commission_mode, 'commission_value', cs.commission_value)
      from nexo_business.cost_settings cs where cs.business_id = p_business),
    -- 20-oct: los últimos turnos de la caja hasta el final del día (abrir con su fondo y cerrar con su conteo)
    'shifts', coalesce((
      select jsonb_agg(jsonb_build_object('operation_type', x.operation_type, 'occurred_at', x.occurred_at, 'payload', x.envelope -> 'payload') order by x.occurred_at desc)
      from (select e.operation_type, e.occurred_at, e.envelope from nexo_business.sync_events e
            where e.business_id = p_business and e.operation_type in ('cash_shift.opened', 'cash_shift.closed')
              and e.occurred_at::timestamptz < p_to
            order by e.occurred_at desc limit 8) x), '[]'::jsonb)
  );
$function$;
revoke all on function public.crm_cierre_caja(text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.crm_cierre_caja(text, timestamptz, timestamptz) to service_role;

-- Comprobar: select count(*) from crm_estrellas;  ·  select jsonb_array_length(crm_cierre_caja('casa-viva', now() - interval '1 day', now()) -> 'shifts');
