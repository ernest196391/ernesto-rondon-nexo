-- SALDO 360 — Storage: para borrar o reemplazar su foto, la API de Supabase exige que el
-- usuario pueda LEER el archivo. Cada usuario lee solo su carpeta (el público sigue viendo
-- las fotos por la URL pública del bucket, que no pasa por estas políticas).
create policy shop_photos_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'shop-photos' and (storage.foldername(name))[1] = auth.uid()::text);
