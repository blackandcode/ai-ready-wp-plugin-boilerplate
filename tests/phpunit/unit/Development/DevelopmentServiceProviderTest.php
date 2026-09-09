<?php
/**
 * Test Development Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Development
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Development;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Development\DevelopmentServiceProvider;
use AIReady\WPPluginBoilerplate\Development\Rest\DevOpenApiController;
use AIReady\WPPluginBoilerplate\Framework\Container\Container;

/**
 * Class DevelopmentServiceProviderTest
 */
class DevelopmentServiceProviderTest extends TestCase {

	/**
	 * Test provider registers and boots correctly.
	 */
	public function test_provider_lifecycle(): void {
		$container = new Container();
		$provider  = new DevelopmentServiceProvider();

		$provider->register( $container );
		$provider->boot();

		$this->assertTrue( $container->has( DevOpenApiController::class ) );
		$this->assertInstanceOf( DevelopmentServiceProvider::class, $provider );
	}
}
