create table if not exists crm_fotos_reales (
  id text primary key,
  business_id uuid not null,
  path text not null,
  folder text,
  sender_phone text,
  sender_name text,
  source text,
  caption text,
  question_id text,
  question_text text,
  product_id bigint,
  product_name text,
  product_how text,
  suggested_id bigint,
  tipo text,
  descripcion text,
  codigos text[] default '{}',
  wa_id text,
  received_at timestamptz,
  discarded boolean not null default false,
  web_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_fotos_reales_producto on crm_fotos_reales (business_id, product_id);
create index if not exists crm_fotos_reales_fecha on crm_fotos_reales (business_id, received_at desc);
alter table crm_fotos_reales enable row level security;
revoke all on crm_fotos_reales from anon, authenticated;
create table if not exists crm_ai_usage (
  id bigserial primary key,
  business_id uuid,
  created_at timestamptz not null default now(),
  day date not null,
  fn text not null,
  provider text not null,
  model text,
  tier text,
  input_tokens integer not null default 0,
  cached_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  output_tokens integer not null default 0,
  images integer not null default 0,
  audio_seconds numeric not null default 0,
  chars integer not null default 0,
  cost_usd numeric(12, 6),
  ok boolean not null default true,
  error text
);
create index if not exists crm_ai_usage_por_dia on crm_ai_usage (day desc, fn);
create index if not exists crm_ai_usage_negocio on crm_ai_usage (business_id, created_at desc);
alter table crm_ai_usage enable row level security;
revoke all on crm_ai_usage from anon, authenticated;
create or replace view crm_ai_usage_dia with (security_invoker = true) as
select day, provider, fn, model,
       count(*) filter (where ok) as llamadas,
       count(*) filter (where not ok) as fallidas,
       sum(input_tokens) as entrada, sum(cached_tokens) as cache, sum(output_tokens) as salida,
       sum(images) as imagenes, sum(audio_seconds) as segundos_audio, sum(chars) as caracteres,
       round(sum(coalesce(cost_usd, 0)), 4) as usd
from crm_ai_usage
group by day, provider, fn, model;
revoke all on crm_ai_usage_dia from anon, authenticated;
