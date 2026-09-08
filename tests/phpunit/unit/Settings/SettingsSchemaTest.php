<?php
/**
 * Test Settings Schema.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Settings
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Settings;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Settings\Infrastructure\SettingsSchema;

/**
 * Class SettingsSchemaTest
 */
class SettingsSchemaTest extends TestCase {

	/**
	 * Test default structure.
	 */
	public function test_defaults_structure(): void {
		$defaults = SettingsSchema::get_defaults();

		$this->assertArrayHasKey( 'general', $defaults );
		$this->assertArrayHasKey( 'advanced', $defaults );
		$this->assertArrayHasKey( 'data_retention', $defaults );

		$this->assertTrue( $defaults['general']['enable_feature'] );
		$this->assertSame( 3600, $defaults['advanced']['cache_ttl'] );
		$this->assertSame( 'preserve', $defaults['data_retention']['uninstall_action'] );
	}
}
