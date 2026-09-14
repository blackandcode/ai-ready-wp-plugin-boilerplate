<?php
/**
 * Plugin Name: WP AI Ready Plugin Boilerplate
 * Plugin URI: https://github.com/wordpress-ai/wp-ai-ready-plugin-boilerplate
 * Description: Production-ready WordPress plugin boilerplate built for modern agentic AI development workflows.
 * Version: 1.3.3
 * Requires at least: 7.1
 * Requires PHP: 8.3
 * Author: Plugin Developer
 * License: MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: wp-ai-ready-plugin-boilerplate
 * Domain Path: /languages
 *
 * @package WPAIBP
 */

use WPAIBP\Framework\Kernel\Activation;
use WPAIBP\Framework\Kernel\Deactivation;
use WPAIBP\Framework\Kernel\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WPAIBP_PLUGIN_FILE', __FILE__ );
define( 'WPAIBP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'WPAIBP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'WPAIBP_VERSION', '1.3.3' );

if ( file_exists( WPAIBP_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
	require_once WPAIBP_PLUGIN_DIR . 'vendor/autoload.php';
}

register_activation_hook( __FILE__, array( Activation::class, 'activate' ) );
register_deactivation_hook( __FILE__, array( Deactivation::class, 'deactivate' ) );

add_action(
	'plugins_loaded',
	static function () {
		Plugin::instance()->boot();
	}
);
