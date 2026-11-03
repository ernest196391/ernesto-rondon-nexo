-- Triciclub · tablas nuevas en el Core de Casa Viva (WordPress, MySQL/MariaDB de Hostinger).
-- Se crean con dbDelta() desde includes/class-cvd-triciclub-db.php, igual que el resto del Core
-- ({prefix} = $wpdb->prefix . 'cvd_tc_'). Por eso:
--   * ids bigint AUTO_INCREMENT (como cvd_order_events) y un uuid público en el viaje (el cliente nunca ve el id).
--   * fechas DATETIME en UTC (current_time('mysql', true)); la app las enseña en hora de Cuba.
--   * dinero en enteros de la moneda (CUP sin centavos) + columna moneda.
--   * sin FOREIGN KEY (dbDelta no las maneja y el Core no las usa): cada relación lleva su índice y la regla
--     de borrado se cumple en PHP, escrita al lado de cada columna.
--   * los CHECK documentan los valores; la validación de verdad está en PHP (algunas MariaDB viejas los ignoran).
-- Acceso: no hay RLS en MySQL. Cada endpoint comprueba quién es (token del cliente, token de Pa'llá del chofer,
-- capacidad de administrador) antes de leer o escribir. Ver architecture.md › Acceso.

CREATE TABLE {prefix}clientes (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  telefono varchar(20) NOT NULL,              -- +53XXXXXXXX normalizado
  nombre varchar(80) NOT NULL DEFAULT '',
  verificado_at datetime NULL,                -- cuándo puso bien el código de WhatsApp
  consentimiento_at datetime NULL,            -- casilla «acepto que Triciclub me contacte» (ficha: solo con permiso)
  token_epoca int unsigned NOT NULL DEFAULT 1, -- subirla anula todos sus enlaces (como Pa'llá)
  bloqueado tinyint(1) NOT NULL DEFAULT 0,
  nota_media decimal(3,2) NULL,
  viajes_total int unsigned NOT NULL DEFAULT 0,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY telefono (telefono)
);

CREATE TABLE {prefix}choferes (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  user_id bigint(20) unsigned NOT NULL,       -- usuario de WordPress (el mismo de Pa'llá). Borrar usuario → estado 'baja', no se borra el chofer
  estado varchar(12) NOT NULL DEFAULT 'pendiente',
  vehiculo varchar(20) NOT NULL DEFAULT 'triciclo_electrico',
  numero varchar(12) NOT NULL DEFAULT '',     -- número visible del triciclo (S03 «Nº 0457»)
  descripcion varchar(80) NOT NULL DEFAULT '', -- «verde, con toldo»
  plazas tinyint unsigned NOT NULL DEFAULT 0,
  servicios varchar(40) NOT NULL DEFAULT 'viaje,paquete,carga',
  chapa_o_chasis varchar(40) NOT NULL DEFAULT '',
  lot_numero varchar(40) NOT NULL DEFAULT '',
  lot_vence date NULL,
  licencia_cat varchar(8) NOT NULL DEFAULT '',
  fotos longtext NULL,                        -- JSON con ids de archivos privados (cara, triciclo, LOT, licencia)
  transferencia varchar(40) NOT NULL DEFAULT '', -- su número para cobrar por transferencia
  disponible tinyint(1) NOT NULL DEFAULT 0,
  lat decimal(9,6) NULL,
  lng decimal(9,6) NULL,
  ubicado_at datetime NULL,
  nota_media decimal(3,2) NULL,
  viajes_total int unsigned NOT NULL DEFAULT 0,
  aprobado_por bigint(20) unsigned NULL,
  aprobado_at datetime NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY user_id (user_id),
  KEY disponibles (estado,disponible,ubicado_at),
  KEY lot_vence (lot_vence),
  CONSTRAINT tc_chofer_estado CHECK (estado IN ('pendiente','aprobado','suspendido','baja'))
);

CREATE TABLE {prefix}viajes (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  uuid char(36) NOT NULL,
  cliente_id bigint(20) unsigned NOT NULL,    -- cliente bloqueado o borrado: el viaje se queda (historia y dinero)
  cid varchar(40) NOT NULL,                   -- id que pone el móvil: el mismo pedido reenviado sin señal no se duplica
  chofer_id bigint(20) unsigned NULL,         -- NULL mientras busca; se pone con UPDATE … WHERE chofer_id IS NULL
  servicio varchar(10) NOT NULL,
  estado varchar(12) NOT NULL DEFAULT 'buscando',
  origen_texto varchar(160) NOT NULL,
  origen_lat decimal(9,6) NOT NULL,
  origen_lng decimal(9,6) NOT NULL,
  destino_texto varchar(160) NOT NULL,
  destino_lat decimal(9,6) NOT NULL,
  destino_lng decimal(9,6) NOT NULL,
  distancia_m int unsigned NOT NULL,
  minutos smallint unsigned NOT NULL DEFAULT 0,
  precio int unsigned NOT NULL,               -- el precio fijo que el cliente vio y aceptó
  moneda char(3) NOT NULL DEFAULT 'CUP',
  precio_origen varchar(10) NOT NULL DEFAULT 'tarifa', -- 'tarifa' o 'ofrecido' (regateo, fase 2)
  tarifa_version int unsigned NOT NULL,       -- con qué tarifas se calculó
  forma_pago varchar(14) NOT NULL DEFAULT 'efectivo',
  cobrado_at datetime NULL,
  codigo char(4) NOT NULL,                    -- código de seguridad
  nota varchar(200) NOT NULL DEFAULT '',
  recibe_nombre varchar(80) NOT NULL DEFAULT '',   -- solo Paquete
  recibe_telefono varchar(20) NOT NULL DEFAULT '', -- solo Paquete
  asignado_at datetime NULL,
  llego_at datetime NULL,
  recogido_at datetime NULL,
  terminado_at datetime NULL,
  cancelado_at datetime NULL,
  cancelado_por varchar(8) NULL,
  motivo varchar(200) NOT NULL DEFAULT '',
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY uuid (uuid),
  UNIQUE KEY cliente_cid (cliente_id,cid),
  KEY estado_fecha (estado,created_at),
  KEY chofer_estado (chofer_id,estado),
  KEY cliente_fecha (cliente_id,created_at),
  CONSTRAINT tc_viaje_servicio CHECK (servicio IN ('viaje','paquete','carga')),
  CONSTRAINT tc_viaje_estado CHECK (estado IN ('buscando','asignado','llego','recogido','terminado','cancelado','sin_chofer')),
  CONSTRAINT tc_viaje_pago CHECK (forma_pago IN ('efectivo','transferencia'))
);

CREATE TABLE {prefix}ubicaciones (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  viaje_id bigint(20) unsigned NOT NULL,      -- se borran a los 30 días (tarea nocturna), no al borrar el viaje
  chofer_id bigint(20) unsigned NOT NULL,
  lat decimal(9,6) NOT NULL,
  lng decimal(9,6) NOT NULL,
  precision_m smallint unsigned NULL,
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY viaje (viaje_id,id),
  KEY fecha (created_at)
);

CREATE TABLE {prefix}valoraciones (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  viaje_id bigint(20) unsigned NOT NULL,
  de varchar(8) NOT NULL,                     -- quién valora: 'cliente' o 'chofer'
  estrellas tinyint unsigned NOT NULL,
  etiquetas varchar(200) NOT NULL DEFAULT '', -- «puntual,amable»
  texto varchar(300) NOT NULL DEFAULT '',
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY viaje_de (viaje_id,de),
  CONSTRAINT tc_val_de CHECK (de IN ('cliente','chofer')),
  CONSTRAINT tc_val_estrellas CHECK (estrellas BETWEEN 1 AND 5)
);

CREATE TABLE {prefix}eventos (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  viaje_id bigint(20) unsigned NOT NULL,
  actor varchar(10) NOT NULL,                 -- cliente | chofer | sistema | admin
  actor_id bigint(20) unsigned NULL,
  tipo varchar(24) NOT NULL,                  -- pedido, cogido, llego, recogido, terminado, cobrado, cancelado, soltado, problema, re_ofrecido
  datos longtext NULL,                        -- JSON
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY viaje (viaje_id,id),
  KEY tipo_fecha (tipo,created_at)
);

-- Tarifas: no es una tabla. Opción de WordPress cvd_tc_tarifas (JSON), con versión:
-- {"version":1,"redondeo":10,"km_factor_recta":1.3,"recargo_noche":{"desde":"22:00","hasta":"06:00","cup":[A DECIDIR]},
--  "viaje":{"minimo":[A DECIDIR],"por_km":[A DECIDIR]},"paquete":{…},"carga":{…}}
-- Cada cambio sube "version" y guarda la anterior en cvd_tc_tarifas_historial.
