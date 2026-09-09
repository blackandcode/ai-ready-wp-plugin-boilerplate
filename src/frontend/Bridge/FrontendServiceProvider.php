<?php
/**
 * Master Frontend Presentation Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Frontend
 */

namespace AIReady\WPPluginBoilerplate\Frontend;

use AIReady\WPPluginBoilerplate\Framework\Container\Container;
use AIReady\WPPluginBoilerplate\Framework\Container\ServiceProviderInterface;
use AIReady\WPPluginBoilerplate\Frontend\Block\BlockRegistry;
use AIReady\WPPluginBoilerplate\Frontend\Pattern\PatternRegistry;
use AIReady\WPPluginBoilerplate\Frontend\Settings\SettingsAdminMenu;
use AIReady\WPPluginBoilerplate\Frontend\Settings\SettingsAssets;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Boots all presentation lifecycle hooks, admin menus, asset enqueuers, and block/pattern registries.
 */
class FrontendServiceProvider implements ServiceProviderInterface {

	/**
	 * Register frontend presentation services.
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Presentation services use static registrations.
	}

	/**
	 * Boot presentation hooks and lifecycle integrations.
	 *
	 * @return void
	 */
	public function boot(): void {
		// Admin UI: menu & scripts.
		SettingsAdminMenu::boot();
		add_action( 'admin_menu', array( SettingsAdminMenu::class, 'register_menu' ) );
		SettingsAssets::register();

		// Gutenberg blocks & patterns.
		add_action( 'init', array( BlockRegistry::class, 'register_blocks' ) );
		add_action( 'init', array( PatternRegistry::class, 'register_patterns' ) );
	}
}
