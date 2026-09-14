/**
 * System Diagnostics Section.
 *
 * Displays host environment, PHP runtime, WordPress core, and REST verification.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import { StatusBadge } from '../../../../shared';
import type { WpaibpBootstrapData } from '../types';

export interface DiagnosticsSectionProps {
	environment?: WpaibpBootstrapData[ 'environment' ];
	version?: string;
}

export function DiagnosticsSection( {
	environment,
	version,
}: DiagnosticsSectionProps ) {
	return (
		<table className="wpaibp-diagnostics-table">
			<tbody>
				<tr>
					<th>
						{ __(
							'Boilerplate Version',
							'wp-ai-ready-plugin-boilerplate'
						) }
					</th>
					<td>
						<code>{ version || '1.3.3' }</code>
					</td>
				</tr>
				<tr>
					<th>
						{ __(
							'PHP Runtime',
							'wp-ai-ready-plugin-boilerplate'
						) }
					</th>
					<td>
						<code>PHP { environment?.phpVersion || '8.3' }</code>{ ' ' }
						<StatusBadge status="success">
							{ __(
								'Compatible',
								'wp-ai-ready-plugin-boilerplate'
							) }
						</StatusBadge>
					</td>
				</tr>
				<tr>
					<th>
						{ __(
							'WordPress Core',
							'wp-ai-ready-plugin-boilerplate'
						) }
					</th>
					<td>
						<code>WP { environment?.wpVersion || '7.1' }</code>{ ' ' }
						<StatusBadge status="success">
							{ __(
								'Supported',
								'wp-ai-ready-plugin-boilerplate'
							) }
						</StatusBadge>
					</td>
				</tr>
				<tr>
					<th>
						{ __(
							'Environment Type',
							'wp-ai-ready-plugin-boilerplate'
						) }
					</th>
					<td>
						<code>{ environment?.environmentType || 'local' }</code>
					</td>
				</tr>
				<tr>
					<th>
						{ __(
							'REST Endpoint Health',
							'wp-ai-ready-plugin-boilerplate'
						) }
					</th>
					<td>
						<code>/wp-json/wpaibp/v1/hello</code>{ ' ' }
						<StatusBadge status="success">
							{ __( 'Active', 'wp-ai-ready-plugin-boilerplate' ) }
						</StatusBadge>
					</td>
				</tr>
			</tbody>
		</table>
	);
}
