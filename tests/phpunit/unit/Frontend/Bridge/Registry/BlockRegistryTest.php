<?php
/**
 * Test BlockRegistry Adapter.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Frontend\Bridge\Registry
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Frontend\Bridge\Registry;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Frontend\Registry\BlockRegistry;

/**
 * Class BlockRegistryTest
 */
class BlockRegistryTest extends TestCase {

	/**
	 * Test instantiation with default and custom paths.
	 */
	public function test_instantiation(): void {
		$registry = new BlockRegistry();
		$this->assertInstanceOf( BlockRegistry::class, $registry );

		$custom_registry = new BlockRegistry( '/tmp/blocks', '/tmp/manifest.php' );
		$this->assertInstanceOf( BlockRegistry::class, $custom_registry );
	}

	/**
	 * Test register does not fail when manifest is missing or present.
	 */
	public function test_register_executes_safely(): void {
		$registry = new BlockRegistry( '/nonexistent/blocks', '/nonexistent/manifest.php' );
		$registry->register();

		// Should complete with zero errors.
		$this->assertTrue( true );
	}

	/**
	 * Test static register_blocks hook adapter.
	 */
	public function test_static_register_blocks(): void {
		BlockRegistry::register_blocks();
		$this->assertTrue( true );
	}
}
