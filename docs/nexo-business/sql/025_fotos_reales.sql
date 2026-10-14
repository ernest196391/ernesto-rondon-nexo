-- Biblioteca permanente de fotos reales del equipo (Ernesto, 14-oct-2026: «que las fotos que manda el equipo se
-- guarden para siempre unidas a su producto»). Copia de lo que hay en el VPS (/root/archivos/fotos-reales/, que es
-- lo que manda): el bot y `cv fotos` escriben aquí si la tabla existe; si no, solo en disco y `cv fotos sincronizar`
-- la llena después. Servirá al panel para la fase 2 («poner en la web con un toque»).
-- Pegar en Supabase → proyecto nexo-production → SQL Editor (traductor de Chrome apagado).
create table if not exists crm_fotos_reales (
  id text primary key,                 -- 12 letras del sha256 de la foto (también en el nombre del archivo)
  business_id uuid not null,
  path text not null,                  -- ruta en el VPS
  folder text,                         -- <id woo>-<nombre> | sin-producto | otras | descartadas
  sender_phone text,
  sender_name text,
  source text,                         -- privado | general | pregunta | migrada-…
  caption text,
  question_id text,                    -- pregunta abierta (crm_settings.preguntas_abiertas) que contestaba
  question_text text,
  product_id bigint,                   -- producto de WooCommerce
  product_name text,
  product_how text,                    -- pregunta | pie | pie-cercano | codigo | catalogo | manual
  suggested_id bigint,                 -- lo que la IA cree, sin estar segura (no se usa solo)
  tipo text,                           -- producto | captura | anuncio | documento | lugar | otro | sin_revisar
  descripcion text,
  codigos text[] default '{}',
  wa_id text,
  received_at timestamptz,
  discarded boolean not null default false,
  web_status text,                     -- fase 2: null | subida | quitada
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_fotos_reales_producto on crm_fotos_reales (business_id, product_id);
create index if not exists crm_fotos_reales_fecha on crm_fotos_reales (business_id, received_at desc);
alter table crm_fotos_reales enable row level security;
revoke all on crm_fotos_reales from anon, authenticated;
