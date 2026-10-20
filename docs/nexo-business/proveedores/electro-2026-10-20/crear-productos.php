<?php
/**
 * Crea en la web (WooCommerce) los productos de proveedor CONFIRMADOS (Sergio/Ricardo y LJH), igual que los MK- que ya
 * publica VivaBot (Core CVD_Market_Bridge::publish, p. ej. MK-1192 «Paraguas doble capa», producto 3128):
 *   SKU MK-<id de crm_market_items> · categoría «Bajo pedido» + su departamento · sin control de stock, «hay existencias»,
 *   sin reservas · descripción corta = aviso de bajo pedido · menu_order 10 · _cvd_market_item_id / _cvd_market_version ·
 *   comisión fija _cvd_commission_type=fixed / _cvd_commission_value · costo = precio del proveedor (CVD_Costs, «proveedor»).
 *   El proveedor NO se guarda en la web (igual que el puente de Core): sale de crm_market_items por el SKU.
 * Por defecto se crean en BORRADOR (o privados). 20-oct-2026: Ernesto aprobó publicarlos directamente ("estado": "publish"
 * en el JSON). Cada producto creado se apunta al momento en ~/bak-20261020-electro-creados.json (para mandarlos a la papelera
 * de una vez si hiciera falta: wp post delete $(jq -r '.[].id' ~/bak-20261020-electro-creados.json) — SIN --force = papelera).
 * «max=N» = crea como mucho N (para ir por tandas; es idempotente: lo que ya existe se salta).
 *
 * NO SE HA EJECUTADO. Uso (en el servidor, carpeta de WordPress):
 *   wp eval-file ~/electro-2026-10-20/crear-productos.php ~/electro-2026-10-20/confirmados.json            → PRUEBA EN SECO (por defecto)
 *   wp eval-file ~/electro-2026-10-20/crear-productos.php ~/electro-2026-10-20/confirmados.json dry-run    → igual, explícito
 *   wp eval-file ~/electro-2026-10-20/crear-productos.php ~/electro-2026-10-20/confirmados.json hacer      → crea de verdad
 * (wp-cli 2.12 rechaza «--dry-run» en eval-file, «unknown --dry-run parameter», también después de «--»: por eso es la
 *  palabra suelta «dry-run». Sin «hacer» SIEMPRE es prueba en seco. Probado en seco en el servidor el 20-oct: php -l OK,
 *  5 creables, MK-131 detectado como ya existente aunque el anuncio más reciente es el #1773, sin confirmar y precio mal saltados.)
 *
 * confirmados.json (lo arma armar-confirmados.mjs en el VPS; ejemplo en confirmados.ejemplo.json):
 *   { "estado": "draft" | "private", "productos": [ { "market_id": 1758, "ids": [146,488,381,1758], "nombre": "…",
 *     "precio_proveedor": 490, "precio": 540, "comision": 20, "departamentos": ["apagones-y-energia"],
 *     "descripcion": "…", "fotos": ["https://….supabase.co/…?token=…" | "/home/u824654880/electro-fotos/1758/1.jpg"],
 *     "confirmado": true, "confirmado_por": "Ricardo 21-oct 10:15" } ] }
 *
 * Reglas:
 *  - Solo crea lo que trae "confirmado": true y "confirmado_por" (doble comprobación como con Kevin).
 *  - Idempotente: si ya existe un producto con SKU MK-<market_id> o MK-<cualquiera de sus ids>, lo salta (no lo toca).
 *  - Comprueba que el precio y la comisión cuadran con la regla del bot (D43/D45 + 40 % del margen); si no, avisa y lo salta.
 *  - Fotos: la primera es la principal y hasta 3 más van a la galería. https solo de *.supabase.co (como Core) o archivos
 *    locales del servidor. Si una foto falla, el producto se crea igual y lo dice.
 */

