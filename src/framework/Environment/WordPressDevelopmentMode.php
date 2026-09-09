<?php
/**
 * WordPress Development Mode Adapter.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Environment
 */

namespace AIReady\WPPluginBoilerplate\Framework\Environment;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Concrete implementation reading development mode state from WordPress Core APIs.
 */
final class WordPressDevelopmentMode implements DevelopmentMode {

	/**
	 * Determine whether plugin development mode is active.
	 *
	 * Evaluates wp_is_development_mode('plugin') or checks whether 'all' or 'plugin' is active.
	 *
	 * @return bool
	 */
	public function is_plugin_development(): bool {
		if ( function_exists( 'wp_is_development_mode' ) && wp_is_development_mode( 'plugin' ) ) {
			return true;
		}

		$mode = $this->get_mode();
		return 'all' === $mode || 'plugin' === $mode;
	}

	/**
	 * Get the active development mode string.
	 *
	 * @return string
	 */
	public function get_mode(): string {
		if ( function_exists( 'wp_get_development_mode' ) ) {
			return (string) wp_get_development_mode();
		}

		return '';
	}
}
