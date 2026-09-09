<?php
/**
 * Master Frontend Presentation Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Frontend
 */

namespace AIReady\WPPluginBoilerplate\Frontend;

use AIReady\WPPluginBoilerplate\Framework\Container\Container;
use AIReady\WPPluginBoilerplate\Framework\Container\ServiceProviderInterface;
use AIReady\WPPluginBoilerplate\Frontend\Apps\Settings\SettingsFrontendServiceProvider;
use AIReady\WPPluginBoilerplate\Frontend\Registry\BlockRegistry;
use AIReady\WPPluginBoilerplate\Frontend\Registry\PatternRegistry;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Boots all presentation lifecycle hooks, admin menus, asset enqueuers, and block/pattern registries.
 */
class FrontendServiceProvider implements ServiceProviderInterface {

	/**
	 * Sub-providers for presentation applications.
	 *
	 * @var ServiceProviderInterface[]
	 */
	private array $app_providers = array();

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->app_providers = array(
			new SettingsFrontendServiceProvider(),
		);
	}

	/**
	 * Register frontend presentation services.
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	public function register( Container $container ): void {
		foreach ( $this->app_providers as $provider ) {
			$provider->register( $container );
		}
	}

	/**
	 * Boot presentation hooks and lifecycle integrations.
	 *
	 * @return void
	 */
	public function boot(): void {
		foreach ( $this->app_providers as $provider ) {
			$provider->boot();
		}

		// Gutenberg blocks & patterns.
		if ( function_exists( 'add_action' ) ) {
			add_action( 'init', array( BlockRegistry::class, 'register_blocks' ) );
			add_action( 'init', array( PatternRegistry::class, 'register_patterns' ) );
		}
	}
}
