<?php
/**
 * Test TransientCache utility.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Framework\Support
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Framework\Support;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Framework\Support\Cache\TransientCache;

/**
 * Class TransientCacheTest
 */
class TransientCacheTest extends TestCase {

	/**
	 * Test building standard key.
	 */
	public function test_build_key_prefixes_correctly(): void {
		$key = TransientCache::build_key( 'my_test_cache' );
		$this->assertSame( 'airwp_my_test_cache', $key );
	}

	/**
	 * Test building very long key hashes to maintain length limits.
	 */
	public function test_build_long_key_hashes(): void {
		$long_key = str_repeat( 'very_long_transient_key_', 10 );
		$key      = TransientCache::build_key( $long_key );

		$this->assertLessThanOrEqual( TransientCache::MAX_KEY_LENGTH, strlen( $key ) );
		$this->assertStringStartsWith( 'airwp_', $key );
	}
}
