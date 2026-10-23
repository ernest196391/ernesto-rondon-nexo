<?php
/**
 * 23-oct-2026 · Mercancía de Nana (pedido de Lennys 10:13–10:23 Cuba).
 * Los 4 productos YA existían: Lennys los creó en su panel el 20-oct (22:30–22:41) y los ocultó.
 * Aquí se ponen a la venta con sus precios de hoy, comisión FIJA de gestora, costo, nota de consignación
 * y descripción corta. No se borra nada; antes se guarda una copia en ~/bak-20261023-nana-antes.json.
 *
 * Uso: wp eval-file publicar-nana.php            (prueba en seco: solo dice qué cambiaría)
 *      wp eval-file publicar-nana.php hacer [ID_FOTO_COMPRESOR]
 */
defined( 'ABSPATH' ) || exit;
$hacer = in_array( 'hacer', $args ?? array(), true );
$foto_specs = 0;
foreach ( $args ?? array() as $a ) { if ( ctype_digit( (string) $a ) ) { $foto_specs = (int) $a; } }

$nota = 'Nana (23-oct, por Lennys) · precio fijado por ella para no estancar su mercancía · la ganancia de la tienda va a gastos fijos';
$items = array(
	4896 => array(
		'name' => 'Compresor de aire portátil CUPSHE F8801 con pantalla digital',
		'price' => 42, 'gestora' => 5, 'tienda' => 7, 'cost' => 30, 'cat' => 'Movilidad', 'sku' => 'nx-119',
		'excerpt' => '<p>Compresor de aire portátil y recargable CUPSHE, modelo F8801. Pantalla digital con la presión; se fija la presión y para solo al llegar. Modos para carro, moto, bicicleta y balón. Trae boquillas, cable de carga y bolsa.</p>',
		'content' => '<p><strong>Compresor de aire portátil CUPSHE F8801</strong></p>'
			. '<p>Inflador recargable con pantalla digital para neumáticos de carro, moto y bicicleta, balones y otros inflables.</p>'
			. '<p><strong>Lo que dice la caja</strong></p><ul>'
			. '<li>Se fija la presión y se detiene solo al llegar.</li>'
			. '<li>Mide y enseña la presión en la pantalla digital.</li>'
			. '<li>Luz de trabajo y luz intermitente de 3 colores.</li>'
			. '<li>Modos: carro (2,50 bar), moto (2,40 bar), bicicleta (45 PSI), balón (8 PSI) y personalizado.</li>'
			. '<li>Batería de litio 7,4 V (1800 mAh × 2). Carga por USB tipo C (5 V / 1 A), de 3 a 5 horas.</li>'
			. '<li>Salida USB 5 V / 2 A. Potencia 80 W. Caudal 19 L/min.</li>'
			. '<li>Tamaño: 12,8 × 7,8 × 5,2 cm.</li></ul>'
			. '<p><strong>Incluye</strong> (según la foto de la caja): compresor, cable de carga, boquillas, manual y bolsa de tela.</p>',
	),
	4902 => array(
		'name' => 'Bocina Bluetooth portátil T&G TG-157 con luces LED',
		'price' => 50, 'gestora' => 4, 'tienda' => 5, 'cost' => 41,
		'excerpt' => '<p>Bocina Bluetooth portátil T&amp;G, modelo TG-157, color turquesa, con luces LED de colores y cordón para llevarla. Recargable; trae cable de carga.</p>',
	),
	4908 => array(
		'name' => 'Tira de luces LED RGB de 10 metros con control remoto',
		'price' => 27, 'gestora' => 3, 'tienda' => 4, 'cost' => 20,
		'excerpt' => '<p>Tira de luces LED de colores (RGB) de 10 metros, con control remoto y conexión USB. Trae el rollo de luces, el control y el controlador con cable USB.</p>',
	),
	4913 => array(
		'name' => 'Lámpara LED recargable de escritorio con portalápices',
		'price' => 26, 'gestora' => 3, 'tienda' => 4, 'cost' => 19, 'sin_numero' => true,
		'excerpt' => '<p>Lámpara LED recargable de escritorio, blanca, con brazo flexible y base con dos compartimentos para lápices y bolígrafos.</p>',
	),
);

