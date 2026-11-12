-- SALDO 360 — corrección: pausar o quitar una oferta vencida hace días fallaba, porque el
-- disparador le renovaba la vigencia sin renovar la confirmación (violaba «máx. 72 h»).
-- Ahora solo se renueva cuando la oferta queda ACTIVA, y entonces se fecha todo desde ahora.
create or replace function private.guard_offer() returns trigger
language plpgsql security definer set search_path = '' as $$
declare active_count integer;
begin
  if auth.uid() is null or private.is_admin() then return new; end if;
  if not private.is_active_user() or not private.owns_shop(new.shop_id) then
    raise exception 'Solo el dueño de la tienda gestiona sus ofertas' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    new.source := 'web';
    new.confirmed_at := now();
    if new.expires_at is null or new.expires_at <= now() then new.expires_at := now() + interval '24 hours'; end if;
  else
    if new.shop_id is distinct from old.shop_id or new.source is distinct from old.source then
      raise exception 'Campo no editable' using errcode = '42501';
    end if;
    if old.status = 'removed' then
      raise exception 'Oferta eliminada' using errcode = '42501';
    end if;
    -- Reconfirmar = el proveedor dice «sigue en pie»: se fecha ahora, nunca en el futuro ni en el pasado.
    if new.confirmed_at is distinct from old.confirmed_at then new.confirmed_at := now(); end if;
    if new.status = 'active' and new.expires_at <= now() then
      new.confirmed_at := now();
      new.expires_at := now() + interval '24 hours';
    end if;
  end if;
  if new.status = 'active' then
    select count(*) into active_count from public.offers
      where shop_id = new.shop_id and status = 'active' and expires_at > now()
        and id is distinct from new.id;
    if active_count >= 5 then
      raise exception 'Máximo 5 ofertas activas por tienda' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_offer() from public, anon, authenticated;
