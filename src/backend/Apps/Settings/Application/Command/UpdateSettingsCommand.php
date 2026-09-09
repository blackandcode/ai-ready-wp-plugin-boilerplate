<?php
/**
 * Update Settings Command.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\Command
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\Command;

/**
 * Command carrying parameters for mutating plugin settings.
 */
readonly class UpdateSettingsCommand {

	/**
	 * Greeting message.
	 *
	 * @var string|null
	 */
	public ?string $greeting_message;

	/**
	 * Feature flag.
	 *
	 * @var bool|null
	 */
	public ?bool $enable_feature;

	/**
	 * Description.
	 *
	 * @var string|null
	 */
	public ?string $description;

	/**
	 * REST debug flag.
	 *
	 * @var bool|null
	 */
	public ?bool $rest_debug;

	/**
	 * Cache TTL duration in seconds.
	 *
	 * @var int|null
	 */
	public ?int $cache_ttl;

	/**
	 * Data retention uninstall policy string.
	 *
	 * @var string|null
	 */
	public ?string $uninstall_action;

	/**
	 * Constructor.
	 *
	 * @param string|null $greeting_message Greeting message.
	 * @param bool|null   $enable_feature Feature flag.
	 * @param string|null $description Description.
	 * @param bool|null   $rest_debug REST debug.
	 * @param int|null    $cache_ttl Cache TTL.
	 * @param string|null $uninstall_action Uninstall action.
	 */
	public function __construct(
		?string $greeting_message = null,
		?bool $enable_feature = null,
		?string $description = null,
		?bool $rest_debug = null,
		?int $cache_ttl = null,
		?string $uninstall_action = null
	) {
		$this->greeting_message = $greeting_message;
		$this->enable_feature   = $enable_feature;
		$this->description      = $description;
		$this->rest_debug       = $rest_debug;
		$this->cache_ttl        = $cache_ttl;
		$this->uninstall_action = $uninstall_action;
	}

	/**
	 * Create command from structured or nested input array.
	 *
	 * @param array<string, mixed> $data Input array from REST request, CLI, or Abilities.
	 * @return self
	 */
	public static function from_array( array $data ): self {
		$greeting   = null;
		$feature    = null;
		$desc       = null;
		$rest_debug = null;
		$ttl        = null;
		$action     = null;

		// Handle nested format.
		if ( isset( $data['general'] ) && is_array( $data['general'] ) ) {
			if ( array_key_exists( 'greeting_message', $data['general'] ) ) {
				$greeting = (string) $data['general']['greeting_message'];
			}
			if ( array_key_exists( 'enable_feature', $data['general'] ) ) {
				$feature = (bool) $data['general']['enable_feature'];
			}
			if ( array_key_exists( 'description', $data['general'] ) ) {
				$desc = (string) $data['general']['description'];
			}
		}

		if ( isset( $data['advanced'] ) && is_array( $data['advanced'] ) ) {
			if ( array_key_exists( 'rest_debug', $data['advanced'] ) ) {
				$rest_debug = (bool) $data['advanced']['rest_debug'];
			}
			if ( array_key_exists( 'cache_ttl', $data['advanced'] ) ) {
				$ttl = (int) $data['advanced']['cache_ttl'];
			}
		}

		if ( isset( $data['data_retention'] ) && is_array( $data['data_retention'] ) ) {
			if ( array_key_exists( 'uninstall_action', $data['data_retention'] ) ) {
				$action = (string) $data['data_retention']['uninstall_action'];
			}
		}

		// Also handle flat format.
		if ( null === $greeting && array_key_exists( 'greeting_message', $data ) ) {
			$greeting = (string) $data['greeting_message'];
		}
		if ( null === $feature && array_key_exists( 'enable_feature', $data ) ) {
			$feature = (bool) $data['enable_feature'];
		}
		if ( null === $desc && array_key_exists( 'description', $data ) ) {
			$desc = (string) $data['description'];
		}
		if ( null === $rest_debug && array_key_exists( 'rest_debug', $data ) ) {
			$rest_debug = (bool) $data['rest_debug'];
		}
		if ( null === $ttl && array_key_exists( 'cache_ttl', $data ) ) {
			$ttl = (int) $data['cache_ttl'];
		}
		if ( null === $action && array_key_exists( 'uninstall_action', $data ) ) {
			$action = (string) $data['uninstall_action'];
		}

		return new self(
			$greeting,
			$feature,
			$desc,
			$rest_debug,
			$ttl,
			$action
		);
	}
}
