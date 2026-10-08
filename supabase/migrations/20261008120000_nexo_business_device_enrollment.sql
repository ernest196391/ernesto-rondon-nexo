-- Alta de equipos con un código corto (lanzamiento de la caja, 2026-10-08).
-- Ernesto pide un código (orden "ALTA CAJA Nombre" en su chat de WhatsApp, o el panel);
-- la dependienta lo escribe en la app y la nube crea el equipo y le entrega su clave una sola vez.
-- Solo se guarda el hash del código; caduca en 48 h y sirve una vez.
CREATE TABLE IF NOT EXISTS nexo_business.device_enrollments (
  code_hash   TEXT PRIMARY KEY CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  business_id TEXT NOT NULL,
  label       TEXT NOT NULL,
  created_by  TEXT NOT NULL DEFAULT 'owner',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + interval '48 hours',
  used_at     TIMESTAMPTZ,
  device_id   TEXT
);
ALTER TABLE nexo_business.device_enrollments ENABLE ROW LEVEL SECURITY;

-- Crea un código de alta (solo servidor: bot / supervisor / panel vía función).
CREATE OR REPLACE FUNCTION public.nexo_business_create_enrollment(p_business TEXT, p_label TEXT, p_created_by TEXT DEFAULT 'owner')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code TEXT := '';
  v_bytes BYTEA := extensions.gen_random_bytes(6);
  i INT;
BEGIN
  IF nullif(trim(coalesce(p_label, '')), '') IS NULL THEN
    RETURN jsonb_build_object('error', 'Falta el nombre del equipo');
  END IF;
  FOR i IN 0..5 LOOP
    v_code := v_code || substr(v_alphabet, 1 + (get_byte(v_bytes, i) % 32), 1);
  END LOOP;
  INSERT INTO nexo_business.device_enrollments (code_hash, business_id, label, created_by)
  VALUES (encode(extensions.digest(v_code, 'sha256'), 'hex'), p_business, trim(p_label), coalesce(p_created_by, 'owner'));
  RETURN jsonb_build_object('code', v_code, 'label', trim(p_label), 'expiresInHours', 48);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_create_enrollment(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_create_enrollment(TEXT, TEXT, TEXT) TO service_role;

-- Canjea el código: crea el equipo y devuelve su clave (una sola vez).
CREATE OR REPLACE FUNCTION public.nexo_business_enroll_device(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row nexo_business.device_enrollments;
  v_code TEXT := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_device TEXT;
  v_token TEXT;
BEGIN
  SELECT * INTO v_row FROM nexo_business.device_enrollments
   WHERE code_hash = encode(extensions.digest(v_code, 'sha256'), 'hex')
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Código incorrecto');
  END IF;
  IF v_row.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Ese código ya se usó: pide uno nuevo');
  END IF;
  IF v_row.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'El código venció: pide uno nuevo');
  END IF;
  v_device := left(regexp_replace(translate(lower(v_row.label), 'áéíóúüñ', 'aeiouun'), '[^a-z0-9]+', '-', 'g'), 40);
  v_device := trim(both '-' from v_device);
  IF length(v_device) < 3 THEN v_device := 'equipo'; END IF;
  v_device := v_device || '-' || to_char(now(), 'MMDD') || '-' || substr(encode(extensions.gen_random_bytes(2), 'hex'), 1, 4);
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash)
  VALUES (v_row.business_id, v_device, v_row.label, encode(extensions.digest(v_token, 'sha256'), 'hex'));
  UPDATE nexo_business.device_enrollments SET used_at = now(), device_id = v_device WHERE code_hash = v_row.code_hash;
  RETURN jsonb_build_object('businessId', v_row.business_id, 'deviceId', v_device, 'label', v_row.label, 'token', v_token);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_enroll_device(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_enroll_device(TEXT) TO service_role;
