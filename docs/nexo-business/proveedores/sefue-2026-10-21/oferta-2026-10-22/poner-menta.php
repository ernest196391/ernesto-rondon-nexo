<?php
/**
 * SeFué 23-oct: pone como foto principal la versión con fondo verde menta (color de proveedor SeFué, decisión de Ernesto).
 * No borra nada: la foto vieja queda en la biblioteca y su id se apunta en ~/bak-20261023-sefue-fotos-antes.json
 * (deshacer: «deshacer» vuelve a poner la vieja). Sin «hacer» es prueba en seco.
 *   wp eval-file ~/sefue-fotos-menta/poner-menta.php ~/sefue-fotos-menta/menta-plan.json [hacer|deshacer]
 */
defined( 'ABSPATH' ) || exit;
$a    = isset( $args ) && is_array( $args ) ? $args : array();
$plan = '';
foreach ( $a as $x ) { if ( preg_match( '/\.json$/', $x ) ) { $plan = $x; } }
$do   = in_array( 'hacer', $a, true );
$undo = in_array( 'deshacer', $a, true );
$bak  = rtrim( (string) getenv( 'HOME' ), '/' ) . '/bak-20261023-sefue-fotos-antes.json';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

if ( $undo ) {
	$prev = json_decode( (string) file_get_contents( $bak ), true );
	foreach ( (array) $prev as $r ) { $p = wc_get_product( $r['id'] ); if ( $p && $r['antes'] ) { $p->set_image_id( $r['antes'] ); $p->save(); } }
	echo 'Deshecho: ' . count( (array) $prev ) . PHP_EOL;
	return;
}
$items = json_decode( (string) file_get_contents( $plan ), true );
$done  = is_readable( $bak ) ? (array) json_decode( (string) file_get_contents( $bak ), true ) : array();
$ya    = array_column( $done, 'id' );
$n     = 0;
foreach ( (array) $items as $it ) {
	$p = wc_get_product( (int) $it['id'] );
	if ( ! $p || 0 !== strpos( (string) $p->get_sku(), 'MK-' ) ) { echo "❌ {$it['id']} no es un MK-\n"; continue; }
	if ( in_array( (int) $it['id'], $ya, true ) ) { echo "↩️ {$it['id']} ya tiene la menta\n"; continue; }
	if ( ! is_readable( $it['file'] ) ) { echo "❌ falta {$it['file']}\n"; continue; }
	if ( ! $do ) { $n++; continue; }
	$tmp = wp_tempnam( basename( $it['file'] ) );
	copy( $it['file'], $tmp );
	$att = media_handle_sideload( array( 'name' => 'sefue-menta-' . $it['id'] . '.jpg', 'tmp_name' => $tmp ), (int) $it['id'], $p->get_name() );
	if ( is_wp_error( $att ) ) { echo "❌ {$it['id']} " . $att->get_error_message() . "\n"; continue; }
	$old = (int) $p->get_image_id();
	$p->set_image_id( (int) $att );
	$p->save();
	$done[] = array( 'id' => (int) $it['id'], 'n' => $it['n'], 'antes' => $old, 'menta' => (int) $att );
	file_put_contents( $bak, wp_json_encode( $done, JSON_PRETTY_PRINT ) );
	$n++;
}
echo ( $do ? 'Puestas: ' : 'En seco, se pondrían: ' ) . $n . PHP_EOL;
