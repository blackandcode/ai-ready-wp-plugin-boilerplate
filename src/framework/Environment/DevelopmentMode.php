<?php
/**
 * Development Mode Contract.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Environment
 */

namespace AIReady\WPPluginBoilerplate\Framework\Environment;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Interface defining development mode detection contract.
 */
interface DevelopmentMode {

	/**
	 * Determine whether plugin development mode is active.
	 *
	 * @return bool True if plugin development mode is enabled, false otherwise.
	 */
	public function is_plugin_development(): bool;

	/**
	 * Get the active development mode string ('all', 'plugin', 'theme', 'core', or empty string).
	 *
	 * @return string
	 */
	public function get_mode(): string;
}
