<?php
defined('WP_UNINSTALL_PLUGIN') || exit;
// Conserva trazabilidad de productos y pedidos. Solo elimina la configuración del puente.
delete_option('nexo_studio_settings');
