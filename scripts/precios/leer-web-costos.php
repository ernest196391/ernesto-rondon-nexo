<?php
// SOLO LECTURA (14-oct). Productos y variantes de casaviva.company con precio, comisión, SKU, costo de Core
// (_cvd_cost_usd, si ya existe) y unidades vendidas en los últimos 90 días (pedidos no cancelados).
// Uso: ssh <hostinger> 'cd ~/domains/casaviva.company/public_html && wp eval-file -' < scripts/precios/leer-web-costos.php > web-costos.json
global $wpdb;
$out = array(
	'fetched_at' => gmdate( 'c' ),
	'cvd_default_commission_rate' => get_option( 'cvd_default_commission_rate', null ),
	'products' => array(),
);
$sold = array();
$rows = $wpdb->get_results(
	"SELECT l.product_id, l.variation_id, SUM(l.product_qty) qty
	   FROM {$wpdb->prefix}wc_order_product_lookup l
	   JOIN {$wpdb->prefix}wc_order_stats s ON s.order_id = l.order_id
	  WHERE s.status IN ('wc-completed','wc-processing','wc-on-hold') AND l.date_created >= DATE_SUB(NOW(), INTERVAL 90 DAY)
	  GROUP BY l.product_id, l.variation_id"
);
foreach ( (array) $rows as $r ) {
	$id = (int) $r->variation_id ?: (int) $r->product_id;
	$sold[ $id ] = ( $sold[ $id ] ?? 0 ) + (int) $r->qty;
}
$ids = get_posts( array( 'post_type' => array( 'product', 'product_variation' ), 'post_status' => array( 'publish', 'private', 'draft', 'pending' ), 'numberposts' => -1, 'fields' => 'ids' ) );
foreach ( $ids as $id ) {
	$p = wc_get_product( $id );
	if ( ! $p ) { continue; }
	$parent = $p->get_parent_id() ? get_post( $p->get_parent_id() ) : null;
	$out['products'][] = array(
		'id' => $id,
		'parent_id' => $p->get_parent_id(),
		'parent_status' => $parent ? $parent->post_status : null,
		'type' => $p->get_type(),
		'status' => get_post_status( $id ),
		'visibility' => $p->is_type( 'variation' ) ? null : $p->get_catalog_visibility(),
		'stock_status' => $p->get_stock_status(),
		'name' => $p->get_name(),
		'sku' => $p->get_sku(),
		'price' => $p->get_price(),
		'regular_price' => $p->get_regular_price(),
		'sale_price' => $p->get_sale_price(),
		'commission_type' => get_post_meta( $id, '_cvd_commission_type', true ),
		'commission_value' => get_post_meta( $id, '_cvd_commission_value', true ),
		'market_item_id' => get_post_meta( $id, '_cvd_market_item_id', true ),
		'nexo_product_id' => get_post_meta( $id, '_cvd_nexo_product_id', true ),
		'cost_usd' => get_post_meta( $id, '_cvd_cost_usd', true ),
		'cost_source' => get_post_meta( $id, '_cvd_cost_source', true ),
		'sold_90d' => $sold[ $id ] ?? 0,
	);
}
echo wp_json_encode( $out );
