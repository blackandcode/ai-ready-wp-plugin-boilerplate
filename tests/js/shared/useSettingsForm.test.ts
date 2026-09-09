import { renderHook, act } from '@testing-library/react';
import { useSettingsForm } from '../../../assets/src/shared/hooks/useSettingsForm';
import type { PluginSettings } from '../../../assets/src/shared/types';

describe( 'useSettingsForm State Reducer Hook', () => {
	const initial: PluginSettings = {
		general: {
			greeting_message: 'Initial Greeting',
			enable_feature: false,
			description: 'Initial Description',
		},
		advanced: {
			rest_debug: false,
			cache_ttl: 1800,
		},
		data_retention: {
			uninstall_action: 'preserve',
		},
	};

	it( 'initializes with given settings and not dirty', () => {
		const { result } = renderHook( () => useSettingsForm( initial ) );

		expect( result.current.settings ).toEqual( initial );
		expect( result.current.isDirty ).toBe( false );
	} );

	it( 'marks dirty when general settings are modified', () => {
		const { result } = renderHook( () => useSettingsForm( initial ) );

		act( () => {
			result.current.updateGeneral( {
				greeting_message: 'Updated Greeting',
			} );
		} );

		expect( result.current.settings.general.greeting_message ).toBe(
			'Updated Greeting'
		);
		expect( result.current.isDirty ).toBe( true );
	} );

	it( 'resets back to initial state on reset()', () => {
		const { result } = renderHook( () => useSettingsForm( initial ) );

		act( () => {
			result.current.updateAdvanced( { cache_ttl: 7200 } );
		} );
		expect( result.current.isDirty ).toBe( true );

		act( () => {
			result.current.reset();
		} );

		expect( result.current.settings.advanced.cache_ttl ).toBe( 1800 );
		expect( result.current.isDirty ).toBe( false );
	} );

	it( 'commits new baseline on commit()', () => {
		const { result } = renderHook( () => useSettingsForm( initial ) );

		const newSettings: PluginSettings = {
			...initial,
			general: {
				...initial.general,
				greeting_message: 'Committed Greeting',
			},
		};

		act( () => {
			result.current.commit( newSettings );
		} );

		expect( result.current.settings.general.greeting_message ).toBe(
			'Committed Greeting'
		);
		expect( result.current.isDirty ).toBe( false );

		// Resetting now keeps the committed state
		act( () => {
			result.current.reset();
		} );
		expect( result.current.settings.general.greeting_message ).toBe(
			'Committed Greeting'
		);
	} );
} );
