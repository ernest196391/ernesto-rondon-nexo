-- SALDO 360 — formas de pago reales, moneda y precio mayorista (27-oct, decisión de Ernesto).
-- * Cada oferta tiene moneda: CUP o USD (precio por cada 100 CUP de saldo, en esa moneda).
-- * CUP: Transfermóvil, EnZona, efectivo. USD: Zelle, USDT, Tarjeta Clásica, MLC, efectivo en dólares.
-- * El vendedor puede escribir hasta 3 formas propias (p. ej. «PayPal»).
-- * Mayorista: «desde X CUP, precio Y por cada 100» (Y no puede ser mayor que el precio normal).

create or replace function private.valid_custom_methods(m text[]) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(cardinality(m), 0) <= 3
     and not exists (select 1 from unnest(coalesce(m, '{}')) x where char_length(btrim(x)) not between 2 and 30 or x ~ '[\r\n<>]') $$;

alter table public.offers drop constraint if exists offers_payment_methods_check;
alter table public.offers
  add column if not exists price_currency text not null default 'CUP',
  add column if not exists custom_payment_methods text[] not null default '{}',
  add column if not exists wholesale_min_cup integer,
  add column if not exists wholesale_price_per_100 numeric(10, 2);
alter table public.offers
  add constraint offers_currency_check check (price_currency in ('CUP', 'USD')),
  add constraint offers_custom_methods_check check (private.valid_custom_methods(custom_payment_methods)),
  add constraint offers_methods_v2_check check (
    cardinality(payment_methods) + cardinality(custom_payment_methods) between 1 and 8
    and ((price_currency = 'CUP' and payment_methods <@ array['transfermovil', 'enzona', 'efectivo'])
      or (price_currency = 'USD' and payment_methods <@ array['zelle', 'usdt', 'clasica', 'mlc', 'efectivo_usd']))),
  add constraint offers_wholesale_check check (
    (wholesale_min_cup is null) = (wholesale_price_per_100 is null)
    and (wholesale_min_cup is null or (wholesale_min_cup > min_cup and wholesale_min_cup <= max_cup
         and wholesale_price_per_100 > 0 and wholesale_price_per_100 <= price_per_100_cup)));

alter table public.requests add column if not exists price_currency text not null default 'CUP'
  check (price_currency in ('CUP', 'USD'));

create or replace view public.market_offers with (security_invoker = true) as
select o.id, o.shop_id, s.slug as shop_slug, s.name as shop_name, s.locality, s.photo_path, s.whatsapp_e164,
       o.min_cup, o.max_cup, o.price_per_100_cup, o.payment_methods, o.confirmed_at, o.expires_at,
       coalesce(r.confirmed_ops, 0) as confirmed_ops, coalesce(r.reviews_count, 0) as reviews_count,
       case when coalesce(r.reviews_count, 0) > 0 then round(r.rating_sum::numeric / r.reviews_count, 1) end as rating_avg,
       o.price_currency, o.custom_payment_methods, o.wholesale_min_cup, o.wholesale_price_per_100
from public.offers o
join public.shops s on s.id = o.shop_id
left join public.shop_reputation r on r.shop_id = s.id
where o.status = 'active' and o.expires_at > now() and o.confirmed_at <= now()
  and s.status = 'approved' and s.deleted_at is null;

-- RPC del vendedor con los campos nuevos (hora del servidor, RLS del usuario).
drop function if exists public.publish_offer(uuid, integer, integer, numeric, text[], integer);
drop function if exists public.update_offer(uuid, integer, integer, numeric, text[], integer);

create or replace function public.publish_offer(
  p_shop_id uuid, p_min_cup integer, p_max_cup integer, p_price_per_100_cup numeric,
  p_payment_methods text[], p_valid_hours integer default 24, p_currency text default 'CUP',
  p_custom_methods text[] default '{}', p_wholesale_min_cup integer default null, p_wholesale_price numeric default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if p_valid_hours is null or p_valid_hours < 1 or p_valid_hours > 72 then
    raise exception 'Vigencia de 1 a 72 horas' using errcode = 'P0001';
  end if;
  insert into public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods, expires_at,
                             price_currency, custom_payment_methods, wholesale_min_cup, wholesale_price_per_100)
  values (p_shop_id, p_min_cup, p_max_cup, p_price_per_100_cup, coalesce(p_payment_methods, '{}'),
          now() + make_interval(hours => p_valid_hours), coalesce(p_currency, 'CUP'), coalesce(p_custom_methods, '{}'),
          p_wholesale_min_cup, p_wholesale_price)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.update_offer(
  p_offer_id uuid, p_min_cup integer, p_max_cup integer, p_price_per_100_cup numeric,
  p_payment_methods text[], p_valid_hours integer default 24, p_currency text default 'CUP',
  p_custom_methods text[] default '{}', p_wholesale_min_cup integer default null, p_wholesale_price numeric default null)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare v_exp timestamptz;
