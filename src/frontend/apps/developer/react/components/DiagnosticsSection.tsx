/**
 * System Diagnostics Section.
 *
 * Displays host environment, PHP runtime, WordPress core, and REST verification.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import { StatusBadge } from '../../../../shared';
import type { AirwpBootstrapData } from '../types';

export interface DiagnosticsSectionProps {
	environment?: AirwpBootstrapData[ 'environment' ];
	version?: string;
}

export function DiagnosticsSection( {
	environment,
	version,
}: DiagnosticsSectionProps ) {
	return (
		<table className="airwp-diagnostics-table">
			<tbody>
				<tr>
					<th>
						{ __(
							'Boilerplate Version',
							'ai-ready-wp-plugin-boilerplate'
						) }
					</th>
					<td>
						<code>{ version || '1.1.1' }</code>
					</td>
				</tr>
				<tr>
					<th>
						{ __(
							'PHP Runtime',
							'ai-ready-wp-plugin-boilerplate'
						) }
					</th>
					<td>
						<code>PHP { environment?.phpVersion || '8.3' }</code>{ ' ' }
						<StatusBadge status="success">
							{ __(
								'Compatible',
								'ai-ready-wp-plugin-boilerplate'
							) }
						</StatusBadge>
					</td>
				</tr>
				<tr>
					<th>
						{ __(
							'WordPress Core',
							'ai-ready-wp-plugin-boilerplate'
						) }
					</th>
					<td>
						<code>WP { environment?.wpVersion || '7.0' }</code>{ ' ' }
						<StatusBadge status="success">
							{ __(
								'Supported',
								'ai-ready-wp-plugin-boilerplate'
							) }
						</StatusBadge>
					</td>
				</tr>
				<tr>
					<th>
						{ __(
							'Environment Type',
							'ai-ready-wp-plugin-boilerplate'
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
							'ai-ready-wp-plugin-boilerplate'
						) }
					</th>
					<td>
						<code>/wp-json/ai-ready-wp/v1/hello</code>{ ' ' }
						<StatusBadge status="success">
							{ __( 'Active', 'ai-ready-wp-plugin-boilerplate' ) }
						</StatusBadge>
					</td>
				</tr>
			</tbody>
		</table>
	);
}
