<?php
/**
 * REST Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Rest
 */

namespace AIReady\WPPluginBoilerplate\Rest;

use AIReady\WPPluginBoilerplate\Bootstrap\Container;
use AIReady\WPPluginBoilerplate\Bootstrap\ServiceProvider;
use AIReady\WPPluginBoilerplate\Diagnostics\Application\DiagnosticsService;
use AIReady\WPPluginBoilerplate\Diagnostics\Domain\DiagnosticsProviderInterface;
use AIReady\WPPluginBoilerplate\Diagnostics\Infrastructure\WordPressDiagnosticsProvider;
use AIReady\WPPluginBoilerplate\Event\EventDispatcher;
use AIReady\WPPluginBoilerplate\Event\EventDispatcherInterface;
use AIReady\WPPluginBoilerplate\Rest\Controller\DiagnosticsController;
use AIReady\WPPluginBoilerplate\Rest\Controller\HelloWorldController;
use AIReady\WPPluginBoilerplate\Rest\Controller\SettingsController;
use AIReady\WPPluginBoilerplate\Settings\Application\SettingsApplicationService;
use AIReady\WPPluginBoilerplate\Settings\Domain\Repository\SettingsRepositoryInterface;
use AIReady\WPPluginBoilerplate\Settings\Infrastructure\SettingsRepository;
use AIReady\WPPluginBoilerplate\Settings\Infrastructure\WordPressSettingsRepository;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Service provider for registering REST controllers and core application services.
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

		// Event dispatcher binding.
		if ( ! $container->has( EventDispatcherInterface::class ) ) {
			$container->bind(
				EventDispatcherInterface::class,
				static function () {
					return new EventDispatcher();
				}
			);
		}

		// Repository bindings.
		if ( ! $container->has( SettingsRepositoryInterface::class ) ) {
			$container->bind(
				SettingsRepositoryInterface::class,
				static function () {
					return new WordPressSettingsRepository();
				}
			);
		}

		if ( ! $container->has( SettingsRepository::class ) ) {
			$container->bind(
				SettingsRepository::class,
				static function () {
					return new SettingsRepository();
				}
			);
		}

		// Diagnostics bindings.
		if ( ! $container->has( DiagnosticsProviderInterface::class ) ) {
			$container->bind(
				DiagnosticsProviderInterface::class,
				static function () {
					return new WordPressDiagnosticsProvider();
				}
			);
		}

		if ( ! $container->has( DiagnosticsService::class ) ) {
			$container->bind(
				DiagnosticsService::class,
				static function ( Container $c ) {
					return new DiagnosticsService( $c->get( DiagnosticsProviderInterface::class ) );
				}
			);
		}

		// Core application service binding.
		if ( ! $container->has( SettingsApplicationService::class ) ) {
			$container->bind(
				SettingsApplicationService::class,
				static function ( Container $c ) {
					return new SettingsApplicationService(
						$c->get( SettingsRepositoryInterface::class ),
						$c->get( EventDispatcherInterface::class )
					);
				}
			);
		}

		// Controller bindings.
		$container->bind(
			HelloWorldController::class,
			static function () {
				return new HelloWorldController();
			}
		);

		$container->bind(
			SettingsController::class,
			static function ( Container $c ) {
				return new SettingsController( $c->get( SettingsApplicationService::class ) );
			}
		);

		$container->bind(
			DiagnosticsController::class,
			static function ( Container $c ) {
				return new DiagnosticsController( $c->get( DiagnosticsService::class ) );
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

		$diagnostics_controller = $this->container->get( DiagnosticsController::class );
		$diagnostics_controller->register_routes();
	}
}
