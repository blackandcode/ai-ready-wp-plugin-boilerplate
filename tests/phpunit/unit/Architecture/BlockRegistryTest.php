<?php
/**
 * Test Block Registry Architecture Invariants.
 *
 * Enforces that BlockRegistry uses WordPress 6.8+ native metadata collection:
 * - Zero glob() filesystem traversal in code.
 * - Zero source tree block.json scanning (src/frontend/apps).
 * - Delegates to wp_register_block_types_from_metadata_collection.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Architecture
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Architecture;

use PHPUnit\Framework\TestCase;

/**
 * Class BlockRegistryTest
 */
class BlockRegistryTest extends TestCase {

	/**
	 * Path to BlockRegistry.php.
	 *
	 * @var string
	 */
	private string $registry_file;

	/**
	 * Setup.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->registry_file = dirname( __DIR__, 4 ) . '/src/frontend/Bridge/Registry/BlockRegistry.php';
	}

	/**
	 * Assert BlockRegistry does not use custom filesystem discovery or glob in executable code.
	 */
	public function test_block_registry_does_not_use_glob_or_source_scanning(): void {
		$this->assertFileExists( $this->registry_file );
		$content = (string) file_get_contents( $this->registry_file );

		$tokens = token_get_all( $content );
		foreach ( $tokens as $token ) {
			if ( is_array( $token ) && T_STRING === $token[0] && 'glob' === strtolower( $token[1] ) ) {
				$this->fail( 'BlockRegistry must not call glob().' );
			}
		}

		$this->assertStringNotContainsString(
			'src/frontend/apps',
			$content,
			'BlockRegistry must not inspect source directory layout for block registration.'
		);
	}

	/**
	 * Assert BlockRegistry delegates to native WordPress metadata collection API.
	 */
	public function test_block_registry_uses_native_metadata_collection_api(): void {
		$this->assertFileExists( $this->registry_file );
		$content = (string) file_get_contents( $this->registry_file );

		$this->assertStringContainsString(
			'wp_register_block_types_from_metadata_collection',
			$content,
			'BlockRegistry must delegate to wp_register_block_types_from_metadata_collection.'
		);
	}
}
