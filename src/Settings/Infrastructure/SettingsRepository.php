<?php
/**
 * Settings Repository.
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Infrastructure
 */

namespace AIReady\WPPluginBoilerplate\Settings\Infrastructure;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Manages retrieval and persistence of plugin settings.
 */
class SettingsRepository {

	/**
	 * Retrieve all plugin settings merged with defaults.
	 *
	 * @return array<string, mixed>
	 */
	public function get_all(): array {
		$raw      = get_option( SettingsSchema::OPTION_KEY, array() );
		$defaults = SettingsSchema::get_defaults();

		if ( ! is_array( $raw ) ) {
			return $defaults;
		}

		return array_replace_recursive( $defaults, $raw );
	}

	/**
	 * Retrieve a specific settings section.
	 *
	 * @param string $section Section identifier (general, advanced, data_retention).
	 * @return array<string, mixed>
	 */
	public function get_section( string $section ): array {
		$all = $this->get_all();
		return $all[ $section ] ?? array();
	}

	/**
	 * Update settings.
	 *
	 * @param array<string, mixed> $settings Raw or partial settings data.
	 * @return bool True if value changed, false otherwise.
	 */
	public function update( array $settings ): bool {
		$sanitized = SettingsSchema::sanitize( $settings );
		return update_option( SettingsSchema::OPTION_KEY, $sanitized );
	}
}
