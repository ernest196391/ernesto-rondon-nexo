<?php
/**
 * Tienda 42 y 23 (20-oct-2026): crea (o actualiza, si ya estaban en privado) los productos en la web, PUBLICADOS, igual que
 * el lote electro-2026-10-20 y los MK- que publica VivaBot (Core CVD_Market_Bridge::publish, p. ej. MK-1192):
 *   SKU MK-<id de crm_market_items> · «Bajo pedido» + su departamento · sin control de stock, «hay existencias» · descripción
 *   corta = aviso de bajo pedido · menu_order 10 · _cvd_market_item_id / _cvd_market_version · comisión fija
 *   (_cvd_commission_type=fixed) · costo = precio de la etiqueta (CVD_Costs, «proveedor»). El proveedor no se guarda en la web.
 * "actualizar": <id> = producto privado que ya existía (1015 batidora HB blanca, 1019 ventilador Royal, 1146 panel 120 W
 *   variable 18 V/36 V): se guarda su estado anterior en ~/bak-20261020-42y23-antes.json y se convierte en el MK- (SKU, precio,
 *   foto nueva, categorías, metas, publicado). En el variable, el precio va en cada variación y el SKU solo en el padre
 *   (las variaciones lo heredan: el pedido llega con MK-<id> y el bajo pedido lo reconoce).
 * Cada producto hecho se apunta al momento en ~/bak-20261020-42y23-creados.json.
 *
 * Uso (carpeta de WordPress):
 *   wp eval-file ~/42y23-2026-10-20/crear-productos.php ~/42y23-2026-10-20/publicar.json            → PRUEBA EN SECO
 *   wp eval-file ~/42y23-2026-10-20/crear-productos.php ~/42y23-2026-10-20/publicar.json hacer max=3 → 3 de verdad
 *   wp eval-file ~/42y23-2026-10-20/crear-productos.php ~/42y23-2026-10-20/publicar.json hacer        → el resto
 * Idempotente: lo que ya tiene su SKU MK-<id> y está publicado se salta.
 * Deshacer: creados → papelera (wp post delete <id>, SIN --force); actualizados → restaurar desde bak-…-antes.json.
 */

defined( 'ABSPATH' ) || exit( "Ejecútalo con: wp eval-file crear-productos.php publicar.json [hacer] [max=N]\n" );

$cvx_args = isset( $args ) && is_array( $args ) ? $args : array();
$cvx_do   = in_array( 'hacer', $cvx_args, true ) && ! in_array( 'dry-run', $cvx_args, true );
$cvx_file = '';
foreach ( $cvx_args as $a ) { if ( preg_match( '/\.json$/i', $a ) ) { $cvx_file = $a; } }
$cvx_max = PHP_INT_MAX;
foreach ( $cvx_args as $a ) { if ( preg_match( '/^max=(\d+)$/', $a, $m ) ) { $cvx_max = (int) $m[1]; } }
$cvx_home = rtrim( (string) getenv( 'HOME' ), '/' );
$cvx_bak  = $cvx_home . '/bak-20261020-42y23-creados.json';
$cvx_prev = $cvx_home . '/bak-20261020-42y23-antes.json';

const CVX_NOTICE = 'Producto bajo pedido: confirmamos disponibilidad en 1 hora antes de cobrar.';
const CVX_MENU   = 10;
const CVX_DEPTS  = array( 'apagones-y-energia', 'electrodomesticos', 'cocina', 'ferreteria' );
const CVX_OLD    = array( 1015 => 'NEXO-HB-BLENDER-WHITE', 1019 => 'NEXO-RA123SL', 1146 => 'NEXO-SOLAR-FOLD-120W' );

