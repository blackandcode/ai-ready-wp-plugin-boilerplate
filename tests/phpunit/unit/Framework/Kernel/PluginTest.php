<?php
/**
 * Test Plugin bootstrap class.
 *
 * @package WPAIBP\Tests\Unit\Framework\Kernel
 */

namespace WPAIBP\Tests\Unit\Framework\Kernel;

use PHPUnit\Framework\TestCase;
use WPAIBP\Backend\BackendServiceProvider;
use WPAIBP\Development\DevelopmentServiceProvider;
use WPAIBP\Framework\Environment\DevelopmentMode;
use WPAIBP\Framework\Environment\FakeDevelopmentMode;
use WPAIBP\Framework\Kernel\Plugin;
use WPAIBP\Frontend\FrontendServiceProvider;

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
		$this->assertSame( '1.4.0', Plugin::VERSION );
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

	/**
	 * Test provider registration when development mode is disabled.
	 */
	public function test_providers_when_development_mode_disabled(): void {
		$plugin   = Plugin::instance();
		$dev_mode = new FakeDevelopmentMode( false );
		$plugin->boot( $dev_mode );
		$plugin->on_init();

		$registry  = $plugin->get_registry();
		$container = $plugin->get_container();

		$this->assertNotNull( $registry );
		$this->assertNotNull( $container );
		$this->assertTrue( $container->has( DevelopmentMode::class ) );
		$this->assertSame( $dev_mode, $container->get( DevelopmentMode::class ) );

		$providers = $registry->get_providers();
		$this->assertCount( 2, $providers );
		$this->assertInstanceOf( BackendServiceProvider::class, $providers[0] );
		$this->assertInstanceOf( FrontendServiceProvider::class, $providers[1] );
	}

	/**
	 * Test provider registration when development mode is enabled.
	 */
	public function test_providers_when_development_mode_enabled(): void {
		$plugin   = Plugin::instance();
		$dev_mode = new FakeDevelopmentMode( true );
		$plugin->boot( $dev_mode );
		$plugin->on_init();

		$registry = $plugin->get_registry();
		$this->assertNotNull( $registry );

		$providers = $registry->get_providers();
		$this->assertCount( 3, $providers );
		$this->assertInstanceOf( BackendServiceProvider::class, $providers[0] );
		$this->assertInstanceOf( FrontendServiceProvider::class, $providers[1] );
		$this->assertInstanceOf( DevelopmentServiceProvider::class, $providers[2] );
	}
}
