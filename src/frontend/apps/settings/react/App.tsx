/**
 * Settings Application Root Container.
 *
 * Implements the Container / Presenter design pattern, orchestrating
 * SettingsApiClient, useSettingsForm, useNotice, and ErrorBoundary.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	ErrorBoundary,
	NoticeBanner,
	LoadingSkeleton,
	useSettingsForm,
	useNotice,
	defaultSettingsApiClient,
	type ISettingsApiClient,
	type PluginSettings,
	type AirwpBootstrapData,
} from '../../../shared';
import { SettingsShell } from './components/SettingsShell';
import './styles/settings.css';

const DEFAULT_SETTINGS: PluginSettings = {
	general: {
		greeting_message: 'Hello from AI-Ready WP Plugin Boilerplate!',
		enable_feature: true,
		description: 'A modern WordPress plugin powered by AI workflows.',
	},
	advanced: {
		rest_debug: false,
		cache_ttl: 3600,
	},
	data_retention: {
		uninstall_action: 'preserve',
	},
};

export interface AppProps {
	bootstrap?: AirwpBootstrapData;
	apiClient?: ISettingsApiClient;
}

export function App( {
	bootstrap,
	apiClient = defaultSettingsApiClient,
}: AppProps ) {
	const initial = bootstrap?.initialSettings || DEFAULT_SETTINGS;
	const form = useSettingsForm( initial );
	const { notice, showSuccess, showError, dismiss } = useNotice();
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isLoading, setIsLoading ] = useState(
		! bootstrap?.initialSettings
	);

	const formCommit = form.commit;

	useEffect( () => {
		// If initialSettings were not localized, fetch them via the API client
		if ( ! bootstrap?.initialSettings ) {
			let isMounted = true;
			apiClient
				.getSettings()
				.then( ( data ) => {
					if ( isMounted ) {
						formCommit( data );
						setIsLoading( false );
					}
				} )
				.catch( ( err ) => {
					if ( isMounted ) {
						showError(
							err?.message ||
								__(
									'Failed to load settings from server.',
									'ai-ready-wp-plugin-boilerplate'
								)
						);
						setIsLoading( false );
					}
				} );

			return () => {
				isMounted = false;
			};
		}
	}, [ bootstrap?.initialSettings, apiClient, formCommit, showError ] );

	const handleSave = async () => {
		setIsSaving( true );
		dismiss();

		try {
			const saved = await apiClient.updateSettings( form.settings );
			form.commit( saved );
			showSuccess(
				__(
					'Settings successfully saved.',
					'ai-ready-wp-plugin-boilerplate'
				)
			);
		} catch ( error: any ) {
			showError(
				error?.message ||
					__(
						'Failed to save settings. Please check your permissions.',
						'ai-ready-wp-plugin-boilerplate'
					)
			);
		} finally {
			setIsSaving( false );
		}
	};

	const handleReset = () => {
		form.reset();
		dismiss();
	};

	let appState = 'ready';
	if ( isLoading ) {
		appState = 'loading';
	} else if ( isSaving ) {
		appState = 'saving';
	}

	return (
		<ErrorBoundary
			fallbackTitle={ __(
				'Settings Application Error',
				'ai-ready-wp-plugin-boilerplate'
			) }
		>
			<div
				className="airwp-app-container"
				data-airwp-app-state={ appState }
			>
				{ notice && (
					<NoticeBanner
						status={ notice.status }
						onDismiss={ dismiss }
					>
						{ notice.message }
					</NoticeBanner>
				) }

				{ isLoading ? (
					<LoadingSkeleton />
				) : (
					<SettingsShell
						settings={ form.settings }
						bootstrap={ bootstrap }
						isDirty={ form.isDirty }
						isSaving={ isSaving }
						onUpdate={ form.setSettings }
						onSave={ handleSave }
						onReset={ handleReset }
					/>
				) }
			</div>
		</ErrorBoundary>
	);
}
