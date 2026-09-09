<?php
/**
 * Test Development Isolation Architectural Invariants.
 *
 * Verifies that development services, routes, and providers are never registered
 * in production contexts when development mode is false.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Architecture
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Architecture;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Development\DevelopmentServiceProvider;
use AIReady\WPPluginBoilerplate\Framework\Environment\DevelopmentMode;
use AIReady\WPPluginBoilerplate\Framework\Environment\FakeDevelopmentMode;
use AIReady\WPPluginBoilerplate\Framework\Kernel\Plugin;

/**
 * Class DevelopmentIsolationTest
 */
class DevelopmentIsolationTest extends TestCase {

	/**
	 * Reset singleton instance after each test.
	 */
	protected function tearDown(): void {
		Plugin::reset_instance();
		parent::tearDown();
	}

	/**
	 * Test development provider is excluded when development mode is disabled.
	 */
	public function test_development_provider_excluded_in_production(): void {
		$plugin   = Plugin::instance();
		$dev_mode = new FakeDevelopmentMode( false );

		$plugin->boot( $dev_mode );
		$plugin->on_init();

		$registry = $plugin->get_registry();
		$this->assertNotNull( $registry );

		$dev_providers = array_filter(
			$registry->get_providers(),
			static function ( $provider ) {
				return $provider instanceof DevelopmentServiceProvider;
			}
		);

		$this->assertCount( 0, $dev_providers, 'DevelopmentServiceProvider must never be registered when development mode is disabled.' );
	}

	/**
	 * Test development provider is included when development mode is enabled.
	 */
	public function test_development_provider_included_in_development(): void {
		$plugin   = Plugin::instance();
		$dev_mode = new FakeDevelopmentMode( true );

		$plugin->boot( $dev_mode );
		$plugin->on_init();

		$registry = $plugin->get_registry();
		$this->assertNotNull( $registry );

		$dev_providers = array_filter(
			$registry->get_providers(),
			static function ( $provider ) {
				return $provider instanceof DevelopmentServiceProvider;
			}
		);

		$this->assertCount( 1, $dev_providers, 'DevelopmentServiceProvider must be registered when development mode is enabled.' );
	}
}
