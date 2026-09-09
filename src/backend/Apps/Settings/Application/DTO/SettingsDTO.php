<?php
/**
 * Settings Data Transfer Object.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\DTO
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\DTO;

use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Model\PluginSettings;

/**
 * Immutable DTO representing plugin settings crossing application boundaries.
 */
readonly class SettingsDTO {

	/**
	 * General settings section.
	 *
	 * @var array{greeting_message: string, enable_feature: bool, description: string}
	 */
	public array $general;

	/**
	 * Advanced settings section.
	 *
	 * @var array{rest_debug: bool, cache_ttl: int}
	 */
	public array $advanced;

	/**
	 * Data retention settings section.
	 *
	 * @var array{uninstall_action: string}
	 */
	public array $data_retention;

	/**
	 * Constructor.
	 *
	 * @param array{greeting_message: string, enable_feature: bool, description: string} $general General settings.
	 * @param array{rest_debug: bool, cache_ttl: int}                                    $advanced Advanced settings.
	 * @param array{uninstall_action: string}                                            $data_retention Retention settings.
	 */
	public function __construct(
		array $general,
		array $advanced,
		array $data_retention
	) {
		$this->general        = $general;
		$this->advanced       = $advanced;
		$this->data_retention = $data_retention;
	}

	/**
	 * Create DTO from aggregate root.
	 *
	 * @param PluginSettings $settings Aggregate root.
	 * @return self
	 */
	public static function from_aggregate( PluginSettings $settings ): self {
		$raw = $settings->to_array();

		return new self(
			(array) $raw['general'],
			(array) $raw['advanced'],
			(array) $raw['data_retention']
		);
	}

	/**
	 * Convert DTO to array.
	 *
	 * @return array<string, mixed>
	 */
	public function to_array(): array {
		return array(
			'general'        => $this->general,
			'advanced'       => $this->advanced,
			'data_retention' => $this->data_retention,
		);
	}
}
