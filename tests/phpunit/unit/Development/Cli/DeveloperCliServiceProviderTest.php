<?php
/**
 * Test Developer CLI Service Provider.
 *
 * @package WPAIBP\Tests\Unit\Development\Cli
 */

namespace WPAIBP\Tests\Unit\Development\Cli;

use PHPUnit\Framework\TestCase;
use WPAIBP\Development\Cli\DeveloperCliServiceProvider;
use WPAIBP\Framework\Container\Container;

/**
 * Class DeveloperCliServiceProviderTest
 */
class DeveloperCliServiceProviderTest extends TestCase {

	/**
	 * Test provider lifecycle without WP_CLI defined.
	 */
	public function test_provider_lifecycle(): void {
		$container = new Container();
		$provider  = new DeveloperCliServiceProvider();

		$provider->register( $container );
		$provider->boot();

		$this->assertInstanceOf( DeveloperCliServiceProvider::class, $provider );
	}
}
