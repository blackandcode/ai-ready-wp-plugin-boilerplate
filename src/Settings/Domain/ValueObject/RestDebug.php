<?php
/**
 * REST Debug Flag Value Object.
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject
 */

namespace AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject;

/**
 * Immutable REST debug flag value object.
 */
readonly class RestDebug {

	/**
	 * Debug state.
	 *
	 * @var bool
	 */
	private bool $enabled;

	/**
	 * Constructor.
	 *
	 * @param bool $enabled Flag status.
	 */
	public function __construct( bool $enabled ) {
		$this->enabled = $enabled;
	}

	/**
	 * Retrieve primitive value.
	 *
	 * @return bool
	 */
	public function value(): bool {
		return $this->enabled;
	}

	/**
	 * Check if enabled.
	 *
	 * @return bool
	 */
	public function is_enabled(): bool {
		return $this->enabled;
	}

	/**
	 * Semantic equality check.
	 *
	 * @param RestDebug $other Other instance.
	 * @return bool
	 */
	public function equals( RestDebug $other ): bool {
		return $this->enabled === $other->enabled;
	}
}