defined( 'ABSPATH' ) || exit( "Ejecútalo con: wp eval-file crear-productos.php confirmados.json [dry-run|hacer]\n" );

$cvx_args  = isset( $args ) && is_array( $args ) ? $args : array();
$cvx_do    = in_array( 'hacer', $cvx_args, true ) && ! in_array( 'dry-run', $cvx_args, true ) && ! in_array( '--dry-run', $cvx_args, true );
$cvx_file  = '';
foreach ( $cvx_args as $a ) { if ( preg_match( '/\.json$/i', $a ) ) { $cvx_file = $a; } }
if ( '' === $cvx_file ) { $cvx_file = getcwd() . '/confirmados.json'; }
$cvx_max = PHP_INT_MAX;
foreach ( $cvx_args as $a ) { if ( preg_match( '/^max=(\d+)$/', $a, $m ) ) { $cvx_max = (int) $m[1]; } }
$cvx_bak = rtrim( (string) getenv( 'HOME' ), '/' ) . '/bak-20261020-electro-creados.json';

const CVX_NOTICE  = 'Producto bajo pedido: confirmamos disponibilidad en 1 hora antes de cobrar.';
const CVX_MARKET  = 'bajo-pedido';
const CVX_MENU    = 10;
const CVX_DEPTS   = array( 'apagones-y-energia', 'electrodomesticos', 'tecnologia', 'movilidad', 'sala-y-muebles', 'navidad', 'accesorios', 'cocina' );

/** Regla del bot (vivabot/src/market-price.js). */
function cvx_my_price( float $cost ): float {
	if ( $cost < 60 ) { return ceil( $cost + min( 17, max( 5, $cost * 0.4 ) ) ); }
	$margin = max( 17, $cost > 300 ? $cost * 0.10 : 0 );
	return ceil( ( $cost + $margin ) / 5 ) * 5;
}
function cvx_share( float $price, float $cost ): float { return max( 0, round( ( $price - $cost ) * 0.4, 2 ) ); }
function cvx_say( string $s ): void { echo $s . PHP_EOL; }
function cvx_no_contacts( string $t ): string {
	$t = preg_replace( '/(\+?53)?[\s-]*\d[\d\s-]{6,}\d/u', '', $t );
	$t = preg_replace( '/@\w+|wa\.me\/\S+/iu', '', $t );
	return trim( (string) $t );
}
function cvx_term( string $slug ): int {
	$t = get_term_by( 'slug', $slug, 'product_cat' );
	return $t ? (int) $t->term_id : 0;
}
function cvx_existing( array $ids ): ?array {
	foreach ( $ids as $id ) {
		$pid = wc_get_product_id_by_sku( 'MK-' . absint( $id ) );
		if ( $pid ) { return array( 'sku' => 'MK-' . absint( $id ), 'id' => (int) $pid, 'status' => get_post_status( $pid ) ); }
	}
	return null;
}
function cvx_photo_ok( string $src ): bool {
	if ( 0 === strpos( $src, 'https://' ) ) { return (bool) preg_match( '/\.supabase\.co$/', (string) wp_parse_url( $src, PHP_URL_HOST ) ); }
	return is_readable( $src );
}
function cvx_sideload( string $src, int $product_id, string $title ): int {
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';
	if ( 0 === strpos( $src, 'https://' ) ) {
		$tmp = download_url( $src, 60 );
		if ( is_wp_error( $tmp ) ) { cvx_say( '      ⚠️ foto no descargada: ' . $tmp->get_error_message() ); return 0; }
	} else {
		$tmp = wp_tempnam( basename( $src ) );
		if ( ! @copy( $src, $tmp ) ) { cvx_say( '      ⚠️ foto no copiada: ' . $src ); return 0; }
	}
	$file = array( 'name' => sanitize_file_name( 'mercado-' . $product_id . '-' . wp_generate_password( 6, false ) . '.jpg' ), 'tmp_name' => $tmp );
	$att  = media_handle_sideload( $file, $product_id, $title );
	if ( is_wp_error( $att ) ) { @unlink( $tmp ); cvx_say( '      ⚠️ foto rechazada: ' . $att->get_error_message() ); return 0; }
	return (int) $att;
}

