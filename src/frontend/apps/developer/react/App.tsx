/**
 * Developer Application Root Container.
 *
 * Can run standalone or embedded within another host application.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import { ErrorBoundary } from '../../../shared';
import { DeveloperShell } from './components/DeveloperShell';
import type { AirwpBootstrapData, DeveloperSubTab } from './types';

export interface DeveloperAppProps {
	bootstrap?: AirwpBootstrapData;
	initialSubTab?: DeveloperSubTab;
}

export function DeveloperApp( {
	bootstrap,
	initialSubTab = 'diagnostics',
}: DeveloperAppProps ) {
	return (
		<ErrorBoundary
			fallbackTitle={ __(
				'Developer Tools Error',
				'ai-ready-wp-plugin-boilerplate'
			) }
		>
			<DeveloperShell
				bootstrap={ bootstrap }
				initialSubTab={ initialSubTab }
			/>
		</ErrorBoundary>
	);
}
