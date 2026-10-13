<?php
// Crea (o reintenta sin duplicar, por `ref`) un producto con diseños por el MISMO código del panel
// (CVD_Panel_Bridge::create_variable = POST /panel/products/variable) y le añade la ficha y las medidas.
// Uso: wp eval-file crear-variable.php datos.json
$in = json_decode( file_get_contents( $args[0] ), true );
if ( ! is_array( $in ) ) { echo wp_json_encode( array( 'error' => 'json' ) ); return; }
$req = new WP_REST_Request( 'POST', '/casa-viva/v1/panel/products/variable' );
$req->set_header( 'content-type', 'application/json' );
$req->set_body( wp_json_encode( $in['create'] ) );
$res = CVD_Panel_Bridge::create_variable( $req );
if ( is_wp_error( $res ) ) { echo wp_json_encode( array( 'error' => $res->get_error_message() ) ); return; }
$data = $res instanceof WP_REST_Response ? $res->get_data() : (array) $res;
$p = wc_get_product( (int) $data['parentId'] );
if ( ! empty( $in['description'] ) ) { $p->set_description( $in['description'] ); }
if ( ! empty( $in['short'] ) ) { $p->set_short_description( $in['short'] ); }
foreach ( array( 'length', 'width', 'height' ) as $k ) { if ( isset( $in['dims'][ $k ] ) ) { $p->{"set_$k"}( (string) $in['dims'][ $k ] ); } }
$p->save();
echo wp_json_encode( $data );
