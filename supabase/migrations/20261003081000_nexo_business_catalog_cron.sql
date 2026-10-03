-- Hourly catalog import for businesses with auto_import = true.
--
-- The job's credential is generated inside the database and kept in Supabase
-- Vault; it never leaves Postgres. The Edge Function accepts it by asking
-- nexo_business_check_import_key() (service role only).

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'nexo_catalog_import_key') THEN
    PERFORM vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'nexo_catalog_import_key',
                                'NEXO Business hourly catalog import (pg_cron -> nexo-catalog-import)');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.nexo_business_check_import_key(p_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT coalesce(length(p_key), 0) >= 32 AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'nexo_catalog_import_key' AND decrypted_secret = p_key);
$$;
REVOKE ALL ON FUNCTION public.nexo_business_check_import_key(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_check_import_key(TEXT) TO service_role;

-- Fires one import request per business that has auto_import on.
CREATE OR REPLACE FUNCTION nexo_business.run_scheduled_catalog_imports()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_key TEXT;
  v_business TEXT;
  v_count INT := 0;
BEGIN
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'nexo_catalog_import_key';
  FOR v_business IN SELECT business_id FROM nexo_business.catalog_sources WHERE auto_import LOOP
    PERFORM net.http_post(
      url := 'https://viwwlriwlwodrfukbgbj.supabase.co/functions/v1/nexo-catalog-import?business=' || v_business,
      headers := jsonb_build_object('x-nexo-import-key', v_key, 'content-type', 'application/json'),
      body := '{}'::jsonb,
      timeout_milliseconds := 300000);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION nexo_business.run_scheduled_catalog_imports() FROM PUBLIC, anon, authenticated;

-- :50 so the BizneCubano snapshot (Casa-Viva repo, hourly at :05) has finished.
SELECT cron.schedule('nexo-business-catalog-import', '50 * * * *',
                     'SELECT nexo_business.run_scheduled_catalog_imports()');
