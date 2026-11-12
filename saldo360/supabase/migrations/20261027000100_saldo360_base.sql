-- SALDO 360 — esquema base v1 (27-oct-2026)
-- Va SOLO en el proyecto Supabase dedicado de Saldo 360. NUNCA en nexo-production.
--
-- Reglas que este archivo hace cumplir dentro de la base (no en el navegador):
--  * Un proveedor solo edita SU tienda y SUS ofertas (RLS + disparadores).
--  * Nadie se da a sí mismo rol de administrador ni se «verifica» solo.
--  * El público solo ve tiendas aprobadas y ofertas activas NO vencidas.
--  * Un clic a WhatsApp es un «contacto», nunca una venta.
--  * Una operación solo cuenta para la reputación si comprador Y proveedor la confirman.
--  * Solo el comprador de una operación confirmada puede valorarla, una vez.
--  * Las acciones sensibles quedan en audit_events.
-- Importes en CUP. Precio = CUP que paga el comprador por cada 100 CUP de saldo.

create schema if not exists private;

-- ───────────────────────── utilidades ─────────────────────────
create or replace function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

-- ───────────────────────── 1. perfiles ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin' and status = 'active') $$;

create or replace function private.is_active_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'active') $$;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Rol y estado solo los cambia un admin (o el sistema: auth.uid() nulo = service role / SQL).
-- Única excepción: buyer → seller cuando ya tiene tienda propia.
create or replace function private.guard_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or private.is_admin() then return new; end if;
  if new.status is distinct from old.status then
    raise exception 'No puedes cambiar el estado de la cuenta' using errcode = '42501';
  end if;
  if new.role is distinct from old.role and not (
       old.role = 'buyer' and new.role = 'seller'
       and exists (select 1 from public.shops where owner_id = new.id)) then
    raise exception 'No puedes cambiar tu rol' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function private.guard_profile();
create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

-- ───────────────────────── 2. tiendas ─────────────────────────
-- owner_id nulo = tienda gestionada por Saldo 360 para un proveedor que dio su
-- consentimiento pero aún no tiene cuenta (piloto con importación supervisada).
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid unique references public.profiles(id) on delete set null default auth.uid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  bio text not null default '' check (char_length(bio) <= 280),
  locality text not null default '' check (char_length(locality) <= 60),
  whatsapp_e164 text check (whatsapp_e164 ~ '^53[0-9]{8}$'),
  whatsapp_consent_at timestamptz,
  consent_evidence text check (char_length(consent_evidence) <= 300),
  photo_path text check (char_length(photo_path) <= 200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'paused', 'suspended')),
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (whatsapp_e164 is null or whatsapp_consent_at is not null)
);
create index shops_status_idx on public.shops (status) where deleted_at is null;

create or replace function private.guard_shop() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or private.is_admin() then return new; end if;
  if not private.is_active_user() then
    raise exception 'Cuenta suspendida' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    new.status := 'pending';
    new.verified_at := null; new.verified_by := null; new.consent_evidence := null;
    if new.whatsapp_e164 is not null then new.whatsapp_consent_at := now(); end if;
    return new;
  end if;
  -- UPDATE por el dueño
  if new.owner_id is distinct from old.owner_id or new.verified_at is distinct from old.verified_at
     or new.verified_by is distinct from old.verified_by or new.consent_evidence is distinct from old.consent_evidence
     or new.slug is distinct from old.slug or new.deleted_at is distinct from old.deleted_at then
    raise exception 'Campo reservado a moderación' using errcode = '42501';
  end if;
  if new.status is distinct from old.status and not (
       (old.status = 'approved' and new.status = 'paused') or (old.status = 'paused' and new.status = 'approved')) then
    raise exception 'Solo puedes pausar o reactivar tu tienda' using errcode = '42501';
  end if;
  -- Cambiar el WhatsApp obliga a verificar de nuevo (evita suplantación).
  if new.whatsapp_e164 is distinct from old.whatsapp_e164 then
    new.status := 'pending'; new.verified_at := null; new.verified_by := null;
    new.whatsapp_consent_at := case when new.whatsapp_e164 is null then null else now() end;
  end if;
  return new;
