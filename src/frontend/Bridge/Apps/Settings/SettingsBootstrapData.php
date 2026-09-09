<?php
/**
 * Settings Bootstrap Data Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Frontend\Apps\Settings
 */

namespace AIReady\WPPluginBoilerplate\Frontend\Apps\Settings;

use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Infrastructure\WordPressSettingsRepository;
use AIReady\WPPluginBoilerplate\Framework\Kernel\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Builds localized JavaScript configuration payload for React admin apps.
 */
class SettingsBootstrapData {

	/**
	 * Build payload array.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_payload(): array {
		$repository  = new WordPressSettingsRepository();
		$plugin_mode = function_exists( 'wp_is_development_mode' ) && wp_is_development_mode( 'plugin' );

		$development = array(
			'pluginMode' => $plugin_mode,
		);

		if ( $plugin_mode ) {
			$development['openApiEndpoint'] = esc_url_raw( rest_url( 'ai-ready-wp-dev/v1/openapi' ) );
		}

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
			'development'     => $development,
		);
	}
}
