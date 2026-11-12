-- SALDO 360 — verificación automática del WhatsApp de una tienda (27-oct).
-- 1) El dueño pide un código (start_shop_verification) y envía «SALDO360 <código>» desde SU WhatsApp al bot.
-- 2) El bot (VivaBot, filtra por «SALDO360») llama a bot_verify_shop con el número REAL del remitente y una clave
--    secreta que solo él tiene. Si número y código cuadran, la tienda queda aprobada sola.
-- El bot nunca escribe primero: solo responde a quien le escribió.

create table if not exists private.shop_verifications (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  code text not null check (code ~ '^[0-9]{6}$'),
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

-- Huella (sha256) de la clave del bot. La clave en sí vive solo en el VPS.
create table if not exists private.bot_secrets (
  name text primary key,
  secret_sha256 text not null,
  created_at timestamptz not null default now()
);

create or replace function public.start_shop_verification(p_shop_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_code text; s record;
begin
  if auth.uid() is null or not private.is_active_user() or not private.owns_shop(p_shop_id) then
    raise exception 'Solo el dueño de la tienda' using errcode = '42501';
  end if;
  select * into s from public.shops where id = p_shop_id;
  if s.status <> 'pending' then raise exception 'La tienda no está en revisión' using errcode = 'P0001'; end if;
  if s.whatsapp_e164 is null then raise exception 'Falta el WhatsApp de la tienda' using errcode = 'P0001'; end if;
  v_code := lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::int & 2147483647) % 1000000)::text, 6, '0');
  insert into private.shop_verifications (shop_id, code, expires_at, attempts)
  values (p_shop_id, v_code, now() + interval '30 minutes', 0)
  on conflict (shop_id) do update set code = excluded.code, expires_at = excluded.expires_at, attempts = 0, created_at = now();
  return v_code;
end $$;

-- Resultado: approved | already | no_shop | no_code | expired | wrong_code | forbidden
create or replace function public.bot_verify_shop(p_phone text, p_code text, p_secret text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_phone text; s record; v record;
begin
  if p_secret is null or not exists (select 1 from private.bot_secrets
      where name = 'vivabot' and secret_sha256 = encode(extensions.digest(p_secret, 'sha256'), 'hex')) then
    return 'forbidden';
  end if;
  v_phone := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(v_phone) = 8 then v_phone := '53' || v_phone; end if;
  -- La tienda más reciente en revisión con ese WhatsApp.
  select * into s from public.shops where whatsapp_e164 = v_phone and deleted_at is null
    order by (status = 'pending') desc, created_at desc limit 1;
  if s.id is null then return 'no_shop'; end if;
  if s.status in ('approved', 'paused') then return 'already'; end if;
  if s.status <> 'pending' then return 'no_shop'; end if;
  select * into v from private.shop_verifications where shop_id = s.id for update;
  if v.shop_id is null then return 'no_code'; end if;
  if v.expires_at < now() or v.attempts >= 5 then
    delete from private.shop_verifications where shop_id = s.id;
    return 'expired';
  end if;
  if v.code <> regexp_replace(coalesce(p_code, ''), '\D', '', 'g') then
    update private.shop_verifications set attempts = attempts + 1 where shop_id = s.id;
    return 'wrong_code';
  end if;
  update public.shops set status = 'approved', verified_at = now(),
    consent_evidence = left('WhatsApp verificado por el propio número (SALDO360) ' || to_char(now() at time zone 'America/Havana', 'YYYY-MM-DD HH24:MI'), 300)
  where id = s.id;
  delete from private.shop_verifications where shop_id = s.id;
  perform private.audit('verify_whatsapp', 'shops', s.id::text, jsonb_build_object('via', 'vivabot'));
  return 'approved';
end $$;

revoke all on table private.shop_verifications, private.bot_secrets from public, anon, authenticated;
revoke all on function public.start_shop_verification(uuid) from public, anon;
revoke all on function public.bot_verify_shop(text, text, text) from public;
grant execute on function public.start_shop_verification(uuid) to authenticated;
-- El bot entra con la clave publicable (rol anon); lo protege la clave secreta.
grant execute on function public.bot_verify_shop(text, text, text) to anon, authenticated;
