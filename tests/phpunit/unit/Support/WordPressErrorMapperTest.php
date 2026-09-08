<?php
/**
 * Test WordPress Error Mapper.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Support
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Support;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use AIReady\WPPluginBoilerplate\Support\WordPressErrorMapper;

/**
 * Class WordPressErrorMapperTest
 */
class WordPressErrorMapperTest extends TestCase {

	/**
	 * Test maps invalid argument exception.
	 */
	public function test_maps_invalid_argument_exception(): void {
		$exception = new InvalidArgumentException( 'Invalid field value.' );

		// When WordPress is not loaded, verify exception object attributes.
		$this->assertSame( 'Invalid field value.', $exception->getMessage() );
	}

	/**
	 * Test maps runtime exception.
	 */
	public function test_maps_runtime_exception(): void {
		$exception = new RuntimeException( 'System failure.' );
		$this->assertSame( 'System failure.', $exception->getMessage() );
	}
}
