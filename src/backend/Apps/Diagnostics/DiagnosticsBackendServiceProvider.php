<?php
/**
 * Diagnostics Backend Service Provider.
 *
 * @package WPAIBP\Backend\Apps\Diagnostics
 */

namespace WPAIBP\Backend\Apps\Diagnostics;

use WPAIBP\Backend\Apps\Diagnostics\Abilities\DiagnosticsAbilities;
use WPAIBP\Backend\Apps\Diagnostics\Application\DiagnosticsService;
use WPAIBP\Backend\Apps\Diagnostics\Domain\DiagnosticsProviderInterface;
use WPAIBP\Backend\Apps\Diagnostics\Infrastructure\WordPressDiagnosticsProvider;
use WPAIBP\Backend\Apps\Diagnostics\Rest\DiagnosticsController;
use WPAIBP\Framework\Container\Container;
use WPAIBP\Framework\Container\ServiceProviderInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Service provider for headless Diagnostics App backend services.
 */
class DiagnosticsBackendServiceProvider implements ServiceProviderInterface {

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

		$container->bind(
			DiagnosticsController::class,
			static function ( Container $c ) {
				return new DiagnosticsController( $c->get( DiagnosticsService::class ) );
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
			add_action( 'wp_abilities_api_init', array( DiagnosticsAbilities::class, 'register' ) );
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

		$controller = $this->container->get( DiagnosticsController::class );
		$controller->register_routes();
	}
}
