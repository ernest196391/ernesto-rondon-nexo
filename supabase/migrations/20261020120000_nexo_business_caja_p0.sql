-- Caja P0 (20-oct, auditoría de Ernesto). Idempotente: se puede aplicar dos veces.
--
-- 1. Equipos: «Última conexión» también al bajar datos (checkin) y versión de la app.
-- 2. D80: venta de mostrador sin gestora → 2 % para la dependienta de «Atiende»
--    (counter_staff), fuera del bote del 0,5 %. Con gestora, todo como antes.
-- 3. Un cajón por tienda: store_shifts (proyección de los eventos de turno de
--    todas las cajas), «debería haber» de toda la tienda al cerrar y la
--    dependienta de turno (quien abrió hoy) para el bot y el bote del 0,5 %.
-- 4. Informe: «Atiende» en cada venta, turnos (quién abrió y quién cerró) y
--    lo de cada dependienta en la caja.

-- ---------- 1. Equipos ----------
ALTER TABLE nexo_business.devices
  ADD COLUMN IF NOT EXISTS app_version TEXT,
  ADD COLUMN IF NOT EXISTS app_version_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_pull_at TIMESTAMPTZ;

-- La caja lo llama en cada sincronización (antes de enviar y bajar): marca la
-- conexión aunque no tenga ventas que enviar y guarda su versión.
CREATE OR REPLACE FUNCTION public.nexo_business_device_checkin(p_token TEXT, p_version TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  d nexo_business.devices%ROWTYPE;
  v_version TEXT := nullif(left(regexp_replace(coalesce(p_version, ''), '[^0-9A-Za-z.+_-]', '', 'g'), 40), '');
BEGIN
  IF coalesce(length(p_token), 0) < 32 THEN RETURN jsonb_build_object('error', 'unauthorized'); END IF;
  UPDATE nexo_business.devices
     SET last_seen_at = now(), last_pull_at = now(),
         app_version = coalesce(v_version, app_version),
         app_version_at = CASE WHEN v_version IS NOT NULL THEN now() ELSE app_version_at END
   WHERE token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') AND active
  RETURNING * INTO d;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'unauthorized'); END IF;
  RETURN jsonb_build_object('businessId', d.business_id, 'deviceId', d.device_id, 'label', d.label);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_device_checkin(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_device_checkin(TEXT, TEXT) TO service_role;

-- Panel → Ajustes → Cajas: última conexión, última descarga y versión.
CREATE OR REPLACE FUNCTION public.nexo_business_device_status(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF nexo_business.role_of(p_business) IS NULL OR nexo_business.role_of(p_business) = 'partner' THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('deviceId', device_id, 'label', label, 'active', active,
      'lastSeenAt', last_seen_at, 'lastPullAt', last_pull_at, 'appVersion', app_version, 'appVersionAt', app_version_at)
      ORDER BY active DESC, device_id)
    FROM nexo_business.devices WHERE business_id = p_business), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_device_status(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_device_status(TEXT) TO authenticated;

-- ---------- 2. D80: venta de mostrador ----------
ALTER TABLE nexo_business.cost_settings
  ADD COLUMN IF NOT EXISTS counter_staff_pct NUMERIC(5, 2) NOT NULL DEFAULT 2;
DO $$ BEGIN
  ALTER TABLE nexo_business.cost_settings ADD CONSTRAINT cost_settings_counter_staff_pct_check CHECK (counter_staff_pct BETWEEN 0 AND 50);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE nexo_business.commission_entries DROP CONSTRAINT IF EXISTS commission_entries_kind_check;
ALTER TABLE nexo_business.commission_entries ADD CONSTRAINT commission_entries_kind_check
  CHECK (kind IN ('gestor', 'extra_gestor', 'extra_staff', 'staff', 'partner', 'counter_staff'));

-- Entradas de una línea vendida. Sin cambios con gestora. Sin gestora y con
-- «Atiende» (D80): la dependienta gana counter_staff_pct (2 %) de la línea; es
-- suyo y no va al bote del 0,5 % (staff_pct). Sin «Atiende», nadie cobra.
CREATE OR REPLACE FUNCTION nexo_business.line_entries(p_business TEXT, p_gestor UUID, p_staff UUID, p_product TEXT,
  p_qty BIGINT, p_line_minor BIGINT, p_extra BOOLEAN)
RETURNS TABLE (person_id UUID, kind TEXT, amount_usd NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
DECLARE
  s nexo_business.cost_settings;
  v_comm NUMERIC;
  v_staff_pct NUMERIC;
BEGIN
  SELECT * INTO s FROM nexo_business.cost_settings WHERE business_id = p_business;
  IF p_gestor IS NULL THEN
    IF p_staff IS NOT NULL AND coalesce(s.counter_staff_pct, 2) > 0 THEN
      person_id := p_staff; kind := 'counter_staff'; amount_usd := p_line_minor / 100.0 * coalesce(s.counter_staff_pct, 2) / 100; RETURN NEXT;
    END IF;
    RETURN;
  END IF;
  v_comm := coalesce(nexo_business.line_commission(p_business, p_gestor, p_product, p_qty, p_line_minor), 0);
  IF coalesce(p_extra, FALSE) THEN
    person_id := p_gestor; kind := 'extra_gestor'; amount_usd := v_comm * coalesce(s.split_gestor_pct, 33.34) / 100; RETURN NEXT;
    IF p_staff IS NOT NULL THEN
      person_id := p_staff; kind := 'extra_staff'; amount_usd := v_comm * coalesce(s.split_staff_pct, 33.33) / 100; RETURN NEXT;
    END IF;
  ELSE
    person_id := p_gestor; kind := 'gestor'; amount_usd := v_comm; RETURN NEXT;
  END IF;
  IF p_staff IS NOT NULL THEN
    SELECT coalesce(c.staff_pct, s.staff_pct, 0) INTO v_staff_pct
      FROM (SELECT 1) one LEFT JOIN nexo_business.product_costs c ON c.business_id = p_business AND c.product_id = p_product;
    IF v_staff_pct > 0 THEN
      person_id := p_staff; kind := 'staff'; amount_usd := p_line_minor / 100.0 * v_staff_pct / 100; RETURN NEXT;
    END IF;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION nexo_business.line_entries(TEXT, UUID, UUID, TEXT, BIGINT, BIGINT, BOOLEAN) FROM PUBLIC, anon, authenticated;

-- ---------- 3. Un cajón por tienda ----------
-- Una fila por (turno, caja). store_shift_id = el turno de la tienda al que
-- pertenece (el de quien abrió y contó el fondo). role: opener (contó el
-- fondo), joiner (se unió sin contar), legacy (turno de un solo equipo, antes
-- del 20-oct). merged = una segunda apertura el mismo rato (sin internet): se
-- une a la primera y su fondo NO se suma (es el mismo cajón).
CREATE TABLE IF NOT EXISTS nexo_business.store_shifts (
  shift_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  branch_id TEXT,
  store_shift_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('opener', 'joiner', 'legacy')),
  operator_id TEXT,
  opened_at TIMESTAMPTZ NOT NULL,
  floats JSONB NOT NULL DEFAULT '[]'::jsonb,
  merged BOOLEAN NOT NULL DEFAULT FALSE,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_at TIMESTAMPTZ,
  closed_by TEXT,
  closed_device TEXT,
  counts JSONB,
  expected_source TEXT,
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shift_id, device_id)
);
CREATE INDEX IF NOT EXISTS store_shifts_open_idx ON nexo_business.store_shifts (business_id, status, opened_at DESC);
CREATE INDEX IF NOT EXISTS store_shifts_session_idx ON nexo_business.store_shifts (business_id, store_shift_id);
CREATE INDEX IF NOT EXISTS sync_events_shift_idx ON nexo_business.sync_events (business_id, ((envelope->'payload'->>'shift_id')))
  WHERE operation_type IN ('sale.completed', 'sale.returned', 'cash_movement.recorded', 'web_order.charged');
