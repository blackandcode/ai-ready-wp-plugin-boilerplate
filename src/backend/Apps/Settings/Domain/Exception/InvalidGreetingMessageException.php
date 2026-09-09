<?php
/**
 * Invalid Greeting Message Domain Exception.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Exception
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Exception;

/**
 * Thrown when a greeting message violates domain invariants.
 */
class InvalidGreetingMessageException extends InvalidSettingException {

	/**
	 * Create exception for empty greeting.
	 *
	 * @return self
	 */
	public static function empty_value(): self {
		return new self( 'Greeting message must not be empty.' );
	}

	/**
	 * Create exception for excessive length.
	 *
	 * @param int $length Current length.
	 * @param int $max_length Maximum permitted length.
	 * @return self
	 */
	public static function too_long( int $length, int $max_length ): self {
		return new self(
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception messages are internal diagnostic strings.
			sprintf( 'Greeting message must not exceed %d characters. Given: %d characters.', $max_length, $length )
		);
	}
}
