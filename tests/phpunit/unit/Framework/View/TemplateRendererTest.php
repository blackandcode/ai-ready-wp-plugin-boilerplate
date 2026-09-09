<?php
/**
 * Unit Test for TemplateRenderer.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Framework\View
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Framework\View;

use AIReady\WPPluginBoilerplate\Framework\View\TemplateRenderer;
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

	public function test_resolves_app_level_template_from_frontend_root(): void {
		$parent_dir = $this->temp_dir . '/frontend_root';
		$tpl_dir    = $parent_dir . '/templates';
		$app_dir    = $parent_dir . '/apps/settings/templates';
		mkdir( $parent_dir );
		mkdir( $tpl_dir );
		mkdir( $parent_dir . '/apps', 0777, true );
		mkdir( $parent_dir . '/apps/settings', 0777, true );
		mkdir( $app_dir, 0777, true );
		file_put_contents( $app_dir . '/custom.php', '<?php echo "App View"; ?>' );

		$renderer = new TemplateRenderer( $tpl_dir );
		$resolved = $renderer->resolve_path( 'apps/settings/templates/custom.php' );
		$this->assertSame( $app_dir . '/custom.php', $resolved );

		@unlink( $app_dir . '/custom.php' );
		@rmdir( $app_dir );
		@rmdir( $parent_dir . '/apps/settings' );
		@rmdir( $parent_dir . '/apps' );
		@rmdir( $tpl_dir );
		@rmdir( $parent_dir );
	}

	public function test_throws_exception_when_template_file_not_found(): void {
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'does not exist' );

		$this->renderer->resolve_path( 'non-existent-template' );
	}
}
