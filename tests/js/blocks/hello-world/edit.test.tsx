import { render, screen } from '@testing-library/react';
import Edit from '../../../../blocks/hello-world/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: jest.fn( () => ( {
		className: 'airwp-hello-world-block',
	} ) ),
	InspectorControls: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
} ) );

describe( 'HelloWorld Block Edit Component', () => {
	it( 'renders greeting text inside preview card', () => {
		const attributes = {
			greeting: 'Welcome to WordPress AI!',
			showTimestamp: true,
		};

		render(
			<Edit
				attributes={ attributes }
				setAttributes={ jest.fn() }
				clientId="test-client-id"
				isSelected={ false }
				context={ {} }
			/>
		);

		expect(
			screen.getByText( 'Welcome to WordPress AI!' )
		).toBeInTheDocument();
		expect( screen.getByText( /Live Block Preview/i ) ).toBeInTheDocument();
	} );
} );
