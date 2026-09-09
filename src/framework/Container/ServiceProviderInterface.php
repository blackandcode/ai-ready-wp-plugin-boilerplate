<?php
/**
 * Service Provider Contract.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Container
 */

namespace AIReady\WPPluginBoilerplate\Framework\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Interface for module service providers.
 */
interface ServiceProviderInterface {

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
