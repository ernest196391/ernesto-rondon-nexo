-- Owner-authorized historical annotations; never mutate cash movements/closures.
-- No public API grants. Trusted operations records a concrete approval first.
CREATE TABLE nexo_business.cash_rectification_authorizations (
  business_id text NOT NULL,
  rectification_id text NOT NULL,
  device_id text NOT NULL,
  event_id text NOT NULL UNIQUE,
  shift_id text NOT NULL,
  target_movement_id text NOT NULL,
  protected_movement_id text NOT NULL,
  approval_ref text NOT NULL,
  approved_by text NOT NULL,
  approved_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  manifest jsonb NOT NULL,
  target_before jsonb NOT NULL,
  protected_before jsonb NOT NULL,
  closure_before jsonb NOT NULL,
  consumed_at timestamptz,
  PRIMARY KEY(business_id,rectification_id),
  UNIQUE(business_id,target_movement_id),
  UNIQUE(business_id,approval_ref)
);
CREATE TABLE nexo_business.cash_rectifications (
  business_id text NOT NULL,
  rectification_id text NOT NULL,
  event_id text NOT NULL UNIQUE REFERENCES nexo_business.sync_events(event_id),
  device_id text NOT NULL,
  shift_id text NOT NULL,
  target_movement_id text NOT NULL,
  approval_ref text NOT NULL,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL,
  PRIMARY KEY(business_id,rectification_id),
  UNIQUE(business_id,target_movement_id)
);
ALTER TABLE nexo_business.cash_rectification_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexo_business.cash_rectifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.cash_rectification_authorizations,nexo_business.cash_rectifications FROM PUBLIC,anon,authenticated;

CREATE FUNCTION nexo_business.record_cash_rectification() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
  a nexo_business.cash_rectification_authorizations%ROWTYPE;
  p jsonb := NEW.envelope->'payload';
  actual_target jsonb;
  actual_protected jsonb;
  actual_closure jsonb;
  closed_at timestamptz;
BEGIN
  SELECT * INTO a FROM nexo_business.cash_rectification_authorizations
   WHERE business_id=NEW.business_id AND rectification_id=p->>'rectification_id'
   FOR UPDATE;
  IF NOT FOUND OR NOT a.active OR a.consumed_at IS NOT NULL
     OR a.event_id IS DISTINCT FROM NEW.event_id OR a.device_id IS DISTINCT FROM NEW.device_id
     OR NEW.entity_type IS DISTINCT FROM 'cash_rectification' OR NEW.entity_id IS DISTINCT FROM a.rectification_id
     OR (p - 'operator_id') IS DISTINCT FROM a.manifest
     OR coalesce(length(trim(p->>'operator_id')),0)=0
     OR NEW.occurred_at::timestamptz < a.approved_at
     OR NEW.occurred_at::timestamptz > now()+interval '5 minutes'
  THEN RAISE EXCEPTION 'cash rectification does not match an active owner authorization'; END IF;
  SELECT to_jsonb(m) INTO actual_target FROM nexo_business.cash_movements m
    WHERE m.business_id=a.business_id AND m.movement_id=a.target_movement_id;
  SELECT to_jsonb(m) INTO actual_protected FROM nexo_business.cash_movements m
    WHERE m.business_id=a.business_id AND m.movement_id=a.protected_movement_id;
  SELECT e.envelope->'payload',e.occurred_at::timestamptz INTO actual_closure,closed_at
    FROM nexo_business.sync_events e WHERE e.business_id=a.business_id AND e.device_id=a.device_id
      AND e.operation_type='cash_shift.closed' AND e.envelope->'payload'->>'shift_id'=a.shift_id
    ORDER BY e.occurred_at DESC LIMIT 1;
  IF actual_target IS DISTINCT FROM a.target_before OR actual_protected IS DISTINCT FROM a.protected_before
     OR actual_closure IS DISTINCT FROM a.closure_before OR closed_at IS NULL
     OR NEW.occurred_at::timestamptz <= closed_at
     OR EXISTS (SELECT 1 FROM nexo_business.sync_events e WHERE e.business_id=a.business_id
       AND e.operation_type='cash_movement.recorded' AND e.envelope->'payload'->>'corrects_movement_id'
       IN (a.target_movement_id,a.protected_movement_id))
  THEN RAISE EXCEPTION 'cash records changed since owner authorization'; END IF;
  INSERT INTO nexo_business.cash_rectifications(business_id,rectification_id,event_id,device_id,shift_id,target_movement_id,approval_ref,occurred_at,payload)
    VALUES(a.business_id,a.rectification_id,NEW.event_id,a.device_id,a.shift_id,a.target_movement_id,a.approval_ref,NEW.occurred_at::timestamptz,p);
  UPDATE nexo_business.cash_rectification_authorizations SET consumed_at=now()
    WHERE business_id=a.business_id AND rectification_id=a.rectification_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION nexo_business.record_cash_rectification() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER record_cash_rectification AFTER INSERT ON nexo_business.sync_events
FOR EACH ROW WHEN (NEW.operation_type='cash_shift.rectified') EXECUTE FUNCTION nexo_business.record_cash_rectification();

CREATE FUNCTION nexo_business.protect_cash_rectification() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'cash rectifications are immutable'; END;
$$;
REVOKE ALL ON FUNCTION nexo_business.protect_cash_rectification() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER protect_cash_rectification BEFORE UPDATE OR DELETE ON nexo_business.cash_rectifications
FOR EACH ROW EXECUTE FUNCTION nexo_business.protect_cash_rectification();
