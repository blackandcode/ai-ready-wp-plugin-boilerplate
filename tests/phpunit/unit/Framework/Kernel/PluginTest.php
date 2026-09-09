<?php
/**
 * Test Plugin bootstrap class.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Framework\Kernel
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Framework\Kernel;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Framework\Kernel\Plugin;

/**
 * Class PluginTest
 */
class PluginTest extends TestCase {

	/**
	 * Reset singleton instance after each test.
	 */
	protected function tearDown(): void {
		Plugin::reset_instance();
		parent::tearDown();
	}

	/**
	 * Test plugin version constant.
	 */
	public function test_plugin_version_constant(): void {
		$this->assertSame( '1.0.1', Plugin::VERSION );
	}

	/**
	 * Test singleton returns identical instance.
	 */
	public function test_singleton_instance(): void {
		$instance1 = Plugin::instance();
		$instance2 = Plugin::instance();

		$this->assertInstanceOf( Plugin::class, $instance1 );
		$this->assertSame( $instance1, $instance2 );
	}

	/**
	 * Test boot marks booted flag.
	 */
	public function test_boot_lifecycle(): void {
		$plugin = Plugin::instance();
		$this->assertFalse( $plugin->is_booted() );

		$plugin->boot();
		$this->assertTrue( $plugin->is_booted() );

		// Double boot is idempotent.
		$plugin->boot();
		$this->assertTrue( $plugin->is_booted() );
	}
}
