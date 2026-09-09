import { render, screen } from '@testing-library/react';
import { SectionHeader } from '../../../src/frontend/shared/components/SectionHeader';

describe( 'SectionHeader Component', () => {
	it( 'renders title and description', () => {
		render(
			<SectionHeader
				title="General Settings"
				description="Manage your main settings here."
			/>
		);

		expect(
			screen.getByRole( 'heading', {
				name: 'General Settings',
				level: 2,
			} )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Manage your main settings here.' )
		).toBeInTheDocument();
	} );

	it( 'renders icon and actions when provided', () => {
		render(
			<SectionHeader
				title="Advanced"
				icon={ <span data-testid="test-icon">⚙️</span> }
				actions={ <button type="button">Reset</button> }
			/>
		);

		expect( screen.getByTestId( 'test-icon' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Reset' } )
		).toBeInTheDocument();
	} );
} );
