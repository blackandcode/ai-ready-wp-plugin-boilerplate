<?php
/**
 * Unit Test for TemplateRenderer.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Support
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Support;

use AIReady\WPPluginBoilerplate\Support\View\TemplateRenderer;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

/**
 * Class TemplateRendererTest
 */
class TemplateRendererTest extends TestCase {

	private string $temp_dir;
	private TemplateRenderer $renderer;

	protected function setUp(): void {
		parent::setUp();
		$this->temp_dir = sys_get_temp_dir() . '/airwp_test_templates_' . uniqid();
		mkdir( $this->temp_dir );
		mkdir( $this->temp_dir . '/admin' );

		file_put_contents(
			$this->temp_dir . '/test-view.php',
			'<?php echo "Hello, " . ( $name ?? "World" ); ?>'
		);

		file_put_contents(
			$this->temp_dir . '/admin/admin-view.php',
			'<?php echo "Admin Section: " . ( $section ?? "Dashboard" ); ?>'
		);

		$this->renderer = new TemplateRenderer( $this->temp_dir );
	}

	protected function tearDown(): void {
		@unlink( $this->temp_dir . '/test-view.php' );
		@unlink( $this->temp_dir . '/admin/admin-view.php' );
		@rmdir( $this->temp_dir . '/admin' );
		@rmdir( $this->temp_dir );
		parent::tearDown();
	}

	public function test_renders_template_with_data_to_string(): void {
		$output = $this->renderer->render_to_string( 'test-view', array( 'name' => 'WordPress AI' ) );
		$this->assertSame( 'Hello, WordPress AI', $output );
	}

	public function test_renders_template_directly_to_stdout(): void {
		ob_start();
		$this->renderer->render( 'test-view', array( 'name' => 'Standard Output' ) );
		$output = ob_get_clean();

		$this->assertSame( 'Hello, Standard Output', $output );
	}

	public function test_falls_back_to_admin_directory(): void {
		$output = $this->renderer->render_to_string( 'admin-view', array( 'section' => 'Settings' ) );
		$this->assertSame( 'Admin Section: Settings', $output );
	}

	public function test_rejects_directory_traversal_attempts(): void {
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Security violation: directory traversal detected' );

		$this->renderer->resolve_path( '../secrets.txt' );
	}

	public function test_rejects_null_byte_injections(): void {
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Security violation: directory traversal detected' );

		$this->renderer->resolve_path( "test\0view" );
	}

	public function test_throws_exception_when_template_file_not_found(): void {
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'does not exist' );

		$this->renderer->resolve_path( 'non-existent-template' );
	}
}
