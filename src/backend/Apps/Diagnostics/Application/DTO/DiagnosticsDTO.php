<?php
/**
 * Diagnostics DTO.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Application\DTO
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Application\DTO;

/**
 * Immutable DTO representing system diagnostics and runtime health.
 */
readonly class DiagnosticsDTO {

	/**
	 * PHP version.
	 *
	 * @var string
	 */
	public string $php_version;

	/**
	 * WordPress version.
	 *
	 * @var string
	 */
	public string $wp_version;

	/**
	 * Environment type.
	 *
	 * @var string
	 */
	public string $environment_type;

	/**
	 * Database connectivity status.
	 *
	 * @var string
	 */
	public string $db_status;

	/**
	 * REST API availability status.
	 *
	 * @var string
	 */
	public string $rest_status;

	/**
	 * Plugin version.
	 *
	 * @var string
	 */
	public string $plugin_version;

	/**
	 * Constructor.
	 *
	 * @param string $php_version PHP version.
	 * @param string $wp_version WordPress version.
	 * @param string $environment_type Environment type.
	 * @param string $db_status Database status.
	 * @param string $rest_status REST API status.
	 * @param string $plugin_version Plugin version.
	 */
	public function __construct(
		string $php_version,
		string $wp_version,
		string $environment_type,
		string $db_status,
		string $rest_status,
		string $plugin_version
	) {
		$this->php_version      = $php_version;
		$this->wp_version       = $wp_version;
		$this->environment_type = $environment_type;
		$this->db_status        = $db_status;
		$this->rest_status      = $rest_status;
		$this->plugin_version   = $plugin_version;
	}

	/**
	 * Convert DTO to associative array.
	 *
	 * @return array<string, string>
	 */
	public function to_array(): array {
		return array(
			'php_version'      => $this->php_version,
			'wp_version'       => $this->wp_version,
			'environment_type' => $this->environment_type,
			'db_status'        => $this->db_status,
			'rest_status'      => $this->rest_status,
			'plugin_version'   => $this->plugin_version,
		);
	}
}