ALTER TABLE nexo_business.store_shifts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.store_shifts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON nexo_business.store_shifts TO service_role;

-- El turno de la tienda abierto HOY (hora de Cuba): el último que se abrió y contó el fondo.
-- Uno de otro día que nadie cerró no cuenta (la caja avisa: «turno viejo sin cerrar»).
-- Un «claim» (alta en línea antes de que llegue el evento) caduca a los 15 min.
CREATE OR REPLACE FUNCTION nexo_business.open_store_shift(p_business TEXT)
RETURNS nexo_business.store_shifts LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT * FROM nexo_business.store_shifts
   WHERE business_id = p_business AND status = 'open' AND role = 'opener' AND NOT merged
     AND store_shift_id = shift_id AND (NOT claimed OR updated_at > now() - interval '15 minutes')
     AND (opened_at AT TIME ZONE 'America/Havana')::date = (now() AT TIME ZONE 'America/Havana')::date
   ORDER BY opened_at DESC LIMIT 1;
$$;
REVOKE ALL ON FUNCTION nexo_business.open_store_shift(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION nexo_business.apply_shift_event(p_business TEXT, p_device TEXT, p_op TEXT, p_at TEXT, p JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_shift TEXT := p->>'shift_id';
  v_role TEXT := coalesce(nullif(p->>'store_role', ''), 'legacy');
  v_open nexo_business.store_shifts;
  v_session TEXT;
  v_merged BOOLEAN := FALSE;
  v_at TIMESTAMPTZ := coalesce(p_at::timestamptz, now());
BEGIN
  IF v_shift IS NULL OR v_shift = '' THEN RETURN; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('nexo_store_shift:' || p_business));
  IF p_op = 'cash_shift.opened' THEN
    IF v_role = 'opener' THEN
      v_open := nexo_business.open_store_shift(p_business);
      IF v_open.shift_id IS NOT NULL AND v_open.shift_id <> v_shift THEN
        v_session := v_open.store_shift_id; v_merged := TRUE;  -- segunda apertura del mismo cajón
      ELSE
        v_session := v_shift;
      END IF;
    ELSE
      v_role := 'legacy'; v_session := v_shift;
    END IF;
    INSERT INTO nexo_business.store_shifts AS t (shift_id, device_id, business_id, branch_id, store_shift_id, role, operator_id, opened_at, floats, merged, claimed)
    VALUES (v_shift, p_device, p_business, p->>'branch_id', v_session, v_role, nullif(p->>'operator_id', ''), v_at,
            coalesce(p->'opening_floats', '[]'::jsonb), v_merged, FALSE)
    ON CONFLICT (shift_id, device_id) DO UPDATE
      SET floats = EXCLUDED.floats, operator_id = coalesce(EXCLUDED.operator_id, t.operator_id), opened_at = EXCLUDED.opened_at,
          branch_id = EXCLUDED.branch_id, claimed = FALSE, updated_at = now();
  ELSIF p_op = 'cash_shift.joined' THEN
    -- Unido en línea: el mismo id que el turno abierto. Sin internet (id nuevo): al turno abierto ahora.
    SELECT store_shift_id INTO v_session FROM nexo_business.store_shifts
     WHERE business_id = p_business AND shift_id = v_shift AND role = 'opener' LIMIT 1;
    IF v_session IS NULL THEN
      v_open := nexo_business.open_store_shift(p_business);
      v_session := coalesce(v_open.store_shift_id, v_shift);
    END IF;
    INSERT INTO nexo_business.store_shifts (shift_id, device_id, business_id, branch_id, store_shift_id, role, operator_id, opened_at)
    VALUES (v_shift, p_device, p_business, p->>'branch_id', v_session, 'joiner', nullif(p->>'operator_id', ''), v_at)
    ON CONFLICT (shift_id, device_id) DO NOTHING;
  ELSIF p_op = 'cash_shift.closed' THEN
    SELECT store_shift_id INTO v_session FROM nexo_business.store_shifts WHERE shift_id = v_shift AND device_id = p_device;
    v_session := coalesce(v_session, v_shift);
    UPDATE nexo_business.store_shifts
       SET counts = p->'counts', expected_source = p->>'expected_source', note = p->>'note'
     WHERE shift_id = v_shift AND device_id = p_device;
    UPDATE nexo_business.store_shifts
       SET status = 'closed', closed_at = v_at, closed_by = nullif(p->>'closed_by', ''), closed_device = p_device, updated_at = now()
     WHERE business_id = p_business AND store_shift_id = v_session AND status = 'open';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION nexo_business.apply_shift_event(TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION nexo_business.track_store_shift() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM nexo_business.apply_shift_event(NEW.business_id, NEW.device_id, NEW.operation_type, NEW.occurred_at, NEW.envelope->'payload');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_events_store_shift ON nexo_business.sync_events;
CREATE TRIGGER sync_events_store_shift AFTER INSERT ON nexo_business.sync_events
  FOR EACH ROW WHEN (NEW.operation_type IN ('cash_shift.opened', 'cash_shift.joined', 'cash_shift.closed'))
  EXECUTE FUNCTION nexo_business.track_store_shift();

-- Turnos ya enviados antes de esta migración (una vez; si ya están, no hace nada).
DO $$
DECLARE e RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM nexo_business.store_shifts) THEN
    FOR e IN SELECT business_id, device_id, operation_type, occurred_at, envelope->'payload' AS p
               FROM nexo_business.sync_events
              WHERE operation_type IN ('cash_shift.opened', 'cash_shift.joined', 'cash_shift.closed')
              ORDER BY occurred_at, received_at LOOP
      PERFORM nexo_business.apply_shift_event(e.business_id, e.device_id, e.operation_type, e.occurred_at, e.p);
    END LOOP;
  END IF;
END $$;

-- Nombre de una persona del negocio (id en texto) o NULL.
CREATE OR REPLACE FUNCTION nexo_business.person_name(p_business TEXT, p_id TEXT)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT full_name FROM nexo_business.people WHERE business_id = p_business AND id::text = p_id;
$$;
REVOKE ALL ON FUNCTION nexo_business.person_name(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- Resumen de un turno de la tienda para la caja.
CREATE OR REPLACE FUNCTION nexo_business.store_shift_json(p_business TEXT, p_session TEXT)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'storeShiftId', o.store_shift_id, 'status', o.status, 'openedAt', o.opened_at,
    'openedById', o.operator_id, 'openedBy', nexo_business.person_name(p_business, o.operator_id),
    'openedDevice', coalesce(d.label, o.device_id),
    'closedAt', o.closed_at, 'closedBy', nexo_business.person_name(p_business, o.closed_by),
    'devices', (SELECT jsonb_agg(jsonb_build_object('deviceId', m.device_id, 'label', coalesce(md.label, m.device_id),
                  'role', m.role, 'lastSeenAt', md.last_seen_at) ORDER BY m.opened_at)
                  FROM nexo_business.store_shifts m LEFT JOIN nexo_business.devices md ON md.business_id = m.business_id AND md.device_id = m.device_id
                 WHERE m.business_id = p_business AND m.store_shift_id = p_session))
  FROM nexo_business.store_shifts o
  LEFT JOIN nexo_business.devices d ON d.business_id = o.business_id AND d.device_id = o.device_id
  WHERE o.business_id = p_business AND o.shift_id = p_session AND o.store_shift_id = p_session
  ORDER BY o.opened_at LIMIT 1;
$$;
REVOKE ALL ON FUNCTION nexo_business.store_shift_json(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- «Debería haber» de todo el cajón: fondo (de quien abrió) + efectivo de las
-- ventas de TODAS las cajas del turno + entradas (también los pedidos web
-- cobrados en la caja) − salidas − reembolsos en efectivo + p_web (efectivo de
-- pedidos web cobrados en Ventas/Core que no pasaron por la caja; lo trae la
-- función nexo-device-shift desde Core). Fuente única del dinero de los
-- mensajeros: Core («Registrar dinero recibido»); el «Efectivo de mensajeros»
-- de la caja no se usa para pedidos web.
CREATE OR REPLACE FUNCTION nexo_business.store_shift_expected(p_business TEXT, p_session TEXT, p_web JSONB DEFAULT '[]'::jsonb)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v JSONB;
BEGIN
  WITH members AS (SELECT DISTINCT shift_id FROM nexo_business.store_shifts WHERE business_id = p_business AND store_shift_id = p_session),
  floats AS (
    SELECT upper(f->>'currency') AS currency, sum((f->>'amount_minor')::BIGINT) AS m
      FROM nexo_business.store_shifts s, jsonb_array_elements(s.floats) f
     WHERE s.business_id = p_business AND s.store_shift_id = p_session AND s.role IN ('opener', 'legacy') AND NOT s.merged
     GROUP BY 1),
  ev AS (
    SELECT e.operation_type AS op, e.envelope->'payload' AS p FROM nexo_business.sync_events e
     WHERE e.business_id = p_business AND e.envelope->'payload'->>'shift_id' IN (SELECT shift_id FROM members)
       AND e.operation_type IN ('sale.completed', 'sale.returned', 'cash_movement.recorded')),
  sales AS (
    SELECT upper(pe->>'currency') AS currency, sum((pe->>'amount_minor')::BIGINT) AS m
      FROM ev, jsonb_array_elements(coalesce(ev.p->'payments', '[]'::jsonb)) pe
     WHERE ev.op = 'sale.completed' AND (pe->>'rail' = 'cash' OR (pe->>'rail' IS NULL AND pe->>'method' = 'cash'))
     GROUP BY 1),
  moves AS (
    SELECT upper(p->>'currency') AS currency,
           sum(CASE WHEN p->>'direction' = 'in' AND coalesce(p->>'source_type', '') <> 'web_order' THEN (p->>'amount_minor')::BIGINT ELSE 0 END) AS m_in,
           sum(CASE WHEN p->>'direction' = 'in' AND p->>'source_type' = 'web_order' THEN (p->>'amount_minor')::BIGINT ELSE 0 END) AS m_web,
           sum(CASE WHEN p->>'direction' = 'out' THEN (p->>'amount_minor')::BIGINT ELSE 0 END) AS m_out
      FROM ev WHERE op = 'cash_movement.recorded' GROUP BY 1),
  refunds AS (
    SELECT upper(coalesce(p->>'currency', 'USD')) AS currency, sum((p->>'refund_minor')::BIGINT) AS m
      FROM ev WHERE op = 'sale.returned' AND p->>'refund_rail' = 'cash' GROUP BY 1),
  web AS (
    SELECT upper(w->>'currency') AS currency, sum((w->>'amountMinor')::BIGINT) AS m
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_web) = 'array' THEN p_web ELSE '[]'::jsonb END) w GROUP BY 1),
  cur AS (SELECT currency FROM floats UNION SELECT currency FROM sales UNION SELECT currency FROM moves
          UNION SELECT currency FROM refunds UNION SELECT currency FROM web)
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'currency', c.currency,
      'openingFloatMinor', coalesce(f.m, 0), 'salesCashMinor', coalesce(s.m, 0),
      'webInCajaMinor', coalesce(mv.m_web, 0), 'webInVentasMinor', coalesce(w.m, 0),
      'otherInMinor', coalesce(mv.m_in, 0), 'outMinor', coalesce(mv.m_out, 0) + coalesce(r.m, 0),
      'expectedMinor', coalesce(f.m, 0) + coalesce(s.m, 0) + coalesce(mv.m_web, 0) + coalesce(w.m, 0) + coalesce(mv.m_in, 0)
                       - coalesce(mv.m_out, 0) - coalesce(r.m, 0)) ORDER BY c.currency), '[]'::jsonb)
    INTO v
    FROM cur c LEFT JOIN floats f USING (currency) LEFT JOIN sales s USING (currency) LEFT JOIN moves mv USING (currency)
    LEFT JOIN refunds r USING (currency) LEFT JOIN web w USING (currency);
  RETURN v;
