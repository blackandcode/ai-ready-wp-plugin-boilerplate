<?php
/**
 * Settings Route and Screen Helper.
 *
 * @package AIReady\WPPluginBoilerplate\Frontend\Settings
 */

namespace AIReady\WPPluginBoilerplate\Frontend\Settings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Screen slug definitions and routing helpers for Settings app.
 */
class SettingsRoute {

	/**
	 * Top-level menu page slug.
	 */
	public const MENU_SLUG = 'airwp-plugin';

	/**
	 * Settings submenu page slug.
	 */
	public const SETTINGS_SLUG = 'airwp-settings';

	/**
	 * Check whether current admin hook matches target screen slug.
	 *
	 * @param string $hook_suffix Admin hook suffix.
	 * @param string $screen_slug Screen slug constant.
	 * @return bool
	 */
	public static function is_screen( string $hook_suffix, string $screen_slug ): bool {
		return false !== strpos( $hook_suffix, $screen_slug );
	}
}
