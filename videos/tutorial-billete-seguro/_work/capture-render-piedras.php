<?php
// Tutorial «Las piedras»: render del área de gestora como la CUENTA DE PRUEBA 45 (nunca una gestora real), con un cálculo
// del programa INVENTADO (el ejemplo María/Ana de AUDITORIA-2026-10-16 §0.2). Solo lectura y solo en memoria:
// - el estado «approved» de la cuenta 45 se finge con un filtro de get_user_metadata (no se guarda);
// - la lectura del libro (wp_cvd_programa_runs) se cambia por un SELECT literal con el JSON de ejemplo (filtro 'query').
// Uso: CV_USER=45 wp eval-file ~/tmp-piedras-render.php  → ~/tmp-tutorial-piedras.html (bajarlo y borrar los dos en el acto).
$uid = (int) ( getenv( 'CV_USER' ) ?: 45 );
if ( '1' !== (string) get_user_meta( $uid, '_cvd_test_account', true ) ) { fwrite( STDERR, "no es cuenta de prueba\n" ); exit( 1 ); }
add_filter( 'get_user_metadata', function ( $v, $id, $k ) use ( $uid ) {
	return ( (int) $id === $uid && '_cvd_account_status' === $k ) ? array( 'approved' ) : $v;
}, 10, 3 );
$ana = 990001;
$people = array(
	$uid => array(
		'id' => $uid, 'name' => 'Tu nombre', 'inviter' => 0, 'joined' => '2026-09-01 12:00:00', 'title' => 'plata', 'stone' => 'plata',
		'own_points' => 60, 'own_sales_usd' => 300, 'team_points' => 140, 'level1' => array( $ana ), 'level2' => array(),
		'next' => array( 'slug' => 'oro', 'name' => 'Oro', 'points' => 195, 'have' => 140, 'missing' => 55, 'min_own_usd' => 50, 'own_usd_missing' => 0 ),
		'red_gross' => 4.0, 'red_pay' => 4.0, 'red_lost' => 0, 'red_lost_reason' => '', 'bonus_cup' => 10000, 'bonus_pay_cup' => 9066, 'coverage' => 0.9066,
	),
	$ana => array(
		'id' => $ana, 'name' => 'Ana Ejemplo', 'inviter' => $uid, 'joined' => '2026-10-02 15:00:00', 'title' => 'bronce', 'stone' => 'bronce',
		'own_points' => 80, 'own_sales_usd' => 400, 'team_points' => 80, 'level1' => array(), 'level2' => array(),
	),
);
$lines = array(
	array( 'kind' => 'venta', 'user' => $uid, 'order' => 990101, 'source' => $uid, 'points' => 22.6, 'amount' => 0 ),
	array( 'kind' => 'venta', 'user' => $uid, 'order' => 990102, 'source' => $uid, 'points' => 18.4, 'amount' => 0 ),
	array( 'kind' => 'venta', 'user' => $uid, 'order' => 990103, 'source' => $uid, 'points' => 19, 'amount' => 0 ),
	array( 'kind' => 'red1', 'user' => $uid, 'order' => 990201, 'source' => $ana, 'points' => 0, 'amount' => 4.0 ),
);
$data = array( 'period' => '2026-10', 'people' => $people, 'lines' => $lines, 'alerts' => array(), 'params' => array( 'rate_cup' => 800 ) );
add_filter( 'query', function ( $q ) use ( $data ) {
	global $wpdb;
	if ( false === strpos( $q, 'cvd_programa_runs' ) || 0 !== stripos( ltrim( $q ), 'SELECT' ) ) { return $q; }
	return $wpdb->prepare( "SELECT 1 AS id, '2026-10' AS period, 'diario' AS kind, 'sombra' AS mode, 'sombra' AS status, '2026-10-16 07:30:00' AS computed_at, %s AS payload", wp_json_encode( $data ) );
} );
wp_set_current_user( $uid );
$u = wp_get_current_user();
fwrite( STDERR, 'user=' . $u->ID . ' approved=' . ( CVD_Registration::is_approved_gestora( $u ) ? 1 : 0 ) . ' app=' . ( CVD_Gestora_App::enabled_for( $u ) ? 1 : 0 ) . ' prog=' . ( CVD_Programa::visible_for( $u ) ? 1 : 0 ) . "\n" );
$GLOBALS['wp_query'] = new WP_Query( array( 'pagename' => 'area-gestoras' ) );
$GLOBALS['wp_the_query'] = $GLOBALS['wp_query'];
if ( have_posts() ) { the_post(); }
ob_start();
include CVD_DIR . 'templates/gestora-app.php';
$html = ob_get_clean();
file_put_contents( getenv( 'HOME' ) . '/tmp-tutorial-piedras.html', $html );
file_put_contents( getenv( 'HOME' ) . '/tmp-tutorial-piedras-meta.tsv', $u->display_name . "\t" . get_user_meta( $u->ID, '_cvd_referral_code', true ) . "\t" . get_user_meta( $u->ID, '_cvd_zone', true ) );
fwrite( STDERR, 'bytes=' . strlen( $html ) . "\n" );
