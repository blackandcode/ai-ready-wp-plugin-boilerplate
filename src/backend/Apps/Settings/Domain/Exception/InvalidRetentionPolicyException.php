<?php
/**
 * Invalid Retention Policy Domain Exception.
 *
 * @package WPAIBP\Backend\Apps\Settings\Domain\Exception
 */

namespace WPAIBP\Backend\Apps\Settings\Domain\Exception;

/**
 * Thrown when an unrecognized data retention policy is supplied.
 */
class InvalidRetentionPolicyException extends InvalidSettingException {

	/**
	 * Create exception for unsupported policy string.
	 *
	 * @param string        $value Provided string.
	 * @param array<string> $allowed Allowed values.
	 * @return self
	 */
	public static function unsupported( string $value, array $allowed ): self {
		return new self(
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception messages are internal diagnostic strings.
			sprintf( 'Unsupported data retention policy "%s". Allowed: %s.', $value, implode( ', ', $allowed ) )
		);
	}
}
