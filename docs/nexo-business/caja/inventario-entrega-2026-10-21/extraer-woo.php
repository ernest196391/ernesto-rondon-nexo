<?php
// Solo LECTURA. Se ejecuta con: wp eval-file - < extraer-woo.php   (variable de entorno CV_START = 'YYYY-MM-DD HH:MM:SS' UTC)
// Devuelve JSON con productos con stock propio, movimientos desde START, claves de la caja y pedidos con stock descontado.
global $wpdb;
$start = getenv('CV_START') ?: '2026-10-15 14:00:00';
$out = array('start_utc' => $start, 'now_utc' => gmdate('Y-m-d H:i:s'), 'products' => array(), 'mov' => array(), 'caja' => array(), 'orders' => array());

// Productos
$ids = get_posts(array('post_type' => 'product', 'post_status' => array('publish', 'private', 'draft', 'pending'), 'numberposts' => -1, 'fields' => 'ids'));
foreach ($ids as $pid) {
    $p = wc_get_product($pid);
    if (!$p) continue;
    $cats = wp_get_post_terms($pid, 'product_cat', array('fields' => 'names'));
    $cats = is_array($cats) ? $cats : array();
    $rows = array();
    if ($p->is_type('variable')) {
        foreach ($p->get_children() as $vid) {
            $v = wc_get_product($vid);
            if (!$v) continue;
            $rows[] = $v;
        }
        if ($p->managing_stock()) $rows[] = $p; // stock a nivel de padre
    } else {
        $rows[] = $p;
    }
    foreach ($rows as $r) {
        $managed_by = method_exists($r, 'get_stock_managed_by_id') ? $r->get_stock_managed_by_id() : $r->get_id();
        $out['products'][] = array(
            'id' => $r->get_id(), 'parent' => $pid, 'managed_by' => $managed_by,
            'manage' => $r->managing_stock() ? 1 : 0,
            'name' => $r->get_id() == $pid ? $p->get_name() : $r->get_name(),
            'attrs' => $r->get_id() == $pid ? '' : wc_get_formatted_variation($r, true, false, false),
            'sku' => (string) $r->get_sku(), 'parent_sku' => (string) $p->get_sku(),
            'cats' => $cats, 'status' => $p->get_status(), 'vstatus' => $r->get_status(),
            'stock' => $r->get_stock_quantity(), 'type' => $r->get_type(),
        );
    }
}

// Movimientos web (Core) y de la caja desde START
$out['mov'] = $wpdb->get_results("SELECT id,product_id,variation_id,movement_type,quantity_delta+0 AS d,stock_before+0 AS sb,stock_after+0 AS sa,reason,reference_type,reference_id,created_at,metadata FROM {$wpdb->prefix}cvd_inventory_movements ORDER BY id", ARRAY_A); // todos (pocos): hacen falta los anteriores para saber lo apartado al empezar
$out['caja'] = $wpdb->get_results($wpdb->prepare("SELECT stock_key,product_id,delta,applied_at FROM {$wpdb->prefix}cvd_nexo_stock_keys WHERE applied_at >= %s ORDER BY applied_at", $start), ARRAY_A);

// Pedidos: abiertos ahora + todos los que tuvieron movimientos desde START + los que se completaron desde START
$oids = $wpdb->get_col($wpdb->prepare(
    "SELECT o.id FROM {$wpdb->prefix}wc_orders o LEFT JOIN {$wpdb->prefix}wc_order_operational_data od ON od.order_id=o.id
     WHERE o.type='shop_order' AND (o.status IN ('wc-on-hold','wc-processing','wc-pending') OR od.date_completed_gmt >= %s OR o.date_updated_gmt >= %s)", $start, $start));
$mov_oids = $wpdb->get_col($wpdb->prepare("SELECT DISTINCT reference_id FROM {$wpdb->prefix}cvd_inventory_movements WHERE reference_type='woocommerce_order' AND created_at >= %s", $start));
$oids = array_unique(array_map('intval', array_merge($oids, $mov_oids)));
foreach ($oids as $oid) {
    $o = wc_get_order($oid);
    if (!$o || $o->get_type() !== 'shop_order') continue;
    $lines = array();
    foreach ($o->get_items('line_item') as $iid => $it) {
        $lines[] = array('item_id' => $iid, 'pid' => $it->get_product_id(), 'vid' => $it->get_variation_id(), 'name' => $it->get_name(), 'qty' => (int) $it->get_quantity(), 'reduced' => (string) $it->get_meta('_reduced_stock', true));
    }
    $dc = $o->get_date_completed();
    $out['orders'][] = array(
        'id' => $oid, 'number' => $o->get_order_number(), 'status' => $o->get_status(),
        'created' => $o->get_date_created() ? $o->get_date_created()->date('Y-m-d H:i:s') : null,
        'completed_gmt' => $dc ? gmdate('Y-m-d H:i:s', $dc->getTimestamp()) : null,
        'first_name' => $o->get_billing_first_name(), 'buyer' => (string) $o->get_meta('_cvd_buyer_name'),
        'fulfillment' => (string) $o->get_meta('_cvd_fulfillment_type'),
        'delivery_date' => (string) $o->get_meta('_billing_cvd_delivery_date'),
        'delivery_window' => (string) $o->get_meta('_billing_cvd_delivery_window'),
        'op_status' => (string) $o->get_meta('_cvd_operation_status'),
        'delivery_status' => (string) $o->get_meta('_cvd_delivery_status'),
        'stock_reduced' => (string) $o->get_meta('_order_stock_reduced'),
        'history' => array_values(array_map(function ($h) { return array('to' => $h['to'] ?? '', 'at' => $h['at'] ?? ''); }, is_array($o->get_meta('_cvd_operation_history')) ? $o->get_meta('_cvd_operation_history') : array())),
        'lines' => $lines,
    );
}
echo wp_json_encode($out);
