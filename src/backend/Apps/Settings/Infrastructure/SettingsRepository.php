<?php
/**
 * Settings Repository (Backward-compatible adapter).
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Infrastructure
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Infrastructure;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Backward-compatible subclass extending WordPressSettingsRepository.
 */
class SettingsRepository extends WordPressSettingsRepository {}
