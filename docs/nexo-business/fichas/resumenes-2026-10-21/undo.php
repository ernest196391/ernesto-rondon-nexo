<?php
// Deshacer: wp eval-file ~/cv-resumenes-undo.php ~/backup-resumenes-cortos-2026-10-21.json [dry]
$dry = isset( $args[1] ) && 'dry' === $args[1];
$rows = json_decode( file_get_contents( $args[0] ), true );
$n = 0; $v = 0;
foreach ( $rows as $r ) {
	$p = wc_get_product( $r['id'] ); if ( ! $p ) { continue; }
	if ( ! $dry ) { $p->set_short_description( $r['excerpt'] ); $p->save(); } $n++;
	foreach ( $r['variations'] as $var ) {
		$o = wc_get_product( $var['id'] ); if ( ! $o ) { continue; }
		if ( ! $dry ) { $o->set_description( $var['description'] ); $o->save(); } $v++;
	}
}
echo ( $dry ? 'PRUEBA ' : '' ) . "productos restaurados: $n · variaciones: $v\n";
