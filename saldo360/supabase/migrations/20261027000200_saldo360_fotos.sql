-- SALDO 360 — fotos de tienda (Supabase Storage). Proyecto dedicado de Saldo 360.
-- Lectura pública (son fotos de perfil); escritura solo en la carpeta del propio usuario:
--   shop-photos/<auth.uid()>/<archivo>
-- Máximo 2 MB; solo JPEG, PNG o WebP.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-photos', 'shop-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy shop_photos_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'shop-photos' and (storage.foldername(name))[1] = auth.uid()::text
              and private.is_active_user());
create policy shop_photos_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'shop-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'shop-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy shop_photos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'shop-photos' and (storage.foldername(name))[1] = auth.uid()::text);