$bak = array();
$out = array();
foreach ( array_keys( $items ) as $id ) {
	$p = wc_get_product( $id );
	if ( ! $p ) { continue; }
	$bak[ $id ] = array(
		'post' => get_post( $id, ARRAY_A ),
		'meta' => get_post_meta( $id ),
		'cats' => wp_get_post_terms( $id, 'product_cat', array( 'fields' => 'names' ) ),
		'visibility' => $p->get_catalog_visibility(),
	);
}
if ( $hacer ) {
	$file = getenv( 'HOME' ) . '/bak-20261023-nana-antes.json';
	if ( ! file_exists( $file ) ) { file_put_contents( $file, wp_json_encode( $bak, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) ); }
	if ( ! file_exists( $file ) ) { echo "No se pudo guardar la copia: no se cambia nada.\n"; return; }
	$out[] = "Copia: $file";
}
foreach ( $items as $id => $d ) {
	$p = wc_get_product( $id );
	if ( ! $p ) { $out[] = "#$id NO EXISTE"; continue; }
	$antes = sprintf( '%s | %s | %s USD | stock %s | com %s %s | costo %s', $p->get_status(), $p->get_name(), $p->get_regular_price(),
		$p->managing_stock() ? $p->get_stock_quantity() : 'sin control', $p->get_meta( '_cvd_commission_type' ), $p->get_meta( '_cvd_commission_value' ), $p->get_meta( '_cvd_cost_usd' ) );
	$out[] = "#$id ANTES: $antes";
	$out[] = sprintf( '#%d DESPUÉS: publish | %s | %d USD | gestora fija %d | costo %d (Nana) | tienda %d%s', $id, $d['name'], $d['price'], $d['gestora'], $d['cost'], $d['tienda'], ! empty( $d['sin_numero'] ) ? ' | stock: en existencia SIN número (falta la cantidad)' : '' );
	if ( ! $hacer ) { continue; }

	$p->set_name( $d['name'] );
	$p->set_regular_price( wc_format_decimal( $d['price'], 2 ) );
	$p->set_sale_price( '' );
	$p->set_short_description( $d['excerpt'] );
	if ( isset( $d['content'] ) ) { $p->set_description( $d['content'] ); }
	if ( isset( $d['sku'] ) ) { $p->set_sku( $d['sku'] ); }
	if ( isset( $d['cat'] ) ) {
		$t = get_term_by( 'name', $d['cat'], 'product_cat' );
		if ( $t ) { $p->set_category_ids( array( (int) $t->term_id ) ); }
	}
	if ( ! empty( $d['sin_numero'] ) ) {
		$p->set_manage_stock( false );
		$p->set_stock_status( 'instock' );
	}
	// «Volver a vender» igual que el panel (CVD_Panel_Bridge::put_on_sale): la retención la puso «Ocultar» (hold=false).
	$p->set_status( 'publish' );
	$p->set_catalog_visibility( 'visible' );
	$p->delete_meta_data( '_cvd_retired' );
	$p->delete_meta_data( '_cvd_hold' );
	$p->delete_meta_data( '_cvd_sync_hidden_from' );
	// Comisión fija de la gestora, costo (= lo que se le paga a Nana) y nota de consignación (como Ely, 3893).
	$p->update_meta_data( '_cvd_commission_type', 'fixed' );
	$p->update_meta_data( '_cvd_commission_value', wc_format_decimal( $d['gestora'], 2 ) );
	$p->update_meta_data( '_cvd_cost_usd', wc_format_decimal( $d['cost'], 2 ) );
	$p->update_meta_data( '_cvd_cost_source', 'manual' );
	$p->update_meta_data( '_cvd_cost_updated_at', gmdate( 'c' ) );
	$p->update_meta_data( '_cvd_consignacion', $nota );
	$p->update_meta_data( '_cvd_admin_note', sprintf( 'Mercancía de Nana. Precio %d fijado por ella (Lennys 23-oct 10:23). Costo %d = para Nana · tienda %d (a gastos fijos) · gestora %d.', $d['price'], $d['cost'], $d['tienda'], $d['gestora'] ) );
	if ( 4896 === $id ) {
		// Restos de la copia de la tabla de planchar 4894 (BizneCubano y códigos repetidos).
		foreach ( array( '_cvd_biznecubano_url', '_cvd_biznecubano_synced_at', '_cvd_bc_image' ) as $k ) { $p->delete_meta_data( $k ); }
		if ( $foto_specs ) {
			$g = $p->get_gallery_image_ids();
			if ( ! in_array( $foto_specs, $g, true ) ) { $g[] = $foto_specs; }
			$p->set_gallery_image_ids( $g );
		}
	}
	$p->save();
	if ( 4896 === $id ) {
		delete_post_meta( $id, '_cvd_inventory_code' );
		add_post_meta( $id, '_cvd_inventory_code', 'CV-4896' );
	}
	wc_delete_product_transients( $id );
	$out[] = "#$id HECHO → " . get_permalink( $id );
}
echo implode( "\n", $out ) . "\n";
