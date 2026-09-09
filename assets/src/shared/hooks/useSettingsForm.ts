/**
 * State Reducer Hook for Settings Form State Management.
 *
 * Implements the State Reducer design pattern, maintaining immutable state,
 * dirty tracking, and atomic rollback/commit operations.
 *
 * @package
 */

import { useReducer, useCallback, useMemo } from '@wordpress/element';
import type {
	PluginSettings,
	GeneralSettings,
	AdvancedSettings,
	DataRetentionSettings,
} from '../types';

export interface SettingsFormState {
	initial: PluginSettings;
	current: PluginSettings;
	isDirty: boolean;
}

type SettingsFormAction =
	| { type: 'UPDATE_GENERAL'; payload: Partial< GeneralSettings > }
	| { type: 'UPDATE_ADVANCED'; payload: Partial< AdvancedSettings > }
	| { type: 'UPDATE_RETENTION'; payload: Partial< DataRetentionSettings > }
	| { type: 'SET_SETTINGS'; payload: PluginSettings }
	| { type: 'COMMIT_SETTINGS'; payload: PluginSettings }
	| { type: 'RESET_SETTINGS' };

function areSettingsEqual( a: PluginSettings, b: PluginSettings ): boolean {
	return JSON.stringify( a ) === JSON.stringify( b );
}

function settingsFormReducer(
	state: SettingsFormState,
	action: SettingsFormAction
): SettingsFormState {
	switch ( action.type ) {
		case 'UPDATE_GENERAL': {
			const current: PluginSettings = {
				...state.current,
				general: {
					...state.current.general,
					...action.payload,
				},
			};
			return {
				...state,
				current,
				isDirty: ! areSettingsEqual( state.initial, current ),
			};
		}

		case 'UPDATE_ADVANCED': {
			const current: PluginSettings = {
				...state.current,
				advanced: {
					...state.current.advanced,
					...action.payload,
				},
			};
			return {
				...state,
				current,
				isDirty: ! areSettingsEqual( state.initial, current ),
			};
		}

		case 'UPDATE_RETENTION': {
			const current: PluginSettings = {
				...state.current,
				data_retention: {
					...state.current.data_retention,
					...action.payload,
				},
			};
			return {
				...state,
				current,
				isDirty: ! areSettingsEqual( state.initial, current ),
			};
		}

		case 'SET_SETTINGS': {
			return {
				...state,
				current: action.payload,
				isDirty: ! areSettingsEqual( state.initial, action.payload ),
			};
		}

		case 'COMMIT_SETTINGS': {
			return {
				initial: action.payload,
				current: action.payload,
				isDirty: false,
			};
		}

		case 'RESET_SETTINGS': {
			return {
				...state,
				current: state.initial,
				isDirty: false,
			};
		}

		default:
			return state;
	}
}

export function useSettingsForm( initialSettings: PluginSettings ) {
	const [ state, dispatch ] = useReducer( settingsFormReducer, {
		initial: initialSettings,
		current: initialSettings,
		isDirty: false,
	} );

	const updateGeneral = useCallback(
		( payload: Partial< GeneralSettings > ) => {
			dispatch( { type: 'UPDATE_GENERAL', payload } );
		},
		[]
	);

	const updateAdvanced = useCallback(
		( payload: Partial< AdvancedSettings > ) => {
			dispatch( { type: 'UPDATE_ADVANCED', payload } );
		},
		[]
	);

	const updateRetention = useCallback(
		( payload: Partial< DataRetentionSettings > ) => {
			dispatch( { type: 'UPDATE_RETENTION', payload } );
		},
		[]
	);

	const setSettings = useCallback( ( payload: PluginSettings ) => {
		dispatch( { type: 'SET_SETTINGS', payload } );
	}, [] );

	const commit = useCallback( ( payload: PluginSettings ) => {
		dispatch( { type: 'COMMIT_SETTINGS', payload } );
	}, [] );

	const reset = useCallback( () => {
		dispatch( { type: 'RESET_SETTINGS' } );
	}, [] );

	return useMemo(
		() => ( {
			settings: state.current,
			initialSettings: state.initial,
			isDirty: state.isDirty,
			updateGeneral,
			updateAdvanced,
			updateRetention,
			setSettings,
			commit,
			reset,
		} ),
		[
			state,
			updateGeneral,
			updateAdvanced,
			updateRetention,
			setSettings,
			commit,
			reset,
		]
	);
}
