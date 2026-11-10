-- «Se muestra solo al reponer» (Ernesto 10-nov, opción 2). Diseño: docs/nexo-business/ocultar-mostrar-automatico-2026-11-10.md
-- Plan: docs/nexo-business/ocultar-mostrar-automatico-PLAN.md. Lo pega Ernesto en nexo-production (editor SQL).
--
-- Al ocultar, el producto guarda POR QUÉ:
--   'agotado' (Se acabó)  → cuando vuelve a tener unidades (Llegó mercancía, Quedan, devolución, pedido web cancelado)
--                            se muestra SOLO en la caja y, por el puente (≤ 2 min), en la web.
--   'manual'  (A propósito)→ sigue oculto hasta que Lennys pulse «Mostrar».
-- Por defecto (si el panel no lo dice): 'agotado' si quedan 0 y 'manual' si queda alguno.
-- La liquidación (Core: _cvd_no_reponer) siempre es «A propósito»: si vuelve sola, el puente la oculta otra vez.
--
-- Deshacer (en este orden):
--   DROP TRIGGER IF EXISTS sync_events_back_on_restock ON nexo_business.sync_events;
--   DROP FUNCTION IF EXISTS nexo_business.catalog_back_on_restock();
--   DROP FUNCTION IF EXISTS public.nexo_business_reshow_pending(TEXT, INT);
--   DROP FUNCTION IF EXISTS public.nexo_business_reshow_done(TEXT, BIGINT[], TEXT[]);
--   DROP FUNCTION IF EXISTS public.nexo_business_products_retire(TEXT, TEXT[], BOOLEAN, TEXT);
--   volver a crear nexo_business_products_retire(TEXT, TEXT[], BOOLEAN) y nexo_business_inventory de 20261011180000;
--   DROP TABLE IF EXISTS nexo_business.web_reshow_queue;
--   ALTER TABLE nexo_business.catalog_products DROP COLUMN IF EXISTS retired_reason;

BEGIN;

ALTER TABLE nexo_business.catalog_products
  ADD COLUMN IF NOT EXISTS retired_reason TEXT CHECK (retired_reason IN ('agotado', 'manual'));

-- Lo que la web tiene que volver a mostrar (lo recoge nexo-stock-bridge cada 2 minutos).
CREATE TABLE IF NOT EXISTS nexo_business.web_reshow_queue (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id   TEXT NOT NULL,
  product_id    TEXT NOT NULL,
  woo_id        BIGINT,
  parent_woo_id BIGINT,
  qty           BIGINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  done_at       TIMESTAMPTZ,
  result        TEXT
);
CREATE INDEX IF NOT EXISTS web_reshow_queue_pending ON nexo_business.web_reshow_queue (business_id, id) WHERE done_at IS NULL;
ALTER TABLE nexo_business.web_reshow_queue ENABLE ROW LEVEL SECURITY; -- sin políticas: solo service_role

-- Stock de UN producto (la vista suma todos los eventos; filtrado por producto).
CREATE OR REPLACE FUNCTION nexo_business.stock_of(p_business TEXT, p_product TEXT) RETURNS BIGINT
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT coalesce(sum(quantity_delta), 0)::bigint FROM nexo_business.stock_movements
   WHERE business_id = p_business AND product_id = p_product;
$$;

