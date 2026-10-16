<?php
// Corre CVD_Programa_Calc::compute (el de verdad) sobre escenarios inventados o copiados. Sin WordPress, sin base de datos.
// Uso: php run.php <calc.php> <escenarios.json>  → JSON por stdout.
define( 'ABSPATH', __DIR__ );
require $argv[1];
$sc = json_decode( file_get_contents( $argv[2] ), true );
$out = array();
foreach ( $sc as $s ) {
	$params = ( $s['params'] ?? array() ) + array( 'rate_cup' => 800 );
	$members = array(); foreach ( $s['members'] as $id => $m ) { $members[ (int) $id ] = $m; }
	$r = CVD_Programa_Calc::compute( $s['period'], $members, $s['sales'], array(), $params );
	$res = array( 'id' => $s['id'], 'm1' => slim( $r ) );
	if ( ! empty( $s['month2'] ) ) {
		// Devoluciones: pedidos del mes 1 (ya cerrado y pagado) que se anulan en el mes 2.
		$ret = array_flip( $s['month2']['returned'] );
		$rev = array();
		foreach ( $r['lines'] as $l ) {
			if ( ! isset( $ret[ $l['order'] ] ) ) { continue; }
			$o = $l['order'];
			$rev[ $o ] = $rev[ $o ] ?? array( 'order_id' => $o, 'owner' => 0, 'points' => 0, 'base' => 0, 'red' => array() );
			if ( 'venta' === $l['kind'] ) { $rev[ $o ]['owner'] = $l['user']; $rev[ $o ]['points'] += $l['points']; $rev[ $o ]['base'] += $l['base']; }
			if ( 'red1' === $l['kind'] || 'red2' === $l['kind'] ) { $rev[ $o ]['red'][] = array( 'user' => $l['user'], 'level' => 'red1' === $l['kind'] ? 1 : 2, 'amount' => $l['amount'] ); }
		}
		$r2 = CVD_Programa_Calc::compute( $s['month2']['period'], $members, $s['month2']['sales'], array_values( $rev ), $params );
		$res['m2'] = slim( $r2 );
	}
	$out[] = $res;
}
echo json_encode( $out );
function slim( array $r ): array {
	$p = array();
	foreach ( $r['people'] as $id => $x ) {
		if ( ! $x['own_points'] && ! $x['team_points'] && ! $x['red_gross'] ) { continue; }
		$p[ $id ] = array( 'own' => $x['own_points'], 'orders' => $x['own_orders'], 'sales' => $x['own_sales_usd'], 'team' => $x['team_points'], 'stone' => $x['stone'], 'red' => $x['red_pay'], 'red_gross' => $x['red_gross'], 'bonus_cup' => $x['bonus_pay_cup'], 'bonus_full_cup' => $x['bonus_cup'], 'bonus_usd' => $x['bonus_pay_usd'], 'cov' => $x['coverage'], 'inviter' => $x['inviter'] );
	}
	return array( 'totals' => $r['totals'], 'people' => $p, 'alerts' => array_count_values( array_column( $r['alerts'], 'type' ) ) );
}
