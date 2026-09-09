<?php
/**
 * Test Settings Route and Frontend Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Frontend\Apps\Settings
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Frontend\Apps\Settings;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Framework\Container\Container;
use AIReady\WPPluginBoilerplate\Frontend\Apps\Settings\SettingsRoute;
use AIReady\WPPluginBoilerplate\Frontend\Apps\Settings\SettingsFrontendServiceProvider;

/**
 * Class SettingsRouteTest
 */
class SettingsRouteTest extends TestCase {

	/**
	 * Test SettingsRoute screen matching.
	 */
	public function test_settings_route_screen_matching(): void {
		$this->assertSame( 'airwp-settings', SettingsRoute::SETTINGS_SLUG );
		$this->assertSame( 'airwp-plugin', SettingsRoute::MENU_SLUG );
		$this->assertTrue( SettingsRoute::is_screen( 'toplevel_page_airwp-settings', SettingsRoute::SETTINGS_SLUG ) );
		$this->assertFalse( SettingsRoute::is_screen( 'edit.php', SettingsRoute::SETTINGS_SLUG ) );
	}

	/**
	 * Test SettingsFrontendServiceProvider boot runs without error.
	 */
	public function test_settings_frontend_service_provider_lifecycle(): void {
		$container = new Container();
		$provider  = new SettingsFrontendServiceProvider();

		$this->assertInstanceOf( SettingsFrontendServiceProvider::class, $provider );

		$provider->register( $container );
		$provider->boot();
	}
}
