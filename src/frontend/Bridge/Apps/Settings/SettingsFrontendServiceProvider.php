<?php
/**
 * Settings Frontend Presentation Service Provider.
 *
 * @package WPAIBP\Frontend\Apps\Settings
 */

namespace WPAIBP\Frontend\Apps\Settings;

use WPAIBP\Framework\Container\Container;
use WPAIBP\Framework\Container\ServiceProviderInterface;

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
