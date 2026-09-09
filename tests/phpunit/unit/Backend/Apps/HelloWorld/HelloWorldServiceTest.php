<?php
/**
 * Test HelloWorld Service.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\HelloWorld
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\HelloWorld;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Application\HelloWorldService;
use AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Domain\HelloWorldGreeting;

/**
 * Class HelloWorldServiceTest
 */
class HelloWorldServiceTest extends TestCase {

	/**
	 * Test greeting value object default and custom values.
	 */
	public function test_greeting_value_object(): void {
		$default = HelloWorldGreeting::default();
		$this->assertSame( 'Hello from AI-Ready WP Plugin Boilerplate!', $default->value() );

		$custom = new HelloWorldGreeting( 'Greetings AI Agent!' );
		$this->assertSame( 'Greetings AI Agent!', $custom->value() );
	}

	/**
	 * Test empty greeting throws InvalidArgumentException.
	 */
	public function test_empty_greeting_throws(): void {
		$this->expectException( InvalidArgumentException::class );
		new HelloWorldGreeting( '   ' );
	}

	/**
	 * Test HelloWorldService returns valid DTO.
	 */
	public function test_service_returns_dto(): void {
		$service = new HelloWorldService();
		$dto     = $service->get_hello_world();
		$array   = $dto->to_array();

		$this->assertSame( 'Hello from AI-Ready WP Plugin Boilerplate!', $dto->message );
		$this->assertSame( 'ok', $dto->status );
		$this->assertArrayHasKey( 'timestamp', $array );
		$this->assertArrayHasKey( 'version', $array );
	}
}
