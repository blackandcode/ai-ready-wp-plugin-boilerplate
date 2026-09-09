<?php
/**
 * Diagnostics Provider Domain Interface.
 *
 * @package AIReady\WPPluginBoilerplate\Diagnostics\Domain
 */

namespace AIReady\WPPluginBoilerplate\Diagnostics\Domain;

/**
 * Contract for querying environment and system diagnostic health metrics.
 */
interface DiagnosticsProviderInterface {

	/**
	 * Retrieve raw diagnostic metrics.
	 *
	 * @return array<string, mixed>
	 */
	public function get_metrics(): array;
}
