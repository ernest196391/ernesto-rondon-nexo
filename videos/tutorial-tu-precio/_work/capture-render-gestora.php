<?php
// Render del área de gestora (CV_USER) para capturas del tutorial. Solo lectura.
wp_set_current_user( (int) ( getenv( "CV_USER" ) ?: 65 ) );
$u = wp_get_current_user();
fwrite( STDERR, 'user=' . $u->ID . ' approved=' . ( CVD_Registration::is_approved_gestora( $u ) ? 1 : 0 ) . ' app=' . ( CVD_Gestora_App::enabled_for( $u ) ? 1 : 0 ) . ' test=' . get_user_meta( get_current_user_id(), '_cvd_test_account', true ) . "\n" );
$GLOBALS['wp_query'] = new WP_Query( array( 'pagename' => 'area-gestoras' ) );
$GLOBALS['wp_the_query'] = $GLOBALS['wp_query'];
if ( have_posts() ) { the_post(); }
fwrite( STDERR, 'is_page=' . ( is_page( 'area-gestoras' ) ? 1 : 0 ) . "\n" );
ob_start();
include CVD_DIR . 'templates/gestora-app.php';
$html = ob_get_clean();
file_put_contents( getenv( 'HOME' ) . '/tmp-tutorial-tu-precio.html', $html );
fwrite( STDERR, 'bytes=' . strlen( $html ) . ' name=' . $u->display_name . ' code=' . get_user_meta( $u->ID, '_cvd_referral_code', true ) . "\n" );
