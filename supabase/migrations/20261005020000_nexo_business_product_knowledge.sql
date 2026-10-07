-- Ficha central de conocimiento por producto (Digitaliza tus productos).
-- Única fuente de características para cualquier IA o plantilla: los prompts
-- leen esta ficha y nunca guardan copias propias.
-- * product_facts: libro de hechos, solo se añade. Cada cambio es una fila
--   nueva que sustituye a la anterior (historial completo). Cada hecho tiene
--   valor, unidad, fuente, evidencia (enlaces/archivos), fecha, estado de
--   verificación, alcance (producto o categoría) y variante a la que aplica.
-- * product_experiences: pruebas reales (condiciones, cantidades, ajustes,
--   tiempos, resultados, archivos). Complementan los hechos; no los cambian.
-- * product_knowledge: versión de la ficha por producto (sube con cada cambio).
-- * content_pieces: cada pieza generada guarda la versión de la ficha que usó.
--   Si cambia un hecho sensible (precio, garantía, características…), las
--   piezas que lo usaron quedan "needs_review".
-- Grupo = variant_of o product_id (como en la recepción). Aditiva.

CREATE TABLE IF NOT EXISTS nexo_business.product_knowledge (
  business_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  version INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, group_id)
);

CREATE TABLE IF NOT EXISTS nexo_business.product_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  fact_key TEXT NOT NULL CHECK (fact_key ~ '^[a-z][a-z0-9_]{1,40}$'),
  label TEXT NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 80),
  -- Precio y existencias NO son hechos: los manda Core (catalog_products y el libro de stock).
  kind TEXT NOT NULL CHECK (kind IN ('feature', 'warranty', 'offer', 'included', 'documentation', 'usage', 'other')),
  value TEXT,
  unit TEXT,
  applies_to TEXT,                    -- product_id de la variante; NULL = todas
  scope TEXT NOT NULL DEFAULT 'product' CHECK (scope IN ('product', 'category')),
  -- verified: comprobado con evidencia · declared: lo dice el vendedor/proveedor/caja
  -- pending: falta investigar o probar (sin valor) · contradicted: fuentes no coinciden
  status TEXT NOT NULL CHECK (status IN ('verified', 'declared', 'pending', 'contradicted')),
  source TEXT NOT NULL CHECK (length(trim(source)) BETWEEN 1 AND 200),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
  note TEXT,
  observed_on DATE NOT NULL DEFAULT current_date,
  replaces UUID REFERENCES nexo_business.product_facts(id),
  current BOOLEAN NOT NULL DEFAULT TRUE,
  knowledge_version INT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Sin evidencia suficiente no se rellena por suposición.
  CHECK (status <> 'pending' OR value IS NULL),
  CHECK (status = 'pending' OR value IS NOT NULL),
  CHECK (status <> 'verified' OR jsonb_array_length(evidence) > 0)
);
CREATE INDEX IF NOT EXISTS product_facts_group ON nexo_business.product_facts (business_id, group_id, current);

CREATE TABLE IF NOT EXISTS nexo_business.product_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  applies_to TEXT,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 2 AND 120),
  conditions TEXT,
  quantities TEXT,
  settings TEXT,
  duration TEXT,
  result TEXT NOT NULL CHECK (length(trim(result)) > 0),
  files JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(files) = 'array'),
  tested_on DATE NOT NULL DEFAULT current_date,
  tested_by TEXT,
  replaces UUID REFERENCES nexo_business.product_experiences(id),
  current BOOLEAN NOT NULL DEFAULT TRUE,
  knowledge_version INT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexo_business.content_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  format TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_version INT NOT NULL,
  provider TEXT,
  knowledge_version INT NOT NULL,
  fact_keys TEXT[] NOT NULL DEFAULT '{}',   -- hechos que usa la pieza
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'needs_review', 'discarded')),
  review_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_pieces_group ON nexo_business.content_pieces (business_id, group_id);

ALTER TABLE nexo_business.product_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexo_business.product_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexo_business.product_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexo_business.content_pieces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.product_knowledge, nexo_business.product_facts, nexo_business.product_experiences,
  nexo_business.content_pieces FROM PUBLIC, anon, authenticated;

