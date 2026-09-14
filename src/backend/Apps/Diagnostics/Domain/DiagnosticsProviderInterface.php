<?php
/**
 * Diagnostics Provider Domain Interface.
 *
 * @package WPAIBP\Backend\Apps\Diagnostics\Domain
 */

namespace WPAIBP\Backend\Apps\Diagnostics\Domain;

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
