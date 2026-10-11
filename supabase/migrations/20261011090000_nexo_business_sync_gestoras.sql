-- Gestoras: una sola lista, la de la web (D37). El puente copia las gestoras de Core a la caja
-- (people.kind='gestor'): aprobada = activa. Las que ya estaban en la caja se enlazan por teléfono
-- (últimas 8 cifras) o por nombre, para conservar su id (las comisiones de la caja apuntan a él).
-- Una gestora de la caja que no está en la web queda inactiva.
CREATE OR REPLACE FUNCTION public.nexo_business_sync_gestoras(p_business TEXT, p_items JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE i JSONB; v_id UUID; v_tel TEXT; v_name TEXT; v_status TEXT; n_new INT := 0; n_linked INT := 0; n_off INT;
BEGIN
  FOR i IN SELECT * FROM jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) LOOP
    v_tel := right(regexp_replace(coalesce(i->>'phone', ''), '\D', '', 'g'), 8);
    v_name := left(trim(coalesce(i->>'name', '')), 80);
    IF length(v_name) < 2 THEN CONTINUE; END IF;
    v_status := CASE WHEN i->>'status' = 'approved' THEN 'active' ELSE 'inactive' END;
    SELECT id INTO v_id FROM nexo_business.people
     WHERE business_id = p_business AND kind = 'gestor' AND woo_user_id = (i->>'wooId')::bigint;
    IF v_id IS NULL THEN
      SELECT id INTO v_id FROM nexo_business.people
       WHERE business_id = p_business AND kind = 'gestor' AND woo_user_id IS NULL
         AND ((length(v_tel) = 8 AND right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 8) = v_tel)
              OR lower(full_name) = lower(v_name))
       ORDER BY (length(v_tel) = 8 AND right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 8) = v_tel) DESC LIMIT 1;
      IF v_id IS NOT NULL THEN n_linked := n_linked + 1; END IF;
    END IF;
    IF v_id IS NULL THEN
      INSERT INTO nexo_business.people (business_id, kind, full_name, phone, status, woo_user_id)
      VALUES (p_business, 'gestor', v_name, CASE WHEN length(coalesce(i->>'phone', '')) BETWEEN 6 AND 20 THEN i->>'phone' END, v_status, (i->>'wooId')::bigint);
      n_new := n_new + 1;
    ELSE
      UPDATE nexo_business.people SET woo_user_id = (i->>'wooId')::bigint, full_name = v_name, status = v_status,
             phone = CASE WHEN length(coalesce(i->>'phone', '')) BETWEEN 6 AND 20 THEN i->>'phone' ELSE phone END
       WHERE id = v_id AND (woo_user_id, full_name, status, coalesce(phone, '')) IS DISTINCT FROM ((i->>'wooId')::bigint, v_name, v_status, coalesce(i->>'phone', phone, ''));
    END IF;
    v_id := NULL;
  END LOOP;
  UPDATE nexo_business.people SET status = 'inactive'
   WHERE business_id = p_business AND kind = 'gestor' AND woo_user_id IS NULL AND status = 'active'
     AND jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 0;
  GET DIAGNOSTICS n_off = ROW_COUNT;
  RETURN jsonb_build_object('new', n_new, 'linked', n_linked, 'off', n_off);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_sync_gestoras(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_sync_gestoras(TEXT, JSONB) TO service_role;
