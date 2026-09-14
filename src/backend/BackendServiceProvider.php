<?php
/**
 * Master Backend Service Provider.
 *
 * @package WPAIBP\Backend
 */

namespace WPAIBP\Backend;

use WP_CLI;
use WPAIBP\Backend\Apps\Diagnostics\DiagnosticsBackendServiceProvider;
use WPAIBP\Backend\Apps\HelloWorld\HelloWorldBackendServiceProvider;
use WPAIBP\Backend\Apps\Settings\SettingsBackendServiceProvider;
use WPAIBP\Backend\Cli\PluginCliCommand;
use WPAIBP\Framework\Container\Container;
use WPAIBP\Framework\Container\ServiceProviderInterface;
use WPAIBP\Framework\Event\EventDispatcher;
use WPAIBP\Framework\Event\EventDispatcherInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Master service provider aggregating and booting all headless backend apps.
 */
class BackendServiceProvider implements ServiceProviderInterface {

	/**
	 * Sub-providers.
	 *
	 * @var ServiceProviderInterface[]
	 */
	private array $sub_providers = array();

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->sub_providers = array(
			new SettingsBackendServiceProvider(),
			new DiagnosticsBackendServiceProvider(),
			new HelloWorldBackendServiceProvider(),
		);
	}

	/**
	 * Register all backend services.
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	public function register( Container $container ): void {
		// Bind shared event dispatcher if not already registered.
		if ( ! $container->has( EventDispatcherInterface::class ) ) {
			$container->bind(
				EventDispatcherInterface::class,
				static function () {
					return new EventDispatcher();
				}
			);
		}

		foreach ( $this->sub_providers as $provider ) {
			$provider->register( $container );
		}
	}

	/**
	 * Boot all backend services.
	 *
	 * @return void
	 */
	public function boot(): void {
		foreach ( $this->sub_providers as $provider ) {
			$provider->boot();
		}

		// Register Abilities API category.
		if ( function_exists( 'add_action' ) ) {
			add_action( 'wp_abilities_api_categories_init', array( $this, 'register_abilities_category' ) );
		}

		// Register WP-CLI command.
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			WP_CLI::add_command( 'ai-ready', PluginCliCommand::class );
		}
	}

	/**
	 * Register shared category in WordPress Abilities API.
	 *
	 * @return void
	 */
	public function register_abilities_category(): void {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		wp_register_ability_category(
			'wpaibp',
			array(
				'label'       => __( 'AI-Ready WP Plugin', 'wp-ai-ready-plugin-boilerplate' ),
				'description' => __( 'Domain capabilities for inspecting and modifying plugin settings and telemetry.', 'wp-ai-ready-plugin-boilerplate' ),
			)
		);
	}
}
