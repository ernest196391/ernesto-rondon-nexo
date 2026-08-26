<?php
/**
 * Plugin Name: NEXO Product Studio
 * Description: Puente seguro entre NEXO Studio, WooCommerce y Casa Viva.
 * Version: 0.1.0
 * Author: NEXO
 * Requires PHP: 8.0
 * Requires Plugins: woocommerce
 */
defined('ABSPATH') || exit;

final class NEXO_Product_Studio_Plugin {
	const VERSION='0.1.0'; const OPTION='nexo_studio_settings';
	public static function boot():void{add_action('admin_menu',[__CLASS__,'menu']);add_action('admin_init',[__CLASS__,'settings']);add_action('rest_api_init',[__CLASS__,'routes']);add_action('woocommerce_admin_order_data_after_order_details',[__CLASS__,'order_trace']);add_action('add_meta_boxes_product',[__CLASS__,'product_box']);}
	public static function activate():void{if(!class_exists('WooCommerce'))deactivate_plugins(plugin_basename(__FILE__));}
	public static function menu():void{add_submenu_page('woocommerce','NEXO Product Studio','NEXO Studio','manage_woocommerce','nexo-product-studio',[__CLASS__,'page']);}
	public static function settings():void{register_setting('nexo_studio',self::OPTION,['sanitize_callback'=>[__CLASS__,'sanitize']]);}
	public static function sanitize($raw):array{return ['render_url'=>esc_url_raw($raw['render_url']??''),'webhook_secret'=>(string)($raw['webhook_secret']??'')];}
	private static function options():array{return wp_parse_args((array)get_option(self::OPTION,[]),['render_url'=>'','webhook_secret'=>'']);}
	public static function page():void{if(!current_user_can('manage_woocommerce'))return;$o=self::options();echo '<div class="wrap"><h1>NEXO Product Studio</h1><p>Conexión desacoplada con Render. Los secretos se guardan como opciones protegidas de WordPress y nunca se envían al navegador público.</p><form method="post" action="options.php">';settings_fields('nexo_studio');echo '<table class="form-table"><tr><th>URL de Render</th><td><input class="regular-text" type="url" name="'.esc_attr(self::OPTION).'[render_url]" value="'.esc_attr($o['render_url']).'"></td></tr><tr><th>Secreto de webhook</th><td><input class="regular-text" type="password" autocomplete="new-password" name="'.esc_attr(self::OPTION).'[webhook_secret]" value="'.esc_attr($o['webhook_secret']).'"><p class="description">Debe coincidir con NEXO_WEBHOOK_SECRET en Render.</p></td></tr></table>';submit_button();echo '</form><h2>Diagnóstico</h2><ul><li>WooCommerce: '.(class_exists('WooCommerce')?'conectado':'no disponible').'</li><li>Casa Viva: '.(class_exists('CVD_Attribution')?'detectado':'no detectado').'</li><li>Webhook: '.($o['webhook_secret']?'configurado':'pendiente').'</li></ul></div>';}
	public static function routes():void{register_rest_route('nexo/v1','/health',['methods'=>'GET','permission_callback'=>fn()=>current_user_can('manage_woocommerce'),'callback'=>fn()=>['ok'=>true,'version'=>self::VERSION,'woocommerce'=>class_exists('WooCommerce'),'casaViva'=>class_exists('CVD_Attribution')]]);register_rest_route('nexo/v1','/product-sync',['methods'=>'POST','permission_callback'=>[__CLASS__,'signed_permission'],'callback'=>[__CLASS__,'sync_product']]);}
	public static function signed_permission(WP_REST_Request $request){$o=self::options();$secret=(string)$o['webhook_secret'];$signature=(string)$request->get_header('x-nexo-signature');$timestamp=(string)$request->get_header('x-nexo-timestamp');if(!$secret||!$signature||!ctype_digit($timestamp)||abs(time()-(int)$timestamp)>300)return new WP_Error('nexo_forbidden','Firma ausente o vencida',['status'=>403]);$expected=hash_hmac('sha256',$timestamp.'.'.$request->get_body(),$secret);return hash_equals($expected,$signature)?true:new WP_Error('nexo_forbidden','Firma no válida',['status'=>403]);}
	public static function sync_product(WP_REST_Request $request){$data=$request->get_json_params();$id=absint($data['woocommerce_product_id']??0);$product=$id?wc_get_product($id):null;if(!$product)return new WP_Error('nexo_product_missing','Producto WooCommerce no encontrado',['status'=>404]);foreach(['nexo_capture_id','nexo_product_id','commerce_id','verified_at'] as $key)if(isset($data[$key]))$product->update_meta_data($key,sanitize_text_field((string)$data[$key]));$product->save();return ['ok'=>true,'woocommerce_product_id'=>$id];}
	public static function product_box():void{add_meta_box('nexo_trace','NEXO · Trazabilidad',[__CLASS__,'product_trace'],'product','side','default');}
	public static function product_trace(WP_Post $post):void{$p=wc_get_product($post->ID);if(!$p)return;foreach(['nexo_capture_id'=>'Captura','commerce_id'=>'Comercio','nexo_verified_at'=>'Verificado','nexo_price_rule_id'=>'Regla de precio'] as $key=>$label){$value=$p->get_meta($key,true);echo '<p><strong>'.esc_html($label).':</strong><br>'.esc_html($value?:'Pendiente').'</p>';}}
	public static function order_trace(WC_Order $order):void{$captureIds=[];foreach($order->get_items() as $item){$p=$item->get_product();if($p&&$p->get_meta('nexo_capture_id',true))$captureIds[]=$p->get_meta('nexo_capture_id',true);}if(!$captureIds)return;echo '<div class="order_data_column"><h4>NEXO</h4><p><strong>Capturas:</strong> '.esc_html(implode(', ',array_unique($captureIds))).'</p><p><strong>Atribución:</strong> '.esc_html($order->get_meta('gestora_nombre',true)?:'Venta directa').'</p></div>';}
}
register_activation_hook(__FILE__,['NEXO_Product_Studio_Plugin','activate']);add_action('plugins_loaded',['NEXO_Product_Studio_Plugin','boot'],30);
