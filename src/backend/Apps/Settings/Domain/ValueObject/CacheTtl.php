<?php
/**
 * Cache TTL Value Object.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject;

use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Exception\InvalidCacheTtlException;

/**
 * Immutable cache TTL (Time To Live) in seconds.
 */
readonly class CacheTtl {

	/**
	 * Minimum permitted TTL (0 = caching disabled / immediate expiry).
	 */
	public const MIN_TTL = 0;

	/**
	 * Maximum permitted TTL (86400 = 24 hours).
	 */
	public const MAX_TTL = 86400;

	/**
	 * Default TTL (3600 = 1 hour).
	 */
	public const DEFAULT_TTL = 3600;

	/**
	 * TTL in seconds.
	 *
	 * @var int
	 */
	private int $seconds;

	/**
	 * Constructor.
	 *
	 * @param int $seconds TTL duration in seconds.
	 * @throws InvalidCacheTtlException If duration is out of allowed range.
	 */
	public function __construct( int $seconds ) {
		if ( $seconds < self::MIN_TTL || $seconds > self::MAX_TTL ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Diagnostic exception values are safe integers.
			throw InvalidCacheTtlException::out_of_range( $seconds, self::MIN_TTL, self::MAX_TTL );
		}

		$this->seconds = $seconds;
	}

	/**
	 * Create an instance by clamping values to the allowed bounds.
	 *
	 * @param int $seconds Input seconds.
	 * @return self
	 */
	public static function from_clamped( int $seconds ): self {
		$clamped = max( self::MIN_TTL, min( self::MAX_TTL, $seconds ) );
		return new self( $clamped );
	}

	/**
	 * Retrieve primitive value.
	 *
	 * @return int
	 */
	public function value(): int {
		return $this->seconds;
	}

	/**
	 * Semantic equality check.
	 *
	 * @param CacheTtl $other Other instance.
	 * @return bool
	 */
	public function equals( CacheTtl $other ): bool {
		return $this->seconds === $other->seconds;
	}

	/**
	 * Create with default value.
	 *
	 * @return self
	 */
	public static function default(): self {
		return new self( self::DEFAULT_TTL );
	}

	/**
	 * Create from nullable integer with fallback to default.
	 *
	 * @param int|null $value Raw value.
	 * @return self
	 */
	public static function from_or_default( ?int $value ): self {
		if ( null === $value ) {
			return self::default();
		}

		return new self( $value );
	}
}
