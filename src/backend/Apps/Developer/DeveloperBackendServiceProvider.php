<?php
/**
 * Developer Tools Backend Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Developer
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Developer;

use AIReady\WPPluginBoilerplate\Backend\Apps\Developer\Rest\DevOpenApiController;
use AIReady\WPPluginBoilerplate\Framework\Container\Container;
use AIReady\WPPluginBoilerplate\Framework\Container\ServiceProviderInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Service provider for development-only backend tooling, routes, and capabilities.
 */
class DeveloperBackendServiceProvider implements ServiceProviderInterface {

	/**
	 * Register developer services in DI container.
	 *
	 * @param Container $container Container instance.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// No container bindings required currently.
	}

	/**
	 * Boot developer service provider and hooks.
	 *
	 * @return void
	 */
	public function boot(): void {
		if ( function_exists( 'add_action' ) ) {
			add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		}
	}

	/**
	 * Determine whether plugin development mode is active.
	 *
	 * @return bool
	 */
	public static function is_dev_mode(): bool {
		if ( function_exists( 'wp_is_development_mode' ) && wp_is_development_mode( 'plugin' ) ) {
			return true;
		}

		if ( function_exists( 'wp_get_development_mode' ) ) {
			$mode = wp_get_development_mode();
			if ( 'all' === $mode || 'plugin' === $mode ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Register development REST routes when plugin development mode is active.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		if ( ! self::is_dev_mode() ) {
			return;
		}

		$controller = new DevOpenApiController();
		$controller->register_routes();
	}
}
