<?php
/**
 * Greeting Message Value Object.
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject
 */

namespace AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject;

use AIReady\WPPluginBoilerplate\Settings\Domain\Exception\InvalidGreetingMessageException;

/**
 * Immutable greeting message value object.
 */
readonly class GreetingMessage {

	/**
	 * Maximum allowed character length.
	 */
	public const MAX_LENGTH = 255;

	/**
	 * Normalized string message.
	 *
	 * @var string
	 */
	private string $value;

	/**
	 * Constructor.
	 *
	 * @param string $value Raw greeting message.
	 * @throws InvalidGreetingMessageException When message is empty or exceeds length.
	 */
	public function __construct( string $value ) {
		$normalized = trim( $value );

		if ( '' === $normalized ) {
			throw new InvalidGreetingMessageException( 'Greeting message cannot be empty.' );
		}

		if ( mb_strlen( $normalized, 'UTF-8' ) > self::MAX_LENGTH ) {
			throw new InvalidGreetingMessageException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Greeting message exceeds maximum length of %d characters.', self::MAX_LENGTH )
			);
		}

		$this->value = $normalized;
	}

	/**
	 * Retrieve primitive value.
	 *
	 * @return string
	 */
	public function value(): string {
		return $this->value;
	}

	/**
	 * Semantic equality comparison.
	 *
	 * @param GreetingMessage $other Other instance.
	 * @return bool
	 */
	public function equals( GreetingMessage $other ): bool {
		return $this->value === $other->value;
	}

	/**
	 * String casting.
	 *
	 * @return string
	 */
	public function __toString(): string {
		return $this->value;
	}
}
