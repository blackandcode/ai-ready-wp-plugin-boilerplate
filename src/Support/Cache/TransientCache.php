<?php
/**
 * WordPress Transient Cache Utility.
 *
 * @package AIReady\WPPluginBoilerplate\Support\Cache
 */

namespace AIReady\WPPluginBoilerplate\Support\Cache;

use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\CacheTtl;

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
	 * Store cached value with TTL.
	 *
	 * @param string $key Cache key.
	 * @param mixed  $value Value to cache.
	 * @param int    $ttl TTL duration in seconds.
	 * @return bool
	 */
	public static function set( string $key, mixed $value, int $ttl = CacheTtl::DEFAULT_TTL ): bool {
		if ( ! function_exists( 'set_transient' ) ) {
			return false;
		}

		$clamped_ttl = CacheTtl::from_clamped( $ttl )->value();
		if ( 0 === $clamped_ttl ) {
			return false;
		}

		return set_transient( self::build_key( $key ), $value, $clamped_ttl );
	}

	/**
	 * Delete cached value.
	 *
	 * @param string $key Cache key.
	 * @return bool
	 */
	public static function delete( string $key ): bool {
		if ( ! function_exists( 'delete_transient' ) ) {
			return false;
		}
		return delete_transient( self::build_key( $key ) );
	}

	/**
	 * Remember or compute cached value.
	 *
	 * @param string   $key Cache key.
	 * @param int      $ttl TTL duration.
	 * @param callable $callback Value generator.
	 * @return mixed
	 */
	public static function remember( string $key, int $ttl, callable $callback ): mixed {
		$cached = self::get( $key );
		if ( false !== $cached ) {
			return $cached;
		}

		$fresh = $callback();
		self::set( $key, $fresh, $ttl );
		return $fresh;
	}
}
