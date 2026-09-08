<?php
/**
 * Admin script and style enqueue for React applications.
 *
 * @package AIReady\WPPluginBoilerplate\Admin
 */

namespace AIReady\WPPluginBoilerplate\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueues screen-scoped admin assets with bootstrap data.
 */
class AdminAssets {

	/**
	 * Register admin asset hooks.
	 *
	 * @return void
	 */
	public static function register(): void {
		add_action( 'admin_enqueue_scripts', array( self::class, 'enqueue' ) );
	}

	/**
	 * Enqueue assets for plugin admin screens.
	 *
	 * @param string $hook_suffix Current admin page hook suffix.
	 * @return void
	 */
	public static function enqueue( string $hook_suffix ): void {
		if ( ! AdminRoute::is_screen( $hook_suffix, AdminRoute::SETTINGS_SLUG ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$plugin_dir = defined( 'AIRWP_PLUGIN_DIR' ) ? AIRWP_PLUGIN_DIR : dirname( __DIR__, 2 ) . '/';
		$plugin_url = defined( 'AIRWP_PLUGIN_URL' ) ? AIRWP_PLUGIN_URL : plugin_dir_url( $plugin_dir . 'ai-ready-wp-plugin-boilerplate.php' );
		$version    = defined( 'AIRWP_VERSION' ) ? AIRWP_VERSION : '1.0.0';

		$script_path = 'build/admin/settings/index.js';
		$style_path  = 'build/admin/settings/index.css';
		$handle      = 'airwp-admin-settings';

		if ( ! file_exists( $plugin_dir . $script_path ) ) {
			return;
		}

		$asset_file = $plugin_dir . 'build/admin/settings/index.asset.php';
		$asset_meta = file_exists( $asset_file )
			? require $asset_file
			: array(
				'dependencies' => array(
					'wp-element',
					'wp-components',
					'wp-api-fetch',
					'wp-i18n',
				),
				'version'      => $version,
			);

		wp_enqueue_script(
			$handle,
			$plugin_url . $script_path,
			$asset_meta['dependencies'],
			$asset_meta['version'],
			true
		);

		wp_localize_script(
			$handle,
			'airwpAdminBootstrap',
			ScreenBootstrapData::get_payload()
		);

		wp_set_script_translations( $handle, 'ai-ready-wp-plugin-boilerplate', $plugin_dir . 'languages' );

		if ( file_exists( $plugin_dir . $style_path ) ) {
			wp_enqueue_style(
				$handle,
				$plugin_url . $style_path,
				array( 'wp-components' ),
				$version
			);
		}
	}
}
