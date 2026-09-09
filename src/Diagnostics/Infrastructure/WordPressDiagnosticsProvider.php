<?php
/**
 * WordPress Diagnostics Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Diagnostics\Infrastructure
 */

namespace AIReady\WPPluginBoilerplate\Diagnostics\Infrastructure;

use AIReady\WPPluginBoilerplate\Bootstrap\Plugin;
use AIReady\WPPluginBoilerplate\Diagnostics\Domain\DiagnosticsProviderInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Concrete WordPress diagnostics provider gathering system telemetry.
 */
class WordPressDiagnosticsProvider implements DiagnosticsProviderInterface {

	/**
	 * Retrieve runtime health metrics.
	 *
	 * @return array<string, mixed>
	 */
	public function get_metrics(): array {
		global $wpdb;

		$db_status = 'connected';
		if ( isset( $wpdb ) && method_exists( $wpdb, 'check_connection' ) ) {
			$db_status = $wpdb->check_connection( false ) ? 'connected' : 'disconnected';
		} elseif ( ! isset( $wpdb ) || ! $wpdb->ready ) {
			$db_status = 'unready';
		}

		$wp_version = function_exists( 'get_bloginfo' ) ? get_bloginfo( 'version' ) : '7.0';
		$env_type   = function_exists( 'wp_get_environment_type' ) ? wp_get_environment_type() : 'local';

		return array(
			'php_version'      => PHP_VERSION,
			'wp_version'       => (string) $wp_version,
			'environment_type' => (string) $env_type,
			'db_status'        => $db_status,
			'rest_status'      => function_exists( 'rest_url' ) ? 'available' : 'unavailable',
			'plugin_version'   => defined( 'AIRWP_VERSION' ) ? AIRWP_VERSION : Plugin::VERSION,
		);
	}
}
