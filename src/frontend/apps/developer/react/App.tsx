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
import type { WpaibpBootstrapData, DeveloperSubTab } from './types';

export interface DeveloperAppProps {
	bootstrap?: WpaibpBootstrapData;
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
				'wp-ai-ready-plugin-boilerplate'
			) }
		>
			<DeveloperShell
				bootstrap={ bootstrap }
				initialSubTab={ initialSubTab }
			/>
		</ErrorBoundary>
	);
}
