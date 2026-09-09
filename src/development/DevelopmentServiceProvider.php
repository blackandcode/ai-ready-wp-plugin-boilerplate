<?php
/**
 * Master Development Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Development
 */

namespace AIReady\WPPluginBoilerplate\Development;

use AIReady\WPPluginBoilerplate\Development\Cli\DeveloperCliServiceProvider;
use AIReady\WPPluginBoilerplate\Development\Rest\DevOpenApiController;
use AIReady\WPPluginBoilerplate\Framework\Container\Container;
use AIReady\WPPluginBoilerplate\Framework\Container\ServiceProviderInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Service provider for development-only tools, routes, and capabilities.
 * Registered strictly when DevelopmentMode::is_plugin_development() is true.
 */
class DevelopmentServiceProvider implements ServiceProviderInterface {

	/**
	 * DI Container instance.
	 *
	 * @var Container|null
	 */
	private ?Container $container = null;

	/**
	 * Developer CLI service provider.
	 *
	 * @var DeveloperCliServiceProvider
	 */
	private DeveloperCliServiceProvider $cli_provider;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->cli_provider = new DeveloperCliServiceProvider();
	}

	/**
	 * Register developer services in DI container.
	 *
	 * @param Container $container Container instance.
	 * @return void
	 */
	public function register( Container $container ): void {
		$this->container = $container;

		if ( ! $container->has( DevOpenApiController::class ) ) {
			$container->bind(
				DevOpenApiController::class,
				static function () {
					return new DevOpenApiController();
				}
			);
		}

		$this->cli_provider->register( $container );
	}

	/**
	 * Boot developer service provider and attach development hooks.
	 *
	 * @return void
	 */
	public function boot(): void {
		if ( function_exists( 'add_action' ) ) {
			add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		}

		$this->cli_provider->boot();
	}

	/**
	 * Register development REST routes.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		if ( null !== $this->container && $this->container->has( DevOpenApiController::class ) ) {
			$controller = $this->container->get( DevOpenApiController::class );
		} else {
			$controller = new DevOpenApiController();
		}

		$controller->register_routes();
	}
}
