import { render, screen } from '@testing-library/react';
import { CardLayout } from '../../../src/frontend/shared/components/CardLayout';

describe( 'CardLayout Component', () => {
	it( 'renders correctly using props', () => {
		render(
			<CardLayout
				header={ <span>Header Content</span> }
				footer={ <span>Footer Content</span> }
			>
				<span>Body Content</span>
			</CardLayout>
		);

		expect( screen.getByText( 'Header Content' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Body Content' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Footer Content' ) ).toBeInTheDocument();
	} );

	it( 'renders correctly using compound components', () => {
		render(
			<CardLayout>
				<CardLayout.Header>
					<span>Compound Header</span>
				</CardLayout.Header>
				<CardLayout.Body>
					<span>Compound Body</span>
				</CardLayout.Body>
				<CardLayout.Footer>
					<span>Compound Footer</span>
				</CardLayout.Footer>
			</CardLayout>
		);

		expect( screen.getByText( 'Compound Header' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Compound Body' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Compound Footer' ) ).toBeInTheDocument();
	} );

	it( 'applies custom class name', () => {
		const { container } = render(
			<CardLayout className="custom-test-card">
				<span>Body</span>
			</CardLayout>
		);

		expect(
			container.querySelector( '.custom-test-card' )
		).toBeInTheDocument();
	} );
} );