end $$;
create trigger shops_guard before insert or update on public.shops
  for each row execute function private.guard_shop();
create trigger shops_touch before update on public.shops
  for each row execute function private.touch_updated_at();

create or replace function private.promote_seller() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is not null then
    update public.profiles set role = 'seller' where id = new.owner_id and role = 'buyer';
  end if;
  return new;
end $$;
create trigger shops_promote after insert on public.shops
  for each row execute function private.promote_seller();

create or replace function private.owns_shop(p_shop uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.shops where id = p_shop and owner_id = auth.uid() and deleted_at is null) $$;

create or replace function private.shop_is_public(p_shop uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.shops where id = p_shop and status = 'approved' and deleted_at is null) $$;

-- ───────────────────────── 3. ofertas ─────────────────────────
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  min_cup integer not null check (min_cup >= 1),
  max_cup integer not null check (max_cup >= min_cup and max_cup <= 100000),
  price_per_100_cup numeric(10, 2) not null check (price_per_100_cup > 0 and price_per_100_cup <= 100000),
  payment_methods text[] not null check (
    cardinality(payment_methods) between 1 and 3
    and payment_methods <@ array['transfermovil', 'enzona', 'efectivo']),
  status text not null default 'active' check (status in ('active', 'paused', 'removed')),
  source text not null default 'web' check (source in ('web', 'vivabot', 'admin_import')),
  confirmed_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > confirmed_at and expires_at <= confirmed_at + interval '72 hours')
);
create index offers_public_idx on public.offers (status, expires_at, price_per_100_cup);
create index offers_shop_idx on public.offers (shop_id);

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
    if new.expires_at <= now() then new.expires_at := now() + interval '24 hours'; end if;
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
create trigger offers_guard before insert or update on public.offers
  for each row execute function private.guard_offer();
create trigger offers_touch before update on public.offers
  for each row execute function private.touch_updated_at();

-- ───────────────────────── 4. reputación (solo hechos comprobados) ─────────────────────────
create table public.shop_reputation (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  confirmed_ops integer not null default 0 check (confirmed_ops >= 0),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  rating_sum integer not null default 0 check (rating_sum >= 0),
  updated_at timestamptz not null default now()
);

create or replace function private.bump_reputation(p_shop uuid, p_ops integer, p_reviews integer, p_rating integer)
returns void language sql security definer set search_path = '' as $$
  insert into public.shop_reputation (shop_id, confirmed_ops, reviews_count, rating_sum)
  values (p_shop, greatest(p_ops, 0), greatest(p_reviews, 0), greatest(p_rating, 0))
  on conflict (shop_id) do update set
    confirmed_ops = greatest(public.shop_reputation.confirmed_ops + p_ops, 0),
    reviews_count = greatest(public.shop_reputation.reviews_count + p_reviews, 0),
    rating_sum = greatest(public.shop_reputation.rating_sum + p_rating, 0),
    updated_at = now() $$;

-- ───────────────────────── 5. contactos (NO son ventas) ─────────────────────────
create table public.contact_events (
  id bigint generated always as identity primary key,
  offer_id uuid references public.offers(id) on delete set null,
  shop_id uuid not null references public.shops(id) on delete cascade,
  buyer_id uuid references public.profiles(id) on delete set null,
  channel text not null default 'whatsapp' check (channel in ('whatsapp')),
  amount_cup integer check (amount_cup between 1 and 100000),
  created_at timestamptz not null default now()
);
create index contact_events_shop_idx on public.contact_events (shop_id, created_at desc);

