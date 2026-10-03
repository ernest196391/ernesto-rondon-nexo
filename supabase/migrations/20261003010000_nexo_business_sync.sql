-- NEXO Business outbox ingestion (push contract v1, docs/nexo-business/SYNC_PUSH_CONTRACT.md).
--
-- Isolated schema `nexo_business`; `public` only gains one service-role RPC wrapper.
-- * devices: provisioned POS devices; only a SHA-256 hash of each device token is stored.
-- * sync_events: append-only copy of every outbox event, unique by event_id, so a
--   retry is answered 'duplicate' and never stored twice.
-- * push_events(): the only entry point. SECURITY DEFINER, executable by
--   service_role only (called from the nexo-sync-push Edge Function).
-- Projections (sales, cash, stock…) are built from sync_events later.

CREATE SCHEMA IF NOT EXISTS nexo_business;
REVOKE ALL ON SCHEMA nexo_business FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA nexo_business TO service_role;

CREATE TABLE IF NOT EXISTS nexo_business.devices (
  business_id TEXT NOT NULL CHECK (length(trim(business_id)) > 0),
  device_id TEXT NOT NULL CHECK (length(trim(device_id)) > 0),
  label TEXT,
  token_hash TEXT NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  PRIMARY KEY (business_id, device_id)
);

CREATE TABLE IF NOT EXISTS nexo_business.sync_events (
  event_id TEXT PRIMARY KEY CHECK (length(trim(event_id)) > 0),
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  envelope JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (business_id, device_id) REFERENCES nexo_business.devices (business_id, device_id)
);

CREATE INDEX IF NOT EXISTS sync_events_business_received_idx
  ON nexo_business.sync_events (business_id, received_at);
CREATE INDEX IF NOT EXISTS sync_events_entity_idx
  ON nexo_business.sync_events (business_id, entity_type, entity_id);

ALTER TABLE nexo_business.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexo_business.sync_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA nexo_business FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON nexo_business.devices TO service_role;
GRANT SELECT, INSERT ON nexo_business.sync_events TO service_role;

-- Events are append-only.
CREATE OR REPLACE FUNCTION nexo_business.forbid_event_change() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'sync events are append-only';
END;
$$;

DROP TRIGGER IF EXISTS sync_events_append_only ON nexo_business.sync_events;
CREATE TRIGGER sync_events_append_only
  BEFORE UPDATE OR DELETE ON nexo_business.sync_events
  FOR EACH ROW EXECUTE FUNCTION nexo_business.forbid_event_change();

CREATE OR REPLACE FUNCTION nexo_business.push_events(p_token TEXT, p_request JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_device nexo_business.devices%ROWTYPE;
  v_event JSONB;
  v_event_id TEXT;
  v_existing_business TEXT;
  v_inserted INT;
  v_results JSONB := '[]'::jsonb;
BEGIN
  IF coalesce(length(p_token), 0) < 32 THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT * INTO v_device FROM nexo_business.devices
   WHERE token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') AND active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  IF (p_request->>'contractVersion')::INT IS DISTINCT FROM 1
     OR p_request->>'businessId' IS DISTINCT FROM v_device.business_id
     OR p_request->>'deviceId' IS DISTINCT FROM v_device.device_id
     OR jsonb_typeof(p_request->'events') <> 'array'
     OR jsonb_array_length(p_request->'events') > 500 THEN
    RETURN jsonb_build_object('error', 'bad_request');
  END IF;

  UPDATE nexo_business.devices SET last_seen_at = now()
   WHERE business_id = v_device.business_id AND device_id = v_device.device_id;

  FOR v_event IN SELECT * FROM jsonb_array_elements(p_request->'events') LOOP
    v_event_id := v_event->>'eventId';
    IF v_event_id IS NULL OR length(trim(v_event_id)) = 0 THEN
      CONTINUE;
    END IF;

    IF v_event->>'businessId' IS DISTINCT FROM v_device.business_id
       OR v_event->>'deviceId' IS DISTINCT FROM v_device.device_id
       OR coalesce(v_event->>'operationType', '') = ''
       OR coalesce(v_event->>'entityType', '') = ''
       OR coalesce(v_event->>'entityId', '') = ''
       OR coalesce(v_event->>'occurredAt', '') = ''
       OR v_event->'envelope' IS NULL THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'eventId', v_event_id, 'status', 'rejected', 'error', 'Event does not belong to this device or is incomplete'));
      CONTINUE;
    END IF;

    INSERT INTO nexo_business.sync_events
      (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
    VALUES
      (v_event_id, v_device.business_id, v_device.device_id, v_event->>'operationType',
       v_event->>'entityType', v_event->>'entityId', v_event->>'occurredAt', v_event->'envelope')
    ON CONFLICT (event_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;

    IF v_inserted = 1 THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('eventId', v_event_id, 'status', 'applied'));
    ELSE
      SELECT business_id INTO v_existing_business FROM nexo_business.sync_events WHERE event_id = v_event_id;
      IF v_existing_business = v_device.business_id THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('eventId', v_event_id, 'status', 'duplicate'));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object(
          'eventId', v_event_id, 'status', 'rejected', 'error', 'Event id already used'));
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('results', v_results);
END;
$$;

REVOKE ALL ON FUNCTION nexo_business.push_events(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION nexo_business.push_events(TEXT, JSONB) TO service_role;
REVOKE ALL ON FUNCTION nexo_business.forbid_event_change() FROM PUBLIC, anon, authenticated;

-- PostgREST only exposes `public`; this wrapper is the RPC the Edge Function
-- calls with the service role. Not executable by anon/authenticated.
CREATE OR REPLACE FUNCTION public.nexo_business_push_events(p_token TEXT, p_request JSONB)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT nexo_business.push_events(p_token, p_request);
$$;

REVOKE ALL ON FUNCTION public.nexo_business_push_events(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_push_events(TEXT, JSONB) TO service_role;
