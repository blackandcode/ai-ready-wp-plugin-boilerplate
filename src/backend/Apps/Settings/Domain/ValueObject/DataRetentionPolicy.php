<?php
/**
 * Data Retention Policy Backed Enum.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject;

use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Exception\InvalidRetentionPolicyException;

/**
 * Data retention policy for plugin uninstall and cleanup.
 */
enum DataRetentionPolicy: string {
	case Preserve       = 'preserve';
	case DeleteSettings = 'delete_settings';
	case DeleteAll      = 'delete_all';

	/**
	 * Create from string or throw domain exception.
	 *
	 * @param string $value Policy string.
	 * @return self
	 * @throws InvalidRetentionPolicyException If value is not a valid enum case.
	 */
	public static function from_string( string $value ): self {
		$policy = self::tryFrom( $value );
		if ( null === $policy ) {
			throw new InvalidRetentionPolicyException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Invalid data retention policy: "%s". Allowed values: preserve, delete_settings, delete_all.', $value )
			);
		}
		return $policy;
	}

	/**
	 * Resolve policy or fallback to default preserve.
	 *
	 * @param string|null $value Raw value.
	 * @return self
	 */
	public static function from_or_default( ?string $value ): self {
		if ( null === $value || '' === trim( $value ) ) {
			return self::Preserve;
		}
		return self::tryFrom( $value ) ?? self::Preserve;
	}
}
