-- A partial return used to void the whole commission of each returned product
-- (returning 1 of 3 towels cancelled the commission on all 3). Now the
-- available entry is voided and, if units remain with the customer, a new
-- entry is written for them, proportional to the original amount.
-- Repeated partial returns chain: each one acts on the latest available entry.

CREATE OR REPLACE FUNCTION nexo_business.record_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  p JSONB := NEW.envelope->'payload';
  v_gestor UUID;
  v_staff UUID;
  l JSONB;
  v_qty BIGINT;
  v_line BIGINT;
  r RECORD;
  rl RECORD;
  v_left BIGINT;
BEGIN
  IF NEW.operation_type = 'sale.completed' THEN
    IF jsonb_typeof(p->'lines') <> 'array' THEN RETURN NEW; END IF;
    v_gestor := (SELECT id FROM nexo_business.people WHERE id::text = p->>'gestor_id' AND business_id = NEW.business_id AND kind = 'gestor');
    v_staff := (SELECT id FROM nexo_business.people WHERE id::text = p->>'staff_id' AND business_id = NEW.business_id AND kind = 'staff');
    FOR l IN SELECT * FROM jsonb_array_elements(p->'lines') LOOP
      v_qty := (l->>'quantity')::BIGINT;
      v_line := coalesce((l->>'line_total_minor')::BIGINT, v_qty * (l->>'unit_price_minor')::BIGINT);
      IF v_gestor IS NOT NULL OR v_staff IS NOT NULL THEN
        INSERT INTO nexo_business.commission_entries (business_id, person_id, sale_id, product_id, kind, quantity, amount_usd, event_id)
        SELECT NEW.business_id, e.person_id, p->>'sale_id', l->>'product_id', e.kind, v_qty, round(e.amount_usd, 4), NEW.event_id
          FROM nexo_business.line_entries(NEW.business_id, v_gestor, v_staff, l->>'product_id', v_qty, v_line,
                 coalesce((l->>'extra')::BOOLEAN, FALSE)) e
         WHERE e.amount_usd > 0;
      END IF;
      INSERT INTO nexo_business.commission_entries (business_id, person_id, sale_id, product_id, kind, quantity, amount_usd, event_id)
      SELECT NEW.business_id, s.person_id, p->>'sale_id', l->>'product_id', 'partner', v_qty, round(s.amount_usd, 4), NEW.event_id
        FROM nexo_business.partner_share(NEW.business_id, l->>'product_id', v_qty, v_line) s
       WHERE s.amount_usd > 0;
    END LOOP;
  ELSIF NEW.operation_type = 'sale.returned' AND jsonb_typeof(p->'lines') = 'array' THEN
    FOR rl IN
      SELECT x->>'product_id' AS product_id, sum(coalesce((x->>'quantity')::BIGINT, 0)) AS qty
        FROM jsonb_array_elements(p->'lines') x GROUP BY 1
    LOOP
      FOR r IN
        SELECT * FROM nexo_business.commission_entries ce
         WHERE ce.business_id = NEW.business_id AND ce.sale_id = p->>'sale_id'
           AND ce.product_id = rl.product_id AND ce.status = 'available'
         FOR UPDATE
      LOOP
        UPDATE nexo_business.commission_entries SET status = 'void', voided_at = now() WHERE id = r.id;
        -- Old clients sent no quantity: treat that as a full return, as before.
        v_left := CASE WHEN rl.qty > 0 THEN r.quantity - rl.qty ELSE 0 END;
        IF v_left > 0 THEN
          INSERT INTO nexo_business.commission_entries (business_id, person_id, sale_id, product_id, kind, quantity, amount_usd, event_id)
          VALUES (r.business_id, r.person_id, r.sale_id, r.product_id, r.kind, v_left,
                  round(r.amount_usd * v_left / r.quantity, 4), NEW.event_id);
        END IF;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;
