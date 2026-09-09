<?php
/**
 * Test GreetingMessage Value Object.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\Settings\Domain
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\Settings\Domain;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Exception\InvalidGreetingMessageException;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\GreetingMessage;

/**
 * Class GreetingMessageTest
 */
class GreetingMessageTest extends TestCase {

	/**
	 * Test valid greeting message trims whitespace.
	 */
	public function test_valid_greeting_message_normalizes(): void {
		$vo = new GreetingMessage( "  Hello World  \n" );

		$this->assertSame( 'Hello World', $vo->value() );
		$this->assertSame( 'Hello World', (string) $vo );
	}

	/**
	 * Test empty greeting message throws exception.
	 */
	public function test_empty_message_throws_exception(): void {
		$this->expectException( InvalidGreetingMessageException::class );
		$this->expectExceptionMessage( 'Greeting message cannot be empty.' );

		new GreetingMessage( '   ' );
	}

	/**
	 * Test greeting message exceeding max length throws exception.
	 */
	public function test_excessive_length_throws_exception(): void {
		$too_long = str_repeat( 'a', 256 );

		$this->expectException( InvalidGreetingMessageException::class );
		$this->expectExceptionMessage( 'exceeds maximum length of 255 characters' );

		new GreetingMessage( $too_long );
	}

	/**
	 * Test semantic equality.
	 */
	public function test_equality(): void {
		$vo1 = new GreetingMessage( 'Welcome' );
		$vo2 = new GreetingMessage( 'Welcome' );
		$vo3 = new GreetingMessage( 'Different' );

		$this->assertTrue( $vo1->equals( $vo2 ) );
		$this->assertFalse( $vo1->equals( $vo3 ) );
	}
}