-- Sube la versión de la ficha y devuelve la nueva.
CREATE OR REPLACE FUNCTION nexo_business.bump_knowledge(p_business TEXT, p_group TEXT)
RETURNS INT LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  INSERT INTO nexo_business.product_knowledge (business_id, group_id, version) VALUES (p_business, p_group, 1)
  ON CONFLICT (business_id, group_id) DO UPDATE SET version = nexo_business.product_knowledge.version + 1, updated_at = now()
  RETURNING version;
$$;
REVOKE ALL ON FUNCTION nexo_business.bump_knowledge(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- La ficha completa: lo que leen las plantillas y los proveedores de IA.
CREATE OR REPLACE FUNCTION nexo_business.knowledge_of(p_business TEXT, p_group TEXT)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT jsonb_build_object(
    'groupId', p_group,
    'version', coalesce(k.version, 0),
    'products', coalesce((SELECT jsonb_agg(jsonb_build_object('productId', c.product_id, 'name', c.name, 'variantLabel', c.variant_label,
       'prices', c.prices, 'stock', coalesce(s.quantity, 0)) ORDER BY c.product_id)
       FROM nexo_business.catalog_products c
       LEFT JOIN nexo_business.stock_by_product s ON s.business_id = c.business_id AND s.product_id = c.product_id
       WHERE c.business_id = p_business AND c.active AND (c.product_id = p_group OR c.variant_of = p_group)), '[]'::jsonb),
    'facts', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'key', fact_key, 'label', label, 'kind', kind, 'value', value, 'unit', unit,
       'appliesTo', applies_to, 'scope', scope, 'status', status, 'source', source, 'evidence', evidence, 'note', note,
       'observedOn', observed_on, 'version', knowledge_version) ORDER BY kind, label)
       FROM nexo_business.product_facts WHERE business_id = p_business AND group_id = p_group AND current), '[]'::jsonb),
    'experiences', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'title', title, 'appliesTo', applies_to, 'conditions', conditions,
       'quantities', quantities, 'settings', settings, 'duration', duration, 'result', result, 'files', files,
       'testedOn', tested_on, 'testedBy', tested_by, 'version', knowledge_version) ORDER BY tested_on DESC)
       FROM nexo_business.product_experiences WHERE business_id = p_business AND group_id = p_group AND current), '[]'::jsonb),
    'pending', coalesce((SELECT jsonb_agg(label ORDER BY label) FROM nexo_business.product_facts
       WHERE business_id = p_business AND group_id = p_group AND current AND status IN ('pending', 'contradicted')), '[]'::jsonb),
    'pieces', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'channel', channel, 'format', format, 'status', status,
       'knowledgeVersion', knowledge_version, 'reviewReason', review_reason) ORDER BY created_at DESC)
       FROM nexo_business.content_pieces WHERE business_id = p_business AND group_id = p_group AND status <> 'discarded'), '[]'::jsonb))
  FROM (SELECT 1) one
  LEFT JOIN nexo_business.product_knowledge k ON k.business_id = p_business AND k.group_id = p_group;
