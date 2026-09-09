<?php
/**
 * Settings Bootstrap Data Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Frontend\Apps\Settings
 */

namespace AIReady\WPPluginBoilerplate\Frontend\Apps\Settings;

use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Infrastructure\WordPressSettingsRepository;
use AIReady\WPPluginBoilerplate\Framework\Environment\DevelopmentMode;
use AIReady\WPPluginBoilerplate\Framework\Environment\WordPressDevelopmentMode;
use AIReady\WPPluginBoilerplate\Framework\Kernel\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Builds localized JavaScript configuration payload for React admin apps.
 */
class SettingsBootstrapData {

	/**
	 * Determine whether plugin development mode is active.
	 *
	 * @return bool
	 */
	public static function is_plugin_dev_mode(): bool {
		$container = Plugin::instance()->get_container();
		if ( null !== $container && $container->has( DevelopmentMode::class ) ) {
			return $container->get( DevelopmentMode::class )->is_plugin_development();
		}

		$dev_mode = new WordPressDevelopmentMode();
		return $dev_mode->is_plugin_development();
	}

	/**
	 * Build payload array.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_payload(): array {
		$repository  = new WordPressSettingsRepository();
		$plugin_mode = self::is_plugin_dev_mode();

		$development = array(
			'pluginMode' => $plugin_mode,
		);

		if ( $plugin_mode ) {
			$development['openApiEndpoint'] = esc_url_raw( rest_url( 'ai-ready-wp-dev/v1/openapi' ) );
			$development['openApiPath']     = '/ai-ready-wp-dev/v1/openapi';
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