-- «Ocultar» / «Mostrar» con motivo. Con p_retire = true sobre algo ya oculto, solo cambia el motivo (si se da).
DROP FUNCTION IF EXISTS public.nexo_business_products_retire(TEXT, TEXT[], BOOLEAN);
CREATE OR REPLACE FUNCTION public.nexo_business_products_retire(p_business TEXT, p_products TEXT[], p_retire BOOLEAN, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v nexo_business.catalog_products%ROWTYPE;
  v_out JSONB := '[]'::jsonb;
  v_reason TEXT;
  v_stock BIGINT;
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF p_retire IS NULL OR coalesce(cardinality(p_products), 0) = 0 THEN RETURN jsonb_build_object('error', 'Elige al menos un producto'); END IF;
  IF cardinality(p_products) > 500 THEN RETURN jsonb_build_object('error', 'Como máximo 500 productos a la vez'); END IF;
  IF p_reason IS NOT NULL AND p_reason NOT IN ('agotado', 'manual') THEN RETURN jsonb_build_object('error', 'Motivo no válido'); END IF;
  FOR v IN SELECT * FROM nexo_business.catalog_products
            WHERE business_id = p_business AND product_id = ANY (p_products) ORDER BY product_id FOR UPDATE LOOP
    v_reason := NULL;
    IF p_retire THEN
      v_stock := nexo_business.stock_of(p_business, v.product_id);
      v_reason := coalesce(p_reason, CASE WHEN v.retired_at IS NOT NULL THEN v.retired_reason END, CASE WHEN v_stock <= 0 THEN 'agotado' ELSE 'manual' END);
      UPDATE nexo_business.catalog_products
         SET retired_at = coalesce(retired_at, now()), retired_by = CASE WHEN retired_at IS NULL THEN auth.uid() ELSE retired_by END,
             retired_reason = v_reason, active = FALSE, updated_by = auth.uid()
       WHERE business_id = p_business AND product_id = v.product_id;
    ELSE
      UPDATE nexo_business.catalog_products
         SET retired_at = NULL, retired_by = NULL, retired_reason = NULL, active = TRUE, updated_by = auth.uid()
       WHERE business_id = p_business AND product_id = v.product_id;
    END IF;
    INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
    VALUES (p_business, 'retire:' || v.product_id,
      jsonb_build_object('active', v.active, 'retiredAt', v.retired_at, 'reason', v.retired_reason),
      jsonb_strip_nulls(jsonb_build_object('active', NOT p_retire, 'retired', p_retire, 'reason', v_reason)), auth.uid());
    v_out := v_out || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('productId', v.product_id, 'reason', v_reason,
      'wooId', (v.external_refs->'casaviva.company'->>'wooId')::bigint,
      'parentWooId', (v.external_refs->'casaviva.company'->>'parentWooId')::bigint)));
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'items', v_out);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_products_retire(TEXT, TEXT[], BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_products_retire(TEXT, TEXT[], BOOLEAN, TEXT) TO authenticated;

-- Lista de Productos: + retiredReason y backAlone ({at, qty} si se mostró solo en los últimos 7 días).
CREATE OR REPLACE FUNCTION public.nexo_business_inventory(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF coalesce(nexo_business.role_of(p_business), '') <> 'owner' THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN jsonb_build_object('products', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'productId', p.product_id, 'name', p.name, 'variant', p.variant_label, 'variantOf', p.variant_of, 'category', p.category,
      'imageUrl', p.image_url,
      'priceUsd', round(coalesce(p.regular_minor, (p.prices->>'USD')::bigint)::numeric / 100, 2),
      'offerUsd', CASE WHEN p.regular_minor IS NOT NULL THEN round((p.prices->>'USD')::numeric / 100, 2) END,
      'stock', coalesce(st.quantity, 0), 'minStock', p.min_stock, 'active', p.active,
      'retired', p.retired_at IS NOT NULL, 'retiredAt', p.retired_at, 'retiredReason', p.retired_reason,
      'backAlone', ba.back,
      'wooId', (p.external_refs->'casaviva.company'->>'wooId')::bigint,
      'parentWooId', (p.external_refs->'casaviva.company'->>'parentWooId')::bigint) ORDER BY p.active DESC, p.name)
      FROM nexo_business.catalog_products p
      LEFT JOIN nexo_business.stock_by_product st ON st.business_id = p.business_id AND st.product_id = p.product_id
      LEFT JOIN LATERAL (
        SELECT jsonb_build_object('at', a.changed_at, 'qty', (a.after->>'llegaron')::bigint) AS back
          FROM nexo_business.cost_audit a
         WHERE a.business_id = p.business_id AND a.subject = 'retire:' || p.product_id
           AND a.after->>'auto' = 'true' AND a.changed_at > now() - interval '7 days'
         ORDER BY a.changed_at DESC LIMIT 1) ba ON p.active
     WHERE p.business_id = p_business), '[]'::jsonb));
END;
$$;

-- Al llegar unidades (de 0 o menos a más de 0) a un producto oculto por «Se acabó», se muestra solo.
-- Nunca frena la sincronización de la caja: cualquier error se queda en un aviso del registro.
CREATE OR REPLACE FUNCTION nexo_business.catalog_back_on_restock() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_payload JSONB := NEW.envelope->'payload';
  r RECORD;
  v nexo_business.catalog_products%ROWTYPE;
  v_now BIGINT;
BEGIN
  FOR r IN
    SELECT x.pid, sum(x.delta)::bigint AS delta FROM (
      SELECT v_payload->>'product_id' AS pid, (v_payload->>'difference_quantity')::bigint AS delta
       WHERE NEW.operation_type = 'inventory.counted'
      UNION ALL
      SELECT l->>'product_id', (l->>'quantity')::bigint
        FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_payload->'lines') = 'array' THEN v_payload->'lines' ELSE '[]'::jsonb END) l
       WHERE NEW.operation_type IN ('inventory.received', 'sale.returned')
    ) x WHERE x.pid IS NOT NULL AND x.delta > 0 GROUP BY x.pid
  LOOP
    SELECT * INTO v FROM nexo_business.catalog_products WHERE business_id = NEW.business_id AND product_id = r.pid FOR UPDATE;
    IF NOT FOUND OR v.retired_at IS NULL OR v.retired_reason IS DISTINCT FROM 'agotado' OR upper(coalesce(v.sku, '')) LIKE 'MK-%' THEN CONTINUE; END IF;
    v_now := nexo_business.stock_of(NEW.business_id, r.pid); -- ya incluye este evento
    IF v_now <= 0 OR v_now - r.delta > 0 THEN CONTINUE; END IF;
    UPDATE nexo_business.catalog_products SET retired_at = NULL, retired_by = NULL, retired_reason = NULL, active = TRUE
     WHERE business_id = NEW.business_id AND product_id = r.pid;
    INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
    VALUES (NEW.business_id, 'retire:' || r.pid,
      jsonb_build_object('active', false, 'retiredAt', v.retired_at, 'reason', 'agotado'),
      jsonb_build_object('active', true, 'retired', false, 'auto', true, 'motivo', 'llegó mercancía', 'llegaron', r.delta, 'quedan', v_now, 'evento', NEW.event_id), NULL);
    IF (v.external_refs->'casaviva.company'->>'wooId') IS NOT NULL THEN
      INSERT INTO nexo_business.web_reshow_queue (business_id, product_id, woo_id, parent_woo_id, qty)
      VALUES (NEW.business_id, r.pid, (v.external_refs->'casaviva.company'->>'wooId')::bigint,
              (v.external_refs->'casaviva.company'->>'parentWooId')::bigint, r.delta);
    END IF;
  END LOOP;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'catalog_back_on_restock %: %', NEW.event_id, SQLERRM;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS sync_events_back_on_restock ON nexo_business.sync_events;