$$;
REVOKE ALL ON FUNCTION nexo_business.knowledge_of(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_knowledge(p_business TEXT, p_group TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF NOT nexo_business.can_receive(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN nexo_business.knowledge_of(p_business, p_group);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_knowledge(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_knowledge(TEXT, TEXT) TO authenticated;

-- Historial de un hecho (todas sus versiones).
CREATE OR REPLACE FUNCTION public.nexo_business_fact_history(p_business TEXT, p_group TEXT, p_key TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $$
BEGIN
  IF NOT nexo_business.can_receive(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('value', value, 'unit', unit, 'status', status, 'source', source, 'evidence', evidence,
      'appliesTo', applies_to, 'current', current, 'version', knowledge_version, 'at', created_at) ORDER BY created_at DESC)
    FROM nexo_business.product_facts WHERE business_id = p_business AND group_id = p_group AND fact_key = p_key), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_fact_history(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_fact_history(TEXT, TEXT, TEXT) TO authenticated;

-- p_fact: {key, label, kind, value?, unit?, appliesTo?, scope?, status, source, evidence?: [{url|path, title?, conclusion?}], note?, observedOn?}
-- Guardar un hecho con la misma clave y variante crea una versión nueva y retira la anterior.
CREATE OR REPLACE FUNCTION public.nexo_business_fact_save(p_business TEXT, p_group TEXT, p_fact JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_prev nexo_business.product_facts%ROWTYPE;
  v_version INT;
  v_id UUID;
  v_flagged INT := 0;
  v_changed BOOLEAN;
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF NOT EXISTS (SELECT 1 FROM nexo_business.catalog_products WHERE business_id = p_business AND (product_id = p_group OR variant_of = p_group)) THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Producto desconocido');
  END IF;
  IF coalesce(p_fact->>'key', '') !~ '^[a-z][a-z0-9_]{1,40}$' OR coalesce(trim(p_fact->>'label'), '') = '' THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Falta el nombre del dato');
  END IF;
  IF coalesce(p_fact->>'kind', '') NOT IN ('feature', 'warranty', 'offer', 'included', 'documentation', 'usage', 'other') THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Tipo de dato desconocido (precio y existencias se cambian en Core)');
  END IF;
  IF coalesce(p_fact->>'status', '') NOT IN ('verified', 'declared', 'pending', 'contradicted') THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Estado de verificación desconocido');
  END IF;
  IF p_fact->>'status' = 'pending' AND nullif(trim(p_fact->>'value'), '') IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Un dato pendiente va sin valor: no se rellena por suposición');
  END IF;
  IF p_fact->>'status' <> 'pending' AND nullif(trim(p_fact->>'value'), '') IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Escribe el valor o marca el dato como pendiente');
  END IF;
  IF p_fact->>'status' = 'verified' AND jsonb_array_length(coalesce(p_fact->'evidence', '[]'::jsonb)) = 0 THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Un dato verificado necesita evidencia (enlace o archivo)');
  END IF;
  IF coalesce(trim(p_fact->>'source'), '') = '' THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Indica la fuente del dato');
  END IF;
  SELECT * INTO v_prev FROM nexo_business.product_facts
   WHERE business_id = p_business AND group_id = p_group AND fact_key = p_fact->>'key' AND current
     AND applies_to IS NOT DISTINCT FROM nullif(p_fact->>'appliesTo', '')
   FOR UPDATE;
  v_changed := v_prev.id IS NULL OR v_prev.value IS DISTINCT FROM nullif(trim(p_fact->>'value'), '')
    OR v_prev.unit IS DISTINCT FROM nullif(trim(p_fact->>'unit'), '') OR v_prev.status IS DISTINCT FROM p_fact->>'status';
  v_version := nexo_business.bump_knowledge(p_business, p_group);
  UPDATE nexo_business.product_facts SET current = FALSE WHERE id = v_prev.id;
  INSERT INTO nexo_business.product_facts (business_id, group_id, fact_key, label, kind, value, unit, applies_to, scope, status, source,
    evidence, note, observed_on, replaces, knowledge_version, created_by)
  VALUES (p_business, p_group, p_fact->>'key', trim(p_fact->>'label'), p_fact->>'kind', nullif(trim(p_fact->>'value'), ''),
    nullif(trim(p_fact->>'unit'), ''), nullif(p_fact->>'appliesTo', ''), coalesce(p_fact->>'scope', 'product'), p_fact->>'status',
    trim(p_fact->>'source'), coalesce(p_fact->'evidence', '[]'::jsonb), nullif(trim(p_fact->>'note'), ''),
    coalesce((p_fact->>'observedOn')::date, current_date), v_prev.id, v_version, auth.uid())
  RETURNING id INTO v_id;
  -- Piezas que usaron este dato: a revisar (solo si el valor o su estado cambió).
  IF v_prev.id IS NOT NULL AND v_changed THEN
    UPDATE nexo_business.content_pieces SET status = 'needs_review',
      review_reason = 'Cambió «' || trim(p_fact->>'label') || '» (ficha v' || v_version || ')'
     WHERE business_id = p_business AND group_id = p_group AND status IN ('draft', 'review', 'approved')
       AND (p_fact->>'key' = ANY (fact_keys) OR p_fact->>'kind' IN ('warranty', 'offer'));
    GET DIAGNOSTICS v_flagged = ROW_COUNT;
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', v_id, 'version', v_version, 'piecesToReview', v_flagged);
EXCEPTION WHEN check_violation OR invalid_text_representation OR not_null_violation OR invalid_datetime_format THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_fact_save(TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_fact_save(TEXT, TEXT, JSONB) TO authenticated;

-- p_exp: {id? (para corregir: crea versión nueva), title, appliesTo?, conditions, quantities, settings, duration, result, files?, testedOn?, testedBy?}
-- Dueña, economista o dependienta activa pueden registrar pruebas reales.
CREATE OR REPLACE FUNCTION public.nexo_business_experience_save(p_business TEXT, p_group TEXT, p_exp JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_prev UUID := nullif(p_exp->>'id', '')::uuid;
  v_version INT;
  v_id UUID;
BEGIN
  IF NOT nexo_business.can_receive(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  IF NOT EXISTS (SELECT 1 FROM nexo_business.catalog_products WHERE business_id = p_business AND (product_id = p_group OR variant_of = p_group)) THEN
    RETURN jsonb_build_object('error', 'invalid', 'message', 'Producto desconocido');
  END IF;
  v_version := nexo_business.bump_knowledge(p_business, p_group);
  UPDATE nexo_business.product_experiences SET current = FALSE WHERE id = v_prev AND business_id = p_business AND group_id = p_group;
  INSERT INTO nexo_business.product_experiences (business_id, group_id, applies_to, title, conditions, quantities, settings, duration, result,
    files, tested_on, tested_by, replaces, knowledge_version, created_by)
  VALUES (p_business, p_group, nullif(p_exp->>'appliesTo', ''), trim(p_exp->>'title'), nullif(trim(p_exp->>'conditions'), ''),
    nullif(trim(p_exp->>'quantities'), ''), nullif(trim(p_exp->>'settings'), ''), nullif(trim(p_exp->>'duration'), ''),
    trim(p_exp->>'result'), coalesce(p_exp->'files', '[]'::jsonb), coalesce((p_exp->>'testedOn')::date, current_date),
    nullif(trim(p_exp->>'testedBy'), ''), v_prev, v_version, auth.uid())
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id, 'version', v_version);
EXCEPTION WHEN check_violation OR invalid_text_representation OR not_null_violation OR invalid_datetime_format THEN
  RETURN jsonb_build_object('error', 'invalid', 'message', 'Completa el título y el resultado de la prueba');
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_experience_save(TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_experience_save(TEXT, TEXT, JSONB) TO authenticated;

-- Registro de una pieza generada (bloque 2 la usará): guarda la versión de la ficha que se usó.
CREATE OR REPLACE FUNCTION public.nexo_business_piece_record(p_business TEXT, p_group TEXT, p_piece JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_current INT;
  v_id UUID;
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  SELECT version INTO v_current FROM nexo_business.product_knowledge WHERE business_id = p_business AND group_id = p_group;
  IF v_current IS NULL OR (p_piece->>'knowledgeVersion')::int <> v_current THEN
    RETURN jsonb_build_object('error', 'conflict', 'message', 'La ficha cambió: vuelve a generar con la versión actual');
  END IF;
  INSERT INTO nexo_business.content_pieces (business_id, group_id, channel, format, template_id, template_version, provider,
    knowledge_version, fact_keys, body)
  VALUES (p_business, p_group, p_piece->>'channel', p_piece->>'format', p_piece->>'templateId', (p_piece->>'templateVersion')::int,
    p_piece->>'provider', v_current, coalesce((SELECT array_agg(x) FROM jsonb_array_elements_text(p_piece->'factKeys') x), '{}'),
    coalesce(p_piece->'body', '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id, 'knowledgeVersion', v_current);
END;
$$;
REVOKE ALL ON FUNCTION public.nexo_business_piece_record(TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_piece_record(TEXT, TEXT, JSONB) TO authenticated;

-- El precio vive en Core: si cambia, las piezas de ese producto quedan a revisar.
CREATE OR REPLACE FUNCTION nexo_business.flag_pieces_on_price() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE nexo_business.content_pieces SET status = 'needs_review', review_reason = 'Cambió el precio en Core'
   WHERE business_id = NEW.business_id AND group_id = coalesce(NEW.variant_of, NEW.product_id)
     AND status IN ('draft', 'review', 'approved');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS catalog_products_flag_pieces ON nexo_business.catalog_products;
CREATE TRIGGER catalog_products_flag_pieces AFTER UPDATE OF prices ON nexo_business.catalog_products
  FOR EACH ROW WHEN (OLD.prices IS DISTINCT FROM NEW.prices) EXECUTE FUNCTION nexo_business.flag_pieces_on_price();
