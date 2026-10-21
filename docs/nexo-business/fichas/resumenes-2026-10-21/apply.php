<?php
// args: json_path offset limit [dry]
list( $path, $offset, $limit ) = array( $args[0], (int) $args[1], (int) $args[2] );
$dry = isset( $args[3] ) && 'dry' === $args[3];
$generic = 'Consulta disponibilidad, variantes y opciones de recogida o mensajería en La Habana.';
$map = json_decode( file_get_contents( $path ), true );
$ids = array_slice( array_keys( $map ), $offset, $limit );
$stats = array( 'simple' => 0, 'variable' => 0, 'variations' => 0, 'skipped' => array() );
foreach ( $ids as $id ) {
	$text = trim( $map[ $id ] );
	$p = wc_get_product( (int) $id );
	if ( ! $p || '' === $text ) { $stats['skipped'][] = "$id:no-product"; continue; }
	$cur = trim( (string) get_post_field( 'post_excerpt', (int) $id ) );
	if ( '' !== $cur && $generic !== $cur ) { $stats['skipped'][] = "$id:ya-tiene"; continue; }
	if ( ! $dry ) { $p->set_short_description( '<p>' . esc_html( $text ) . '</p>' ); $p->save(); }
	$stats[ $p->get_type() === 'variable' ? 'variable' : 'simple' ]++;
	if ( $p->is_type( 'variable' ) ) {
		foreach ( $p->get_children() as $vid ) {
			$v = wc_get_product( $vid );
			if ( ! $v || '' !== trim( (string) $v->get_description( 'edit' ) ) ) { continue; }
			if ( ! $dry ) { $v->set_description( $text ); $v->save(); }
			$stats['variations']++;
		}
	}
}
echo wp_json_encode( $stats, JSON_UNESCAPED_UNICODE ), "\n";