/** Regla del bot (vivabot/src/market-price.js). */
function cvx_my_price( float $cost ): float {
	if ( $cost < 60 ) { return ceil( $cost + min( 17, max( 5, $cost * 0.4 ) ) ); }
	$margin = max( 17, $cost > 300 ? $cost * 0.10 : 0 );
	return ceil( ( $cost + $margin ) / 5 ) * 5;
}
function cvx_share( float $price, float $cost ): float { return max( 0, round( ( $price - $cost ) * 0.4, 2 ) ); }
function cvx_say( string $s ): void { echo $s . PHP_EOL; }
function cvx_term( string $slug ): int { $t = get_term_by( 'slug', $slug, 'product_cat' ); return $t ? (int) $t->term_id : 0; }
function cvx_sideload( string $src, int $product_id, string $title ): int {
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';
	$tmp = wp_tempnam( basename( $src ) );
	if ( ! @copy( $src, $tmp ) ) { cvx_say( '      ⚠️ foto no copiada: ' . $src ); return 0; }
	$file = array( 'name' => sanitize_file_name( 'mercado-' . $product_id . '-' . wp_generate_password( 6, false ) . '.jpg' ), 'tmp_name' => $tmp );
	$att  = media_handle_sideload( $file, $product_id, $title );
	if ( is_wp_error( $att ) ) { @unlink( $tmp ); cvx_say( '      ⚠️ foto rechazada: ' . $att->get_error_message() ); return 0; }
	return (int) $att;
}
function cvx_snapshot( WC_Product $p ): array {
	$id = $p->get_id();
	$s = array(
		'id' => $id, 'type' => $p->get_type(), 'name' => $p->get_name(), 'slug' => $p->get_slug(), 'status' => $p->get_status(),
		'sku' => $p->get_sku( 'edit' ), 'regular_price' => $p->get_regular_price( 'edit' ), 'sale_price' => $p->get_sale_price( 'edit' ),
		'catalog_visibility' => $p->get_catalog_visibility(), 'menu_order' => $p->get_menu_order(), 'manage_stock' => $p->get_manage_stock(),
		'stock_status' => $p->get_stock_status(), 'category_ids' => $p->get_category_ids(), 'image_id' => $p->get_image_id( 'edit' ),
		'gallery_image_ids' => $p->get_gallery_image_ids( 'edit' ), 'short_description' => $p->get_short_description( 'edit' ),
		'description' => $p->get_description( 'edit' ), 'meta' => get_post_meta( $id ), 'children' => array(),
	);
	if ( $p->is_type( 'variable' ) ) {
		foreach ( $p->get_children() as $cid ) {
			$c = wc_get_product( $cid );
			if ( $c ) { $s['children'][] = array( 'id' => $cid, 'sku' => $c->get_sku( 'edit' ), 'regular_price' => $c->get_regular_price( 'edit' ), 'sale_price' => $c->get_sale_price( 'edit' ), 'status' => $c->get_status(), 'meta' => get_post_meta( $cid ) ); }
		}
	}
	return $s;
}

if ( ! is_readable( $cvx_file ) ) { cvx_say( "❌ No encuentro {$cvx_file}" ); return; }
$cvx_in = json_decode( (string) file_get_contents( $cvx_file ), true );
if ( ! is_array( $cvx_in['productos'] ?? null ) ) { cvx_say( '❌ el JSON no tiene "productos"' ); return; }
$cvx_status = 'publish' === ( $cvx_in['estado'] ?? '' ) ? 'publish' : 'draft';
$cvx_done = is_readable( $cvx_bak ) ? (array) json_decode( (string) file_get_contents( $cvx_bak ), true ) : array();
$cvx_prev_all = is_readable( $cvx_prev ) ? (array) json_decode( (string) file_get_contents( $cvx_prev ), true ) : array();
$cvx_market = cvx_term( 'bajo-pedido' );
if ( ! $cvx_market ) { cvx_say( '❌ No existe la categoría «Bajo pedido».' ); return; }

cvx_say( ( $cvx_do ? '🛠️  HACIENDO DE VERDAD' : '🔎 PRUEBA EN SECO (para hacerlo añade «hacer»)' ) . " · {$cvx_file} · estado: {$cvx_status}" . ( PHP_INT_MAX !== $cvx_max ? " · max={$cvx_max}" : '' ) );
$cvx_n = array( 'hacer' => 0, 'hecho' => 0, 'existe' => 0, 'saltado' => 0 );
$cvx_version = (int) round( microtime( true ) * 1000 );

