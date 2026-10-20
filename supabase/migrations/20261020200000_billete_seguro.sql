-- Billete Seguro: equipos que pueden usar la IA (un código por negocio o equipo)
-- y registro de cada revisión con IA, para medir uso y billetes rechazados.
-- Solo la función billete-seguro-revisa (service role) lee y escribe: RLS sin políticas.

create table if not exists public.billete_seguro_equipos (
  codigo text primary key check (length(codigo) between 8 and 64),
  nombre text not null,
  activo boolean not null default true,
  tope_hora integer not null default 60 check (tope_hora between 1 and 1000),
  creado timestamptz not null default now()
);

create table if not exists public.billete_seguro_revisiones (
  id bigint generated always as identity primary key,
  codigo text not null references public.billete_seguro_equipos(codigo) on update cascade,
  billete text not null,
  veredicto text check (veredicto in ('sin_senales', 'dudoso', 'falso', 'error')),
  creado timestamptz not null default now()
);
create index if not exists billete_seguro_revisiones_codigo_creado on public.billete_seguro_revisiones (codigo, creado desc);

alter table public.billete_seguro_equipos enable row level security;
alter table public.billete_seguro_revisiones enable row level security;
revoke all on public.billete_seguro_equipos, public.billete_seguro_revisiones from anon, authenticated;
