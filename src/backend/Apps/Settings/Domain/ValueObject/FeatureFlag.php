<?php
/**
 * Feature Flag Value Object.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject;

/**
 * Immutable feature flag value object.
 */
readonly class FeatureFlag {

	/**
	 * Flag state.
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
	 * @param FeatureFlag $other Other instance.
	 * @return bool
	 */
	public function equals( FeatureFlag $other ): bool {
		return $this->enabled === $other->enabled;
	}

	/**
	 * Create enabled instance.
	 *
	 * @return self
	 */
	public static function enabled(): self {
		return new self( true );
	}

	/**
	 * Create disabled instance.
	 *
	 * @return self
	 */
	public static function disabled(): self {
		return new self( false );
	}

	/**
	 * Create from nullable boolean with fallback.
	 *
	 * @param bool|null $value Raw boolean value.
	 * @param bool      $fallback Default boolean fallback.
	 * @return self
	 */
	public static function from_or_default( ?bool $value, bool $fallback = true ): self {
		if ( null === $value ) {
			return new self( $fallback );
		}
		return new self( $value );
	}
}