-- ───────────────────────── 6. operaciones ─────────────────────────
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete set null,
  amount_cup integer not null check (amount_cup between 1 and 100000),
  price_per_100_cup numeric(10, 2) not null check (price_per_100_cup > 0),
  total_cup numeric(12, 2) not null check (total_cup > 0),
  status text not null default 'contacted'
    check (status in ('contacted', 'agreed', 'delivered', 'confirmed', 'disputed', 'cancelled')),
  buyer_confirmed_at timestamptz,
  seller_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);
create index requests_buyer_idx on public.requests (buyer_id, created_at desc);
create index requests_shop_idx on public.requests (shop_id, created_at desc);
create trigger requests_touch before update on public.requests
  for each row execute function private.touch_updated_at();

create table public.request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.requests(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  from_status text,
  to_status text,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index request_events_request_idx on public.request_events (request_id, id);

-- ───────────────────────── 7. reseñas ─────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 400),
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index reviews_shop_idx on public.reviews (shop_id, created_at desc);

-- ───────────────────────── 8. denuncias, auditoría y consentimientos ─────────────────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  target_type text not null check (target_type in ('shop', 'offer', 'request', 'review')),
  target_id uuid not null,
  reason text not null check (reason in ('fraude', 'precio_falso', 'no_responde', 'suplantacion', 'contenido', 'otro')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles(id),
  resolution text check (char_length(resolution) <= 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  resource text not null,
  resource_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_resource_idx on public.audit_events (resource, resource_id, id desc);

create table public.message_opt_ins (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  channel text not null default 'whatsapp' check (channel in ('whatsapp')),
  category text not null check (category in ('offer_refresh', 'contact_alerts')),
  consent_at timestamptz not null default now(),
  evidence text check (char_length(evidence) <= 300),
  revoked_at timestamptz,
  unique (shop_id, channel, category)
);

create or replace function private.audit(p_action text, p_resource text, p_id text, p_detail jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_events (actor_id, action, resource, resource_id, detail)
  values (auth.uid(), p_action, p_resource, p_id, coalesce(p_detail, '{}'::jsonb)) $$;

create or replace function private.audit_row() returns trigger
language plpgsql security definer set search_path = '' as $$
declare d jsonb;
begin
  if tg_table_name = 'shops' then
    d := jsonb_build_object('status', jsonb_build_array(case when tg_op = 'UPDATE' then old.status end, new.status),
                            'whatsapp_changed', tg_op = 'UPDATE' and new.whatsapp_e164 is distinct from old.whatsapp_e164);
  elsif tg_table_name = 'offers' then
    d := jsonb_build_object('status', new.status, 'price_per_100_cup', new.price_per_100_cup,
                            'min_cup', new.min_cup, 'max_cup', new.max_cup, 'expires_at', new.expires_at, 'source', new.source);
  elsif tg_table_name = 'profiles' then
    if tg_op = 'UPDATE' and new.role is not distinct from old.role and new.status is not distinct from old.status then
      return new;
    end if;
    d := jsonb_build_object('role', new.role, 'status', new.status);
  end if;
  perform private.audit(lower(tg_op), tg_table_name, new.id::text, d);
  return new;
end $$;
create trigger shops_audit after insert or update on public.shops for each row execute function private.audit_row();
create trigger offers_audit after insert or update on public.offers for each row execute function private.audit_row();
create trigger profiles_audit after update on public.profiles for each row execute function private.audit_row();

-- ───────────────────────── 9. vista pública del mercado ─────────────────────────
create view public.market_offers with (security_invoker = true) as
select o.id, o.shop_id, s.slug as shop_slug, s.name as shop_name, s.locality, s.photo_path, s.whatsapp_e164,
       o.min_cup, o.max_cup, o.price_per_100_cup, o.payment_methods, o.confirmed_at, o.expires_at,
       coalesce(r.confirmed_ops, 0) as confirmed_ops, coalesce(r.reviews_count, 0) as reviews_count,
       case when coalesce(r.reviews_count, 0) > 0 then round(r.rating_sum::numeric / r.reviews_count, 1) end as rating_avg
from public.offers o
join public.shops s on s.id = o.shop_id
left join public.shop_reputation r on r.shop_id = s.id
where o.status = 'active' and o.expires_at > now() and o.confirmed_at <= now()
  and s.status = 'approved' and s.deleted_at is null;

-- ───────────────────────── 10. RLS ─────────────────────────
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.offers enable row level security;
alter table public.shop_reputation enable row level security;
alter table public.contact_events enable row level security;
alter table public.requests enable row level security;
alter table public.request_events enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.audit_events enable row level security;
alter table public.message_opt_ins enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated
  using (id = auth.uid() or private.is_admin());
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy shops_public_read on public.shops for select to anon, authenticated
  using ((status = 'approved' and deleted_at is null) or owner_id = auth.uid() or private.is_admin());
create policy shops_owner_insert on public.shops for insert to authenticated
  with check (owner_id = auth.uid() and private.is_active_user());
create policy shops_owner_update on public.shops for update to authenticated
  using (owner_id = auth.uid() and deleted_at is null) with check (owner_id = auth.uid());

create policy offers_public_read on public.offers for select to anon, authenticated
  using ((status = 'active' and expires_at > now() and confirmed_at <= now() and private.shop_is_public(shop_id))
         or private.owns_shop(shop_id) or private.is_admin());
create policy offers_owner_insert on public.offers for insert to authenticated
  with check (private.owns_shop(shop_id));
create policy offers_owner_update on public.offers for update to authenticated
  using (private.owns_shop(shop_id)) with check (private.owns_shop(shop_id));

create policy reputation_public_read on public.shop_reputation for select to anon, authenticated using (true);

create policy contacts_owner_read on public.contact_events for select to authenticated
  using (private.owns_shop(shop_id) or buyer_id = auth.uid() or private.is_admin());

create policy requests_party_read on public.requests for select to authenticated
  using (buyer_id = auth.uid() or private.owns_shop(shop_id) or private.is_admin());
create policy request_events_party_read on public.request_events for select to authenticated
  using (exists (select 1 from public.requests r where r.id = request_id
                 and (r.buyer_id = auth.uid() or private.owns_shop(r.shop_id) or private.is_admin())));

create policy reviews_public_read on public.reviews for select to anon, authenticated
  using ((visible and private.shop_is_public(shop_id)) or buyer_id = auth.uid() or private.is_admin());

create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and private.is_active_user());
create policy reports_read on public.reports for select to authenticated
  using (reporter_id = auth.uid() or private.is_admin());

create policy audit_admin_read on public.audit_events for select to authenticated using (private.is_admin());

create policy optins_owner_read on public.message_opt_ins for select to authenticated
  using (private.owns_shop(shop_id) or private.is_admin());
create policy optins_owner_insert on public.message_opt_ins for insert to authenticated
  with check (private.owns_shop(shop_id));
create policy optins_owner_update on public.message_opt_ins for update to authenticated
  using (private.owns_shop(shop_id)) with check (private.owns_shop(shop_id));

-- ───────────────────────── 11. funciones públicas (RPC) ─────────────────────────
-- Contacto por WhatsApp: se registra para métricas del proveedor. NO es una venta.
create or replace function public.log_contact(p_offer_id uuid, p_amount_cup integer default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_shop uuid;
begin
  select o.shop_id into v_shop from public.offers o join public.shops s on s.id = o.shop_id
   where o.id = p_offer_id and o.status = 'active' and o.expires_at > now() and s.status = 'approved' and s.deleted_at is null;
  if v_shop is null then return; end if;
  insert into public.contact_events (offer_id, shop_id, buyer_id, amount_cup)
  values (p_offer_id, v_shop, auth.uid(),
          case when p_amount_cup between 1 and 100000 then p_amount_cup end);
end $$;

-- El comprador con cuenta abre una operación para seguirla (precio congelado).
create or replace function public.start_request(p_offer_id uuid, p_amount_cup integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare o record; v_id uuid;
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
  -- Reintentos no duplican: misma oferta, mismo comprador y operación abierta en 24 h.
  select id into v_id from public.requests
   where buyer_id = auth.uid() and offer_id = p_offer_id and status in ('contacted', 'agreed', 'delivered')
     and created_at > now() - interval '24 hours'
   order by created_at desc limit 1;
  if v_id is not null then return v_id; end if;
  insert into public.requests (buyer_id, shop_id, offer_id, amount_cup, price_per_100_cup, total_cup)
  values (auth.uid(), o.shop_id, o.id, p_amount_cup, o.price_per_100_cup,
          round(p_amount_cup * o.price_per_100_cup / 100, 2))
  returning id into v_id;
  insert into public.request_events (request_id, actor_id, action, to_status) values (v_id, auth.uid(), 'start', 'contacted');
  return v_id;
end $$;

-- Avance de una operación. Acciones: agree, deliver (proveedor), confirm, dispute, cancel (ambos).
create or replace function public.request_action(p_request_id uuid, p_action text, p_note text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare r record; v_role text; v_to text;
begin
  if auth.uid() is null or not private.is_active_user() then
    raise exception 'Entra en tu cuenta' using errcode = '42501';
  end if;
  select * into r from public.requests where id = p_request_id for update;
  if r.id is null then raise exception 'Operación no encontrada' using errcode = 'P0002'; end if;
  if r.buyer_id = auth.uid() then v_role := 'buyer';
  elsif private.owns_shop(r.shop_id) then v_role := 'seller';
  else raise exception 'No participas en esta operación' using errcode = '42501'; end if;
  if r.status in ('confirmed', 'cancelled', 'disputed') then
    raise exception 'La operación ya está cerrada' using errcode = 'P0001';
  end if;

  v_to := r.status;
  if p_action = 'agree' and v_role = 'seller' and r.status = 'contacted' then v_to := 'agreed';
  elsif p_action = 'deliver' and v_role = 'seller' and r.status in ('contacted', 'agreed') then v_to := 'delivered';
  elsif p_action = 'cancel' and r.status in ('contacted', 'agreed') then v_to := 'cancelled';
  elsif p_action = 'dispute' then v_to := 'disputed';
  elsif p_action = 'confirm' and r.status in ('agreed', 'delivered') then
    if v_role = 'buyer' then
      update public.requests set buyer_confirmed_at = coalesce(buyer_confirmed_at, now()) where id = r.id;
    else
      update public.requests set seller_confirmed_at = coalesce(seller_confirmed_at, now()) where id = r.id;
    end if;
    select * into r from public.requests where id = p_request_id;
    if r.buyer_confirmed_at is not null and r.seller_confirmed_at is not null then v_to := 'confirmed'; end if;
  else
    raise exception 'Acción no permitida en este estado' using errcode = 'P0001';
  end if;

  if v_to is distinct from r.status then
    update public.requests set status = v_to,
      closed_at = case when v_to in ('confirmed', 'cancelled', 'disputed') then now() end
    where id = r.id;
    if v_to = 'confirmed' then perform private.bump_reputation(r.shop_id, 1, 0, 0); end if;
  end if;
  insert into public.request_events (request_id, actor_id, action, from_status, to_status, note)
  values (r.id, auth.uid(), p_action, r.status, v_to, left(p_note, 500));
  return v_to;
end $$;

-- Valoración: solo el comprador, solo con la operación confirmada por ambos, una vez.
create or replace function public.leave_review(p_request_id uuid, p_rating integer, p_comment text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare r record; v_id uuid;
begin
  if auth.uid() is null or not private.is_active_user() then
    raise exception 'Entra en tu cuenta' using errcode = '42501';
  end if;
  select * into r from public.requests where id = p_request_id;
  if r.id is null or r.buyer_id <> auth.uid() then
    raise exception 'Solo el comprador puede valorar' using errcode = '42501';
  end if;
  if r.status <> 'confirmed' then
    raise exception 'Solo se valoran operaciones confirmadas por ambas partes' using errcode = 'P0001';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Valoración de 1 a 5' using errcode = 'P0001'; end if;
  insert into public.reviews (request_id, buyer_id, shop_id, rating, comment)
  values (r.id, r.buyer_id, r.shop_id, p_rating, left(coalesce(p_comment, ''), 400))
  returning id into v_id;
  perform private.bump_reputation(r.shop_id, 0, 1, p_rating);
  return v_id;
end $$;

-- ───────────────────────── 12. moderación (solo admin) ─────────────────────────
create or replace function private.require_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not private.is_admin() then
    raise exception 'Solo moderación' using errcode = '42501';
  end if;
end $$;

create or replace function public.admin_set_shop_status(p_shop_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.shops set status = p_status,
    verified_at = case when p_status = 'approved' then coalesce(verified_at, now()) else verified_at end,
    verified_by = case when p_status = 'approved' then coalesce(verified_by, auth.uid()) else verified_by end
  where id = p_shop_id;
  if not found then raise exception 'Tienda no encontrada' using errcode = 'P0002'; end if;
  perform private.audit('moderate', 'shops', p_shop_id::text, jsonb_build_object('status', p_status, 'note', p_note));
end $$;

create or replace function public.admin_set_user_status(p_user_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if p_user_id = auth.uid() then raise exception 'No puedes suspenderte a ti mismo' using errcode = 'P0001'; end if;
  update public.profiles set status = p_status where id = p_user_id;
  if p_status = 'suspended' then
    update public.shops set status = 'suspended' where owner_id = p_user_id and status <> 'suspended';
  end if;
  perform private.audit('moderate', 'profiles', p_user_id::text, jsonb_build_object('status', p_status, 'note', p_note));
end $$;

create or replace function public.admin_set_review_visible(p_review_id uuid, p_visible boolean, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v record;
begin
  perform private.require_admin();
  select * into v from public.reviews where id = p_review_id for update;
  if v.id is null then raise exception 'Reseña no encontrada' using errcode = 'P0002'; end if;
  if v.visible is distinct from p_visible then
    update public.reviews set visible = p_visible where id = p_review_id;
    perform private.bump_reputation(v.shop_id, 0, case when p_visible then 1 else -1 end,
                                    case when p_visible then v.rating else -v.rating end);
  end if;
  perform private.audit('moderate', 'reviews', p_review_id::text, jsonb_build_object('visible', p_visible, 'note', p_note));
end $$;

create or replace function public.admin_resolve_dispute(p_request_id uuid, p_outcome text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  perform private.require_admin();
  if p_outcome not in ('confirmed', 'cancelled') then raise exception 'Resultado inválido' using errcode = 'P0001'; end if;
  select * into r from public.requests where id = p_request_id for update;
  if r.id is null or r.status <> 'disputed' then raise exception 'No hay disputa abierta' using errcode = 'P0001'; end if;
  update public.requests set status = p_outcome, closed_at = now() where id = r.id;
  if p_outcome = 'confirmed' then perform private.bump_reputation(r.shop_id, 1, 0, 0); end if;
  insert into public.request_events (request_id, actor_id, action, from_status, to_status, note)
  values (r.id, auth.uid(), 'resolve', 'disputed', p_outcome, left(p_note, 500));
  perform private.audit('resolve', 'requests', r.id::text, jsonb_build_object('outcome', p_outcome, 'note', p_note));
end $$;

-- Importación supervisada (piloto / VivaBot): un admin, o el servicio sin sesión, publica la
-- oferta de una tienda que ya tiene consentimiento registrado. Nunca para tiendas no aprobadas.
create or replace function public.admin_publish_offer(
  p_shop_id uuid, p_min_cup integer, p_max_cup integer, p_price_per_100_cup numeric,
  p_payment_methods text[], p_valid_hours integer default 24, p_source text default 'admin_import')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; s record;
begin
  perform private.require_admin();
  select * into s from public.shops where id = p_shop_id and deleted_at is null;
  if s.id is null or s.status <> 'approved' then raise exception 'Tienda no aprobada' using errcode = 'P0001'; end if;
  if s.whatsapp_e164 is null or s.whatsapp_consent_at is null then
    raise exception 'Falta consentimiento para publicar el WhatsApp' using errcode = 'P0001';
  end if;
  if p_valid_hours is null or p_valid_hours < 1 or p_valid_hours > 72 then
    raise exception 'Vigencia de 1 a 72 horas' using errcode = 'P0001';
  end if;
  insert into public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods, source, confirmed_at, expires_at)
  values (p_shop_id, p_min_cup, p_max_cup, p_price_per_100_cup, p_payment_methods,
          coalesce(p_source, 'admin_import'), now(), now() + make_interval(hours => p_valid_hours))
  returning id into v_id;
  return v_id;
end $$;

-- ───────────────────────── 13. permisos de tabla (mínimos) ─────────────────────────
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant usage on schema private to anon, authenticated;
-- Solo las funciones que usan las políticas RLS; el resto corre dentro de funciones SECURITY DEFINER.
grant execute on function private.is_admin(), private.is_active_user(), private.owns_shop(uuid),
  private.shop_is_public(uuid) to anon, authenticated;

-- Tiendas: columnas públicas. consent_evidence y verified_by no salen nunca por la API.
grant select (id, slug, name, bio, locality, whatsapp_e164, photo_path, status, verified_at, created_at, updated_at, deleted_at)
  on public.shops to anon, authenticated;
grant select (owner_id, whatsapp_consent_at) on public.shops to authenticated;
grant select on public.offers, public.shop_reputation, public.market_offers to anon, authenticated;
-- Reseñas: anónimas para el público («comprador verificado»), sin buyer_id ni request_id.
grant select (id, shop_id, rating, comment, visible, created_at) on public.reviews to anon, authenticated;
grant select on public.profiles, public.contact_events, public.requests, public.request_events,
  public.reports, public.audit_events, public.message_opt_ins to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant insert (slug, name, bio, locality, whatsapp_e164, photo_path) on public.shops to authenticated;
grant update (name, bio, locality, whatsapp_e164, photo_path, status) on public.shops to authenticated;
grant insert (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods, status, expires_at) on public.offers to authenticated;
grant update (min_cup, max_cup, price_per_100_cup, payment_methods, status, confirmed_at, expires_at) on public.offers to authenticated;
grant insert (target_type, target_id, reason, details) on public.reports to authenticated;
grant insert (shop_id, channel, category, evidence) on public.message_opt_ins to authenticated;
grant update (revoked_at) on public.message_opt_ins to authenticated;

grant execute on function public.log_contact(uuid, integer) to anon, authenticated;
grant execute on function public.start_request(uuid, integer) to authenticated;
grant execute on function public.request_action(uuid, text, text) to authenticated;
grant execute on function public.leave_review(uuid, integer, text) to authenticated;
grant execute on function public.admin_set_shop_status(uuid, text, text) to authenticated;
grant execute on function public.admin_set_user_status(uuid, text, text) to authenticated;
grant execute on function public.admin_set_review_visible(uuid, boolean, text) to authenticated;
grant execute on function public.admin_resolve_dispute(uuid, text, text) to authenticated;
grant execute on function public.admin_publish_offer(uuid, integer, integer, numeric, text[], integer, text) to authenticated;
