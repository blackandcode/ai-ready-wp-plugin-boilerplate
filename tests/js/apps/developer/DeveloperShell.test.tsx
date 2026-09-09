import { render, screen, fireEvent } from '@testing-library/react';
import { DeveloperShell } from '../../../../src/frontend/apps/developer/react/components/DeveloperShell';
import type { AirwpBootstrapData } from '../../../../src/frontend/shared';

jest.mock(
	'../../../../src/frontend/apps/developer/react/components/ApiReferenceSection',
	() => ( {
		ApiReferenceSection: () => (
			<div data-testid="mock-api-reference-section">
				Mocked API Reference Section
			</div>
		),
	} )
);

const mockBootstrap: AirwpBootstrapData = {
	apiBase: '/ai-ready-wp/v1',
	nonce: 'test-nonce',
	version: '1.2.0',
	currentUserCan: { manageOptions: true },
	environment: {
		phpVersion: '8.3.33',
		wpVersion: '7.1',
		environmentType: 'local',
	},
	development: {
		pluginMode: true,
		openApiEndpoint: 'http://localhost:8888/wp-json/ai-ready-wp-dev/v1/openapi',
		openApiPath: '/ai-ready-wp-dev/v1/openapi',
	},
};

describe( 'DeveloperShell Component', () => {
	it( 'renders horizontal sub-tabs and defaults to System Diagnostics', () => {
		render( <DeveloperShell bootstrap={ mockBootstrap } /> );

		const diagnosticsTab = screen.getByRole( 'tab', {
			name: /System Diagnostics/i,
		} );
		const apiRefTab = screen.getByRole( 'tab', {
			name: /API Reference/i,
		} );

		expect( diagnosticsTab ).toBeInTheDocument();
		expect( apiRefTab ).toBeInTheDocument();
		expect( diagnosticsTab ).toHaveClass( 'is-active' );
		expect( diagnosticsTab ).toHaveAttribute( 'aria-selected', 'true' );
		expect( apiRefTab ).toHaveAttribute( 'aria-selected', 'false' );

		// Diagnostics table should be visible
		expect(
			screen.getByText( /Boilerplate Version/i )
		).toBeInTheDocument();
		expect( screen.getByText( /PHP Runtime/i ) ).toBeInTheDocument();
		expect( screen.getByText( /WordPress Core/i ) ).toBeInTheDocument();
	} );

	it( 'switches between sub-tabs when clicked', () => {
		const handleSubTabChange = jest.fn();

		render(
			<DeveloperShell
				bootstrap={ mockBootstrap }
				onSubTabChange={ handleSubTabChange }
			/>
		);

		const apiRefTab = screen.getByRole( 'tab', {
			name: /API Reference/i,
		} );
		fireEvent.click( apiRefTab );

		expect( apiRefTab ).toHaveClass( 'is-active' );
		expect( apiRefTab ).toHaveAttribute( 'aria-selected', 'true' );
		expect(
			screen.getByTestId( 'mock-api-reference-section' )
		).toBeInTheDocument();
		expect( handleSubTabChange ).toHaveBeenCalledWith( 'api-reference' );

		// Switch back to diagnostics
		const diagnosticsTab = screen.getByRole( 'tab', {
			name: /System Diagnostics/i,
		} );
		fireEvent.click( diagnosticsTab );

		expect( diagnosticsTab ).toHaveClass( 'is-active' );
		expect(
			screen.getByText( /Boilerplate Version/i )
		).toBeInTheDocument();
		expect( handleSubTabChange ).toHaveBeenCalledWith( 'diagnostics' );
	} );

	it( 'respects initialSubTab prop', () => {
		render(
			<DeveloperShell
				bootstrap={ mockBootstrap }
				initialSubTab="api-reference"
			/>
		);

		const apiRefTab = screen.getByRole( 'tab', {
			name: /API Reference/i,
		} );
		expect( apiRefTab ).toHaveClass( 'is-active' );
		expect(
			screen.getByTestId( 'mock-api-reference-section' )
		).toBeInTheDocument();
	} );
} );
