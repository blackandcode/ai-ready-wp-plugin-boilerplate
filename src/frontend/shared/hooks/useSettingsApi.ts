/**
 * Custom Hook for Fetching and Updating Settings via SettingsApiClient.
 *
 * @package
 */

import { useState, useCallback, useEffect } from '@wordpress/element';
import {
	SettingsApiClient,
	defaultSettingsApiClient,
	ApiClientError,
} from '../api/SettingsApiClient';
import type { PluginSettingsData } from '../types';

export function useSettingsApi(
	client: SettingsApiClient = defaultSettingsApiClient
) {
	const [ settings, setSettings ] = useState< PluginSettingsData | null >(
		null
	);
	const [ isLoading, setIsLoading ] = useState< boolean >( true );
	const [ isSaving, setIsSaving ] = useState< boolean >( false );
	const [ error, setError ] = useState< string | null >( null );

	const fetchSettings = useCallback( async () => {
		setIsLoading( true );
		setError( null );
		try {
			const data = await client.getSettings();
			setSettings( data );
		} catch ( err: unknown ) {
			if ( err instanceof ApiClientError || err instanceof Error ) {
				setError( err.message );
			} else {
				setError( 'Failed to load settings.' );
			}
		} finally {
			setIsLoading( false );
		}
	}, [ client ] );

	const saveSettings = useCallback(
		async ( payload: PluginSettingsData ): Promise< boolean > => {
			setIsSaving( true );
			setError( null );
			try {
				const updated = await client.updateSettings( payload );
				setSettings( updated );
				return true;
			} catch ( err: unknown ) {
				if ( err instanceof ApiClientError || err instanceof Error ) {
					setError( err.message );
				} else {
					setError( 'Failed to save settings.' );
				}
				return false;
			} finally {
				setIsSaving( false );
			}
		},
		[ client ]
	);

	useEffect( () => {
		fetchSettings();
	}, [ fetchSettings ] );

	return {
		settings,
		setSettings,
		isLoading,
		isSaving,
		error,
		reload: fetchSettings,
		saveSettings,
	};
}
