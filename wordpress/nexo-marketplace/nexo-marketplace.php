<?php
/**
 * Plugin Name: NEXO Marketplace
 * Description: Identidad NEXO, disponibilidad y compatibilidad de atribución para WooCommerce/Casa Viva.
 * Version: 0.1.0
 * Author: NEXO
 * Requires PHP: 8.0
 * Requires Plugins: woocommerce
 */
defined('ABSPATH') || exit;
final class NEXO_Marketplace_Plugin {
	const VERSION='0.1.0';
	public static function boot():void{add_action('wp_enqueue_scripts',[__CLASS__,'assets'],30);add_action('woocommerce_single_product_summary',[__CLASS__,'availability'],22);add_action('woocommerce_checkout_create_order',[__CLASS__,'order_meta'],35,2);add_filter('woocommerce_get_breadcrumb',[__CLASS__,'breadcrumb']);add_action('admin_notices',[__CLASS__,'compatibility_notice']);}
	public static function assets():void{if(function_exists('is_woocommerce')&&(is_woocommerce()||is_cart()||is_checkout()))wp_enqueue_style('nexo-marketplace',plugins_url('assets/marketplace.css',__FILE__),[],self::VERSION);}
	public static function availability():void{global $product;if(!$product)return;$requires='required'===$product->get_meta('nexo_availability_confirmation',true);if($requires)echo '<div class="nexo-availability"><strong>Confirmamos antes de completar la compra</strong><span>Producto sujeto a confirmación de disponibilidad. NEXO verifica existencia y precio antes de completar la compra.</span></div>';}
	public static function order_meta(WC_Order $order,array $data):void{unset($data);$order->update_meta_data('_nexo_marketplace_order','yes');$order->update_meta_data('_nexo_marketplace_version',self::VERSION);if(!$order->get_meta('_cvd_owner_user_id',true))$order->update_meta_data('_nexo_attribution_fallback','organic');}
	public static function breadcrumb(array $crumbs):array{if($crumbs)$crumbs[0][0]='NEXO';return $crumbs;}
	public static function compatibility_notice():void{if(!current_user_can('manage_woocommerce')||class_exists('CVD_Attribution'))return;echo '<div class="notice notice-info"><p><strong>NEXO Marketplace:</strong> Casa Viva Attribution no está activo. Los pedidos funcionan, pero los enlaces de gestora requieren el plugin Casa Viva.</p></div>';}
}
add_action('plugins_loaded',['NEXO_Marketplace_Plugin','boot'],30);
