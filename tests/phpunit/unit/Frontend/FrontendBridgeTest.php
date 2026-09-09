<?php
/**
 * Test Frontend Bridge Services.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Frontend
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Frontend;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Frontend\Settings\SettingsRoute;
use AIReady\WPPluginBoilerplate\Frontend\Settings\SettingsBootstrapData;

/**
 * Class FrontendBridgeTest
 */
class FrontendBridgeTest extends TestCase {

	/**
	 * Test SettingsRoute screen matching.
	 */
	public function test_settings_route_screen_matching(): void {
		$this->assertSame( 'airwp-settings', SettingsRoute::SETTINGS_SLUG );
		$this->assertTrue( SettingsRoute::is_screen( 'toplevel_page_airwp-settings', SettingsRoute::SETTINGS_SLUG ) );
		$this->assertFalse( SettingsRoute::is_screen( 'edit.php', SettingsRoute::SETTINGS_SLUG ) );
	}
}
