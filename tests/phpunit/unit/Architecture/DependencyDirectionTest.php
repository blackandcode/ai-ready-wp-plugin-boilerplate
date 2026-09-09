<?php
/**
 * Test Dependency Direction Architectural Invariants.
 *
 * Enforces hexagonal architectural boundaries:
 * - Framework core components (outside the Composition Root) must NEVER import or depend on Backend or Development.
 * - Backend (Runtime) must NEVER import or depend on Development.
 * - Frontend Bridge must NEVER import or depend on Development.
 * - Composition Root (Plugin.php) wires the top-level ServiceProviders only.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Architecture
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Architecture;

use PHPUnit\Framework\TestCase;

/**
 * Class DependencyDirectionTest
 */
class DependencyDirectionTest extends TestCase {

	/**
	 * Base directory of the repository.
	 *
	 * @var string
	 */
	private string $base_dir;

	/**
	 * Setup repository path.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->base_dir = dirname( __DIR__, 4 ) . '/';
	}

	/**
	 * Recursively find all PHP files in a directory.
	 *
	 * @param string $dir Target directory.
	 * @return string[] Array of absolute file paths.
	 */
	private function get_php_files( string $dir ): array {
		if ( ! is_dir( $dir ) ) {
			return array();
		}

		$files    = array();
		$iterator = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( $dir, \RecursiveDirectoryIterator::SKIP_DOTS )
		);

		foreach ( $iterator as $file ) {
			if ( $file->isFile() && 'php' === $file->getExtension() ) {
				$files[] = $file->getPathname();
			}
		}

		return $files;
	}

	/**
	 * Extract use statements and fully-qualified class references from PHP code.
	 *
	 * @param string $file_path Absolute path to PHP file.
	 * @return string[] List of referenced namespace prefixes / classes.
	 */
	private function extract_imported_namespaces( string $file_path ): array {
		$content = file_get_contents( $file_path );
		if ( false === $content ) {
			return array();
		}

		$tokens  = token_get_all( $content );
		$imports = array();

		$count = count( $tokens );
		for ( $i = 0; $i < $count; $i++ ) {
			if ( is_array( $tokens[ $i ] ) && T_USE === $tokens[ $i ][0] ) {
				$import = '';
				for ( $j = $i + 1; $j < $count; $j++ ) {
					if ( is_string( $tokens[ $j ] ) && ( ';' === $tokens[ $j ] || '(' === $tokens[ $j ] || '{' === $tokens[ $j ] ) ) {
						break;
					}
					if ( is_array( $tokens[ $j ] ) ) {
						$import .= $tokens[ $j ][1];
					}
				}
				$trimmed = trim( $import );
				if ( '' !== $trimmed ) {
					$imports[] = $trimmed;
				}
			}
		}

		return $imports;
	}

	/**
	 * Assert that Framework core components (excluding the composition root) have zero dependencies on Backend or Development.
	 */
	public function test_framework_does_not_depend_on_backend_or_development(): void {
		$framework_dir = $this->base_dir . 'src/framework';
		$files         = $this->get_php_files( $framework_dir );

		$this->assertNotEmpty( $files, 'Framework files must exist.' );

		$violations = array();

		foreach ( $files as $file ) {
			$relative_path = str_replace( $this->base_dir, '', $file );

			// Plugin.php is the Composition Root responsible for instantiating the top-level providers.
			if ( 'src/framework/Kernel/Plugin.php' === $relative_path ) {
				continue;
			}

			$imports = $this->extract_imported_namespaces( $file );

			foreach ( $imports as $import ) {
				if ( str_starts_with( $import, 'AIReady\\WPPluginBoilerplate\\Backend' ) ) {
					$violations[] = sprintf( '%s imports Backend: "%s"', $relative_path, $import );
				}
				if ( str_starts_with( $import, 'AIReady\\WPPluginBoilerplate\\Development' ) ) {
					$violations[] = sprintf( '%s imports Development: "%s"', $relative_path, $import );
				}
			}
		}

		$this->assertEmpty(
			$violations,
			"Architectural violation: Framework core components must never depend on Backend or Development:\n" . implode( "\n", $violations )
		);
	}

	/**
	 * Assert that Backend (Runtime) has zero dependencies on Development.
	 */
	public function test_backend_does_not_depend_on_development(): void {
		$backend_dir = $this->base_dir . 'src/backend';
		$files       = $this->get_php_files( $backend_dir );

		$this->assertNotEmpty( $files, 'Backend files must exist.' );

		$violations = array();

		foreach ( $files as $file ) {
			$imports       = $this->extract_imported_namespaces( $file );
			$relative_path = str_replace( $this->base_dir, '', $file );

			foreach ( $imports as $import ) {
				if ( str_starts_with( $import, 'AIReady\\WPPluginBoilerplate\\Development' ) ) {
					$violations[] = sprintf( '%s imports Development: "%s"', $relative_path, $import );
				}
			}
		}

		$this->assertEmpty(
			$violations,
			"Architectural violation: Backend must never depend on Development:\n" . implode( "\n", $violations )
		);
	}

	/**
	 * Assert that Frontend Bridge has zero dependencies on Development.
	 */
	public function test_frontend_bridge_does_not_depend_on_development(): void {
		$frontend_dir = $this->base_dir . 'src/frontend/Bridge';
		$files        = $this->get_php_files( $frontend_dir );

		$violations = array();

		foreach ( $files as $file ) {
			$imports       = $this->extract_imported_namespaces( $file );
			$relative_path = str_replace( $this->base_dir, '', $file );

			foreach ( $imports as $import ) {
				if ( str_starts_with( $import, 'AIReady\\WPPluginBoilerplate\\Development' ) ) {
					$violations[] = sprintf( '%s imports Development: "%s"', $relative_path, $import );
				}
			}
		}

		$this->assertEmpty(
			$violations,
			"Architectural violation: Frontend Bridge must never depend on Development:\n" . implode( "\n", $violations )
		);
	}
}
