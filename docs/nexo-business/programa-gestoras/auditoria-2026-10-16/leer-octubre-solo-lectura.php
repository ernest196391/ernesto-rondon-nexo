<?php
// SOLO LECTURA: calcula sin guardar y vuelca datos anonimizados.
$period = '2026-10';
$m = new ReflectionMethod('CVD_Programa','members'); $m->setAccessible(true); $members = $m->invoke(null);
$s = new ReflectionMethod('CVD_Programa','sales'); $s->setAccessible(true); $sales = $s->invoke(null, $period, $members, array());
$res = CVD_Programa::compute($period);
$alias = array(); $i=0;
foreach ($members as $id=>$mm) { $alias[$id] = 'G'.(++$i); }
$out = array('rate'=>$res['params']['rate_cup'],'totals'=>$res['totals'],'members'=>array(),'sales'=>array(),'alerts'=>array_count_values(array_column($res['alerts'],'type')));
foreach ($members as $id=>$mm) { $out['members'][$alias[$id]] = array('first'=>strtok($mm['name'],' '),'inviter'=>$mm['inviter']?($alias[$mm['inviter']]??'?'):'','joined'=>substr($mm['joined'],0,10),'approved'=>$mm['approved'],'test'=>$mm['test']); }
foreach ($sales as $x) { if (substr($x['at'],0,7)!==$period) continue; $out['sales'][] = array('o'=>$x['order_id'],'owner'=>$alias[$x['owner']],'at'=>$x['at'],'status'=>$x['status'],'self'=>$x['self_order'],'check'=>$x['self_check'],'test'=>$x['test'],'lines'=>array_map(fn($l)=>array('q'=>$l['qty'],'base'=>$l['base'],'cost'=>$l['cost_unit'],'com'=>$l['commission'],'other'=>$l['other'],'prov'=>$l['cost_provisional'],'bp'=>$l['bajo_pedido'],'name'=>mb_substr($l['name'],0,40)),$x['lines'])); }
foreach ($res['people'] as $id=>$p) { if ($p['own_points']||$p['team_points']) $out['people'][$alias[$id]] = array('own_pts'=>$p['own_points'],'own_usd'=>$p['own_sales_usd'],'orders'=>$p['own_orders'],'team'=>$p['team_points'],'stone'=>$p['stone'],'fund'=>$p['fund_usd'],'bonus_cup'=>$p['bonus_pay_cup']); }
// Comprobaciones de estados: comisiones aprobadas/pagadas cuyo pedido tiene un estado fuera de la lista que lee el programa
global $wpdb;
$out['status_mix'] = $wpdb->get_results("SELECT p.post_status st, pm.meta_value cs, COUNT(*) n FROM {$wpdb->posts} p JOIN {$wpdb->postmeta} pm ON pm.post_id=p.ID AND pm.meta_key='_cvd_commission_status' WHERE p.post_type='shop_order' AND p.post_modified >= '2026-10-01' GROUP BY 1,2", ARRAY_A);
$hpos = get_option('woocommerce_custom_orders_table_enabled');
$out['hpos'] = $hpos;
if ('yes'===$hpos) { $out['status_mix_hpos'] = $wpdb->get_results("SELECT o.status st, m.meta_value cs, COUNT(*) n FROM {$wpdb->prefix}wc_orders o JOIN {$wpdb->prefix}wc_orders_meta m ON m.order_id=o.id AND m.meta_key='_cvd_commission_status' WHERE o.type='shop_order' AND o.date_updated_gmt >= '2026-10-01' GROUP BY 1,2", ARRAY_A); }
// Muestra del formato de fechas del historial
$one = wc_get_orders(array('limit'=>3,'meta_key'=>'_cvd_commission_status','meta_value'=>'approved'));
foreach ($one as $o) { $h=$o->get_meta('_cvd_commission_history',true); $out['hist_sample'][] = array('h'=>is_array($h)?array_slice($h,-2):$h,'cash'=>$o->get_meta('_cvd_cash_verified_at',true)); }
// Reembolsos parciales en octubre (pedido no anulado con reembolso)
$out['partial_refunds'] = array();
foreach (wc_get_orders(array('limit'=>-1,'type'=>'shop_order','date_modified'=>'>='.strtotime('2026-10-01'),'status'=>array('completed','processing','on-hold'))) as $o) { if ($o->get_total_refunded()>0) $out['partial_refunds'][] = array('o'=>$o->get_id(),'refunded'=>$o->get_total_refunded(),'cs'=>$o->get_meta('_cvd_commission_status',true),'owner'=>$o->get_meta('_cvd_owner_user_id',true)?'gestora':'-'); }
// Ventas totales de la web en octubre (todas, con o sin gestora), completadas
$tot=0;$n=0;$org=0; foreach (wc_get_orders(array('limit'=>-1,'type'=>'shop_order','status'=>array('completed'),'date_completed'=>strtotime('2026-10-01').'...'.time())) as $o){ $tot+=$o->get_total(); $n++; if(!$o->get_meta('_cvd_owner_user_id',true) || 'organic'===$o->get_meta('_cvd_owner_type',true)) $org+=$o->get_total(); }
$out['web_completed_oct'] = array('n'=>$n,'total_moneda_pedido'=>$tot,'sin_gestora'=>$org);
echo wp_json_encode($out, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
