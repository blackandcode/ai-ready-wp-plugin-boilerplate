<?php
/**
 * Hello World Backend Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld;

use AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Application\HelloWorldService;
use AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Rest\HelloWorldController;
use AIReady\WPPluginBoilerplate\Framework\Container\Container;
use AIReady\WPPluginBoilerplate\Framework\Container\ServiceProviderInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Service provider for headless Hello World App backend services.
 */
class HelloWorldBackendServiceProvider implements ServiceProviderInterface {

	/**
	 * Container instance reference.
	 *
	 * @var Container|null
	 */
	private ?Container $container = null;

	/**
	 * Register services in container.
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	public function register( Container $container ): void {
		$this->container = $container;

		if ( ! $container->has( HelloWorldService::class ) ) {
			$container->bind(
				HelloWorldService::class,
				static function () {
					return new HelloWorldService();
				}
			);
		}

		$container->bind(
			HelloWorldController::class,
			static function ( Container $c ) {
				return new HelloWorldController( $c->get( HelloWorldService::class ) );
			}
		);
	}

	/**
	 * Boot services.
	 *
	 * @return void
	 */
	public function boot(): void {
		if ( function_exists( 'add_action' ) ) {
			add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		}
	}

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		if ( null === $this->container ) {
			return;
		}

		$controller = $this->container->get( HelloWorldController::class );
		$controller->register_routes();
	}
}