begin
  if p_valid_hours is null or p_valid_hours < 1 or p_valid_hours > 72 then
    raise exception 'Vigencia de 1 a 72 horas' using errcode = 'P0001';
  end if;
  update public.offers set min_cup = p_min_cup, max_cup = p_max_cup, price_per_100_cup = p_price_per_100_cup,
    payment_methods = coalesce(p_payment_methods, '{}'), price_currency = coalesce(p_currency, 'CUP'),
    custom_payment_methods = coalesce(p_custom_methods, '{}'), wholesale_min_cup = p_wholesale_min_cup,
    wholesale_price_per_100 = p_wholesale_price, status = 'active', confirmed_at = now(),
    expires_at = now() + make_interval(hours => p_valid_hours)
  where id = p_offer_id and status <> 'removed'
  returning expires_at into v_exp;
  if v_exp is null then raise exception 'Oferta no encontrada' using errcode = 'P0002'; end if;
  return v_exp;
end $$;

-- La operación congela el precio que toca (mayorista si el monto llega) y la moneda.
create or replace function public.start_request(p_offer_id uuid, p_amount_cup integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare o record; v_id uuid; v_price numeric;
begin
  if auth.uid() is null or not private.is_active_user() then
    raise exception 'Entra en tu cuenta para seguir la operación' using errcode = '42501';
  end if;
  select of.*, s.owner_id into o from public.offers of join public.shops s on s.id = of.shop_id
   where of.id = p_offer_id and of.status = 'active' and of.expires_at > now()
     and s.status = 'approved' and s.deleted_at is null;
  if o.id is null then raise exception 'La oferta ya no está vigente' using errcode = 'P0001'; end if;
  if o.owner_id = auth.uid() then raise exception 'No puedes comprarte a ti mismo' using errcode = '42501'; end if;
  if p_amount_cup is null or p_amount_cup < o.min_cup or p_amount_cup > o.max_cup then
    raise exception 'Revisa el importe' using errcode = 'P0001';
  end if;
  select id into v_id from public.requests
   where buyer_id = auth.uid() and offer_id = p_offer_id and status in ('contacted', 'agreed', 'delivered')
     and created_at > now() - interval '24 hours'
   order by created_at desc limit 1;
  if v_id is not null then return v_id; end if;
  v_price := case when o.wholesale_min_cup is not null and p_amount_cup >= o.wholesale_min_cup
                  then o.wholesale_price_per_100 else o.price_per_100_cup end;
  insert into public.requests (buyer_id, shop_id, offer_id, amount_cup, price_per_100_cup, total_cup, price_currency)
  values (auth.uid(), o.shop_id, o.id, p_amount_cup, v_price, round(p_amount_cup * v_price / 100, 2), o.price_currency)
  returning id into v_id;
  insert into public.request_events (request_id, actor_id, action, to_status) values (v_id, auth.uid(), 'start', 'contacted');
  return v_id;
end $$;

revoke all on function private.valid_custom_methods(text[]) from public, anon, authenticated;
grant execute on function private.valid_custom_methods(text[]) to anon, authenticated;
revoke all on function public.publish_offer(uuid, integer, integer, numeric, text[], integer, text, text[], integer, numeric) from public, anon;
revoke all on function public.update_offer(uuid, integer, integer, numeric, text[], integer, text, text[], integer, numeric) from public, anon;
grant execute on function public.publish_offer(uuid, integer, integer, numeric, text[], integer, text, text[], integer, numeric) to authenticated;
grant execute on function public.update_offer(uuid, integer, integer, numeric, text[], integer, text, text[], integer, numeric) to authenticated;
revoke all on function public.start_request(uuid, integer) from public, anon;
grant execute on function public.start_request(uuid, integer) to authenticated;
grant insert (price_currency, custom_payment_methods, wholesale_min_cup, wholesale_price_per_100) on public.offers to authenticated;
grant update (price_currency, custom_payment_methods, wholesale_min_cup, wholesale_price_per_100) on public.offers to authenticated;
grant select on public.market_offers to anon, authenticated;