// ---------- leer ----------
if ( ! is_readable( $cvx_file ) ) { cvx_say( "❌ No encuentro {$cvx_file}" ); return; }
$cvx_in = json_decode( (string) file_get_contents( $cvx_file ), true );
if ( ! is_array( $cvx_in ) || ! isset( $cvx_in['productos'] ) || ! is_array( $cvx_in['productos'] ) ) { cvx_say( '❌ confirmados.json no tiene "productos"' ); return; }
$cvx_status = in_array( $cvx_in['estado'] ?? 'draft', array( 'draft', 'private', 'pending', 'publish' ), true ) ? $cvx_in['estado'] : 'draft';
$cvx_done = is_readable( $cvx_bak ) ? (array) json_decode( (string) file_get_contents( $cvx_bak ), true ) : array();
$cvx_market = cvx_term( CVX_MARKET );
if ( ! $cvx_market ) { cvx_say( '❌ No existe la categoría «Bajo pedido» (slug bajo-pedido).' ); return; }

cvx_say( ( $cvx_do ? '🛠️  CREANDO DE VERDAD' : '🔎 PRUEBA EN SECO (no se crea nada; para crear añade «hacer»)' ) . " · {$cvx_file} · estado: {$cvx_status}" );
$cvx_n = array( 'crear' => 0, 'creado' => 0, 'existe' => 0, 'saltado' => 0 );
$cvx_version = (int) round( microtime( true ) * 1000 );

