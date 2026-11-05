-- SALDO 360 — cuentas por número de teléfono + clave (sin correo ni SMS en el piloto).
-- La cuenta es un correo interno «<53XXXXXXXX>@tel.saldo360.casaviva.company» que nunca recibe mensajes.
-- Si alguien olvida su clave, un admin genera aquí una clave temporal y se la manda él, a mano.
create or replace function public.admin_temp_password(p_user_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_temp text; v_email text;
begin
  perform private.require_admin();
  select email into v_email from auth.users where id = p_user_id;
  if v_email is null then raise exception 'Cuenta no encontrada' using errcode = 'P0002'; end if;
  -- 8 cifras al azar: fácil de dictar por WhatsApp; el usuario la cambia al entrar.
  v_temp := lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::int & 2147483647) % 100000000)::text, 8, '0');
  update auth.users set encrypted_password = extensions.crypt(v_temp, extensions.gen_salt('bf')), updated_at = now() where id = p_user_id;
  perform private.audit('temp_password', 'profiles', p_user_id::text, '{}'::jsonb);
  return v_temp;
end $$;

-- Para el panel de admin: dueño (id y teléfono) de cada tienda.
create or replace function public.admin_shop_owners()
returns table (shop_id uuid, owner_id uuid, phone text)
language sql stable security definer set search_path = '' as $$
  select s.id, s.owner_id, split_part(u.email, '@', 1)
  from public.shops s join auth.users u on u.id = s.owner_id
  where private.is_admin() and u.email like '%@tel.saldo360.casaviva.company' $$;

revoke all on function public.admin_temp_password(uuid) from public, anon;
revoke all on function public.admin_shop_owners() from public, anon;
grant execute on function public.admin_temp_password(uuid) to authenticated;
grant execute on function public.admin_shop_owners() to authenticated;