CREATE TRIGGER sync_events_back_on_restock AFTER INSERT ON nexo_business.sync_events
  FOR EACH ROW WHEN (NEW.operation_type IN ('inventory.counted', 'inventory.received', 'sale.returned'))
  EXECUTE FUNCTION nexo_business.catalog_back_on_restock();

-- Para el puente (service_role): lo que la web tiene que mostrar.
CREATE OR REPLACE FUNCTION public.nexo_business_reshow_pending(p_business TEXT, p_limit INT DEFAULT 50)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', q.id, 'productId', q.product_id, 'wooId', q.woo_id, 'parentWooId', q.parent_woo_id, 'qty', q.qty) ORDER BY q.id), '[]'::jsonb)
    FROM (SELECT * FROM nexo_business.web_reshow_queue WHERE business_id = p_business AND done_at IS NULL ORDER BY id LIMIT greatest(1, least(p_limit, 200))) q;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_reshow_pending(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_reshow_pending(TEXT, INT) TO service_role;

-- Marca hechas. p_keep_hidden: productos que la web NO quiso mostrar (liquidación): vuelven a ocultarse «A propósito».
CREATE OR REPLACE FUNCTION public.nexo_business_reshow_done(p_business TEXT, p_ids BIGINT[], p_keep_hidden TEXT[] DEFAULT '{}')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_n INT; v_k INT := 0; v_pid TEXT;
BEGIN
  UPDATE nexo_business.web_reshow_queue SET done_at = now(),
         result = CASE WHEN product_id = ANY (coalesce(p_keep_hidden, '{}')) THEN 'liquidacion' ELSE 'shown' END
   WHERE business_id = p_business AND id = ANY (coalesce(p_ids, '{}')) AND done_at IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  FOREACH v_pid IN ARRAY coalesce(p_keep_hidden, '{}') LOOP
    UPDATE nexo_business.catalog_products SET retired_at = now(), retired_reason = 'manual', active = FALSE
     WHERE business_id = p_business AND product_id = v_pid AND retired_at IS NULL;
    IF FOUND THEN
      v_k := v_k + 1;
      INSERT INTO nexo_business.cost_audit (business_id, subject, before, after, changed_by)
      VALUES (p_business, 'retire:' || v_pid, jsonb_build_object('active', true),
              jsonb_build_object('active', false, 'retired', true, 'reason', 'manual', 'motivo', 'liquidación: no se vuelve a vender'), NULL);
    END IF;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'done', v_n, 'keptHidden', v_k);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_reshow_done(TEXT, BIGINT[], TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nexo_business_reshow_done(TEXT, BIGINT[], TEXT[]) TO service_role;

-- Relleno: los ocultos de hoy reciben su motivo según lo que quede (comprobado el 10-nov en transacción deshecha: 121 agotado, 20 manual).
UPDATE nexo_business.catalog_products p
   SET retired_reason = CASE WHEN coalesce(s.quantity, 0) <= 0 THEN 'agotado' ELSE 'manual' END
  FROM (SELECT p2.product_id, s2.quantity FROM nexo_business.catalog_products p2
          LEFT JOIN nexo_business.stock_by_product s2 ON s2.business_id = p2.business_id AND s2.product_id = p2.product_id
         WHERE p2.business_id = 'casa-viva') s
 WHERE p.business_id = 'casa-viva' AND p.product_id = s.product_id AND p.retired_at IS NOT NULL AND p.retired_reason IS NULL;

-- Comprobación (debe salir: agotado ≈ 121, manual ≈ 20, sin_motivo = 0).
SELECT count(*) FILTER (WHERE retired_reason = 'agotado') AS agotado,
       count(*) FILTER (WHERE retired_reason = 'manual') AS manual,
       count(*) FILTER (WHERE retired_reason IS NULL) AS sin_motivo
  FROM nexo_business.catalog_products WHERE business_id = 'casa-viva' AND retired_at IS NOT NULL;

COMMIT;
