<?php
/**
 * Get Settings Query.
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Application\Query
 */

namespace AIReady\WPPluginBoilerplate\Settings\Application\Query;

/**
 * Query object for retrieving plugin settings.
 */
readonly class GetSettingsQuery {

	/**
	 * Specific section to retrieve or null for all sections.
	 *
	 * @var string|null
	 */
	public ?string $section;

	/**
	 * Constructor.
	 *
	 * @param string|null $section Optional section identifier.
	 */
	public function __construct( ?string $section = null ) {
		$this->section = $section;
	}
}
