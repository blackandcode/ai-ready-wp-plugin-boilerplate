<?php
/**
 * Settings Repository (Backward-compatible adapter).
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Infrastructure
 */

namespace AIReady\WPPluginBoilerplate\Settings\Infrastructure;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Backward-compatible subclass extending WordPressSettingsRepository.
 */
class SettingsRepository extends WordPressSettingsRepository {}
