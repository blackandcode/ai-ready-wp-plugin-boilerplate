<?php
/**
 * Diagnostics Application Service.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Application
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Application;

use AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Application\DTO\DiagnosticsDTO;
use AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Domain\DiagnosticsProviderInterface;

/**
 * Service orchestrating system diagnostic telemetry.
 */
class DiagnosticsService {

	/**
	 * Diagnostics provider.
	 *
	 * @var DiagnosticsProviderInterface
	 */
	private DiagnosticsProviderInterface $provider;

	/**
	 * Constructor.
	 *
	 * @param DiagnosticsProviderInterface $provider Provider.
	 */
	public function __construct( DiagnosticsProviderInterface $provider ) {
		$this->provider = $provider;
	}

	/**
	 * Retrieve current diagnostics DTO.
	 *
	 * @return DiagnosticsDTO
	 */
	public function get_diagnostics(): DiagnosticsDTO {
		$metrics = $this->provider->get_metrics();

		return new DiagnosticsDTO(
			(string) ( $metrics['php_version'] ?? PHP_VERSION ),
			(string) ( $metrics['wp_version'] ?? '7.1' ),
			(string) ( $metrics['environment_type'] ?? 'local' ),
			(string) ( $metrics['db_status'] ?? 'connected' ),
			(string) ( $metrics['rest_status'] ?? 'available' ),
			(string) ( $metrics['plugin_version'] ?? '1.3.3' )
		);
	}
}
