-- Lista de números sospechosos de estafa (Ernesto, 20-oct): una sola para toda la red NEXO.
-- Entran solos como «sospechoso» (avisos de los grupos, del equipo, de Billete Seguro, de la búsqueda diaria);
-- Ernesto los pasa a «confirmado» o «descartado» desde «Tú» (SOSPECHOSO / NO SOSPECHOSO).
-- Es interna: a un cliente nunca se le dice que está en la lista.
-- telefono: solo dígitos; los de Cuba, los 8 últimos (o 7 si es fijo); los extranjeros, con su prefijo (1305…).
-- avisado = false → VivaBot le avisa a Ernesto en «Tú» y lo pone en true.

create table if not exists public.crm_sospechosos (
  telefono text primary key check (telefono ~ '^[0-9]{6,15}$'),
  estado text not null default 'sospechoso' check (estado in ('sospechoso', 'confirmado', 'descartado')),
  motivo text,
  fuente text,
  fuente_url text,
  reportado_por text,
  nombre text,
  direcciones text,
  veces integer not null default 1,
  avisado boolean not null default false,
  visto timestamptz,
  historial jsonb not null default '[]'::jsonb,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index if not exists crm_sospechosos_avisado on public.crm_sospechosos (avisado) where not avisado;

alter table public.crm_sospechosos enable row level security;
revoke all on public.crm_sospechosos from anon, authenticated;

-- Semilla (20-oct). Confirmados: los que reportó el propio equipo. Sospechosos: la lista que circula en el grupo
-- de gestores/mensajeros (Dario, 15-oct), sin comprobar.
insert into public.crm_sospechosos (telefono, estado, motivo, fuente, reportado_por, direcciones, avisado) values
  ('56280375', 'confirmado', 'Paga con billetes falsos de 100 USD y da direcciones falsas (una mujer y un hombre con el mismo número).', 'incidencia 20-oct 13:35 y privado 17:35', 'gestora …3588', 'Virtudes entre Misionero y Hospital (dirección falsa que dieron)', true),
  ('51249823', 'confirmado', 'Clienta de la bici del pedido #4220: escribía desde este número, dejó de contestar (estafa).', 'incidencia 20-oct 14:02, pedido #4220', 'Cary (gestora)', null, true),
  ('52579138', 'confirmado', 'Clienta de la bici del pedido #4220: llamaba desde este número; reportada en redes como estafadora.', 'incidencia 20-oct 14:02, pedido #4220', 'Cary (gestora)', null, true),
  ('59495089', 'confirmado', 'Asaltaron a un mensajero que fue a una entrega pedida desde este número.', 'privado 06-oct 18:32', 'equipo', null, true),
  ('50738208', 'confirmado', 'Estafó a un gestor.', 'grupo de gestores 12-oct y 15-oct', 'equipo', null, true),
  ('59285221', 'sospechoso', 'En la lista de estafadores que circula en el grupo.', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Revillagigedo #352 / Puerta Cerrada y Diaria, Habana Vieja', true),
  ('13054871997', 'sospechoso', 'En la lista de estafadores que circula en el grupo (nombre: Jessica).', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Salud / Manrique y Campanario, apto 2 alto', true),
  ('51113330', 'sospechoso', 'En la lista de estafadores que circula en el grupo (nombre: Maykel Luar González; también da el 86081829183).', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Carmen #514 / Juan Delgado y Goicuría, 10 de Octubre (Mónaco)', true),
  ('58128676', 'sospechoso', 'En la lista de estafadores que circula en el grupo (también aparece como 5812867).', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'San Rafael #1214 / Ronda y Mazón', true),
  ('59423367', 'sospechoso', 'En la lista de estafadores que circula en el grupo.', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Marianao, El Palmar, Calle 128B #10114 / 103 y Autopista', true),
  ('55975595', 'sospechoso', 'En la lista de estafadores que circula en el grupo.', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Marianao, El Palmar, Calle 128B #10114 / 103 y Autopista', true),
  ('53811487', 'sospechoso', 'En la lista de estafadores que circula en el grupo.', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Calle San José #74 / San Gregorio y Flores, Centro Habana', true),
  ('58041107', 'sospechoso', 'En la lista de estafadores que circula en el grupo.', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Carretera Santa María del Rosario km 7½ #731, Villa María, Guanabacoa', true),
  ('15025915719', 'sospechoso', 'En la lista de estafadores que circula en el grupo.', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Carretera Santa María del Rosario km 7½ #731, Villa María, Guanabacoa', true),
  ('3200572', 'sospechoso', 'En la lista de estafadores que circula en el grupo (teléfono fijo).', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Calzada de 10 de Octubre #429 / Luyanó y San Nicolás', true),
  ('56581018', 'sospechoso', 'En la lista de estafadores que circula en el grupo.', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'San Miguel / Amistad e Industria, Centro Habana', true),
  ('53119918', 'sospechoso', 'Alias «Caramelo»: publica equipos falsos y no paga a los gestores.', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Neptuno y Lealtad', true),
  ('55875242', 'sospechoso', 'En la lista de estafadores que circula en el grupo.', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Calle 6ta #177 apto 2 / Fomento y Lindero, Palatino, Cerro', true),
  ('56140770', 'sospechoso', 'En la lista de estafadores que circula en el grupo.', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Consulado y Colón', true),
  ('58410642', 'sospechoso', 'En la lista de estafadores que circula en el grupo.', 'grupo 120363406059938006@g.us (Dario, 15-oct)', 'Dario', 'Luz Caballero #18103 / Rafael de Cárdenas y B, San Miguel del Padrón', true)
on conflict (telefono) do nothing;
