<?php
/**
 * Test Settings Schema.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\Settings\Infrastructure
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\Settings\Infrastructure;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Infrastructure\SettingsSchema;

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
