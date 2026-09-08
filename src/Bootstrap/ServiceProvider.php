<?php
/**
 * Service Provider Contract.
 *
 * @package AIReady\WPPluginBoilerplate\Bootstrap
 */

namespace AIReady\WPPluginBoilerplate\Bootstrap;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Interface for module service providers.
 */
interface ServiceProvider {

	/**
	 * Register services in the container.
	 *
	 * @param Container $container DI Container instance.
	 * @return void
	 */
	public function register( Container $container ): void;

	/**
	 * Boot services (hooks, event listeners, registrations).
	 *
	 * @return void
	 */
	public function boot(): void;
}
