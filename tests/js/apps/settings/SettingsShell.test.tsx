import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsShell } from '../../../../src/frontend/apps/settings/react/components/SettingsShell';
import type {
	PluginSettings,
	SettingsAppExtension,
} from '../../../../src/frontend/apps/settings/react/types';

jest.mock( '../../../../src/frontend/apps/developer', () => {
	const React = require( 'react' );
	return {
		developerAppExtension: {
			id: 'developer',
			label: 'Developer Tools',
			icon: () => React.createElement( 'span', null, 'Icon' ),
			subtitle: 'Diagnostics and OpenAPI reference.',
			component: () => (
				<div data-testid="developer-app-extension">
					Developer App Content
				</div>
			),
			hasFooter: false,
			isVisible: ( bootstrap: any ) =>
				Boolean(
					bootstrap?.development?.pluginMode &&
						( bootstrap?.development?.openApiEndpoint ||
							bootstrap?.development?.openApiPath )
				),
		},
	};
} );

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

	it( 'does not show Developer Tools tab when development mode is absent or false', () => {
		render(
			<SettingsShell
				settings={ mockSettings }
				isDirty={ false }
				isSaving={ false }
				onUpdate={ jest.fn() }
				onSave={ jest.fn() }
				onReset={ jest.fn() }
				bootstrap={ {
					apiBase: 'https://example.com/wp-json/ai-ready-wp/v1',
					nonce: 'test-nonce',
					version: '1.2.0',
					currentUserCan: { manageOptions: true },
					development: {
						pluginMode: false,
					},
				} }
			/>
		);

		expect(
			screen.queryByRole( 'button', { name: /Developer Tools/i } )
		).not.toBeInTheDocument();
	} );

	it( 'shows Developer Tools tab and mounts embedded app while hiding save footer when in dev mode', () => {
		render(
			<SettingsShell
				settings={ mockSettings }
				isDirty={ false }
				isSaving={ false }
				onUpdate={ jest.fn() }
				onSave={ jest.fn() }
				onReset={ jest.fn() }
				bootstrap={ {
					apiBase: 'https://example.com/wp-json/ai-ready-wp/v1',
					nonce: 'test-nonce',
					version: '1.2.0',
					currentUserCan: { manageOptions: true },
					development: {
						pluginMode: true,
						openApiEndpoint:
							'https://example.com/wp-json/ai-ready-wp-dev/v1/openapi',
						openApiPath: '/ai-ready-wp-dev/v1/openapi',
					},
				} }
			/>
		);

		const devTab = screen.getByRole( 'button', {
			name: /Developer Tools/i,
		} );
		expect( devTab ).toBeInTheDocument();

		fireEvent.click( devTab );

		expect(
			screen.getByTestId( 'developer-app-extension' )
		).toBeInTheDocument();

		// Footer buttons should be hidden when viewing embedded app with hasFooter: false.
		expect(
			screen.queryByRole( 'button', { name: /Save Settings/i } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Reset/i } )
		).not.toBeInTheDocument();
	} );

	it( 'supports custom third-party extensions passed via extensions prop', () => {
		const customExtension: SettingsAppExtension = {
			id: 'custom-app',
			label: 'Custom App',
			icon: () => <span>CustomIcon</span>,
			subtitle: 'Custom embedded app description',
			component: () => (
				<div data-testid="custom-app-view">Custom App View</div>
			),
			hasFooter: true,
		};

		render(
			<SettingsShell
				settings={ mockSettings }
				isDirty={ true }
				isSaving={ false }
				onUpdate={ jest.fn() }
				onSave={ jest.fn() }
				onReset={ jest.fn() }
				extensions={ [ customExtension ] }
			/>
		);

		const customTab = screen.getByRole( 'button', {
			name: /Custom App/i,
		} );
		expect( customTab ).toBeInTheDocument();

		fireEvent.click( customTab );

		expect( screen.getByTestId( 'custom-app-view' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { name: 'Custom App' } )
		).toBeInTheDocument();
		// Since hasFooter is true, footer save button remains accessible
		expect(
			screen.getByRole( 'button', { name: /Save Settings/i } )
		).toBeInTheDocument();
	} );
} );
