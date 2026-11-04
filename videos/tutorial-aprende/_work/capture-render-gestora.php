<?php
// Render del área de gestora para capturas del tutorial «Aprende». Solo lectura: no guarda nada.
// «Aprende» sale como para una gestora nueva (0 de 6 vistos): se filtra la LECTURA de la meta _cvd_aprende
// (filtro en memoria, la base no se toca). Uso: CV_USER=<id> wp eval-file aprende-render.php
wp_set_current_user( (int) ( getenv( 'CV_USER' ) ?: 65 ) );
add_filter( 'get_user_metadata', static function ( $value, $object_id, $meta_key ) {
	return '_cvd_aprende' === $meta_key ? array( array() ) : $value;
}, 10, 3 );
$u = wp_get_current_user();
fwrite( STDERR, 'user=' . $u->ID . ' approved=' . ( CVD_Registration::is_approved_gestora( $u ) ? 1 : 0 ) . ' app=' . ( CVD_Gestora_App::enabled_for( $u ) ? 1 : 0 ) . ' progress=' . wp_json_encode( CVD_Aprende::progress( $u->ID, 'gestora' ) ) . "\n" );
$GLOBALS['wp_query'] = new WP_Query( array( 'pagename' => 'area-gestoras' ) );
$GLOBALS['wp_the_query'] = $GLOBALS['wp_query'];
if ( have_posts() ) { the_post(); }
fwrite( STDERR, 'is_page=' . ( is_page( 'area-gestoras' ) ? 1 : 0 ) . "\n" );
ob_start();
include CVD_DIR . 'templates/gestora-app.php';
$html = ob_get_clean();
file_put_contents( getenv( 'HOME' ) . '/tmp-aprende-gestora.html', $html );
fwrite( STDERR, 'bytes=' . strlen( $html ) . ' name=' . $u->display_name . ' code=' . CVD_Gestora_App::referral_code( $u ) . ' zone=' . get_user_meta( $u->ID, '_cvd_zone', true ) . "\n" );
