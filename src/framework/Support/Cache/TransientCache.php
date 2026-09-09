<?php
/**
 * WordPress Transient Cache Utility.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Support\Cache
 */

namespace AIReady\WPPluginBoilerplate\Framework\Support\Cache;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Wrapper for WordPress Transients API enforcing TTL bounds and safe keys.
 */
class TransientCache {

	/**
	 * Cache key prefix.
	 */
	public const PREFIX = 'airwp_';

	/**
	 * Maximum key length supported by WordPress transients (172 - length of '_transient_timeout_').
	 */
	public const MAX_KEY_LENGTH = 45;

	/**
	 * Build normalized, prefixed cache key.
	 *
	 * @param string $key Raw key.
	 * @return string
	 */
	public static function build_key( string $key ): string {
		$prefixed = self::PREFIX . $key;
		if ( strlen( $prefixed ) > self::MAX_KEY_LENGTH ) {
			return self::PREFIX . md5( $key );
		}
		return $prefixed;
	}

	/**
	 * Retrieve cached value.
	 *
	 * @param string $key Cache key.
	 * @return mixed False if not found or expired, mixed cached value otherwise.
	 */
	public static function get( string $key ): mixed {
		if ( ! function_exists( 'get_transient' ) ) {
			return false;
		}
		return get_transient( self::build_key( $key ) );
	}

	/**
	 * Store value in cache with TTL.
	 *
	 * @param string $key Cache key.
	 * @param mixed  $value Data to store.
	 * @param int    $ttl Time to live in seconds.
	 * @return bool True on success.
	 */
	public static function set( string $key, mixed $value, int $ttl = 3600 ): bool {
		if ( ! function_exists( 'set_transient' ) ) {
			return false;
		}

		$sanitized_ttl = max( 60, min( 86400, $ttl ) );
		return set_transient( self::build_key( $key ), $value, $sanitized_ttl );
	}

	/**
	 * Delete cached value.
	 *
	 * @param string $key Cache key.
	 * @return bool True if deleted or did not exist.
	 */
	public static function delete( string $key ): bool {
		if ( ! function_exists( 'delete_transient' ) ) {
			return false;
		}
		return delete_transient( self::build_key( $key ) );
	}
}