foreach ( $cvx_in['productos'] as $i => $it ) {
	$mid   = absint( $it['market_id'] ?? 0 );
	$name  = sanitize_text_field( (string) ( $it['nombre'] ?? '' ) );
	$cost  = (float) ( $it['precio_proveedor'] ?? 0 );
	$price = (float) ( $it['precio'] ?? 0 );
	$com   = (float) ( $it['comision'] ?? 0 );
	$upd   = absint( $it['actualizar'] ?? 0 );
	$tag   = sprintf( '%3d. #%-2d MK-%-5d %s%s', $i + 1, (int) ( $it['n'] ?? 0 ), $mid, $name, $upd ? " (actualiza {$upd})" : '' );

	if ( ! $mid || '' === $name || $cost <= 0 || $price <= 0 ) { cvx_say( "{$tag}\n      ❌ saltado: faltan market_id, nombre o precios" ); $cvx_n['saltado']++; continue; }
	if ( abs( $price - cvx_my_price( $cost ) ) > 0.001 ) { cvx_say( "{$tag}\n      ❌ saltado: precio {$price} ≠ regla " . cvx_my_price( $cost ) ); $cvx_n['saltado']++; continue; }
	if ( abs( $com - cvx_share( $price, $cost ) ) > 0.011 || $com <= 0 ) { cvx_say( "{$tag}\n      ❌ saltado: comisión {$com} ≠ 40 % del margen " . cvx_share( $price, $cost ) ); $cvx_n['saltado']++; continue; }
	$photo = (string) ( ( $it['fotos'] ?? array() )[0] ?? '' );
	if ( '' === $photo || ! is_readable( $photo ) ) { cvx_say( "{$tag}\n      ❌ saltado: no encuentro la foto {$photo}" ); $cvx_n['saltado']++; continue; }

	$found = wc_get_product_id_by_sku( 'MK-' . $mid );
	if ( $found && ( ! $upd || (int) $found === $upd ) && 'publish' === get_post_status( $found ) ) { cvx_say( "{$tag}\n      ↩️ ya hecho: producto {$found} (publicado). No se toca." ); $cvx_n['existe']++; continue; }
	if ( $found && $upd && (int) $found !== $upd ) { cvx_say( "{$tag}\n      ❌ saltado: MK-{$mid} ya es el producto {$found}, no el {$upd}" ); $cvx_n['saltado']++; continue; }
	if ( $found && ! $upd ) { cvx_say( "{$tag}\n      ❌ saltado: MK-{$mid} ya existe (producto {$found}, " . get_post_status( $found ) . ')' ); $cvx_n['saltado']++; continue; }
	$old = null;
	if ( $upd ) {
		$old = wc_get_product( $upd );
		if ( ! $old || ! in_array( $old->get_sku( 'edit' ), array( CVX_OLD[ $upd ] ?? '-', 'MK-' . $mid ), true ) ) { cvx_say( "{$tag}\n      ❌ saltado: el producto {$upd} no es el esperado (SKU " . ( $old ? $old->get_sku( 'edit' ) : 'no existe' ) . ')' ); $cvx_n['saltado']++; continue; }
	}

	$depts = array();
	foreach ( (array) ( $it['departamentos'] ?? array() ) as $slug ) {
		$slug = sanitize_title( (string) $slug );
		if ( in_array( $slug, CVX_DEPTS, true ) && ( $tid = cvx_term( $slug ) ) ) { $depts[ $slug ] = $tid; }
	}
	$desc = (string) ( $it['descripcion'] ?? '' );

	cvx_say( $tag );
	cvx_say( sprintf( '      %s · precio %s USD · costo %s · gestora %s · Casa Viva %s · Bajo pedido + %s · foto %s', $upd ? 'ACTUALIZAR ' . $old->get_type() . ' «' . $old->get_name() . '» (' . $old->get_status() . ', ' . $old->get_sku( 'edit' ) . ', ' . ( $old->get_regular_price() ?: $old->get_price() ) . ' USD)' : 'CREAR', wc_format_decimal( $price, 2 ), wc_format_decimal( $cost, 2 ), wc_format_decimal( $com, 2 ), wc_format_decimal( $price - $cost - $com, 2 ), implode( ', ', array_keys( $depts ) ), basename( $photo ) ) );
	if ( ! $cvx_do ) { $cvx_n['hacer']++; continue; }
	if ( $cvx_n['hecho'] >= $cvx_max ) { cvx_say( '⏸️ tope max alcanzado: el resto, en la próxima tanda' ); break; }

	if ( $old ) {
		$cvx_prev_all[ (string) $upd ] = $cvx_prev_all[ (string) $upd ] ?? array_merge( cvx_snapshot( $old ), array( 'guardado' => gmdate( 'c' ) ) );
		file_put_contents( $cvx_prev, wp_json_encode( $cvx_prev_all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
		$p = $old;
	} else {
		$p = new WC_Product_Simple();
	}
	$p->set_name( $name );
	$p->set_sku( 'MK-' . $mid );
	if ( ! $p->is_type( 'variable' ) ) { $p->set_regular_price( wc_format_decimal( $price, 2 ) ); $p->set_sale_price( '' ); }
	$p->set_manage_stock( false );
	$p->set_stock_status( 'instock' );
	if ( ! $p->is_type( 'variable' ) ) { $p->set_backorders( 'no' ); }
	$p->set_status( $cvx_status );
	$p->set_catalog_visibility( 'visible' );
	$p->set_short_description( esc_html( CVX_NOTICE ) );
	$p->set_description( '' !== $desc ? '<p>' . nl2br( esc_html( $desc ) ) . '</p>' : '' );
	$p->set_category_ids( array_values( array_unique( array_merge( array( $cvx_market ), array_values( $depts ) ) ) ) );
	$p->set_menu_order( CVX_MENU );
	$p->update_meta_data( '_cvd_market_item_id', $mid );
	$p->update_meta_data( '_cvd_market_version', $cvx_version );
	$p->update_meta_data( '_cvd_commission_type', 'fixed' );
	$p->update_meta_data( '_cvd_commission_value', wc_format_decimal( $com, 2 ) );
	$p->delete_meta_data( '_cvd_sync_hidden_from' );
	$p->delete_meta_data( '_cvd_hold' );
	// Los privados de agosto/septiembre traen el aviso del plugin nexo-marketplace («NEXO verifica existencia y precio…»):
	// fuera, para que se vean igual que el resto de «Bajo pedido» (queda en bak-…-antes.json).
	$p->delete_meta_data( 'nexo_availability_confirmation' );
	if ( class_exists( 'CVD_Costs' ) ) { CVD_Costs::set_cost( $p, $cost, 'proveedor' ); }
	try {
		$pid = $p->save();
		if ( $p->is_type( 'variable' ) ) {
			foreach ( $p->get_children() as $cid ) {
				$v = wc_get_product( $cid );
				if ( ! $v ) { continue; }
				$v->set_regular_price( wc_format_decimal( $price, 2 ) );
				$v->set_sale_price( '' );
				$v->set_sku( '' );
				$v->set_manage_stock( false );
				$v->set_stock_status( 'instock' );
				$v->set_status( 'publish' );
				$v->save();
			}
			WC_Product_Variable::sync( $pid );
			wc_delete_product_transients( $pid );
		}
	} catch ( Throwable $e ) {
		cvx_say( '      ❌ no se pudo guardar: ' . $e->getMessage() ); $cvx_n['saltado']++; continue;
	}
	$att = cvx_sideload( $photo, $pid, $name );
	if ( $att ) {
		$p = wc_get_product( $pid );
		$p->set_image_id( $att );
		$p->set_gallery_image_ids( array() );
		$p->save();
	}
	$cvx_done[] = array( 'id' => (int) $pid, 'sku' => 'MK-' . $mid, 'market_id' => $mid, 'n' => (int) ( $it['n'] ?? 0 ), 'accion' => $upd ? 'actualizado' : 'creado', 'nombre' => $name, 'costo' => $cost, 'precio' => $price, 'comision' => $com, 'foto' => $att, 'url' => get_permalink( $pid ), 'hecho' => gmdate( 'c' ) );
	file_put_contents( $cvx_bak, wp_json_encode( $cvx_done, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
	cvx_say( '      ✅ ' . ( $upd ? 'actualizado' : 'creado' ) . ": producto {$pid} ({$cvx_status}) · " . get_permalink( $pid ) . ( $att ? '' : ' · ⚠️ SIN FOTO' ) );
	$cvx_n['hecho']++;
}

cvx_say( '' );
cvx_say( $cvx_do
	? "Hecho: {$cvx_n['hecho']}; {$cvx_n['existe']} ya estaban; {$cvx_n['saltado']} saltados."
	: "Prueba en seco: se harían {$cvx_n['hacer']}; {$cvx_n['existe']} ya están; {$cvx_n['saltado']} saltados. Nada cambiado." );
