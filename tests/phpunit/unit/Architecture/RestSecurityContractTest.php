<?php
/**
 * Test REST Security Contract Invariants.
 *
 * Enforces that:
 * 1. Every REST controller registers routes with an explicit non-empty permission_callback.
 * 2. Privileged endpoints strictly require 'manage_options'.
 * 3. Developer endpoints never include authentication bypasses.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Architecture
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Architecture;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Rest\DiagnosticsController;
use AIReady\WPPluginBoilerplate\Backend\Apps\HelloWorld\Rest\HelloWorldController;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Rest\SettingsController;
use AIReady\WPPluginBoilerplate\Development\Rest\DevOpenApiController;

/**
 * Class RestSecurityContractTest
 */
class RestSecurityContractTest extends TestCase {

	/**
	 * Base directory.
	 *
	 * @var string
	 */
	private string $base_dir;

	/**
	 * Setup.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->base_dir = dirname( __DIR__, 4 ) . '/';
	}

	/**
	 * Assert all REST controller classes declare permission_callback in every endpoint configuration.
	 */
	public function test_all_rest_controllers_declare_permission_callbacks(): void {
		$controller_dirs = array(
			$this->base_dir . 'src/backend/Apps',
			$this->base_dir . 'src/development/Rest',
		);

		$files = array();
		foreach ( $controller_dirs as $dir ) {
			if ( ! is_dir( $dir ) ) {
				continue;
			}
			$iterator = new \RecursiveIteratorIterator(
				new \RecursiveDirectoryIterator( $dir, \RecursiveDirectoryIterator::SKIP_DOTS )
			);
			foreach ( $iterator as $file ) {
				if ( $file->isFile() && str_ends_with( $file->getFilename(), 'Controller.php' ) ) {
					$files[] = $file->getPathname();
				}
			}
		}

		$this->assertNotEmpty( $files, 'REST controller files must exist.' );

		foreach ( $files as $file ) {
			$content       = (string) file_get_contents( $file );
			$relative_path = str_replace( $this->base_dir, '', $file );

			if ( str_contains( $content, 'register_rest_route' ) ) {
				$this->assertStringContainsString(
					"'permission_callback'",
					$content,
					sprintf( 'REST controller %s must declare explicit permission_callback in route options.', $relative_path )
				);
			}
		}
	}

	/**
	 * Assert that DevOpenApiController permissions_check rejects unauthorized callers without loose bypasses.
	 */
	public function test_dev_openapi_controller_permission_check(): void {
		$dev_controller_file = $this->base_dir . 'src/development/Rest/DevOpenApiController.php';
		$this->assertFileExists( $dev_controller_file );

		$content = (string) file_get_contents( $dev_controller_file );

		// Must NOT contain loose cookie auth bypass.
		$this->assertStringNotContainsString(
			'wp_validate_auth_cookie',
			$content,
			'DevOpenApiController must not contain cookie validation auth fallback bypass.'
		);

		// Must enforce manage_options check.
		$this->assertStringContainsString(
			"current_user_can( 'manage_options' )",
			$content,
			'DevOpenApiController must explicitly check manage_options capability.'
		);
	}

	/**
	 * Assert that SettingsController permissions_check requires manage_options.
	 */
	public function test_settings_controller_permission_check(): void {
		$controller_file = $this->base_dir . 'src/backend/Apps/Settings/Rest/SettingsController.php';
		$this->assertFileExists( $controller_file );

		$content = (string) file_get_contents( $controller_file );
		$this->assertStringContainsString(
			"current_user_can( 'manage_options' )",
			$content,
			'SettingsController must enforce manage_options.'
		);
	}
}
