<?php
/**
 * Settings script and style enqueue for React application.
 *
 * @package WPAIBP\Frontend\Apps\Settings
 */

namespace WPAIBP\Frontend\Apps\Settings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueues screen-scoped admin assets with bootstrap data.
 */
class SettingsAssets {

	/**
	 * Register admin asset hooks.
	 *
	 * @return void
	 */
	public static function register(): void {
		if ( function_exists( 'add_action' ) ) {
			add_action( 'admin_enqueue_scripts', array( self::class, 'enqueue' ) );
		}
	}

	/**
	 * Enqueue assets for plugin admin screens.
	 *
	 * @param string $hook_suffix Current admin page hook suffix.
	 * @return void
	 */
	public static function enqueue( string $hook_suffix ): void {
		if ( ! SettingsRoute::is_screen( $hook_suffix, SettingsRoute::SETTINGS_SLUG ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$plugin_dir = defined( 'WPAIBP_PLUGIN_DIR' ) ? WPAIBP_PLUGIN_DIR : dirname( __DIR__, 5 ) . '/';
		$plugin_url = defined( 'WPAIBP_PLUGIN_URL' ) ? WPAIBP_PLUGIN_URL : plugin_dir_url( $plugin_dir . 'wp-ai-ready-plugin-boilerplate.php' );
		$version    = defined( 'WPAIBP_VERSION' ) ? WPAIBP_VERSION : '1.4.0';

		$script_path = 'build/admin/settings/index.js';
		$style_path  = 'build/admin/settings/index.css';
		$handle      = 'wpaibp-admin-settings';

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
					'wp-i18n',
					'wp-api-fetch',
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

		if ( file_exists( $plugin_dir . $style_path ) ) {
			wp_enqueue_style(
				$handle,
				$plugin_url . $style_path,
				array( 'wp-components' ),
				$asset_meta['version']
			);
		}

		$payload = SettingsBootstrapData::get_payload();

		wp_localize_script(
			$handle,
			'wpaibpAdminBootstrap',
			$payload
		);
	}
}
