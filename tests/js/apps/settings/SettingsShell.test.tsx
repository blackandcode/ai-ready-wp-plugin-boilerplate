import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsShell } from '../../../../src/frontend/apps/settings/react/components/SettingsShell';
import type { PluginSettings } from '../../../../src/frontend/apps/settings/react/types';

jest.mock(
	'../../../../src/frontend/apps/settings/react/components/ApiReferenceSection',
	() => ( {
		ApiReferenceSection: () => (
			<div data-testid="api-reference-section">API Reference Section</div>
		),
	} )
);

const mockSettings: PluginSettings = {
	general: {
		greeting_message: 'Hello Unit Test',
		enable_feature: true,
		description: 'Testing description',
	},
	advanced: {
		rest_debug: false,
		cache_ttl: 3600,
	},
	data_retention: {
		uninstall_action: 'preserve',
	},
};

describe( 'SettingsShell Component', () => {
	it( 'renders general settings by default', () => {
		render(
			<SettingsShell
				settings={ mockSettings }
				isDirty={ false }
				isSaving={ false }
				onUpdate={ jest.fn() }
				onSave={ jest.fn() }
				onReset={ jest.fn() }
			/>
		);

		expect(
			screen.getByRole( 'heading', { name: 'General' } )
		).toBeInTheDocument();
		expect(
			screen.getByDisplayValue( 'Hello Unit Test' )
		).toBeInTheDocument();
		expect( screen.getByText( 'All changes saved' ) ).toBeInTheDocument();
	} );

	it( 'navigates to advanced settings when tab clicked', () => {
		render(
			<SettingsShell
				settings={ mockSettings }
				isDirty={ false }
				isSaving={ false }
				onUpdate={ jest.fn() }
				onSave={ jest.fn() }
				onReset={ jest.fn() }
			/>
		);

		const advancedTab = screen.getByRole( 'button', {
			name: /Advanced & Retention/i,
		} );
		fireEvent.click( advancedTab );

		expect(
			screen.getByText( /REST API Debug Headers/i )
		).toBeInTheDocument();
	} );

	it( 'triggers save callback when save button is clicked', () => {
		const handleSave = jest.fn();

		render(
			<SettingsShell
				settings={ mockSettings }
				isDirty={ true }
				isSaving={ false }
				onUpdate={ jest.fn() }
				onSave={ handleSave }
				onReset={ jest.fn() }
			/>
		);

		expect(
			screen.getByText( 'You have unsaved changes' )
		).toBeInTheDocument();
		const saveButton = screen.getByRole( 'button', {
			name: /Save Settings/i,
		} );
		expect( saveButton ).toBeEnabled();

		fireEvent.click( saveButton );
		expect( handleSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not show API Reference tab when development mode is absent or false', () => {
		render(
			<SettingsShell
				settings={ mockSettings }
				isDirty={ false }
				isSaving={ false }
				onUpdate={ jest.fn() }
				onSave={ jest.fn() }
				onReset={ jest.fn() }
				bootstrap={ {
					restUrl: 'https://example.com/wp-json/',
					restNonce: 'test-nonce',
					version: '1.1.0',
					env: 'production',
					assetsUrl: 'https://example.com/assets/',
					development: {
						pluginMode: false,
					},
				} }
			/>
		);

		expect(
			screen.queryByRole( 'button', { name: /API Reference/i } )
		).not.toBeInTheDocument();
	} );

	it( 'shows API Reference tab and hides save footer when in plugin development mode', () => {
		render(
			<SettingsShell
				settings={ mockSettings }
				isDirty={ false }
				isSaving={ false }
				onUpdate={ jest.fn() }
				onSave={ jest.fn() }
				onReset={ jest.fn() }
				bootstrap={ {
					restUrl: 'https://example.com/wp-json/',
					restNonce: 'test-nonce',
					version: '1.1.0',
					env: 'development',
					assetsUrl: 'https://example.com/assets/',
					development: {
						pluginMode: true,
						openApiEndpoint: 'https://example.com/wp-json/ai-ready-wp-dev/v1/openapi',
					},
				} }
			/>
		);

		const apiTab = screen.getByRole( 'button', { name: /API Reference/i } );
		expect( apiTab ).toBeInTheDocument();

		fireEvent.click( apiTab );

		// Footer buttons should be hidden on API Reference tab.
		expect(
			screen.queryByRole( 'button', { name: /Save Settings/i } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Reset Defaults/i } )
		).not.toBeInTheDocument();
	} );
} );
