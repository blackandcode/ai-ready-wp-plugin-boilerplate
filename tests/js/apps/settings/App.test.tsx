import {
	render,
	screen,
	fireEvent,
	waitFor,
	within,
} from '@testing-library/react';
import { App } from '../../../../src/frontend/apps/settings/react/App';
import type { ISettingsApiClient } from '../../../../src/frontend/shared';
import type {
	PluginSettings,
	AirwpBootstrapData,
} from '../../../../src/frontend/shared/types';

describe( 'Settings App Container', () => {
	const mockInitialSettings: PluginSettings = {
		general: {
			greeting_message: 'Default App Greeting',
			enable_feature: true,
			description: 'App Description',
		},
		advanced: {
			rest_debug: false,
			cache_ttl: 3600,
		},
		data_retention: {
			uninstall_action: 'preserve',
		},
	};

	const mockBootstrap: AirwpBootstrapData = {
		apiBase: '/ai-ready-wp/v1',
		nonce: 'test-nonce',
		version: '1.3.2',
		currentUserCan: { manageOptions: true },
		initialSettings: mockInitialSettings,
	};

	const createMockApiClient = (
		overrides: Partial< ISettingsApiClient > = {}
	): ISettingsApiClient => ( {
		getSettings: jest.fn().mockResolvedValue( mockInitialSettings ),
		updateSettings: jest.fn().mockResolvedValue( mockInitialSettings ),
		getDiagnostics: jest.fn().mockResolvedValue( {
			php_version: '8.3',
			wp_version: '7.1',
			environment_type: 'local',
			db_status: 'ok',
			rest_status: 'ok',
			plugin_version: '1.3.2',
		} ),
		...overrides,
	} );

	it( 'renders the settings shell with provided bootstrap data', () => {
		const client = createMockApiClient();
		render( <App bootstrap={ mockBootstrap } apiClient={ client } /> );

		expect(
			screen.getByRole( 'heading', { name: 'General', level: 2 } )
		).toBeInTheDocument();
		expect(
			screen.getByDisplayValue( 'Default App Greeting' )
		).toBeInTheDocument();
	} );

	it( 'saves settings successfully and displays success notice', async () => {
		const updatedSettings: PluginSettings = {
			...mockInitialSettings,
			general: {
				...mockInitialSettings.general,
				greeting_message: 'A brand new saved greeting!',
			},
		};

		const updateMock = jest.fn().mockResolvedValue( updatedSettings );
		const client = createMockApiClient( { updateSettings: updateMock } );

		render( <App bootstrap={ mockBootstrap } apiClient={ client } /> );

		const input = screen.getByDisplayValue( 'Default App Greeting' );
		fireEvent.change( input, {
			target: { value: 'A brand new saved greeting!' },
		} );

		const saveButton = screen.getByRole( 'button', {
			name: 'Save Settings',
		} );
		expect( saveButton ).not.toBeDisabled();

		fireEvent.click( saveButton );

		await waitFor( () => {
			expect( updateMock ).toHaveBeenCalledTimes( 1 );
			const banner = screen.getByRole( 'status' );
			expect( banner ).toBeInTheDocument();
			expect(
				within( banner ).getByText( 'Settings successfully saved.' )
			).toBeInTheDocument();
		} );
	} );

	it( 'displays error notice when saving fails', async () => {
		const updateMock = jest
			.fn()
			.mockRejectedValue(
				new Error( 'Unauthorized permission denied.' )
			);
		const client = createMockApiClient( { updateSettings: updateMock } );

		render( <App bootstrap={ mockBootstrap } apiClient={ client } /> );

		const input = screen.getByDisplayValue( 'Default App Greeting' );
		fireEvent.change( input, { target: { value: 'Trigger Error' } } );

		const saveButton = screen.getByRole( 'button', {
			name: 'Save Settings',
		} );
		fireEvent.click( saveButton );

		await waitFor( () => {
			const alertBanner = screen.getByRole( 'alert' );
			expect( alertBanner ).toBeInTheDocument();
			expect(
				within( alertBanner ).getByText(
					'Unauthorized permission denied.'
				)
			).toBeInTheDocument();
		} );
	} );
} );
