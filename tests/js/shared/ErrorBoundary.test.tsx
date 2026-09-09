import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../../assets/src/shared/components/ErrorBoundary';

function ProblemChild( { shouldThrow }: { shouldThrow: boolean } ) {
	if ( shouldThrow ) {
		throw new Error( 'Simulated component explosion' );
	}
	return <div>Normal Content</div>;
}

describe( 'ErrorBoundary Component', () => {
	// Silence console.error during expected throw
	// eslint-disable-next-line no-console
	const originalError = console.error;
	beforeAll( () => {
		// eslint-disable-next-line no-console
		console.error = jest.fn();
	} );
	afterAll( () => {
		// eslint-disable-next-line no-console
		console.error = originalError;
	} );

	it( 'renders children when no error occurs', () => {
		render(
			<ErrorBoundary>
				<div>Child Works</div>
			</ErrorBoundary>
		);

		expect( screen.getByText( 'Child Works' ) ).toBeInTheDocument();
	} );

	it( 'catches error and renders recovery UI', () => {
		render(
			<ErrorBoundary fallbackTitle="Custom Error Title">
				<ProblemChild shouldThrow={ true } />
			</ErrorBoundary>
		);

		expect( screen.getByRole( 'alert' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Custom Error Title' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Simulated component explosion' )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Try Again' } )
		).toBeInTheDocument();
	} );

	it( 'calls onReset when Try Again is clicked', () => {
		const onReset = jest.fn();
		render(
			<ErrorBoundary onReset={ onReset }>
				<ProblemChild shouldThrow={ true } />
			</ErrorBoundary>
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'Try Again' } ) );
		expect( onReset ).toHaveBeenCalledTimes( 1 );
	} );
} );
