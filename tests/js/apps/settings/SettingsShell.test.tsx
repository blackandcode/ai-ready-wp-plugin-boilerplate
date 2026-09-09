import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsShell } from '../../../../assets/src/apps/settings/components/SettingsShell';
import type { PluginSettings } from '../../../../assets/src/apps/settings/types';

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
} );
