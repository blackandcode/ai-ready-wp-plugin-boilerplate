/**
 * Developer Application Presentation Shell.
 *
 * Implements horizontal sub-tab navigation between System Diagnostics
 * and OpenAPI Reference documentation.
 *
 * @package
 */

import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { Icon, info, code } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { DiagnosticsSection } from './DiagnosticsSection';
import { ApiReferenceSection } from './ApiReferenceSection';
import type {
	WpaibpBootstrapData,
	DeveloperSubTab,
	DeveloperTabMeta,
} from '../types';
import '../styles/developer.css';

export interface DeveloperShellProps {
	bootstrap?: WpaibpBootstrapData;
	initialSubTab?: DeveloperSubTab;
	onSubTabChange?: ( tab: DeveloperSubTab ) => void;
}

const SUB_TABS: DeveloperTabMeta[] = [
	{
		id: 'diagnostics',
		label: __( 'System Diagnostics', 'wp-ai-ready-plugin-boilerplate' ),
		icon: info,
	},
	{
		id: 'api-reference',
		label: __( 'API Reference', 'wp-ai-ready-plugin-boilerplate' ),
		icon: code,
	},
];

export function DeveloperShell( {
	bootstrap,
	initialSubTab = 'diagnostics',
	onSubTabChange,
}: DeveloperShellProps ) {
	const [ activeSubTab, setActiveSubTab ] =
		useState< DeveloperSubTab >( initialSubTab );

	const handleTabClick = ( tabId: DeveloperSubTab ) => {
		setActiveSubTab( tabId );
		if ( onSubTabChange ) {
			onSubTabChange( tabId );
		}
	};

	return (
		<div className="wpaibp-developer-app">
			<div
				className="wpaibp-dev-subtabs-nav"
				role="tablist"
				aria-label={ __(
					'Developer Tools Navigation',
					'wp-ai-ready-plugin-boilerplate'
				) }
			>
				{ SUB_TABS.map( ( tab ) => (
					<Button
						key={ tab.id }
						role="tab"
						aria-selected={ activeSubTab === tab.id }
						className={ `wpaibp-dev-subtab ${
							activeSubTab === tab.id ? 'is-active' : ''
						}` }
						onClick={ () => handleTabClick( tab.id ) }
					>
						<Icon icon={ tab.icon } size={ 16 } />
						<span>{ tab.label }</span>
					</Button>
				) ) }
			</div>

			<div className="wpaibp-dev-tab-content" role="tabpanel">
				{ activeSubTab === 'diagnostics' && (
					<DiagnosticsSection
						environment={ bootstrap?.environment }
						version={ bootstrap?.version }
					/>
				) }

				{ activeSubTab === 'api-reference' && (
					<ApiReferenceSection
						endpoint={ bootstrap?.development?.openApiEndpoint }
						path={
							bootstrap?.development?.openApiPath ||
							'/wpaibp-dev/v1/openapi'
						}
						nonce={ bootstrap?.nonce }
					/>
				) }
			</div>
		</div>
	);
}
