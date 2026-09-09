<?php
/**
 * Plugin deactivation handler.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Kernel
 */

namespace AIReady\WPPluginBoilerplate\Framework\Kernel;

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