foreach ( $cvx_in['productos'] as $i => $it ) {
	$mid   = absint( $it['market_id'] ?? 0 );
	$name  = sanitize_text_field( (string) ( $it['nombre'] ?? '' ) );
	$cost  = (float) ( $it['precio_proveedor'] ?? 0 );
	$price = isset( $it['precio'] ) ? (float) $it['precio'] : ( $cost > 0 ? cvx_my_price( $cost ) : 0 );
	$com   = isset( $it['comision'] ) ? (float) $it['comision'] : cvx_share( $price, $cost );
	$ids   = array_values( array_unique( array_map( 'absint', array_merge( array( $mid ), (array) ( $it['ids'] ?? array() ) ) ) ) );
	$tag   = sprintf( '%3d. MK-%-5d %s', $i + 1, $mid, $name );

	if ( ! $mid || '' === $name || $cost <= 0 || $price <= 0 ) { cvx_say( "{$tag}\n      ❌ saltado: faltan market_id, nombre o precios" ); $cvx_n['saltado']++; continue; }
	if ( empty( $it['confirmado'] ) || '' === trim( (string) ( $it['confirmado_por'] ?? '' ) ) ) { cvx_say( "{$tag}\n      ⏸️ saltado: sin «confirmado» del proveedor" ); $cvx_n['saltado']++; continue; }
	if ( empty( $it['precio_manual'] ) && abs( $price - cvx_my_price( $cost ) ) > 0.001 ) { cvx_say( "{$tag}\n      ❌ saltado: precio {$price} ≠ regla del bot " . cvx_my_price( $cost ) . ' (pon "precio_manual": true si es a propósito)' ); $cvx_n['saltado']++; continue; }
	if ( $com <= 0 || $com >= $price - $cost + 0.001 ) { cvx_say( "{$tag}\n      ❌ saltado: comisión {$com} no cabe en el margen " . ( $price - $cost ) ); $cvx_n['saltado']++; continue; }
	if ( $ex = cvx_existing( $ids ) ) { cvx_say( "{$tag}\n      ↩️ ya existe: producto {$ex['id']} ({$ex['sku']}, {$ex['status']}). No se toca." ); $cvx_n['existe']++; continue; }

	$depts = array();
	foreach ( (array) ( $it['departamentos'] ?? array() ) as $slug ) {
		$slug = sanitize_title( (string) $slug );
		if ( in_array( $slug, CVX_DEPTS, true ) && ( $tid = cvx_term( $slug ) ) ) { $depts[ $slug ] = $tid; }
	}
	$photos = array_values( array_filter( array_map( 'strval', (array) ( $it['fotos'] ?? array() ) ), 'cvx_photo_ok' ) );
	$photos = array_slice( $photos, 0, 4 );
	$desc   = cvx_no_contacts( (string) ( $it['descripcion'] ?? '' ) );

	cvx_say( $tag );
	cvx_say( sprintf( '      precio %s USD · proveedor %s · comisión gestora %s USD · Casa Viva %s USD · %s', wc_format_decimal( $price, 2 ), wc_format_decimal( $cost, 2 ), wc_format_decimal( $com, 2 ), wc_format_decimal( $price - $cost - $com, 2 ), 'Bajo pedido' . ( $depts ? ' + ' . implode( ', ', array_keys( $depts ) ) : ' (sin departamento)' ) ) );
	cvx_say( '      fotos: ' . count( $photos ) . ( count( $photos ) < count( (array) ( $it['fotos'] ?? array() ) ) ? ' (alguna no vale: solo https de supabase.co o archivo del servidor)' : '' ) . ' · confirmó: ' . sanitize_text_field( (string) $it['confirmado_por'] ) );
	if ( ! $cvx_do ) { $cvx_n['crear']++; continue; }
	if ( $cvx_n['creado'] >= $cvx_max ) { cvx_say( '⏸️ tope max alcanzado: el resto queda para la próxima tanda' ); break; }

	$p = new WC_Product_Simple();
	$p->set_name( $name );
	$p->set_sku( 'MK-' . $mid );
	$p->set_regular_price( wc_format_decimal( $price, 2 ) );
	$p->set_sale_price( '' );
	$p->set_manage_stock( false );
	$p->set_stock_status( 'instock' );
	$p->set_backorders( 'no' );
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
	if ( class_exists( 'CVD_Costs' ) ) { CVD_Costs::set_cost( $p, $cost, 'proveedor' ); }
	try {
		$pid = $p->save();
	} catch ( Throwable $e ) {
		cvx_say( '      ❌ no se pudo crear: ' . $e->getMessage() ); $cvx_n['saltado']++; continue;
	}
	$att = array();
	foreach ( $photos as $src ) { if ( $a = cvx_sideload( $src, $pid, $name ) ) { $att[] = $a; } }
	if ( $att ) {
		$p = wc_get_product( $pid );
		$p->set_image_id( array_shift( $att ) );
		$p->set_gallery_image_ids( $att );
		$p->save();
	}
	$cvx_done[] = array( 'id' => (int) $pid, 'sku' => 'MK-' . $mid, 'market_id' => $mid, 'proveedor' => (string) ( $it['proveedor'] ?? '' ), 'nombre' => $name, 'precio' => $price, 'comision' => $com, 'fotos' => count( $att ) + ( $p->get_image_id() ? 1 : 0 ), 'url' => get_permalink( $pid ), 'creado' => gmdate( 'c' ) );
	file_put_contents( $cvx_bak, wp_json_encode( $cvx_done, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
	cvx_say( "      ✅ creado: producto {$pid} ({$cvx_status}) · " . get_permalink( $pid ) );
	$cvx_n['creado']++;
}

cvx_say( '' );
cvx_say( $cvx_do
	? "Hecho: {$cvx_n['creado']} creados, {$cvx_n['existe']} ya existían, {$cvx_n['saltado']} saltados."
	: "Prueba en seco: se crearían {$cvx_n['crear']}; {$cvx_n['existe']} ya existen; {$cvx_n['saltado']} saltados. Nada cambiado." );
