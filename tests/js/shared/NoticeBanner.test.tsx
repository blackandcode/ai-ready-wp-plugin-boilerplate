import { render, screen, fireEvent, within } from '@testing-library/react';
import { NoticeBanner } from '../../../src/frontend/shared/components/NoticeBanner';

describe( 'NoticeBanner Component', () => {
	it( 'renders success notice with status role', () => {
		render(
			<NoticeBanner status="success">
				Settings saved successfully.
			</NoticeBanner>
		);

		const banner = screen.getByRole( 'status' );
		expect( banner ).toBeInTheDocument();
		expect(
			within( banner ).getByText( 'Settings saved successfully.' )
		).toBeInTheDocument();
	} );

	it( 'renders error notice with alert role', () => {
		render(
			<NoticeBanner status="error">Failed to save settings.</NoticeBanner>
		);

		const banner = screen.getByRole( 'alert' );
		expect( banner ).toBeInTheDocument();
		expect(
			within( banner ).getByText( 'Failed to save settings.' )
		).toBeInTheDocument();
	} );

	it( 'triggers onDismiss when dismiss button is clicked', () => {
		const onDismiss = jest.fn();
		render(
			<NoticeBanner
				status="info"
				onDismiss={ onDismiss }
				isDismissible={ true }
			>
				Dismissible message.
			</NoticeBanner>
		);

		const dismissBtn = screen.getByRole( 'button', { name: /close/i } );
		fireEvent.click( dismissBtn );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );
