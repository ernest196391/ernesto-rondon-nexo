-- APPLIED IN STEPS on 2026-10-04 (the single run timed out): structure +
-- functions as below; rows loaded into a temporary import_staging table; scores
-- precomputed once; then the classification below. Afterwards every imported
-- row scoring < 0.85 was moved back to needs_review and its new cost removed.
-- Result: 43 imported (51 products with variants, 15 with owner), 135 to
-- review, 128 not on the website.
-- One-off import of Casa Viva's Excel costs (hoja "1") and merchandise owners,
-- with a review list for whatever is not certain. See HANDOFF section 9.
-- * import_review keeps every Excel row with its match and status:
--   imported (cost written), needs_review (owner must confirm), not_found.
-- * Matching: word overlap (Dice) of normalized names against products and
--   variant groups; a group match sets the cost on every variant.
-- * Safe rule: score >= 0.75, a single best candidate, not 'DEFECTO', no other
--   Excel row claiming the same product, and the product has no cost yet.
CREATE TABLE IF NOT EXISTS nexo_business.import_review (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_row INT NOT NULL,
  excel_name TEXT NOT NULL,
  purchase_usd NUMERIC(14, 2),
  freight_usd NUMERIC(14, 2),
  commission_usd NUMERIC(10, 2),
  owner_name TEXT,
  product_id TEXT,
  product_name TEXT,
  score NUMERIC(4, 2),
  status TEXT NOT NULL CHECK (status IN ('imported', 'needs_review', 'not_found', 'resolved', 'ignored')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  UNIQUE (business_id, source, source_row)
);
ALTER TABLE nexo_business.import_review ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON nexo_business.import_review FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION nexo_business.name_words(p TEXT)
RETURNS TEXT[] LANGUAGE sql IMMUTABLE SET search_path = '' AS $f$
  -- Lower case, no accents, sizes kept together (40 x 60 -> 40x60), split words
  -- joined (sobre cama -> sobrecama), plurals to singular; owner tags dropped.
  SELECT coalesce(array_agg(DISTINCT CASE WHEN w ~ '^[a-z]{5,}s$' THEN left(w, -1) ELSE w END), '{}')
    FROM unnest(regexp_split_to_array(
      regexp_replace(regexp_replace(regexp_replace(regexp_replace(
        translate(lower(coalesce(p, '')), 'áéíóúüñ×', 'aeiouunx'),
        '([0-9])[^a-z0-9]*x[^a-z0-9]*([0-9])', '\1x\2', 'g'),
        'sobre cama', 'sobrecama', 'g'), 'tapa sol', 'tapasol', 'g'),
        '[^a-z0-9]+', ' ', 'g'), ' ')) w
   WHERE (length(w) > 2 OR w ~ '[0-9]') AND w <> ''
     AND w NOT IN ('dayra', 'day', 'maryta', 'nana', 'joyce', 'ensueno', 'defect', 'defecto', 'defet',
       'con', 'para', 'los', 'las', 'del', 'nuevas', 'nuevo', 'nueva', 'diseno', 'colores', 'color', 'pza', 'mts');
$f$;

CREATE OR REPLACE FUNCTION nexo_business.name_score(a TEXT[], b TEXT[])
RETURNS NUMERIC LANGUAGE sql IMMUTABLE SET search_path = '' AS $f$
  SELECT CASE WHEN cardinality(a) + cardinality(b) = 0 THEN 0
    ELSE 2.0 * (SELECT count(*) FROM unnest(a) x WHERE x = ANY (b)) / (cardinality(a) + cardinality(b)) END;
$f$;

DO $do$
DECLARE
  v_rows JSONB := '[[3,"Paños de cortina de tela black out (2)",19.28,0,2,null],[4,"bolas 6cm 12 piezas varioss colores",4.55,0,1,null],[5,"Colador plegable de silicona",3.5,0,1,null],[6,"arbolito decorativo",5.63,0,1,null],[7,"Adorno navidad forma casa",4.3,0,1,null],[8,"adorno de navidad cartel",2.5,0,1,null],[9,"adorno de navidad arbol cartel",3.85,0,1,null],[10,"Alfombra de chenilla",4,0,2,"Dayra"],[11,"alfombra de cocina engomada",6.74,0,2,null],[12,"estante de 2 niveles para cocina",12.95,0,2,null],[13,"ESPEJO",23,0,3,null],[14,"Canasta Plastica set 4 pcs",20,0,5,null],[15,"CANASTA GRANDE",9.2,0,1,null],[16,"Organizador plastico  4 pisos",7,0,2,null],[17,"Bata de Bano Lisa",13.2,0,2,null],[18,"Set  de cuchillos mas utencilios silicona 19 pcs",26,0,2,null],[19,"COLCHON  180X200  DAWANG",214,0,20,null],[20,"ESPEJO",20,0,2,null],[21,"CARRITO DE METAL CON RUEDAS",15,0,2,null],[22,"TOALLERO PLEGABLE",14,0,2,null],[23,"CESTO DE BASURA TAPA BASCULANTE 12 L",3,0,1,null],[24,"ESTANTE PARA LAVADORA",12,0,2,null],[25,"SET DE 2 ALMOHADAS",8.4,0,2,null],[26,"MUEBLE ZAPATERA DE 10 NIVELES",16,0,3,null],[27,"RELOJ DE PARED  20 WE",20,0,3,null],[28,"CESTO DE BASURA PEDAL Y PUSH",5,0,2,null],[29,"SARTEN DE 16  CM",7.735849056603773,0,2,null],[30,"SARTEN DE 20 CM",8.49056603773585,0,2,null],[31,"SARTEN DE 24 CM",8.867924528301886,0,2,null],[32,"SARTEN DE 28 CM",9.245283018867925,0,2,null],[33,"SARTEN 28 CM DEFECTO",8.49056603773585,0,2,null],[34,"ESPUMADERA",3.3962264150943398,0,1,null],[35,"TOALLERO PLEGABLE DEFECT",14,0,2,null],[36,"JUEGO DE OLLAS  DEFECT ENSUENO",30,0,3,null],[37,"UTENSILIOS SILICONA DEFET",26,0,1,null],[38,"ORGAN 2 NIVELES DAY DEFECT",6.5,0,1,"Dayra"],[39,"CLOSET GAVETA DAYRA DEFET",21,0,2,"Dayra"],[40,"CORTINERO PLATEADO DEFECT",4.5,0,1,null],[41,"ESCRITORIO DE 2 GAVETAS",80,0,15,null],[42,"ESCRITORIO DE 1 GAVETA",90,0,15,null],[43,"MUEBLE ZAPATERA DE 10 NIVELES",23,0,4,null],[44,"ESQUINERO DE BAÑO",10,0,2,null],[45,"PARAGUAS DE NÑA 55CM,8H",1.08225,0,2,null],[46,"CARTERA RIÑONERA HOMBRE 36X14 CM",1.2874999999999999,0,2,null],[47,"SET DE UTENCILIOS DE COCINA 5 PZA",1.675,0,2,null],[48,"SOMBRILLA RECTANGULAR PARA AUTOS",3.55,0,2,null],[49,"CINTA DE LUCES BLUETOOH CON RGB 5M",6.5,0,4,null],[50,"MOCHILAS GORDER SENCILLAS",9,0,3,null],[51,"MOCHILAS GORDER CON CABLE  Y AUDIFONOS",9,0,2,null],[52,"MOCHILAS  BOLSITA",9,0,1,null],[53,"MOCHILA  GORDER MEDIANA (MUJER)",9,0,3,null],[54,"PORTAFOLIO GORDER MOCHILA",9,0,3,null],[55,"PESA ELECTRONICA CRISTAL 180KG",16.665,0,5,null],[56,"ARBOL DE NAVIDAD PVC 1.50 MTS",17.849999999999998,0,4,null],[57,"CAPAS DE MOTO L 2 METROS",13.25,0,2,null],[59,"Sobre caMa queen",29,0,3,null],[60,"Sobre cama Full",28,0,2,null],[61,"Sobre cama King",31,0,4,null],[62,"Colcha full Queen 180 X 220",12,0,1,null],[63,"Sabana TWIN",9.9,0,1,null],[64,"Sabana Queen",14,0,3,null],[65,"Sabana King",17,0,3,null],[66,"Alfombra de peluche 40X60",5,0,1,null],[67,"Alfombra de gusanito",5,0,1,null],[68,"Edredon queen BOUTAQUEX",30,0,5,null],[69,"PROTECTOR DE COLCHON QUEEN",24,0,4,null],[70,"Toalla Blanca 100% algodon 70 X130",10,0,2,null],[71,"Toalla blanca de piso",7,0,1,null],[72,"Doyle METALIZADO",9,0,1,null],[73,"Doyle con porta vasos",7,0,1,null],[74,"Alfombra de peluche 80X50",6,0,1,null],[75,"Alfombra de baño 3 p ENSUENO",10,0,2,null],[76,"Lampara recargable  PORTATIL redonda",19.5,0,3,null],[77,"lampara recargable con base",10,0,2,null],[78,"Cortina tapasol royale LISAS",18,0,3,null],[79,"Cortina tapasol royale con diseño DORADO",21,0,3,null],[80,"BOTELLA TERMICA",12,0,1,null],[81,"SOBRE CAMA TWIN",25,0,2,null],[82,"ALFOMBRA 40X60 ROMBO",5,0,1,null],[83,"PROTECTOR DE COLCHON TWIN",17,0,2,null],[84,"FUNDAS DE ALMOHADAS BLANCAS 2 FUNDAS  (2.50 )",5,0,1,null],[85,"EXPRIMIDOR DE LIMON CHIQUITO",1.5,0,1,null],[86,"RAYADOR 8 ¨ 4 CARAS",2.5,0,1,null],[87,"LINTERNA LAMPARA LED PEQUENA",4.5,0,1,null],[88,"LINTERNA LAMPARA LED GRANDE",5.5,0,1,null],[89,"CESTO BASURA 10 LTS REDONDO",10,0,1,null],[90,"TOHALLITAS HUMEDAS(60)",2,0,1,null],[91,"HELECHO PLANTA ARTIFCIAL",3,0,1,null],[92,"GIRASOL PLANTA ARTIFICIAL",2.9,0,1,null],[93,"CALDERO 26 mm",30,0,2,null],[94,"MANTEL RECTANGULAR",10,0,2,null],[95,"FORRO DE SILLA Y MESA",40,0,7,null],[96,"CORTINA TAPASOL TEKKO",18,0,4,null],[97,"VASO DE 3PC GRANDE VIDRIO",4.5,0,1,null],[98,"VASO DE 3 PC PEQUEÑO VIDRIO",3,0,1,null],[99,"ADORNO FUENTE DE CERAMICA",25,0,4,null],[100,"BUCARO DE CERAMICA BLANCO",8,0,2,null],[101,"FLORES ARTIFICIALES LAVANDA",8,0,2,null],[102,"MATA 28 CM MENTA",8,0,2,null],[103,"MATA ARTIFICIAL SUCULENTA",6,0,2,null],[104,"COLADOR DE METAL",2,0,1,null],[105,"TERMO 1 L",10.2,0,2,null],[106,"ESCURRIDOR DE METAL",25,0,2,null],[107,"CESTA MIMBRE",5,0,1,null],[108,"FORRO COJIN PELUCHE 24-2",4,0,1,null],[109,"FORRO COJIN GRIS-BLANCO 24-6",4,0,1,null],[110,"FORRO COJIN LISTON DORADOFS-10 RL 24-3",4,0,1,null],[111,"FORRO COJIN RUGOSO",4,0,1,null],[112,"JUEGO DE TAZAS 12 PCS",7,0,2,null],[113,"SET DE BAÑO 15 PC CESTICA VIEJO",15,0,2,null],[114,"FLORERO VIDRIO",10,0,1,null],[115,"MANTELES REDONDOS",10,0,2,null],[116,"RELLENO COJIN",3,0,1,null],[117,"ALMOHADAS",10,0,2,null],[118,"TOALLA DE COLORES 100%A CISNE BLANCO",10,0,2,null],[119,"EDREDON QUEEN ENTERO+JUEGO DE SABANAS",30,0,2,null],[120,"EDREDON KING ENTERO",38,0,3,null],[121,"CORTINA DE BANO AB0669",5,0,1,null],[122,"CORTINA DE BANO A-03H",4.1,0,1,null],[123,"ALFOMBRA 180X200",40,0,5,null],[124,"ALFOMBRA 180 REDONDA",40,0,5,null],[125,"TOALLA MAGESTIC COLORES",10,0,2,null],[126,"SET POZUELO DE 5 PIEZAS-JAGUAR",6,0,1,null],[127,"JARRA DE VIDRIO 1.3 LT",5,0,1,null],[128,"PROTECTOR DE COLCHON FULL",22,0,4,null],[129,"CORTINERO METAL DECORATIVO 1.20",5,0,2,null],[130,"LAVADORA MILEXUS 7 KG",160,5,5,null],[131,"LICUADORA MLD 999 MILEXUS",25,0,2,null],[132,"LICUADORA DE VIDRIO MILEXUS 602",30,0,2,null],[133,"REVESTIMIENTO CERAMIUCO INCEFRA (2.32M)",28,0,3,null],[134,"JUEGO DE OLLAS DE INDUCCION",30,0,7,null],[135,"CORTINA DECORATIVA VIENNA",15,0,3,null],[136,"COCINA DE GAS DE MESA 2 HORNILLAS",22,0,4,null],[137,"BOCINA GRANDE",160,0,5,null],[138,"BOCINA  PEQUENA",140,0,5,null],[139,"COBIJA NAVIDENA",10,0,1,null],[140,"EDREDON FULL DISENO BOUTAQUEX",25,0,5,null],[141,"TOALLA DE MANO COLORES 40 X 75",5,0,1,null],[142,"TOALLA DE MANO BLANCA 40 X 75",5,0,1,null],[143,"CORRAL CUNA DE BEBE 11490",130,0,10,null],[144,"CORRAL CUNA DE BEBE 11491",130,0,10,null],[145,"CORRAL DE BEBE 11494",80,0,8,null],[146,"VENTILADOR RECARGABLE MILEXUS 16 ¨",40,0,5,null],[148,"VENTILADOR RECARGABLE F6",60,0,4,null],[149,"SOPORTE  DE TV 40X80 ENSUEÑO",25,0,5,null],[150,"TENDEDERO DE ROPA 4495",40,0,5,null],[151,"COLGADOR DE ROPA HG 4716",30,0,4,null],[152,"SABANAS FULL   COLORES",12,0,4,null],[153,"CORTINA ROLLER ENROLLABLE 160X280",45,0,7,null],[154,"CORTINA ROLLER ENROLLABLE 172 X 280",50,0,7,null],[155,"CORTINA ROLLER ENROLLABLE 140X280",40,0,7,null],[156,"CORTINA ROLLER ENROLLABLE 100 X 160",35,0,7,null],[157,"ALFOMBRA 120 X 180 PELUCHE NUEVAS MAGESTIC",35,0,5,null],[158,"ALFOMBRA 120 X 180 CISNE BLANCO NUEVAS",35,0,5,null],[159,"SABANAS FULL 4PC LUXURY HOME",13,0,4,null],[160,"PROTECTOR DE COLCHON FULL ACOLCHADOS SIN FUNDAS",20,0,4,null],[161,"PROTECTOR DE COLCHON QUEEN ACOLCHADOS SIN FUNDAS",24,0,4,null],[162,"PROTECTOR DE COLCHON KING ACOLCHADOS SIN FUNDAS",30,0,3,null],[163,"EDREDON FULL 5PC MAGESTIC",25,0,5,null],[164,"EDREDON QUEEN  5PC MAGESTIC",30,0,6,null],[165,"CESTO SANREMO 15LT PEDAL",15,0,1,null],[166,"CESTO SANREMO 7LT PEDAL",8,0,1,null],[167,"COLCHA 180 X 220 LUMINARIAS",15,0,3,null],[168,"COLCHA 180 X 200 RELIEVE",14,0,2,null],[169,"COLCHA 240X260 KING",18,0,2,null],[170,"BATA DE BAÑO NUEVAS",30,0,2,null],[171,"FUNDAS DE ALMOHADAS MAGESTIC(PAR)",5,0,2,null],[172,"DOYLE DE CORCHO",9,0,1,null],[173,"ALFOMBRA DE COCINA 3D ENSUEÑO",12,0,1,null],[174,"ALFOMBRA DE BAÑO 2 PIEZAS",8,0,1,null],[175,"ALFOMBRA DE ENTRADA  (45X75) ENSUEÑO",10,0,1,null],[176,"ESQUINERO DE BAÑO ENSUEÑO",18,0,3,null],[177,"CORTINA DE BAÑO CON TAPETE DE DUCHA",10,0,2,null],[178,"ALFOMBRA PIECITO 40 X 60",10,0,1,null],[179,"SET DE BAÑO 15 PC CESTICA NUEVO",20,0,3,null],[180,"Pomo peroxido de 33.8 oz",6,0,1,null],[181,"Kit shampoo y acondicionador  OGGY",4.5,0,0.7,null],[182,"Shampoo MATIZADOR",3,0,1,"Nana"],[183,"ESPUMA DE AFEITAR",3.5,0,1,"Nana"],[184,"LIMPIADOR FACIAL BLANQUEADOR VIT C",4.5,0,1,null],[185,"KIT 3 P PIEL PORCELANA HYALURONICO",14,0,1,null],[186,"KIT REJUVENECEDOR  ARROZ",19,0,1,null],[187,"KIT RETINOL CERAMIDAS",19,0,1,null],[188,"PROTECTOR SOLAR KIDS",3.5,0,1,null],[189,"PROTECTOR TERMICO BOEN",6,0,1,null],[190,"TRATAMIENTO ALISADO LUMINOLISS",12,0,2,"Nana"],[191,"PROTECTOR SOLAR  DE ZANAHORIA HAWWAIIAN TROPIC",5,0,1,"Nana"],[192,"%  ACEITE CAPILAR BATANA HOEGOA",7,0,1,"Nana"],[193,"%  BALSAMO FACIAL DE MIEL HIDRATANTE",6,0,1,null],[194,"%  ACEITE DE OLIVA ANTIESTRIAS",9,0,1,"Nana"],[195,"% LUMINOLIS",5,0,1,"Nana"],[196,"% CREMA BLANQUEADORA ZONAA SENSIBLES",7,0,1,"Nana"],[197,"% CREMA FACIAL DE COLAGENO,RETINOL,HIALURONICO",6.5,0,1,null],[198,"% CREMA FACIAL ARCILLA Y VIT C Y CURCUMA",5,0,1,null],[199,"% ACEITE CAPILAR BATANA",6.5,0,1,"Nana"],[200,"% CERA EN BARRA PARA EL CABELLO",4.5,0,1,null],[201,"% PARCHE PARA OJOS 24 K",4.5,0,1,"Nana"],[202,"% SERUM CAPILAR  EELHOE CON KERATINA Y PROTEINA",7,0,1,"Nana"],[203,"% CREMA BLANQUEADORA PARA MUSLOS Y AXILA",4.5,0,1,"Nana"],[204,"% CREMA HOYGI VIT C, CURCUMA, 5%HIALURONOCO",5.5,0,1,null],[205,"% CREMA ACLARADORA INTENSA HIPERPIGMENTACION",6.5,0,1,"Nana"],[206,"COMPRESOR PORTATIL DE AIRE  NANA",30,0,5,"Nana"],[207,"LICUADORA PORTATIL DE 380 ML NANA",20,0,3,"Nana"],[208,"RASURADORA PORTATL DE HOMBRE",8,0,2,"Nana"],[209,"DEPILADORA PORTATIL DE CEJAS NANA",5,0,1,"Nana"],[210,"MAQUINA DE PELAR  PORTATIL DE HOMBRE",15,0,3,"Nana"],[211,"DEPILADORA PORTATIL NARIZ  NANA",5,0,1,"Nana"],[212,"RASURADORA PORTATIL FACIAL NANA",6,0,1,"Nana"],[213,"PESA DIGITAL 180 KG NANA",25,0,5,"Nana"],[214,"DESCAMADORA PESCADO NANA",3,0,1,"Nana"],[215,"CABLE CARGADOR NANA",3,0,1,"Nana"],[216,"FAJAS REDUCTORAS NANA",10,0,2,"Nana"],[217,"PORTACELULAR PARA HACER DEPORTE",4,0,1,"Nana"],[218,"SHAMPOO Y ACONDICIONADOR 2 EN 1 DE COCO(MIYA)",3,0,1,null],[219,"CESTOS DE BASURA ENCIMERA",3.5,0,1,null],[220,"CABLE DE CARGA MULTIFUNCIONAL",5,0,1,null],[221,"CREMA CORRECTORA LUMINOLISS",8,0,1,null],[222,"MASAJEADOR CORPORAL NANA",45,0,2,"Nana"],[223,"MASAJEADOR FACIAL Y CUELLO NANA",40,0,4,"Nana"],[224,"COMPRESOR PORTATIL MODELO 1  NANA",35,0,4,"Nana"],[225,"PUZZLE MOVIL TELEFONO DE APRENDIZAJE",10,0,1,"Nana"],[226,"CEPILLOS ALIZADORES RECARGABLES NANA",27,0,2,"Nana"],[227,"AFEITADORA 4 EN 1 DE MUJER NANA",25,0,3,"Nana"],[228,"MAQUINA DE PELAR  RECARGABLE",17,0,2,null],[229,"POWER BANK CARITA NANA",20,0,3,"Nana"],[230,"POWER BANK PANEL SOLAR NANA",30,0,5,"Nana"],[231,"LAMPARA RECARGABLE CON PANEL SOLAR",15,0,3,null],[232,"KIT DE SKINCARE 3 PIEZAS ANTIMANCHAS",10,0,1,null],[233,"KIT DE SKINCARE 3 PIEZAS VITAMINA C",10,0,1,null],[234,"KIT DE SKINCARE 3 PIEZAS ALOE VERA",10,0,1,null],[235,"Panel Solar SKYMAX 620 W  MENSAJERIA Monocristalino BifacialENSUEÑO",190,0,15,null],[236,"ESCRITORIO DE OFICINA(30-211-02) ENSUEÑO",200,5,10,null],[237,"SILLA DE OFICINA (23-222) ENSUEÑO",65,0,5,null],[238,"CABLE FOTOVOLTAICO(03-P050)ENSUEÑO",120,0,10,null],[239,"ACEITE CORPORAL JOYCE",10,0,2.9814218695586163,"Joyce"],[240,"EDULCORANTE JOYCE",5,0,1.4907109347793082,"Joyce"],[241,"CLOSET PORTATIL 6 DIVISIONES",27,0,2,null],[242,"ALFOMBRA DECORATIVA 120X180 DAY",23,0,4,null],[243,"ALFOMBRA DECORATIVA 80X120 DAY",18,0,3,"Dayra"],[244,"ALFOMBRA CHENILLA DAY",6,0,2,"Dayra"],[245,"ALFOMBRA REDONDA DAY",18,0,3,null],[246,"Organizador 2 N BANO",10,0,1,"Dayra"],[247,"MESA  INFANTIL",10,0,1.4000000000000001,null],[248,"SET-ALMOHADAS DAY",7.5,0,2,null],[249,"CLOSET -GAVETAS DAY",38,0,3,null],[250,"SILLA DE PLAYA DX DAYRA",25,0,3,"Dayra"],[251,"CARRETON NEGRO  DAYRA",60,0,5,"Dayra"],[252,"MESA DE CAFÉ SENCILLA DAYRA",22,0,2,"Dayra"],[253,"TABLA DE PLANCHAR DAYRA",28,0,5,"Dayra"],[254,"TABLA DE PLANCHAR DAYRA DEFECTO",23,0,2,"Dayra"],[255,"BASE DE ELECTRODOMESTICOS  DAYRA",15,0,3,"Dayra"],[256,"CESTAS CON TAPA DAYRA",7,0,2,"Dayra"],[257,"CARRITO ORGANIZADOR METALICO DAYRA",28,0,2,"Dayra"],[258,"COLGADOR DE CARTERA",18,0,2,null],[259,"ESCURRIDOR PLASTICO CON ACCESORIOS DAYRA DEFECT",6,0,1,"Dayra"],[260,"COJINES DOBLES  DAYRA",17,0,1,"Dayra"],[261,"JUEGOS DE SABANAS FULL DAYRA",14,0,3,"Dayra"],[262,"SOPORTE TV 14-42 DAYRA",7,0,2,"Dayra"],[263,"SET SILICONA PARA  COCINA DAYRA",28,0,2,"Dayra"],[264,"CORTINERO DECO 1.20-2.1O  DOBLE  DAYRA",13,0,2,"Dayra"],[265,"CORTINERO DECO 48-86 PULG DAYRA 2M",10,0,2,"Dayra"],[266,"CORTINERO PLATEADO BANO DAYRA",4,0,1,"Dayra"],[267,"GAVETERO PLASTICO DAYRA",38,0,4,"Dayra"],[268,"GAVETERO BLANCO DAYRA",53,0,8,"Dayra"],[269,"GAVETERO BLANCO DAYRA DEFECTO",48,0,2,"Dayra"],[270,"SOPORTE TV 14-55 DAYRA",13,0,3,"Dayra"],[271,"TAPAS DE TAZA DE BANO DAYRA",11,0,1,"Dayra"],[272,"JUEGO DE VASO CON JARRA DAYRA",10,0,1.4,"Dayra"],[273,"SARTEN  28 CM X TAPA DAYRA",18,0,2,"Dayra"],[274,"TENDEDERO PLEGABLE PEQUEÑO DAYRA",15,0,3,"Dayra"],[275,"CESTOS DE BASURA DAYRA   PEDAL 15 LT",10,0,2,"Dayra"],[276,"ZAPATERA DE TELA DAYRA",23,0,4,"Dayra"],[277,"CARRITOS DE MANDADOS DAYRA",16,0,2,"Dayra"],[278,"SARTENES DE 24 CM DAYRA CON TAPA",12.5,0,2,"Dayra"],[279,"ORGANIZADOR DE 5 NIVELES DE TELA DAYRA",9.5,0,2,"Dayra"],[280,"SILLAS DE OFICINA SPC-9016 CABEZAL DAYRA",55,0,5,"Dayra"],[281,"SILLAS DE OFICINA SPC-9050 DAYRA",50,0,5,"Dayra"],[282,"MANGUERA  JARDIN DAYRA",55,0,4,"Dayra"],[283,"ORGANIZADOR DE BAÑO DAYRA",21,0,2,"Dayra"],[284,"ALFOMBRA GRANDE  DECOFRATIVA DE SALA  PERSA DAYRA",40,0,4,"Dayra"],[285,"PAREJA DE COJINES FORMA DE FLOR DAYRA",19,0,2,"Dayra"],[286,"PERCHA DE METAL DOBLE CON ZAPATERA DAYRA",25,0,3,"Dayra"],[287,"PERCHERO MULTIFUNCIONAL 160X36X173 DAYRA",23,0,3,"Dayra"],[288,"CORTINERO 2 METEROS DAYRA",10,0,2,"Dayra"],[289,"CORTINERO 3 METEROS DAYRA",12,0,2,"Dayra"],[290,"ZAPATERA  DE 8 NIVELES 62X120X 26  MADERA DAYRA",32,0,6,"Dayra"],[291,"FAROL SOLAR  DAYRA",7,0,2,"Dayra"],[292,"ESPEJO LED 50X70 CM DAYRA",40,0,5,"Dayra"],[293,"PUERTA DE CORREDERA GRIS DAYRA",38,0,6,"Dayra"],[294,"CAMAPE PLEGABLE GRIS DAYRA",45,0,5,"Dayra"],[295,"CESTO DE BASURA 70 LT MARYTA",20,0,2,"Maryta"],[296,"ZAPATERO MULTIFUNCIONAL CON CORTINA MARYTA",16,0,2,"Maryta"],[297,"ESTANTE DE LAVADORA MARYTA",15,0,2,"Maryta"],[298,"ESCURRIDOR CON VENTANA MARYTA",38,0,5,"Maryta"],[299,"ALFOMBRA DE ENTRADA MARYTA",5,0,1,"Maryta"],[300,"BASE DE ELECTRODOMESTICOS  MARYTA",15,0,3,"Maryta"],[301,"CORTINA BAÑO TEFLON MARYTA",8.5,0,1,"Maryta"],[302,"ALFOMBRA ANTIRRESBALANTE DE DUCHA  MARYTA",7,0,1,"Maryta"],[303,"SET DE TABLA CON CUCHILLOS MARYTA",8.5,0,1,"Maryta"],[304,"ALFOMBRA DE ENTRADA  WELCOME  MARYTA",6,0,1,"Maryta"],[305,"CARRETON NEGRO MARYTA",60,0,5,"Maryta"],[306,"ZAPATERA  DE 8 NIVELES 102X120X26 MADERA MARYTA",32,0,6,"Maryta"],[307,"FAROL SOLAR MARYTA",7,0,2,"Maryta"],[308,"ESPEJO LED 60X80 CM MARYTA",45,0,5,"Maryta"],[309,"PUERTA DE CORREDERA BLANCA MARYTA",38,0,6,"Maryta"],[310,"CAMAPE PLEGABLE GRIS MARYTA",45,0,5,"Maryta"]]'::jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM nexo_business.import_review WHERE business_id = 'casa-viva' AND source = 'excel-2026-10') THEN RETURN; END IF;

  CREATE TEMP TABLE cand ON COMMIT DROP AS
    SELECT product_id AS key, name AS label, ARRAY[product_id] AS ids, nexo_business.name_words(name) AS words
      FROM nexo_business.catalog_products WHERE business_id = 'casa-viva' AND active AND variant_of IS NULL
    UNION ALL
    SELECT variant_of, min(split_part(name, ' — ', 1)), array_agg(product_id), nexo_business.name_words(min(split_part(name, ' — ', 1)))
      FROM nexo_business.catalog_products WHERE business_id = 'casa-viva' AND active AND variant_of IS NOT NULL GROUP BY variant_of;

  CREATE TEMP TABLE src ON COMMIT DROP AS
    SELECT (r->>0)::INT AS row_n, r->>1 AS name, (r->>2)::NUMERIC AS purchase, (r->>3)::NUMERIC AS freight,
           nullif(r->>4, '')::NUMERIC AS commission, r->>5 AS owner, nexo_business.name_words(r->>1) AS words
      FROM jsonb_array_elements(v_rows) r;

  CREATE TEMP TABLE best ON COMMIT DROP AS
    SELECT DISTINCT ON (s.row_n) s.*, c.key, c.label, c.ids, round(nexo_business.name_score(s.words, c.words), 2) AS score,
           (SELECT count(*) FROM cand c2 WHERE nexo_business.name_score(s.words, c2.words) = nexo_business.name_score(s.words, c.words)) AS ties
      FROM src s CROSS JOIN cand c
     ORDER BY s.row_n, nexo_business.name_score(s.words, c.words) DESC, c.key;

  INSERT INTO nexo_business.import_review (business_id, source, source_row, excel_name, purchase_usd, freight_usd, commission_usd,
      owner_name, product_id, product_name, score, status, reason)
  SELECT 'casa-viva', 'excel-2026-10', b.row_n, b.name, round(b.purchase, 2), round(b.freight, 2), b.commission, b.owner,
         CASE WHEN b.score >= 0.45 THEN b.key END, CASE WHEN b.score >= 0.45 THEN b.label END, b.score,
         CASE WHEN b.score < 0.45 THEN 'not_found'
              WHEN b.score >= 0.75 AND b.ties = 1 AND b.name !~* 'defec|defet'
                   AND (SELECT count(*) FROM best o WHERE o.key = b.key AND o.score >= 0.75) = 1
                   AND NOT EXISTS (SELECT 1 FROM nexo_business.product_costs pc WHERE pc.business_id = 'casa-viva' AND pc.product_id = ANY (b.ids))
              THEN 'imported' ELSE 'needs_review' END,
         CASE WHEN b.score < 0.45 THEN 'No está en el catálogo de la web'
              WHEN b.name ~* 'defec|defet' THEN 'Producto con defecto: confirmar costo'
              WHEN b.ties > 1 THEN 'Varios productos parecidos'
              WHEN (SELECT count(*) FROM best o WHERE o.key = b.key AND o.score >= 0.75) > 1 THEN 'Varias filas del Excel para el mismo producto'
              WHEN b.score < 0.75 THEN 'Nombre parecido, no igual'
              WHEN EXISTS (SELECT 1 FROM nexo_business.product_costs pc WHERE pc.business_id = 'casa-viva' AND pc.product_id = ANY (b.ids)) THEN 'Ya tenía costo en Core'
         END
    FROM best b;

  INSERT INTO nexo_business.product_costs (business_id, product_id, purchase_amount, purchase_currency, purchase_rate, freight_usd, commission_usd, partner_id)
  SELECT 'casa-viva', pid, b.purchase, 'USD', 1, b.freight, b.commission,
         (SELECT p.id FROM nexo_business.people p WHERE p.business_id = 'casa-viva' AND p.kind = 'partner' AND p.full_name = b.owner)
    FROM best b JOIN nexo_business.import_review ir ON ir.business_id = 'casa-viva' AND ir.source = 'excel-2026-10' AND ir.source_row = b.row_n AND ir.status = 'imported'
    CROSS JOIN unnest(b.ids) pid
  ON CONFLICT (business_id, product_id) DO NOTHING;

  INSERT INTO nexo_business.cost_audit (business_id, subject, after)
  VALUES ('casa-viva', 'import:excel-2026-10', jsonb_build_object('imported',
    (SELECT count(*) FROM nexo_business.import_review WHERE business_id = 'casa-viva' AND source = 'excel-2026-10' AND status = 'imported')));
END;
$do$;

CREATE OR REPLACE FUNCTION public.nexo_business_import_review(p_business TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE AS $f$
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  RETURN jsonb_build_object(
    'counts', (SELECT jsonb_object_agg(status, n) FROM (SELECT status, count(*) n FROM nexo_business.import_review WHERE business_id = p_business GROUP BY 1) t),
    'items', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'row', source_row, 'excelName', excel_name, 'purchaseUsd', purchase_usd,
        'freightUsd', freight_usd, 'commissionUsd', commission_usd, 'owner', owner_name, 'productId', product_id, 'productName', product_name,
        'score', score, 'status', status, 'reason', reason) ORDER BY status, source_row)
      FROM nexo_business.import_review WHERE business_id = p_business AND status IN ('needs_review', 'not_found')), '[]'::jsonb));
END;
$f$;
REVOKE ALL ON FUNCTION public.nexo_business_import_review(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_import_review(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.nexo_business_import_resolve(p_business TEXT, p_id BIGINT, p_product TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $f$
DECLARE
  r nexo_business.import_review;
  v_ids TEXT[];
BEGIN
  IF NOT nexo_business.is_admin(p_business) THEN RETURN jsonb_build_object('error', 'forbidden'); END IF;
  SELECT * INTO r FROM nexo_business.import_review WHERE id = p_id AND business_id = p_business FOR UPDATE;
  IF NOT FOUND OR r.status NOT IN ('needs_review', 'not_found') THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Ya estaba resuelto'); END IF;
  IF p_product IS NULL THEN
    UPDATE nexo_business.import_review SET status = 'ignored', resolved_by = auth.uid(), resolved_at = now() WHERE id = p_id;
    RETURN jsonb_build_object('ok', true);
  END IF;
  SELECT array_agg(product_id) INTO v_ids FROM nexo_business.catalog_products
   WHERE business_id = p_business AND active AND (product_id = p_product OR variant_of = p_product);
  IF v_ids IS NULL THEN RETURN jsonb_build_object('error', 'invalid', 'message', 'Producto no encontrado'); END IF;
  INSERT INTO nexo_business.product_costs (business_id, product_id, purchase_amount, purchase_currency, purchase_rate, freight_usd, commission_usd, partner_id, updated_by)
  SELECT p_business, pid, r.purchase_usd, 'USD', 1, coalesce(r.freight_usd, 0), r.commission_usd,
         (SELECT p.id FROM nexo_business.people p WHERE p.business_id = p_business AND p.kind = 'partner' AND p.full_name = r.owner_name), auth.uid()
    FROM unnest(v_ids) pid
  ON CONFLICT (business_id, product_id) DO UPDATE SET purchase_amount = EXCLUDED.purchase_amount, purchase_currency = 'USD', purchase_rate = 1,
     freight_usd = EXCLUDED.freight_usd, commission_usd = EXCLUDED.commission_usd,
     partner_id = coalesce(EXCLUDED.partner_id, nexo_business.product_costs.partner_id), updated_by = EXCLUDED.updated_by, updated_at = now();
  UPDATE nexo_business.import_review SET status = 'resolved', product_id = p_product, resolved_by = auth.uid(), resolved_at = now() WHERE id = p_id;
  INSERT INTO nexo_business.cost_audit (business_id, subject, after, changed_by)
  VALUES (p_business, 'import_resolve:' || p_id, jsonb_build_object('product', p_product, 'variants', cardinality(v_ids)), auth.uid());
  RETURN jsonb_build_object('ok', true, 'variants', cardinality(v_ids));
END;
$f$;
REVOKE ALL ON FUNCTION public.nexo_business_import_resolve(TEXT, BIGINT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nexo_business_import_resolve(TEXT, BIGINT, TEXT) TO authenticated;
