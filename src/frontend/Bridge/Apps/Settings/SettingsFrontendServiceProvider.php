<?php
/**
 * Settings Frontend Presentation Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Frontend\Apps\Settings
 */

namespace AIReady\WPPluginBoilerplate\Frontend\Apps\Settings;

use AIReady\WPPluginBoilerplate\Framework\Container\Container;
use AIReady\WPPluginBoilerplate\Framework\Container\ServiceProviderInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Boots presentation lifecycle hooks, admin menus, and asset enqueuers for Settings app.
 */
class SettingsFrontendServiceProvider implements ServiceProviderInterface {

	/**
	 * Register frontend services.
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Presentation services use static registrations.
	}

	/**
	 * Boot presentation hooks and lifecycle integrations for Settings app.
	 *
	 * @return void
	 */
	public function boot(): void {
		SettingsAdminMenu::boot();
		if ( function_exists( 'add_action' ) ) {
			add_action( 'admin_menu', array( SettingsAdminMenu::class, 'register_menu' ) );
		}
		SettingsAssets::register();
	}
}
