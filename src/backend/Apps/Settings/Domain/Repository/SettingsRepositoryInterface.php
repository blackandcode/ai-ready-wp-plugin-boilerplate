<?php
/**
 * Settings Repository Domain Interface.
 *
 * @package WPAIBP\Backend\Apps\Settings\Domain\Repository
 */

namespace WPAIBP\Backend\Apps\Settings\Domain\Repository;

use WPAIBP\Backend\Apps\Settings\Domain\Model\PluginSettings;

/**
 * Domain repository contract defining persistence operations for PluginSettings.
 */
interface SettingsRepositoryInterface {

	/**
	 * Retrieve plugin settings aggregate.
	 *
	 * @return PluginSettings
	 */
	public function get(): PluginSettings;

	/**
	 * Persist plugin settings aggregate.
	 *
	 * @param PluginSettings $settings Settings aggregate.
	 * @return void
	 */
	public function save( PluginSettings $settings ): void;
}
