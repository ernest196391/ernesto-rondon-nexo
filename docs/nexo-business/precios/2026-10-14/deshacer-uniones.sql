-- DESHACER la corrección de uniones Excel → producto del 14-oct-2026 (~11:45 Cuba).
-- Pegar en Supabase (proyecto nexo-production). Vuelve las 26 filas de import_review, 6 costos y 11 comisiones de la nube
-- a como estaban antes. La web se deshace aparte con deshacer-uniones-web.php.
BEGIN;
WITH old(id, status, product_id, product_name, resolved_at) AS (VALUES
  (4,'resolved','cv-117','Cojín decorativo','2026-10-11T20:09:15.270442+00:00'),
  (7,'resolved','cv-2381','Árbol de navidad (1,50 m)','2026-10-11T20:10:37.693088+00:00'),
  (41,'resolved','cv-2589','Zapatera 5 niveles','2026-10-11T20:14:23.17805+00:00'),
  (61,'resolved','cv-2457','Edredón con juego de sabana (queen)','2026-10-11T20:15:35.062541+00:00'),
  (71,'resolved','cv-2375','Alfombra peluche 40×60 cm','2026-10-11T20:16:08.802222+00:00'),
  (73,'resolved','cv-299','Rasuradora portatil recargable','2026-10-11T20:16:15.957841+00:00'),
  (74,'resolved','cv-2469','Lámparas recargables con panel solar','2026-10-11T20:16:18.523908+00:00'),
  (86,'resolved','cv-2409','Cesto de basura encimera','2026-10-11T20:16:39.464049+00:00'),
  (93,'resolved','cv-290','Juego de cortina tapa sol Royale','2026-10-11T20:16:45.548955+00:00'),
  (102,'resolved','cv-2503','Mochila M- 1','2026-10-11T20:16:51.998563+00:00'),
  (115,'resolved','cv-695','Toallas Cisne Blanco 40×70','2026-10-11T20:16:57.097717+00:00'),
  (120,'resolved','cv-2369','Alfombra antirresbalante','2026-10-11T20:17:08.482698+00:00'),
  (122,'resolved','cv-684','Toallas pequeña','2026-10-11T20:17:11.989623+00:00'),
  (123,'resolved','cv-2545','Set de utensilios para cocina (5 piezas)','2026-10-11T20:17:13.36634+00:00'),
  (131,'resolved','cv-141','Juego de ollas','2026-10-11T20:17:16.645021+00:00'),
  (135,'resolved','cv-684','Toallas pequeña','2026-10-11T20:22:09.440714+00:00'),
  (153,'resolved','cv-2375','Alfombra peluche 40×60 cm','2026-10-11T20:22:30.65612+00:00'),
  (160,'resolved','cv-2457','Edredón con juego de sabana (queen)','2026-10-11T20:22:35.833048+00:00'),
  (163,'resolved','cv-515','Colcha navideña 180×220','2026-10-11T20:22:37.045745+00:00'),
  (166,'resolved','cv-463','Bata de baño','2026-10-11T20:22:38.256228+00:00'),
  (167,'resolved','cv-2465','Fundas (2) blancas de almohadas','2026-10-11T20:22:39.390143+00:00'),
  (171,'resolved','cv-2373','Alfombra de entrada 40×60 cm','2026-10-11T20:22:43.040289+00:00'),
  (173,'resolved','cv-2429','Cortina de baño 180×180 cm','2026-10-11T20:22:45.555713+00:00'),
  (175,'resolved','cv-2529','Set de 2 alfombras para baño','2026-10-11T20:22:49.052635+00:00'),
  (264,'needs_review','cv-278','Bucaro blanco',NULL),
  (265,'resolved','cv-278','Bucaro blanco','2026-10-13T12:12:27.635515+00:00'))
UPDATE nexo_business.import_review r SET status = old.status, product_id = old.product_id, product_name = old.product_name,
       resolved_at = old.resolved_at::timestamptz,
       resolved_by = CASE WHEN old.resolved_at IS NULL THEN NULL ELSE 'd56dd34e-f6e6-4585-8b00-cda6a6b7aef5'::uuid END,
       reason = regexp_replace(coalesce(r.reason, ''), ' · Unión equivocada quitada.*$', '')
  FROM old WHERE r.business_id = 'casa-viva' AND r.id = old.id;

WITH old(pid, amount) AS (VALUES ('cv-2381',3.85),('cv-2469',10.00),('cv-2545',6.00),('cv-278',48.00),('cv-570',15.00),('cv-572',15.00))
UPDATE nexo_business.product_costs c SET purchase_amount = old.amount, updated_at = now()
  FROM old WHERE c.business_id = 'casa-viva' AND c.product_id = old.pid;

WITH old(pid, usd) AS (VALUES ('cv-2381',1.00),('cv-2469',2.00),('cv-2529',3.00),('cv-2716',4.00),('cv-326',4.00),('cv-328',4.00),
  ('cv-330',4.00),('cv-332',4.00),('cv-334',4.00),('cv-336',4.00),('cv-338',4.00))
UPDATE nexo_business.product_commissions k SET commission_usd = old.usd, updated_at = now()
  FROM old WHERE k.business_id = 'casa-viva' AND k.product_id = old.pid;
COMMIT;
