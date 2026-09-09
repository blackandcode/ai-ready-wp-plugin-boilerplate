import { render } from '@testing-library/react';
import save from '../../../../src/frontend/apps/hello-world/save';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: {
		save: jest.fn( () => ( { className: 'airwp-hello-world-block' } ) ),
	},
} ) );

describe( 'HelloWorld Block Save Component', () => {
	it( 'renders interactive directives and initial context', () => {
		const attributes = {
			greeting: 'Interactive Greetings!',
			showTimestamp: true,
		};

		const { container } = render( <>{ save( { attributes } ) }</> );

		const blockRoot = container.querySelector( '.airwp-hello-world-block' );
		expect( blockRoot ).toHaveAttribute(
			'data-wp-interactive',
			'airwp/hello-world'
		);
		expect( blockRoot ).toHaveAttribute( 'data-wp-context' );

		const parsedContext = JSON.parse(
			blockRoot?.getAttribute( 'data-wp-context' ) || '{}'
		);
		expect( parsedContext.likes ).toBe( 0 );
		expect( parsedContext.isOpen ).toBe( false );

		expect(
			container.querySelector(
				'[data-wp-on--click="actions.incrementLike"]'
			)
		).toBeInTheDocument();
		expect(
			container.querySelector(
				'[data-wp-on--click="actions.toggleDetails"]'
			)
		).toBeInTheDocument();
	} );
} );
