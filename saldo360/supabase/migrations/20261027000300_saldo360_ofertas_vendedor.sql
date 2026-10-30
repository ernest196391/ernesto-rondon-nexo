-- SALDO 360 — el vendedor publica y edita sus ofertas con la HORA DEL SERVIDOR.
-- Muchos móviles tienen la hora mal: la vigencia nunca se calcula en el teléfono.
-- SECURITY INVOKER: corren con los permisos del usuario (RLS y disparadores de 000100 siguen mandando).

create or replace function public.publish_offer(
  p_shop_id uuid, p_min_cup integer, p_max_cup integer, p_price_per_100_cup numeric,
  p_payment_methods text[], p_valid_hours integer default 24)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if p_valid_hours is null or p_valid_hours < 1 or p_valid_hours > 72 then
    raise exception 'Vigencia de 1 a 72 horas' using errcode = 'P0001';
  end if;
  insert into public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods, expires_at)
  values (p_shop_id, p_min_cup, p_max_cup, p_price_per_100_cup, p_payment_methods, now() + make_interval(hours => p_valid_hours))
  returning id into v_id;
  return v_id;
end $$;

-- Editar = volver a confirmar: cambia datos y renueva la vigencia desde ahora.
create or replace function public.update_offer(
  p_offer_id uuid, p_min_cup integer, p_max_cup integer, p_price_per_100_cup numeric,
  p_payment_methods text[], p_valid_hours integer default 24)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare v_exp timestamptz;
begin
  if p_valid_hours is null or p_valid_hours < 1 or p_valid_hours > 72 then
    raise exception 'Vigencia de 1 a 72 horas' using errcode = 'P0001';
  end if;
  update public.offers set min_cup = p_min_cup, max_cup = p_max_cup, price_per_100_cup = p_price_per_100_cup,
    payment_methods = p_payment_methods, status = 'active', confirmed_at = now(),
    expires_at = now() + make_interval(hours => p_valid_hours)
  where id = p_offer_id and status <> 'removed'
  returning expires_at into v_exp;
  if v_exp is null then raise exception 'Oferta no encontrada' using errcode = 'P0002'; end if;
  return v_exp;
end $$;

-- «Sigue en pie»: mismo precio, vigencia renovada.
create or replace function public.confirm_offer(p_offer_id uuid, p_valid_hours integer default 24)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare v_exp timestamptz;
begin
  if p_valid_hours is null or p_valid_hours < 1 or p_valid_hours > 72 then
    raise exception 'Vigencia de 1 a 72 horas' using errcode = 'P0001';
  end if;
  update public.offers set status = 'active', confirmed_at = now(), expires_at = now() + make_interval(hours => p_valid_hours)
  where id = p_offer_id and status <> 'removed'
  returning expires_at into v_exp;
  if v_exp is null then raise exception 'Oferta no encontrada' using errcode = 'P0002'; end if;
  return v_exp;
end $$;

revoke all on function public.publish_offer(uuid, integer, integer, numeric, text[], integer) from public, anon;
revoke all on function public.update_offer(uuid, integer, integer, numeric, text[], integer) from public, anon;
revoke all on function public.confirm_offer(uuid, integer) from public, anon;
grant execute on function public.publish_offer(uuid, integer, integer, numeric, text[], integer) to authenticated;
grant execute on function public.update_offer(uuid, integer, integer, numeric, text[], integer) to authenticated;
grant execute on function public.confirm_offer(uuid, integer) to authenticated;
