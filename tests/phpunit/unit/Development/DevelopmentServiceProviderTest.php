<?php
/**
 * Test Development Service Provider.
 *
 * @package WPAIBP\Tests\Unit\Development
 */

namespace WPAIBP\Tests\Unit\Development;

use PHPUnit\Framework\TestCase;
use WPAIBP\Development\DevelopmentServiceProvider;
use WPAIBP\Development\Rest\DevOpenApiController;
use WPAIBP\Framework\Container\Container;

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
