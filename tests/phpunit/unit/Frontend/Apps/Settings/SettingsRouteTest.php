<?php
/**
 * Test Settings Route and Frontend Service Provider.
 *
 * @package WPAIBP\Tests\Unit\Frontend\Apps\Settings
 */

namespace WPAIBP\Tests\Unit\Frontend\Apps\Settings;

use PHPUnit\Framework\TestCase;
use WPAIBP\Framework\Container\Container;
use WPAIBP\Frontend\Apps\Settings\SettingsRoute;
use WPAIBP\Frontend\Apps\Settings\SettingsFrontendServiceProvider;

/**
 * Class SettingsRouteTest
 */
class SettingsRouteTest extends TestCase {

	/**
	 * Test SettingsRoute screen matching.
	 */
	public function test_settings_route_screen_matching(): void {
		$this->assertSame( 'wpaibp-settings', SettingsRoute::SETTINGS_SLUG );
		$this->assertSame( 'wpaibp-plugin', SettingsRoute::MENU_SLUG );
		$this->assertTrue( SettingsRoute::is_screen( 'toplevel_page_wpaibp-settings', SettingsRoute::SETTINGS_SLUG ) );
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