END;
$$;
REVOKE ALL ON FUNCTION nexo_business.store_shift_expected(TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- Entrada de las cajas (función nexo-device-shift, con la clave del equipo):
--   status   {shiftId?}            → turno abierto de la tienda y, si se pasa, el estado de ese turno
--   open     {shiftId, operatorId} → reserva la apertura (join = ya hay uno abierto: unirse)
--   expected {shiftId, web}        → «debería haber» de todo el cajón
CREATE OR REPLACE FUNCTION public.nexo_business_device_shift(p_token TEXT, p_action TEXT, p_data JSONB DEFAULT '{}'::jsonb)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  d nexo_business.devices%ROWTYPE;
  v_open nexo_business.store_shifts;
  v_shift TEXT := nullif(p_data->>'shiftId', '');
  v_session TEXT;
  v_mine JSONB;
BEGIN
  IF coalesce(length(p_token), 0) < 32 THEN RETURN jsonb_build_object('error', 'unauthorized'); END IF;
  SELECT * INTO d FROM nexo_business.devices WHERE token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') AND active;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'unauthorized'); END IF;

  IF p_action = 'open' THEN
    IF v_shift IS NULL THEN RETURN jsonb_build_object('error', 'invalid'); END IF;
    PERFORM pg_advisory_xact_lock(hashtext('nexo_store_shift:' || d.business_id));
    v_open := nexo_business.open_store_shift(d.business_id);
    IF v_open.shift_id IS NOT NULL AND v_open.shift_id <> v_shift THEN
      RETURN jsonb_build_object('action', 'join', 'shift', nexo_business.store_shift_json(d.business_id, v_open.store_shift_id));
    END IF;
    INSERT INTO nexo_business.store_shifts (shift_id, device_id, business_id, store_shift_id, role, operator_id, opened_at, claimed)
    VALUES (v_shift, d.device_id, d.business_id, v_shift, 'opener', nullif(p_data->>'operatorId', ''), now(), TRUE)
    ON CONFLICT (shift_id, device_id) DO NOTHING;
    RETURN jsonb_build_object('action', 'open', 'shift', nexo_business.store_shift_json(d.business_id, v_shift));
  END IF;

  IF v_shift IS NOT NULL THEN
    SELECT store_shift_id INTO v_session FROM nexo_business.store_shifts
     WHERE business_id = d.business_id AND shift_id = v_shift ORDER BY (device_id = d.device_id) DESC LIMIT 1;
  END IF;

  IF p_action = 'status' THEN
    v_open := nexo_business.open_store_shift(d.business_id);
    IF v_session IS NOT NULL THEN v_mine := nexo_business.store_shift_json(d.business_id, v_session); END IF;
    RETURN jsonb_build_object(
      'open', CASE WHEN v_open.shift_id IS NULL THEN NULL ELSE nexo_business.store_shift_json(d.business_id, v_open.store_shift_id) END,
      'mine', v_mine, 'known', v_session IS NOT NULL,
      -- Turnos de otros días que nadie cerró (para avisar; no se usan).
      'stale', coalesce((SELECT jsonb_agg(nexo_business.store_shift_json(d.business_id, s.store_shift_id) ORDER BY s.opened_at DESC)
                  FROM nexo_business.store_shifts s
                 WHERE s.business_id = d.business_id AND s.status = 'open' AND s.role IN ('opener', 'legacy') AND NOT s.merged AND NOT s.claimed
                   AND s.store_shift_id = s.shift_id
                   AND (s.opened_at AT TIME ZONE 'America/Havana')::date < (now() AT TIME ZONE 'America/Havana')::date), '[]'::jsonb));
  END IF;

  IF p_action = 'expected' THEN
    IF v_session IS NULL THEN
      RETURN jsonb_build_object('error', 'unknown_shift', 'message', 'La nube aún no tiene este turno: sincroniza y prueba otra vez.');
    END IF;
    RETURN jsonb_build_object('shift', nexo_business.store_shift_json(d.business_id, v_session),
      'currencies', nexo_business.store_shift_expected(d.business_id, v_session, coalesce(p_data->'web', '[]'::jsonb)),
      'generatedAt', now());
  END IF;
  RETURN jsonb_build_object('error', 'unknown_action');
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_device_shift(TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_device_shift(TEXT, TEXT, JSONB) TO service_role;

-- «La dependienta de turno» (Lennys 20-oct): quien abrió hoy el turno de la
-- tienda. VivaBot le pregunta solo a ella (preguntas abiertas, fichas) y el
-- bote del 0,5 % de los pedidos cobrados ese día es suyo. Sin turno abierto
-- hoy → open = false (el bot hace lo de siempre).
CREATE OR REPLACE FUNCTION public.nexo_business_on_duty(p_business TEXT DEFAULT 'casa-viva')
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce((
    SELECT jsonb_build_object('open', TRUE, 'storeShiftId', s.store_shift_id, 'openedAt', s.opened_at,
             'staffId', p.id, 'name', p.full_name, 'phone', p.phone, 'wooUserId', p.woo_user_id,
             'device', coalesce(d.label, s.device_id))
      FROM nexo_business.store_shifts s
      LEFT JOIN nexo_business.people p ON p.business_id = s.business_id AND p.id::text = s.operator_id
      LEFT JOIN nexo_business.devices d ON d.business_id = s.business_id AND d.device_id = s.device_id
     WHERE s.business_id = p_business AND s.status = 'open' AND s.role = 'opener' AND NOT s.merged AND NOT s.claimed
       AND (s.opened_at AT TIME ZONE 'America/Havana')::date = (now() AT TIME ZONE 'America/Havana')::date
     ORDER BY s.opened_at DESC LIMIT 1), jsonb_build_object('open', FALSE));
$$;
REVOKE ALL ON FUNCTION public.nexo_business_on_duty(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_on_duty(TEXT) TO service_role;

-- Quién abrió el turno cada día (la primera apertura del día), para el bote del
-- 0,5 % de los pedidos web en «A pagar este mes» (nexo-panel-web, staff_pay).
CREATE OR REPLACE FUNCTION public.nexo_business_shift_days(p_business TEXT, p_from DATE, p_to DATE)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('day', x.day, 'staffId', x.operator_id, 'name', p.full_name,
           'phone', p.phone, 'wooUserId', p.woo_user_id) ORDER BY x.day), '[]'::jsonb)
    FROM (SELECT DISTINCT ON ((opened_at AT TIME ZONE 'America/Havana')::date)
                 (opened_at AT TIME ZONE 'America/Havana')::date AS day, operator_id
            FROM nexo_business.store_shifts
           WHERE business_id = p_business AND role IN ('opener', 'legacy') AND NOT merged AND NOT claimed AND operator_id IS NOT NULL
             AND (opened_at AT TIME ZONE 'America/Havana')::date BETWEEN p_from AND p_to
           ORDER BY (opened_at AT TIME ZONE 'America/Havana')::date, opened_at) x
    JOIN nexo_business.people p ON p.business_id = p_business AND p.id::text = x.operator_id AND p.kind = 'staff';
$$;
REVOKE ALL ON FUNCTION public.nexo_business_shift_days(TEXT, DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_shift_days(TEXT, DATE, DATE) TO service_role;

-- ---------- 4. Informe con «Atiende» y turnos ----------
CREATE OR REPLACE FUNCTION public.nexo_business_report(p_business TEXT, p_from DATE, p_to DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_tz CONSTANT TEXT := 'America/Havana';
  v_from TIMESTAMPTZ;
  v_to TIMESTAMPTZ;
BEGIN
  IF nexo_business.role_of(p_business) IS NULL OR nexo_business.role_of(p_business) = 'partner' THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_to < p_from OR p_to - p_from > 366 THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Periodo inválido (máximo un año)');
  END IF;
  v_from := p_from::timestamp AT TIME ZONE v_tz;
  v_to := (p_to + 1)::timestamp AT TIME ZONE v_tz;

  RETURN (
    WITH sales AS (
      SELECT e.event_id, e.envelope->'payload'->>'sale_id' AS sale_id, e.occurred_at::timestamptz AS at,
             e.device_id, (e.envelope->'payload'->>'total_minor')::BIGINT AS total_minor, e.envelope->'payload' AS p
        FROM nexo_business.sync_events e
       WHERE e.business_id = p_business AND e.operation_type = 'sale.completed'
         AND e.occurred_at::timestamptz >= v_from AND e.occurred_at::timestamptz < v_to),
    lines AS (
      SELECT s.sale_id, l->>'product_id' AS product_id, (l->>'quantity')::BIGINT AS qty,
             coalesce((l->>'line_total_minor')::BIGINT, (l->>'quantity')::BIGINT * (l->>'unit_price_minor')::BIGINT, s.total_minor) AS line_minor
        FROM sales s, jsonb_array_elements(CASE WHEN jsonb_typeof(s.p->'lines') = 'array' THEN s.p->'lines'
               ELSE jsonb_build_array(jsonb_build_object('product_id', s.p->>'product_id', 'quantity', coalesce(s.p->>'quantity', '1'),
                    'line_total_minor', s.total_minor)) END) l),
    econ AS (SELECT * FROM nexo_business.product_unit_economics(p_business)),
    other AS (SELECT coalesce((SELECT other_pct FROM nexo_business.cost_settings WHERE business_id = p_business), 0) AS pct),
    paid AS (
      SELECT ce.sale_id, ce.product_id, sum(ce.amount_usd) AS usd
        FROM nexo_business.commission_entries ce
        LEFT JOIN nexo_business.people pp ON pp.id = ce.person_id
       WHERE ce.business_id = p_business AND ce.status = 'available'
         AND ce.sale_id IN (SELECT sale_id FROM sales)
         AND NOT (ce.kind = 'partner' AND pp.partner_rule = 'supplier_price')
       GROUP BY 1, 2),
    priced AS (
      SELECT l.*, x.total_cost IS NOT NULL AS has_cost,
             CASE WHEN x.total_cost IS NOT NULL
                  THEN l.line_minor / 100.0 - l.qty * x.total_cost - (l.line_minor / 100.0) * (SELECT pct FROM other) / 100 - coalesce(pd.usd, 0) END AS profit
        FROM lines l LEFT JOIN econ x ON x.product_id = l.product_id
        LEFT JOIN paid pd ON pd.sale_id = l.sale_id AND pd.product_id = l.product_id),
    pays AS (
      SELECT s.sale_id, pe->>'method' AS method, coalesce(pe->>'rail', 'cash') AS rail, upper(coalesce(pe->>'currency', 'USD')) AS currency,
             pe->>'provider' AS provider, pe->>'external_ref' AS ref,
             (pe->>'amount_minor')::BIGINT AS amount_minor, coalesce((pe->>'usd_minor')::BIGINT, (pe->>'amount_minor')::BIGINT) AS usd_minor
        FROM sales s, jsonb_array_elements(coalesce(s.p->'payments', jsonb_build_array(jsonb_build_object(
               'method', 'cash', 'rail', 'cash', 'currency', 'USD', 'amount_minor', s.total_minor, 'usd_minor', s.total_minor)))) pe),
    refunds AS (
      SELECT coalesce(sum((e.envelope->'payload'->>'refund_minor')::BIGINT), 0) AS minor, count(*) AS n
        FROM nexo_business.sync_events e
       WHERE e.business_id = p_business AND e.operation_type = 'sale.returned'
         AND e.occurred_at::timestamptz >= v_from AND e.occurred_at::timestamptz < v_to),
    shifts AS (
      SELECT o.* FROM nexo_business.store_shifts o
       WHERE o.business_id = p_business AND o.role IN ('opener', 'legacy') AND NOT o.merged AND NOT o.claimed
         AND o.opened_at >= v_from AND o.opened_at < v_to)
    SELECT jsonb_build_object(
      'from', p_from, 'to', p_to,
      'totals', jsonb_build_object(
        'sales', (SELECT count(*) FROM sales),
        'usdMinor', (SELECT coalesce(sum(total_minor), 0) FROM sales),
        'units', (SELECT coalesce(sum(qty), 0) FROM lines),
        'refundsMinor', (SELECT minor FROM refunds), 'refunds', (SELECT n FROM refunds),
        'profitUsd', (SELECT round(coalesce(sum(profit), 0), 2) FROM priced),
        'costedMinor', (SELECT coalesce(sum(line_minor), 0) FROM priced WHERE has_cost),
        'paidToPeopleUsd', (SELECT round(coalesce(sum(usd), 0), 2) FROM paid)),
      'gestores', coalesce((SELECT jsonb_agg(jsonb_build_object('id', g.id, 'name', g.full_name, 'sales', t.n, 'usdMinor', t.m,
                    'commissionUsd', round(coalesce((SELECT sum(amount_usd) FROM nexo_business.commission_entries ce
                       WHERE ce.person_id = g.id AND ce.status = 'available' AND ce.sale_id IN (SELECT sale_id FROM sales)), 0), 2)) ORDER BY t.m DESC)
                  FROM (SELECT p->>'gestor_id' gid, count(*) n, sum(total_minor) m FROM sales WHERE p->>'gestor_id' IS NOT NULL GROUP BY 1) t
                  JOIN nexo_business.people g ON g.id::text = t.gid AND g.business_id = p_business), '[]'::jsonb),
      -- Lo de cada dependienta en la caja: ventas que atendió, 2 % de mostrador (D80) y 0,5 % con gestora.
      'staff', coalesce((SELECT jsonb_agg(jsonb_build_object('id', st.id, 'name', st.full_name, 'sales', t.n, 'usdMinor', t.m,
                    'counterUsd', round(coalesce((SELECT sum(amount_usd) FROM nexo_business.commission_entries ce
                       WHERE ce.person_id = st.id AND ce.status = 'available' AND ce.kind = 'counter_staff' AND ce.sale_id IN (SELECT sale_id FROM sales)), 0), 2),
                    'staffUsd', round(coalesce((SELECT sum(amount_usd) FROM nexo_business.commission_entries ce
                       WHERE ce.person_id = st.id AND ce.status = 'available' AND ce.kind IN ('staff', 'extra_staff') AND ce.sale_id IN (SELECT sale_id FROM sales)), 0), 2))
                    ORDER BY t.m DESC)
                  FROM (SELECT p->>'staff_id' sid, count(*) n, sum(total_minor) m FROM sales WHERE p->>'staff_id' IS NOT NULL GROUP BY 1) t
                  JOIN nexo_business.people st ON st.id::text = t.sid AND st.business_id = p_business), '[]'::jsonb),
      'withoutStaff', jsonb_build_object('sales', (SELECT count(*) FROM sales WHERE p->>'staff_id' IS NULL),
                    'usdMinor', (SELECT coalesce(sum(total_minor), 0) FROM sales WHERE p->>'staff_id' IS NULL)),
      'byMethod', coalesce((SELECT jsonb_agg(jsonb_build_object('method', method, 'rail', rail, 'provider', provider, 'currency', currency,
                    'count', n, 'amountMinor', amount, 'usdMinor', usd) ORDER BY usd DESC)
                  FROM (SELECT method, rail, provider, currency, count(*) n, sum(amount_minor) amount, sum(usd_minor) usd
                          FROM pays GROUP BY 1, 2, 3, 4) t), '[]'::jsonb),
      'byDay', coalesce((SELECT jsonb_agg(jsonb_build_object('day', d, 'usdMinor', m, 'sales', n) ORDER BY d)
                  FROM (SELECT (at AT TIME ZONE v_tz)::date d, sum(total_minor) m, count(*) n FROM sales GROUP BY 1) t), '[]'::jsonb),
      'byHour', coalesce((SELECT jsonb_agg(jsonb_build_object('hour', h, 'usdMinor', m, 'sales', n) ORDER BY h)
                  FROM (SELECT extract(hour FROM at AT TIME ZONE v_tz)::int h, sum(total_minor) m, count(*) n FROM sales GROUP BY 1) t), '[]'::jsonb),
      'topProducts', coalesce((SELECT jsonb_agg(jsonb_build_object('productId', t.product_id, 'name', coalesce(c.name, t.product_id),
                    'imageUrl', c.image_url, 'units', t.u, 'usdMinor', t.m, 'profitUsd', t.pr) ORDER BY t.m DESC)
                  FROM (SELECT product_id, sum(qty) u, sum(line_minor) m, round(sum(profit), 2) pr FROM priced GROUP BY 1 ORDER BY 3 DESC LIMIT 10) t
                  LEFT JOIN nexo_business.catalog_products c ON c.business_id = p_business AND c.product_id = t.product_id), '[]'::jsonb),
      'shifts', coalesce((SELECT jsonb_agg(jsonb_build_object(
                    'shiftId', s.store_shift_id, 'status', s.status, 'openedAt', s.opened_at, 'closedAt', s.closed_at,
                    'openedBy', nexo_business.person_name(p_business, s.operator_id),
                    'closedBy', nexo_business.person_name(p_business, s.closed_by),
                    'device', coalesce(d.label, s.device_id), 'oneDrawer', s.role = 'opener',
                    'devices', (SELECT jsonb_agg(DISTINCT coalesce(md.label, m.device_id)) FROM nexo_business.store_shifts m
                                  LEFT JOIN nexo_business.devices md ON md.business_id = m.business_id AND md.device_id = m.device_id
                                 WHERE m.business_id = p_business AND m.store_shift_id = s.store_shift_id),
                    'counts', (SELECT m.counts FROM nexo_business.store_shifts m WHERE m.business_id = p_business AND m.store_shift_id = s.store_shift_id
                                  AND m.counts IS NOT NULL ORDER BY m.updated_at DESC LIMIT 1),
                    'expectedSource', (SELECT m.expected_source FROM nexo_business.store_shifts m WHERE m.business_id = p_business AND m.store_shift_id = s.store_shift_id
                                  AND m.counts IS NOT NULL ORDER BY m.updated_at DESC LIMIT 1))
                    ORDER BY s.opened_at DESC)
                  FROM shifts s LEFT JOIN nexo_business.devices d ON d.business_id = p_business AND d.device_id = s.device_id), '[]'::jsonb),
      'sales', coalesce((SELECT jsonb_agg(jsonb_build_object(
                    'saleId', s.sale_id, 'at', s.at, 'device', coalesce(d.label, s.device_id), 'usdMinor', s.total_minor,
                    'staff', st.full_name, 'gestora', g.full_name,
                    'lines', (SELECT jsonb_agg(jsonb_build_object('name', coalesce(c.name, l.product_id), 'qty', l.qty, 'minor', l.line_minor))
                                FROM lines l LEFT JOIN nexo_business.catalog_products c ON c.business_id = p_business AND c.product_id = l.product_id
                               WHERE l.sale_id = s.sale_id),
                    'payments', (SELECT jsonb_agg(jsonb_build_object('method', method, 'rail', rail, 'provider', provider, 'currency', currency,
                                   'amountMinor', amount_minor, 'usdMinor', usd_minor, 'reference', ref)) FROM pays WHERE pays.sale_id = s.sale_id))
                  ORDER BY s.at DESC)
                  FROM sales s LEFT JOIN nexo_business.devices d ON d.business_id = p_business AND d.device_id = s.device_id
                  LEFT JOIN nexo_business.people st ON st.business_id = p_business AND st.id::text = s.p->>'staff_id'
                  LEFT JOIN nexo_business.people g ON g.business_id = p_business AND g.id::text = s.p->>'gestor_id'), '[]'::jsonb)
    ));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_report(TEXT, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_report(TEXT, DATE, DATE) TO authenticated;

-- ---------- 5. Pedidos web en la caja ----------
-- La dependienta de «Atiende» (de la caja que pide): nombre, teléfono y su id de la web,
-- para que Core firme el cobro con su usuaria (nexo-device-web-orders). Solo personal activo.
CREATE OR REPLACE FUNCTION public.nexo_business_device_person(p_token TEXT, p_person TEXT)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce((
    SELECT jsonb_build_object('businessId', d.business_id, 'deviceId', d.device_id, 'label', d.label,
             'person', (SELECT jsonb_build_object('id', p.id, 'name', p.full_name, 'phone', p.phone, 'wooUserId', p.woo_user_id)
                          FROM nexo_business.people p
                         WHERE p.business_id = d.business_id AND p.id::text = p_person AND p.kind = 'staff' AND p.status = 'active'))
      FROM nexo_business.devices d
     WHERE coalesce(length(p_token), 0) >= 32 AND d.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') AND d.active),
    jsonb_build_object('error', 'unauthorized'));
$$;
REVOKE ALL ON FUNCTION public.nexo_business_device_person(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_device_person(TEXT, TEXT) TO service_role;
