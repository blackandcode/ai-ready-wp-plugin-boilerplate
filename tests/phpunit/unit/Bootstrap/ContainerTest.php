<?php
/**
 * Test Container class.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Bootstrap
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Bootstrap;

use PHPUnit\Framework\TestCase;
use RuntimeException;
use stdClass;
use AIReady\WPPluginBoilerplate\Bootstrap\Container;

/**
 * Class ContainerTest
 */
class ContainerTest extends TestCase {

	/**
	 * Test container bind and get returns single instance.
	 */
	public function test_bind_and_resolve_singleton(): void {
		$container = new Container();

		$this->assertFalse( $container->has( 'service.test' ) );

		$container->bind(
			'service.test',
			static function () {
				return new stdClass();
			}
		);

		$this->assertTrue( $container->has( 'service.test' ) );

		$instance1 = $container->get( 'service.test' );
		$instance2 = $container->get( 'service.test' );

		$this->assertInstanceOf( stdClass::class, $instance1 );
		$this->assertSame( $instance1, $instance2 );
	}

	/**
	 * Test container instance method registers directly.
	 */
	public function test_instance_registration(): void {
		$container = new Container();
		$object    = new stdClass();

		$container->instance( 'direct.service', $object );

		$this->assertTrue( $container->has( 'direct.service' ) );
		$this->assertSame( $object, $container->get( 'direct.service' ) );
	}

	/**
	 * Test container throws exception when service is not registered.
	 */
	public function test_throws_for_unregistered_service(): void {
		$container = new Container();

		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage( 'Service "missing.service" is not registered in the container.' );

		$container->get( 'missing.service' );
	}
}
