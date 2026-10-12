<?php
// SOLO LECTURA. Lee precios, comisiones por producto y tasas de casaviva.company.
// Uso: ssh <hostinger> 'cd ~/domains/casaviva.company/public_html && wp eval-file -' < scripts/precios/leer-web.php > datos/web.json
// No llama a ninguna función que escriba (nada de update_*, save, delete).
$out = array(
	'fetched_at' => gmdate( 'c' ),
	'cvd_default_commission_rate' => get_option( 'cvd_default_commission_rate', null ),
	'cvd_daily_rates' => get_option( 'cvd_daily_rates', null ),
	'products' => array(),
);
$ids = get_posts( array( 'post_type' => array( 'product', 'product_variation' ), 'post_status' => array( 'publish', 'private', 'draft', 'pending' ), 'numberposts' => -1, 'fields' => 'ids' ) );
foreach ( $ids as $id ) {
	$p = wc_get_product( $id );
	if ( ! $p ) { continue; }
	$out['products'][] = array(
		'id' => $id,
		'parent_id' => $p->get_parent_id(),
		'type' => $p->get_type(),
		'status' => get_post_status( $id ),
		'name' => $p->get_name(),
		'price' => $p->get_price(),
		'regular_price' => $p->get_regular_price(),
		'sale_price' => $p->get_sale_price(),
		'commission_type' => get_post_meta( $id, '_cvd_commission_type', true ),
		'commission_value' => get_post_meta( $id, '_cvd_commission_value', true ),
	);
}
echo wp_json_encode( $out );
