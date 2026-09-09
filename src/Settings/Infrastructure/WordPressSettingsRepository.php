<?php
/**
 * WordPress Settings Repository Implementation.
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Infrastructure
 */

namespace AIReady\WPPluginBoilerplate\Settings\Infrastructure;

use AIReady\WPPluginBoilerplate\Settings\Domain\Model\PluginSettings;
use AIReady\WPPluginBoilerplate\Settings\Domain\Repository\SettingsRepositoryInterface;

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
	 * Backwards compatible helper to retrieve section.
	 *
	 * @param string $section Section identifier.
	 * @return array<string, mixed>
	 */
	public function get_section( string $section ): array {
		$all = $this->get_all();
		return $all[ $section ] ?? array();
	}

	/**
	 * Backwards compatible update helper.
	 *
	 * @param array<string, mixed> $settings Raw settings array.
	 * @return bool
	 */
	public function update( array $settings ): bool {
		$aggregate = PluginSettings::reconstitute( $settings );
		$this->save( $aggregate );
		return true;
	}
}
