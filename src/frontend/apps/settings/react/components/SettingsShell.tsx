/**
 * Settings Application Presentation Shell.
 *
 * Implements the card-based settings layout with left sidebar navigation,
 * rendering core tabs and dynamic embedded application extensions.
 *
 * @package
 */

import { useState } from '@wordpress/element';
import {
	Card,
	CardHeader,
	CardBody,
	CardFooter,
	Button,
	Icon,
} from '@wordpress/components';
import { cog, shield } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { GeneralSection } from './GeneralSection';
import { AdvancedSection } from './AdvancedSection';
import { developerAppExtension } from '../../../developer';
import type {
	PluginSettings,
	WpaibpBootstrapData,
	SettingsAppExtension,
} from '../types';

export type CoreSettingsTab = 'general' | 'advanced';
export type SettingsTab = CoreSettingsTab | string;

export interface SettingsShellProps {
	settings: PluginSettings;
	bootstrap?: WpaibpBootstrapData;
	isDirty: boolean;
	isSaving: boolean;
	onUpdate: ( updated: PluginSettings ) => void;
	onSave: () => void;
	onReset: () => void;
	extensions?: SettingsAppExtension[];
}

interface TabDefinition {
	id: SettingsTab;
	label: string;
	icon: any;
	subtitle: string;
}

const BASE_TABS: TabDefinition[] = [
	{
		id: 'general',
		label: __( 'General', 'wp-ai-ready-plugin-boilerplate' ),
		icon: cog,
		subtitle: __(
			'Configure greeting message, core toggles, and metadata.',
			'wp-ai-ready-plugin-boilerplate'
		),
	},
	{
		id: 'advanced',
		label: __( 'Advanced & Retention', 'wp-ai-ready-plugin-boilerplate' ),
		icon: shield,
		subtitle: __(
			'Developer controls, debug logging, and data persistence policies.',
			'wp-ai-ready-plugin-boilerplate'
		),
	},
];

const DEFAULT_EXTENSIONS: SettingsAppExtension[] = [ developerAppExtension ];

export function SettingsShell( {
	settings,
	bootstrap,
	isDirty,
	isSaving,
	onUpdate,
	onSave,
	onReset,
	extensions = DEFAULT_EXTENSIONS,
}: SettingsShellProps ) {
	const [ activeTab, setActiveTab ] = useState< SettingsTab >( 'general' );

	const activeExtensions = extensions.filter( ( ext ) => {
		if ( typeof ext.isVisible === 'function' ) {
			return ext.isVisible( bootstrap );
		}
		return true;
	} );

	const extensionTabs: TabDefinition[] = activeExtensions.map( ( ext ) => ( {
		id: ext.id,
		label: ext.label,
		icon: ext.icon,
		subtitle: ext.subtitle,
	} ) );

	const visibleTabs: TabDefinition[] = [ ...BASE_TABS, ...extensionTabs ];

	const currentTabMeta =
		visibleTabs.find( ( t ) => t.id === activeTab ) || visibleTabs[ 0 ];

	const currentExtension = activeExtensions.find(
		( ext ) => ext.id === activeTab
	);

	const showFooter =
		! currentExtension || currentExtension.hasFooter === true;

	return (
		<div className="wpaibp-settings-layout">
			<nav
				className="wpaibp-settings-sidebar"
				aria-label={ __(
					'Settings Sections',
					'wp-ai-ready-plugin-boilerplate'
				) }
			>
				<ul className="wpaibp-sidebar-nav-list">
					{ visibleTabs.map( ( tab ) => (
						<li key={ tab.id }>
							<Button
								className={ `wpaibp-sidebar-tab ${
									activeTab === tab.id ? 'is-active' : ''
								}` }
								onClick={ () => setActiveTab( tab.id ) }
							>
								<Icon icon={ tab.icon } size={ 18 } />
								<span>{ tab.label }</span>
							</Button>
						</li>
					) ) }
				</ul>
			</nav>

			<main className="wpaibp-settings-main">
				<Card className="wpaibp-settings-card">
					<CardHeader className="wpaibp-card-header">
						<div className="wpaibp-header-content">
							<div className="wpaibp-header-badge">
								<Icon
									icon={ currentTabMeta.icon }
									size={ 20 }
								/>
							</div>
							<div>
								<h2 className="wpaibp-card-title">
									{ currentTabMeta.label }
								</h2>
								<p className="wpaibp-card-subtitle">
									{ currentTabMeta.subtitle }
								</p>
							</div>
						</div>
					</CardHeader>

					<CardBody className="wpaibp-card-body">
						{ activeTab === 'general' && (
							<GeneralSection
								settings={ settings.general }
								onChange={ ( general ) =>
									onUpdate( { ...settings, general } )
								}
							/>
						) }

						{ activeTab === 'advanced' && (
							<AdvancedSection
								advanced={ settings.advanced }
								dataRetention={ settings.data_retention }
								onAdvancedChange={ ( advanced ) =>
									onUpdate( { ...settings, advanced } )
								}
								onDataRetentionChange={ ( retention ) =>
									onUpdate( {
										...settings,
										data_retention: retention,
									} )
								}
							/>
						) }

						{ currentExtension && (
							<currentExtension.component
								bootstrap={ bootstrap }
							/>
						) }
					</CardBody>

					{ showFooter && (
						<CardFooter className="wpaibp-card-footer">
							<div
								className={ `wpaibp-save-status ${
									isDirty ? 'is-dirty' : ''
								}` }
							>
								{ isDirty
									? __(
											'You have unsaved changes',
											'wp-ai-ready-plugin-boilerplate'
									  )
									: __(
											'All changes saved',
											'wp-ai-ready-plugin-boilerplate'
									  ) }
							</div>
							<div style={ { display: 'flex', gap: '8px' } }>
								<Button
									variant="tertiary"
									disabled={ ! isDirty || isSaving }
									onClick={ onReset }
								>
									{ __(
										'Reset',
										'wp-ai-ready-plugin-boilerplate'
									) }
								</Button>
								<Button
									variant="primary"
									isBusy={ isSaving }
									disabled={ ! isDirty || isSaving }
									onClick={ onSave }
								>
									{ __(
										'Save Settings',
										'wp-ai-ready-plugin-boilerplate'
									) }
								</Button>
							</div>
						</CardFooter>
					) }
				</Card>
			</main>
		</div>
	);
}
