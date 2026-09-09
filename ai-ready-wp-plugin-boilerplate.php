<?php
/**
 * Plugin Name: AI-Ready WP Plugin Boilerplate
 * Plugin URI: https://github.com/wordpress-ai/ai-ready-wp-plugin-boilerplate
 * Description: Production-ready WordPress plugin boilerplate built for modern agentic AI development workflows.
 * Version: 1.1.0
 * Requires at least: 7.0
 * Requires PHP: 8.3
 * Author: WordPress AI Team
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: ai-ready-wp-plugin-boilerplate
 * Domain Path: /languages
 *
 * @package AIReady\WPPluginBoilerplate
 */

use AIReady\WPPluginBoilerplate\Framework\Kernel\Activation;
use AIReady\WPPluginBoilerplate\Framework\Kernel\Deactivation;
use AIReady\WPPluginBoilerplate\Framework\Kernel\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AIRWP_PLUGIN_FILE', __FILE__ );
define( 'AIRWP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'AIRWP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'AIRWP_VERSION', '1.1.0' );

if ( file_exists( AIRWP_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
	require_once AIRWP_PLUGIN_DIR . 'vendor/autoload.php';
}

register_activation_hook( __FILE__, array( Activation::class, 'activate' ) );
register_deactivation_hook( __FILE__, array( Deactivation::class, 'deactivate' ) );

add_action(
	'plugins_loaded',
	static function () {
		Plugin::instance()->boot();
	}
);
