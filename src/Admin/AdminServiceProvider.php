<?php
/**
 * Admin Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Admin
 */

namespace AIReady\WPPluginBoilerplate\Admin;

use AIReady\WPPluginBoilerplate\Bootstrap\Container;
use AIReady\WPPluginBoilerplate\Bootstrap\ServiceProvider;
use AIReady\WPPluginBoilerplate\Support\View\TemplateRenderer;
use AIReady\WPPluginBoilerplate\Support\View\TemplateRendererInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Service provider for registering admin menus, assets, and handlers.
 */
class AdminServiceProvider implements ServiceProvider {

	/**
	 * Register services in DI container.
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	public function register( Container $container ): void {
		$container->bind(
			TemplateRendererInterface::class,
			function (): TemplateRendererInterface {
				return TemplateRenderer::instance();
			}
		);
	}

	/**
	 * Boot admin services.
	 *
	 * @return void
	 */
	public function boot(): void {
		if ( ! is_admin() ) {
			return;
		}

		add_action( 'admin_menu', array( AdminMenu::class, 'register_menu' ) );
		AdminAssets::register();
	}
}
