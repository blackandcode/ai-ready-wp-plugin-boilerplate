<?php
/**
 * Plugin deactivation handler.
 *
 * @package AIReady\WPPluginBoilerplate\Bootstrap
 */

namespace AIReady\WPPluginBoilerplate\Bootstrap;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles plugin deactivation routines.
 */
class Deactivation {

	/**
	 * Run deactivation logic.
	 */
	public static function deactivate(): void {
		flush_rewrite_rules();
	}
}
