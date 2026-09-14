<?php
/**
 * Invalid Cache TTL Domain Exception.
 *
 * @package WPAIBP\Backend\Apps\Settings\Domain\Exception
 */

namespace WPAIBP\Backend\Apps\Settings\Domain\Exception;

/**
 * Thrown when a cache TTL value is outside allowed bounds.
 */
class InvalidCacheTtlException extends InvalidSettingException {

	/**
	 * Create exception from out-of-range value.
	 *
	 * @param int $value Provided seconds.
	 * @param int $min Minimum permitted seconds.
	 * @param int $max Maximum permitted seconds.
	 * @return self
	 */
	public static function out_of_range( int $value, int $min, int $max ): self {
		return new self(
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception messages are internal diagnostic strings.
			sprintf( 'Cache TTL must be between %d and %d seconds. Given: %d.', $min, $max, $value )
		);
	}
}
