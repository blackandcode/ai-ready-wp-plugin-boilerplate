<?php
/**
 * Settings Repository (Backward-compatible adapter).
 *
 * @package WPAIBP\Backend\Apps\Settings\Infrastructure
 */

namespace WPAIBP\Backend\Apps\Settings\Infrastructure;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Backward-compatible subclass extending WordPressSettingsRepository.
 */
class SettingsRepository extends WordPressSettingsRepository {}
