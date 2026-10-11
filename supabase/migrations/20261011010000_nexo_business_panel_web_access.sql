-- Panel único: el panel lee los pedidos de la web (WooCommerce / Casa Viva Core)
-- a través de la función nexo-panel-web. Esta comprobación decide quién puede:
-- solo las dueñas (members.role = 'owner') del negocio. Solo service_role la llama.
CREATE OR REPLACE FUNCTION public.nexo_panel_is_owner(p_user UUID, p_business TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM nexo_business.members m
                  WHERE m.user_id = p_user AND m.business_id = p_business AND m.role = 'owner');
$$;
REVOKE ALL ON FUNCTION public.nexo_panel_is_owner(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_panel_is_owner(UUID, TEXT) TO service_role;
