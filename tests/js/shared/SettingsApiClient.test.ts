import {
	SettingsApiClient,
	ApiClientError,
} from '../../../src/frontend/shared/api/SettingsApiClient';
import type {
	PluginSettingsData,
	SystemDiagnosticsData,
	AirwpBootstrapData,
} from '../../../src/frontend/shared/types';

describe( 'SettingsApiClient Adapter', () => {
	const mockSettings: PluginSettingsData = {
		general: {
			greeting_message: 'Hi there',
			enable_feature: true,
			description: 'Test desc',
		},
		advanced: {
			rest_debug: false,
			cache_ttl: 3600,
		},
		data_retention: {
			uninstall_action: 'preserve',
		},
	};

	const mockDiagnostics: SystemDiagnosticsData = {
		php_version: '8.3.0',
		wp_version: '7.0.0',
		environment_type: 'local',
		db_status: 'connected',
		rest_status: 'healthy',
		plugin_version: '1.0.1',
	};

	it( 'retrieves settings via GET', async () => {
		const mockFetcher = jest.fn().mockResolvedValue( mockSettings );
		const client = new SettingsApiClient( { fetcher: mockFetcher } );

		const result = await client.getSettings();

		expect( mockFetcher ).toHaveBeenCalledTimes( 1 );
		expect( mockFetcher ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/ai-ready-wp/v1/settings',
				method: 'GET',
			} )
		);
		expect( result ).toEqual( mockSettings );
	} );

	it( 'updates settings via POST with payload', async () => {
		const mockFetcher = jest.fn().mockResolvedValue( mockSettings );
		const client = new SettingsApiClient( { fetcher: mockFetcher } );

		const result = await client.updateSettings( mockSettings );

		expect( mockFetcher ).toHaveBeenCalledTimes( 1 );
		expect( mockFetcher ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/ai-ready-wp/v1/settings',
				method: 'POST',
				data: mockSettings,
			} )
		);
		expect( result ).toEqual( mockSettings );
	} );

	it( 'fetches diagnostics via GET', async () => {
		const mockFetcher = jest.fn().mockResolvedValue( mockDiagnostics );
		const client = new SettingsApiClient( { fetcher: mockFetcher } );

		const result = await client.getDiagnostics();

		expect( mockFetcher ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/ai-ready-wp/v1/diagnostics',
				method: 'GET',
			} )
		);
		expect( result ).toEqual( mockDiagnostics );
	} );

	it( 'injects X-WP-Nonce header when available in bootstrap data', async () => {
		const mockFetcher = jest.fn().mockResolvedValue( mockSettings );
		const mockBootstrap: AirwpBootstrapData = {
			apiBase: '/ai-ready-wp/v1',
			nonce: 'secret-nonce-123',
			version: '1.0.1',
			currentUserCan: { manageOptions: true },
		};

		const client = new SettingsApiClient( {
			fetcher: mockFetcher,
			bootstrapGetter: () => mockBootstrap,
		} );

		await client.getSettings();

		expect( mockFetcher ).toHaveBeenCalledWith(
			expect.objectContaining( {
				headers: expect.objectContaining( {
					'X-WP-Nonce': 'secret-nonce-123',
				} ),
			} )
		);
	} );

	it( 'wraps unknown errors in ApiClientError', async () => {
		const mockFetcher = jest.fn().mockRejectedValue( {
			message: 'Forbidden',
			code: 'rest_forbidden',
			data: { status: 403 },
		} );

		const client = new SettingsApiClient( { fetcher: mockFetcher } );

		await expect( client.getSettings() ).rejects.toThrow( ApiClientError );
		await expect( client.getSettings() ).rejects.toMatchObject( {
			code: 'rest_forbidden',
			status: 403,
			message: 'Forbidden',
		} );
	} );
} );
