<?php
/**
 * Diagnostics WP-CLI Command.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Cli
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Cli;

use WP_CLI;
use AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Application\DiagnosticsService;
use AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Infrastructure\WordPressDiagnosticsProvider;
use AIReady\WPPluginBoilerplate\Framework\Kernel\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Inspect diagnostics via WP-CLI.
 */
class DiagnosticsCliCommand {

	/**
	 * Diagnostics service instance.
	 *
	 * @var DiagnosticsService|null
	 */
	private ?DiagnosticsService $service = null;

	/**
	 * Constructor.
	 *
	 * @param DiagnosticsService|null $service Optional service.
	 */
	public function __construct( ?DiagnosticsService $service = null ) {
		$this->service = $service;
	}

	/**
	 * Resolve DiagnosticsService.
	 *
	 * @return DiagnosticsService
	 */
	private function get_diagnostics_service(): DiagnosticsService {
		if ( null !== $this->service ) {
			return $this->service;
		}

		$container = Plugin::instance()->get_container();
		if ( null !== $container && $container->has( DiagnosticsService::class ) ) {
			return $container->get( DiagnosticsService::class );
		}

		$provider = new WordPressDiagnosticsProvider();
		return new DiagnosticsService( $provider );
	}

	/**
	 * Inspect plugin runtime diagnostic telemetry.
	 *
	 * @param array<int, string>   $args Positional arguments.
	 * @param array<string, mixed> $assoc_args Associative arguments.
	 * @return void
	 */
	public function doctor( array $args, array $assoc_args ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$service     = $this->get_diagnostics_service();
		$diagnostics = $service->get_diagnostics()->to_array();

		$format = $assoc_args['format'] ?? 'table';

		if ( 'table' === $format ) {
			$rows = array();
			foreach ( $diagnostics as $metric => $val ) {
				$rows[] = array(
					'Metric' => $metric,
					'Status' => $val,
				);
			}
			WP_CLI\Utils\format_items( 'table', $rows, array( 'Metric', 'Status' ) );
			return;
		}

		WP_CLI\Utils\format_items( $format, array( $diagnostics ), array_keys( $diagnostics ) );
	}
}
