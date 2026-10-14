-- Gasto de IA del bot, llamada por llamada (Ernesto, 14-oct-2026: «tenemos que tener un balance de cuánto gastamos en
-- herramientas, qué es lo que más consume y poder abaratar costos»). Lo escribe src/usage.js en cada llamada a
-- OpenAI / Anthropic (texto y visión), Groq u OpenAI (notas de voz → texto) y ElevenLabs (texto → voz).
-- Copia de lo que hay en el VPS (/root/archivos/gastos/ia-AAAA-MM-DD.jsonl, que es lo que manda): si la tabla no
-- existe, el bot sigue igual y solo escribe el archivo. Lo lee `cv gastos` (correo diario de las 21:00).
-- Pegar en Supabase → proyecto nexo-production → SQL Editor (traductor de Chrome apagado).
create table if not exists crm_ai_usage (
  id bigserial primary key,
  business_id uuid,
  created_at timestamptz not null default now(),
  day date not null,                    -- día de Cuba (America/Havana)
  fn text not null,                     -- función del bot: conversacion-gestora, preguntas-grupo, fotos-reales-vision, audio-transcribir…
  provider text not null,               -- openai | anthropic | groq | elevenlabs
  model text,
  tier text,                            -- smart | normal
  input_tokens integer not null default 0,   -- OpenAI: total de entrada (incluye los de caché)
  cached_tokens integer not null default 0,  -- de la entrada, leídos de caché (más baratos)
  cache_write_tokens integer not null default 0,
  output_tokens integer not null default 0,
  images integer not null default 0,
  audio_seconds numeric not null default 0,
  chars integer not null default 0,     -- ElevenLabs: caracteres convertidos a voz
  cost_usd numeric(12, 6),              -- estimado con los precios oficiales de src/ai-prices.js; null = sin precio (plan mensual)
  ok boolean not null default true,
  error text                            -- «sin saldo (429)», «error 500»…
);
create index if not exists crm_ai_usage_dia on crm_ai_usage (day desc, fn);
create index if not exists crm_ai_usage_negocio on crm_ai_usage (business_id, created_at desc);
alter table crm_ai_usage enable row level security;
revoke all on crm_ai_usage from anon, authenticated;

-- Resumen por día y función (para el panel o una consulta rápida).
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
