<?php
/**
 * Settings Admin Menu Page Registration.
 *
 * @package AIReady\WPPluginBoilerplate\Frontend\Apps\Settings
 */

namespace AIReady\WPPluginBoilerplate\Frontend\Apps\Settings;

use AIReady\WPPluginBoilerplate\Framework\View\TemplateRenderer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers top-level Boilerplate admin menu page and settings submenu.
 */
class SettingsAdminMenu {

	/**
	 * Boot hooks and action handlers for settings admin page.
	 *
	 * @return void
	 */
	public static function boot(): void {
		if ( function_exists( 'add_action' ) ) {
			add_action( 'airwp_render_settings_page', array( self::class, 'render_settings_view' ) );
			add_action( 'airwp_settings_app_placeholder', array( self::class, 'render_loading_placeholder' ) );
		}
	}

	/**
	 * Register admin menu pages.
	 *
	 * @return void
	 */
	public static function register_menu(): void {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Benign SVG data URI encoding for admin menu icon.
		$icon_svg = 'data:image/svg+xml;base64,' . base64_encode(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>'
		);

		add_menu_page(
			__( 'AI Boilerplate', 'ai-ready-wp-plugin-boilerplate' ),
			__( 'AI Boilerplate', 'ai-ready-wp-plugin-boilerplate' ),
			'manage_options',
			SettingsRoute::SETTINGS_SLUG,
			array( self::class, 'render_settings_page' ),
			$icon_svg,
			65
		);

		add_submenu_page(
			SettingsRoute::SETTINGS_SLUG,
			__( 'Boilerplate Settings', 'ai-ready-wp-plugin-boilerplate' ),
			__( 'Settings', 'ai-ready-wp-plugin-boilerplate' ),
			'manage_options',
			SettingsRoute::SETTINGS_SLUG,
			array( self::class, 'render_settings_page' )
		);
	}

	/**
	 * Render settings shell template by firing lifecycle action hooks.
	 *
	 * @return void
	 */
	public static function render_settings_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'ai-ready-wp-plugin-boilerplate' ) );
		}

		/**
		 * Fires before rendering the boilerplate settings admin page.
		 */
		do_action( 'airwp_before_settings_page' );

		/**
		 * Fires to render the boilerplate settings admin page root container.
		 */
		do_action( 'airwp_render_settings_page' );

		/**
		 * Fires after rendering the boilerplate settings admin page.
		 */
		do_action( 'airwp_after_settings_page' );
	}

	/**
	 * Render settings app root template.
	 *
	 * @return void
	 */
	public static function render_settings_view(): void {
		TemplateRenderer::instance()->render( 'apps/settings/templates/admin-settings-root.php' );
	}

	/**
	 * Render loading placeholder within settings root container.
	 *
	 * @return void
	 */
	public static function render_loading_placeholder(): void {
		TemplateRenderer::instance()->render( 'partials/app-loading.php' );
	}
}
