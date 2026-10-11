-- Permisos por dependienta en la caja (aplicado en producción el 2026-10-11 en dos pasos:
-- nexo_business_staff_permissions y nexo_business_people_permissions). Vacío = todo permitido.
-- Claves: returns (devoluciones), receive (recibir mercancía), counts (conteos), summary (ver resumen de ventas).
ALTER TABLE nexo_business.people ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.nexo_business_set_permissions(p_business TEXT, p_person UUID, p_permissions JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  UPDATE nexo_business.people SET permissions = (
    SELECT coalesce(jsonb_object_agg(k, (p_permissions->>k)::boolean), '{}'::jsonb)
      FROM unnest(ARRAY['returns', 'receive', 'counts', 'summary']) k WHERE p_permissions ? k)
   WHERE id = p_person AND business_id = p_business AND kind = 'staff';
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_set_permissions(TEXT, UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_set_permissions(TEXT, UUID, JSONB) TO authenticated;

-- La caja recibe los permisos con la lista de personas.
CREATE OR REPLACE FUNCTION public.nexo_business_device_rates(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE v_business TEXT;
BEGIN
  IF coalesce(length(p_token), 0) < 32 THEN RETURN jsonb_build_object('error', 'unauthorized'); END IF;
  SELECT business_id INTO v_business FROM nexo_business.devices
   WHERE token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') AND active;
  IF v_business IS NULL THEN RETURN jsonb_build_object('error', 'unauthorized'); END IF;
  RETURN jsonb_build_object(
    'rates', nexo_business.current_rates(v_business),
    'people', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'name', full_name, 'permissions', permissions) ORDER BY full_name)
                          FROM nexo_business.people WHERE business_id = v_business AND status = 'active'), '[]'::jsonb));
END;
$function$;

-- El panel también los lee (Equipo → ficha de la dependienta): añade 'permissions' a nexo_business_people.
-- (Ver la definición completa aplicada en producción; mismo cuerpo que antes + 'permissions', p.permissions.)
