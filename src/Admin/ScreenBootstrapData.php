<?php
/**
 * Screen Bootstrap Data Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Admin
 */

namespace AIReady\WPPluginBoilerplate\Admin;

use AIReady\WPPluginBoilerplate\Bootstrap\Plugin;
use AIReady\WPPluginBoilerplate\Settings\Infrastructure\SettingsRepository;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Builds localized JavaScript configuration payload for React admin apps.
 */
class ScreenBootstrapData {

	/**
	 * Build payload array.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_payload(): array {
		$repository = new SettingsRepository();

		return array(
			'apiBase'         => esc_url_raw( rest_url( 'ai-ready-wp/v1' ) ),
			'nonce'           => wp_create_nonce( 'wp_rest' ),
			'version'         => Plugin::VERSION,
			'currentUserCan'  => array(
				'manageOptions' => current_user_can( 'manage_options' ),
			),
			'initialSettings' => $repository->get_all(),
			'environment'     => array(
				'phpVersion'      => PHP_VERSION,
				'wpVersion'       => get_bloginfo( 'version' ),
				'environmentType' => wp_get_environment_type(),
			),
		);
	}
}
