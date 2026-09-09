<?php
/**
 * Test Developer Backend Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\Developer
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\Developer;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Backend\Apps\Developer\DeveloperBackendServiceProvider;
use AIReady\WPPluginBoilerplate\Framework\Container\Container;

/**
 * Class DeveloperBackendServiceProviderTest
 */
class DeveloperBackendServiceProviderTest extends TestCase {

	/**
	 * Test provider registers and boots without error in non-dev environment.
	 */
	public function test_provider_lifecycle(): void {
		$container = new Container();
		$provider  = new DeveloperBackendServiceProvider();

		$provider->register( $container );
		$provider->boot();

		// Calling register_routes when wp_is_development_mode is absent or false should exit early.
		$provider->register_routes();

		$this->assertInstanceOf( DeveloperBackendServiceProvider::class, $provider );
	}
}
