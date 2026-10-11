<?php
// Pedidos web abiertos de Casa Viva (solo lectura) para el mod /casaviva de Claude Code.
// Vive en el servidor de la web: ~/casaviva-pedidos.php. Uso: wp eval-file ~/casaviva-pedidos.php
$rows = array();
foreach ( wc_get_orders( array( 'limit' => 50, 'type' => 'shop_order', 'status' => array( 'pending', 'processing', 'on-hold' ), 'orderby' => 'date', 'order' => 'ASC' ) ) as $o ) {
	$own = (int) $o->get_meta( '_cvd_owner_user_id' );
	$msg = (int) $o->get_meta( '_cvd_messenger_user_id' );
	$pref = (int) $o->get_meta( '_cvd_preferred_messenger_user_id' );
	$created = $o->get_date_created();
	$rows[] = array(
		'pedido'      => $o->get_id(),
		'minutos'     => $created ? (int) round( ( time() - $created->getTimestamp() ) / 60 ) : null,
		'estado'      => $o->get_status(),
		'operacion'   => (string) $o->get_meta( '_cvd_operation_status' ) ?: 'new',
		'reparto'     => (string) $o->get_meta( '_cvd_delivery_status' ) ?: '-',
		'entrega'     => (string) $o->get_meta( '_cvd_fulfillment_type' ) ?: '-',
		'gestora'     => $own && get_userdata( $own ) ? get_userdata( $own )->display_name : '',
		'mensajero'   => $msg && get_userdata( $msg ) ? get_userdata( $msg )->display_name : '',
		'elegido'     => $pref && get_userdata( $pref ) ? get_userdata( $pref )->display_name : '',
		'productos'   => implode( ', ', array_map( static fn( $i ) => $i->get_name() . ' x' . $i->get_quantity(), $o->get_items() ) ),
		'total'       => (float) $o->get_total(),
	);
}
echo wp_json_encode( array( 'pedidosAbiertos' => $rows ) );
