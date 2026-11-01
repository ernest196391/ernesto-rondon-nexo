-- Pedido web: cancelar o devolver desde la caja (Ernesto 31-oct, caso de la olla Ariete, pedido web de 62 USD).
--
-- Antes Zaymi solo pudo sacar los 62 USD como «Salida del cajón · Otro: devolución de producto (olla reina)»:
-- el pedido no quedaba devuelto y Lennys aprobaba una salida suelta sin saber de qué pedido era.
-- Ahora la caja registra la devolución en Core y el dinero sale del cajón LIGADO al pedido:
--   * efectivo: movimiento cash_out con categoría 'devolucion_pedido' y origen woocommerce / web_order_return / <pedido>;
--   * transferencia: no toca el cajón, llega en el evento web_order.action_recorded.
-- Las dos piden el SÍ de Lennys (fund_exit_approvals, «SALIDA SI n»), con el texto
-- «Devolución pedido #5612 · 1× Olla de presión eléctrica Ariete digital · causa: …».
-- No cambia el dinero de nadie: solo avisa y deja constancia. Reversible (DROP de las columnas y del trigger nuevo).

ALTER TABLE nexo_business.fund_exit_approvals ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE nexo_business.fund_exit_approvals ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'cash';
CREATE INDEX IF NOT EXISTS fund_exit_approvals_order_idx ON nexo_business.fund_exit_approvals (business_id, order_id) WHERE order_id IS NOT NULL;

-- Salidas del cajón que piden aprobación: «remesa», «otro» y ahora «devolucion_pedido» (ligada a su pedido).
CREATE OR REPLACE FUNCTION nexo_business.track_fund_exit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE p JSONB := NEW.envelope->'payload';
BEGIN
  IF p->>'direction' = 'out' AND coalesce(p->>'category', '') IN ('remesa', 'otro', 'devolucion_pedido') THEN
    INSERT INTO nexo_business.fund_exit_approvals (business_id, movement_id, device_id, shift_id, category, currency, amount_minor, reason, operator_id, occurred_at, order_id, method)
    VALUES (NEW.business_id, coalesce(p->>'movement_id', NEW.entity_id), NEW.device_id, p->>'shift_id', p->>'category', upper(coalesce(p->>'currency', 'USD')),
            (p->>'amount_minor')::BIGINT, p->>'reason', nullif(p->>'operator_id', ''), coalesce(NEW.occurred_at::timestamptz, now()),
            CASE WHEN p->>'source_type' = 'web_order_return' THEN nullif(p->>'source_id', '') END, 'cash')
    ON CONFLICT (movement_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- La parte por TRANSFERENCIA de una devolución de pedido web (no pasa por el cajón): también la aprueba Lennys.
CREATE OR REPLACE FUNCTION nexo_business.track_web_order_refund() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  p JSONB := NEW.envelope->'payload';
  v_action TEXT := coalesce(p->>'action_id', NEW.entity_id);
  v_text TEXT;
  v_cur TEXT;
  v_amount BIGINT;
BEGIN
  IF coalesce(p->>'kind', '') <> 'return' THEN RETURN NEW; END IF;
  v_text := left('Devolución pedido #' || coalesce(p->>'order_number', p->>'order_id', '?')
            || CASE WHEN coalesce(p->>'products', '') <> '' THEN ' · ' || (p->>'products') ELSE '' END
            || ' · causa: ' || coalesce(p->>'reason', '') || ' · por transferencia', 280);
  FOREACH v_cur IN ARRAY ARRAY['USD', 'CUP'] LOOP
    v_amount := coalesce((p->>(CASE WHEN v_cur = 'USD' THEN 'refund_usd_minor' ELSE 'refund_cup_minor' END))::BIGINT, 0)
              - coalesce((p->>(CASE WHEN v_cur = 'USD' THEN 'cash_usd_minor' ELSE 'cash_cup_minor' END))::BIGINT, 0);
    IF v_amount > 0 THEN
      INSERT INTO nexo_business.fund_exit_approvals (business_id, movement_id, device_id, shift_id, category, currency, amount_minor, reason, operator_id, occurred_at, order_id, method)
      VALUES (NEW.business_id, v_action || '-trf-' || lower(v_cur), NEW.device_id, p->>'shift_id', 'devolucion_pedido', v_cur, v_amount, v_text,
              nullif(p->>'staff_id', ''), coalesce(NEW.occurred_at::timestamptz, now()), nullif(p->>'order_id', ''), 'transfer')
      ON CONFLICT (movement_id) DO NOTHING;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_events_web_order_refund ON nexo_business.sync_events;
CREATE TRIGGER sync_events_web_order_refund AFTER INSERT ON nexo_business.sync_events
  FOR EACH ROW WHEN (NEW.operation_type = 'web_order.action_recorded')
  EXECUTE FUNCTION nexo_business.track_web_order_refund();

-- VivaBot: igual que antes, más el pedido y la forma. El texto que lee Lennys va en «reason»
-- («Devolución pedido #5612 · 1× Olla … · causa: …») y, para el bot, ya armado en «text».
CREATE OR REPLACE FUNCTION public.nexo_business_fund_exits_to_notify(p_business TEXT DEFAULT 'casa-viva')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v JSONB;
BEGIN
  WITH due AS (
    UPDATE nexo_business.fund_exit_approvals a SET notified_at = now()
     WHERE a.business_id = p_business AND a.status = 'pending' AND a.notified_at IS NULL
    RETURNING a.*)
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'category', d.category, 'currency', d.currency, 'amountMinor', d.amount_minor,
           'reason', d.reason, 'operator', coalesce(nexo_business.person_name(p_business, d.operator_id), d.operator_id), 'device', coalesce(dv.label, d.device_id),
           'occurredAt', d.occurred_at, 'orderId', d.order_id, 'method', d.method,
           'text', CASE WHEN d.category = 'devolucion_pedido'
                        THEN d.reason || ' · ' || to_char(d.amount_minor / 100.0, 'FM999999990.00') || ' ' || d.currency
                             || CASE WHEN d.method = 'transfer' THEN '' ELSE ' en efectivo del cajón' END
                             || ' · la hizo ' || coalesce(nexo_business.person_name(p_business, d.operator_id), d.operator_id, 'la tienda')
                        ELSE NULL END) ORDER BY d.id), '[]'::jsonb) INTO v
    FROM due d LEFT JOIN nexo_business.devices dv ON dv.business_id = d.business_id AND dv.device_id = d.device_id;
  RETURN v;
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_fund_exits_to_notify(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_fund_exits_to_notify(TEXT) TO service_role;

-- Panel: salidas que piden aprobación, ahora con el pedido y la forma.
CREATE OR REPLACE FUNCTION public.nexo_business_fund_exits(p_business TEXT, p_from DATE, p_to DATE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF nexo_business.role_of(p_business) IS NULL OR nexo_business.role_of(p_business) = 'partner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'category', a.category, 'currency', a.currency, 'amountMinor', a.amount_minor,
           'reason', a.reason, 'operator', coalesce(nexo_business.person_name(p_business, a.operator_id), a.operator_id), 'at', a.occurred_at, 'status', a.status,
           'decidedAt', a.decided_at, 'decidedBy', a.decided_by, 'orderId', a.order_id, 'method', a.method) ORDER BY a.occurred_at DESC)
    FROM nexo_business.fund_exit_approvals a
   WHERE a.business_id = p_business AND (a.occurred_at AT TIME ZONE 'America/Havana')::date BETWEEN p_from AND p_to), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_fund_exits(TEXT, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_fund_exits(TEXT, DATE, DATE) TO authenticated;
