/**
 * Developer Application Public Exports & Settings Extension.
 *
 * @package
 */

import { code } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { DeveloperApp } from './react/App';
import type { SettingsAppExtension } from '../../shared';

export { DeveloperApp } from './react/App';
export { DeveloperShell } from './react/components/DeveloperShell';
export { DiagnosticsSection } from './react/components/DiagnosticsSection';
export { ApiReferenceSection } from './react/components/ApiReferenceSection';
export type { DeveloperSubTab, DeveloperTabMeta } from './react/types';

/**
 * Settings app extension registration for Developer Tools.
 */
export const developerAppExtension: SettingsAppExtension = {
	id: 'developer',
	label: __( 'Developer Tools', 'ai-ready-wp-plugin-boilerplate' ),
	icon: code,
	subtitle: __(
		'System diagnostics telemetry and live OpenAPI 3.1 specification viewer.',
		'ai-ready-wp-plugin-boilerplate'
	),
	component: DeveloperApp,
	hasFooter: false,
	isVisible: ( bootstrap ) =>
		Boolean(
			bootstrap?.development?.pluginMode &&
				( bootstrap?.development?.openApiEndpoint ||
					bootstrap?.development?.openApiPath )
		),
};
