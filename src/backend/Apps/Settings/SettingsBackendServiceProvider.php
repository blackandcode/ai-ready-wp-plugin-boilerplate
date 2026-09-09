<?php
/**
 * Settings Backend Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings;

use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Abilities\SettingsAbilities;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\SettingsApplicationService;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Repository\SettingsRepositoryInterface;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Infrastructure\SettingsRepository;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Infrastructure\WordPressSettingsRepository;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Rest\SettingsController;
use AIReady\WPPluginBoilerplate\Framework\Container\Container;
use AIReady\WPPluginBoilerplate\Framework\Container\ServiceProviderInterface;
use AIReady\WPPluginBoilerplate\Framework\Event\EventDispatcherInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Service provider for headless Settings App backend services.
 */
class SettingsBackendServiceProvider implements ServiceProviderInterface {

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

		$container->bind(
			SettingsController::class,
			static function ( Container $c ) {
				return new SettingsController( $c->get( SettingsApplicationService::class ) );
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
			add_action( 'wp_abilities_api_init', array( SettingsAbilities::class, 'register' ) );
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

		$controller = $this->container->get( SettingsController::class );
		$controller->register_routes();
	}
}
