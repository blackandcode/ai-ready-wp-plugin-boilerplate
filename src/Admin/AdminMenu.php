<?php
/**
 * Top-Level Admin Menu Page Registration.
 *
 * @package AIReady\WPPluginBoilerplate\Admin
 */

namespace AIReady\WPPluginBoilerplate\Admin;

use AIReady\WPPluginBoilerplate\Support\View\TemplateRenderer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers top-level Boilerplate admin menu page and settings submenu.
 */
class AdminMenu {

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
			AdminRoute::SETTINGS_SLUG,
			array( self::class, 'render_settings_page' ),
			$icon_svg,
			65
		);

		add_submenu_page(
			AdminRoute::SETTINGS_SLUG,
			__( 'Boilerplate Settings', 'ai-ready-wp-plugin-boilerplate' ),
			__( 'Settings', 'ai-ready-wp-plugin-boilerplate' ),
			'manage_options',
			AdminRoute::SETTINGS_SLUG,
			array( self::class, 'render_settings_page' )
		);
	}

	/**
	 * Render settings shell template.
	 *
	 * @return void
	 */
	public static function render_settings_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'ai-ready-wp-plugin-boilerplate' ) );
		}

		TemplateRenderer::instance()->render( 'admin/admin-settings-root.php' );
	}
}
