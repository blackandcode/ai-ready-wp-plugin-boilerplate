<?php
/**
 * WordPress Settings Repository Implementation.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Infrastructure
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Infrastructure;

use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Model\PluginSettings;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Repository\SettingsRepositoryInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Concrete WordPress adapter persisting PluginSettings aggregate to wp_options.
 * Enforces explicit autoload=false to prevent autoload table bloat (wp-performance).
 */
class WordPressSettingsRepository implements SettingsRepositoryInterface {

	/**
	 * Retrieve settings aggregate root from wp_options.
	 *
	 * @return PluginSettings
	 */
	public function get(): PluginSettings {
		$raw = get_option( SettingsSchema::OPTION_KEY, array() );

		if ( ! is_array( $raw ) || empty( $raw ) ) {
			return PluginSettings::create_default();
		}

		return PluginSettings::reconstitute( $raw );
	}

	/**
	 * Persist settings aggregate to wp_options.
	 *
	 * @param PluginSettings $settings Aggregate instance.
	 * @return void
	 */
	public function save( PluginSettings $settings ): void {
		$payload = $settings->to_array();

		// Check if option exists to enforce explicit autoload=false on creation.
		if ( false === get_option( SettingsSchema::OPTION_KEY, false ) ) {
			add_option( SettingsSchema::OPTION_KEY, $payload, '', false );
		} else {
			update_option( SettingsSchema::OPTION_KEY, $payload, false );
		}
	}

	/**
	 * Backwards compatible helper to retrieve raw array.
	 *
	 * @return array<string, mixed>
	 */
	public function get_all(): array {
		return $this->get()->to_array();
	}

	/**
	 * Backwards compatible helper to retrieve specific setting by dot notation.
	 *
	 * @param string $path Dot notation path, e.g., 'general.greeting_message'.
	 * @param mixed  $fallback Fallback value.
	 * @return mixed
	 */
	public function get_by_path( string $path, mixed $fallback = null ): mixed {
		$parts   = explode( '.', $path );
		$current = $this->get_all();

		foreach ( $parts as $part ) {
			if ( ! is_array( $current ) || ! array_key_exists( $part, $current ) ) {
				return $fallback;
			}
			$current = $current[ $part ];
		}

		return $current;
	}
}
