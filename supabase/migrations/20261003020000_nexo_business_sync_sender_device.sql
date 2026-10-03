-- Attribute every event to the authenticated sender device.
--
-- Early Android pilot builds labelled their sales 'windows-pilot-01'. Those
-- events physically live in (and can only be sent from) the phone's outbox, so
-- a deviceId mismatch must not block the batch. The business must still match;
-- sync_events.device_id is now always the device that sent the event, and the
-- label the event was written with stays inside `envelope`.

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
       OR coalesce(v_event->>'operationType', '') = ''
       OR coalesce(v_event->>'entityType', '') = ''
       OR coalesce(v_event->>'entityId', '') = ''
       OR coalesce(v_event->>'occurredAt', '') = ''
       OR v_event->'envelope' IS NULL THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'eventId', v_event_id, 'status', 'rejected', 'error', 'Event belongs to another business or is incomplete'));
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
