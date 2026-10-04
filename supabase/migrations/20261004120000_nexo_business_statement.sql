-- Estado de cuenta for one person (gestora, dependienta or socio) over a
-- period: every ledger entry, every payout and the balances. The owner can read
-- anyone's; a person only their own. Read-only. Additive.
CREATE OR REPLACE FUNCTION public.nexo_business_statement(p_business TEXT, p_person UUID, p_from DATE, p_to DATE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
DECLARE
  v_tz CONSTANT TEXT := 'America/Havana';
  v_me nexo_business.people := nexo_business.me(p_business);
  v_p nexo_business.people;
  v_from TIMESTAMPTZ := p_from::timestamp AT TIME ZONE v_tz;
  v_to TIMESTAMPTZ := (p_to + 1)::timestamp AT TIME ZONE v_tz;
BEGIN
  IF NOT nexo_business.is_admin(p_business) AND v_me.id IS DISTINCT FROM p_person THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_to < p_from THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Periodo inválido'); END IF;
  SELECT * INTO v_p FROM nexo_business.people WHERE id = p_person AND business_id = p_business;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  RETURN jsonb_build_object(
    'person', jsonb_build_object('fullName', v_p.full_name, 'kind', v_p.kind, 'phone', v_p.phone, 'payout', v_p.payout,
       'partnerType', v_p.partner_type, 'partnerRule', v_p.partner_rule, 'partnerValue', v_p.partner_value),
    'from', p_from, 'to', p_to,
    'earnedUsd', round(coalesce((SELECT sum(amount_usd) FROM nexo_business.commission_entries
                   WHERE person_id = p_person AND status = 'available' AND created_at >= v_from AND created_at < v_to), 0), 2),
    'paidUsd', coalesce((SELECT sum(amount_usd) FROM nexo_business.payouts
                   WHERE person_id = p_person AND status = 'paid' AND decided_at >= v_from AND decided_at < v_to), 0),
    'balance', nexo_business.person_balance(p_person),
    'entries', coalesce((SELECT jsonb_agg(jsonb_build_object('at', e.created_at, 'kind', e.kind, 'name', coalesce(c.name, e.product_id),
        'quantity', e.quantity, 'amountUsd', round(e.amount_usd, 2), 'status', e.status) ORDER BY e.created_at)
      FROM nexo_business.commission_entries e LEFT JOIN nexo_business.catalog_products c ON c.business_id = p_business AND c.product_id = e.product_id
     WHERE e.person_id = p_person AND e.created_at >= v_from AND e.created_at < v_to), '[]'::jsonb),
    'payouts', coalesce((SELECT jsonb_agg(jsonb_build_object('at', coalesce(decided_at, requested_at), 'amountUsd', amount_usd, 'status', status,
        'method', method, 'currency', currency, 'amountPaid', amount_paid, 'reference', reference, 'note', note) ORDER BY requested_at)
      FROM nexo_business.payouts WHERE person_id = p_person AND requested_at >= v_from AND requested_at < v_to), '[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_statement(TEXT, UUID, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_statement(TEXT, UUID, DATE, DATE) TO authenticated;
