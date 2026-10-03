-- Service-role helper for Edge Functions that receive a user JWT: the user's
-- memberships, resolved after the function has verified the token.
CREATE OR REPLACE FUNCTION public.nexo_business_my_memberships_for(p_user UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('businessId', business_id, 'role', role) ORDER BY business_id), '[]'::jsonb)
  FROM nexo_business.members WHERE user_id = p_user;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_my_memberships_for(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_my_memberships_for(UUID) TO service_role;
