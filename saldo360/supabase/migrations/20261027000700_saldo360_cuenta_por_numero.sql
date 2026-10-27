-- SALDO 360 — la cuenta interna por número pasa a «saldo360+<53XXXXXXXX>@casaviva.company»:
-- Supabase rechaza dominios que no reciben correo (tel.saldo360.casaviva.company no tiene MX).
create or replace function public.admin_shop_owners()
returns table (shop_id uuid, owner_id uuid, phone text)
language sql stable security definer set search_path = '' as $$
  select s.id, s.owner_id, substring(u.email from '^saldo360\+(53[0-9]{8})@casaviva\.company$')
  from public.shops s join auth.users u on u.id = s.owner_id
  where private.is_admin() and u.email ~ '^saldo360\+53[0-9]{8}@casaviva\.company$' $$;
revoke all on function public.admin_shop_owners() from public, anon;
grant execute on function public.admin_shop_owners() to authenticated;
