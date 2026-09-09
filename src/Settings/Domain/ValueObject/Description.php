<?php
/**
 * Description Value Object.
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject
 */

namespace AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject;

use AIReady\WPPluginBoilerplate\Settings\Domain\Exception\InvalidSettingException;

/**
 * Immutable plugin description value object.
 */
readonly class Description {

	/**
	 * Maximum character length.
	 */
	public const MAX_LENGTH = 1000;

	/**
	 * Description text.
	 *
	 * @var string
	 */
	private string $value;

	/**
	 * Constructor.
	 *
	 * @param string $value Raw description string.
	 * @throws InvalidSettingException If length exceeds maximum.
	 */
	public function __construct( string $value ) {
		$trimmed = trim( $value );

		if ( mb_strlen( $trimmed, 'UTF-8' ) > self::MAX_LENGTH ) {
			throw new InvalidSettingException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Description exceeds maximum length of %d characters.', self::MAX_LENGTH )
			);
		}

		$this->value = $trimmed;
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
	 * Semantic equality check.
	 *
	 * @param Description $other Other instance.
	 * @return bool
	 */
	public function equals( Description $other ): bool {
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
