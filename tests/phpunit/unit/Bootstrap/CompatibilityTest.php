<?php
/**
 * Test Compatibility checker.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Bootstrap
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Bootstrap;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Bootstrap\Compatibility;

/**
 * Class CompatibilityTest
 */
class CompatibilityTest extends TestCase {

	/**
	 * Test minimum PHP version constraint.
	 */
	public function test_min_php_version_constant(): void {
		$this->assertSame( '8.3', Compatibility::MIN_PHP_VERSION );
	}

	/**
	 * Test minimum WP version constraint.
	 */
	public function test_min_wp_version_constant(): void {
		$this->assertSame( '7.0', Compatibility::MIN_WP_VERSION );
	}

	/**
	 * Test is_php_compatible on current runtime.
	 */
	public function test_php_compatibility(): void {
		$this->assertTrue( Compatibility::is_php_compatible() );
	}
}
