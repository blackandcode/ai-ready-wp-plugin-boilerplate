<?php
/**
 * Test DevelopmentMode implementations.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Framework\Environment
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Framework\Environment;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Framework\Environment\DevelopmentMode;
use AIReady\WPPluginBoilerplate\Framework\Environment\FakeDevelopmentMode;
use AIReady\WPPluginBoilerplate\Framework\Environment\WordPressDevelopmentMode;

/**
 * Class DevelopmentModeTest
 */
class DevelopmentModeTest extends TestCase {

	/**
	 * Test FakeDevelopmentMode defaults and mutation.
	 */
	public function test_fake_development_mode(): void {
		$dev_mode = new FakeDevelopmentMode( false );
		$this->assertFalse( $dev_mode->is_plugin_development() );
		$this->assertSame( '', $dev_mode->get_mode() );

		$dev_mode->set_development( true );
		$this->assertTrue( $dev_mode->is_plugin_development() );
		$this->assertSame( 'plugin', $dev_mode->get_mode() );

		$dev_mode->set_development( true, 'all' );
		$this->assertTrue( $dev_mode->is_plugin_development() );
		$this->assertSame( 'all', $dev_mode->get_mode() );

		$dev_mode->set_development( false, 'theme' );
		$this->assertFalse( $dev_mode->is_plugin_development() );
		$this->assertSame( 'theme', $dev_mode->get_mode() );
	}

	/**
	 * Test WordPressDevelopmentMode implements DevelopmentMode.
	 */
	public function test_wordpress_development_mode_implements_interface(): void {
		$dev_mode = new WordPressDevelopmentMode();
		$this->assertInstanceOf( DevelopmentMode::class, $dev_mode );
		$this->assertIsBool( $dev_mode->is_plugin_development() );
		$this->assertIsString( $dev_mode->get_mode() );
	}
}
