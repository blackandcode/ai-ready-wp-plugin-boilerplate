<?php
/**
 * REST Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Rest
 */

namespace AIReady\WPPluginBoilerplate\Rest;

use AIReady\WPPluginBoilerplate\Bootstrap\Container;
use AIReady\WPPluginBoilerplate\Bootstrap\ServiceProvider;
use AIReady\WPPluginBoilerplate\Rest\Controller\HelloWorldController;
use AIReady\WPPluginBoilerplate\Rest\Controller\SettingsController;
use AIReady\WPPluginBoilerplate\Settings\Infrastructure\SettingsRepository;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Service provider for registering REST controllers and endpoints.
 */
class RestServiceProvider implements ServiceProvider {

	/**
	 * Container instance reference.
	 *
	 * @var Container|null
	 */
	private ?Container $container = null;

	/**
	 * Register services in DI container.
	 *
	 * @param Container $container Container instance.
	 * @return void
	 */
	public function register( Container $container ): void {
		$this->container = $container;

		$container->bind(
			SettingsRepository::class,
			static function () {
				return new SettingsRepository();
			}
		);

		$container->bind(
			HelloWorldController::class,
			static function () {
				return new HelloWorldController();
			}
		);

		$container->bind(
			SettingsController::class,
			static function ( Container $c ) {
				return new SettingsController( $c->get( SettingsRepository::class ) );
			}
		);
	}

	/**
	 * Boot REST services.
	 *
	 * @return void
	 */
	public function boot(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes callback.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		if ( null === $this->container ) {
			return;
		}

		$hello_controller = $this->container->get( HelloWorldController::class );
		$hello_controller->register_routes();

		$settings_controller = $this->container->get( SettingsController::class );
		$settings_controller->register_routes();
	}
}
