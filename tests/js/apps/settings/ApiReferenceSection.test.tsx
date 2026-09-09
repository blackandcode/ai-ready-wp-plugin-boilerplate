import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ApiReferenceSection } from '../../../../src/frontend/apps/settings/react/components/ApiReferenceSection';
import apiFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

jest.mock(
	'../../../../src/frontend/apps/settings/react/components/ApiReferenceViewer',
	() => ( {
		__esModule: true,
		default: ( { spec }: { spec: Record< string, unknown > } ) => (
			<div data-testid="scalar-viewer">
				Viewer Loaded: { ( spec?.info as { title?: string } )?.title }
			</div>
		),
	} )
);

const mockedApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

describe( 'ApiReferenceSection Component', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders the developer reference banner with regeneration guidance', () => {
		mockedApiFetch.mockReturnValue( new Promise( () => {} ) ); // Never resolves for loading state.

		render(
			<ApiReferenceSection
				endpoint="https://example.com/wp-json/ai-ready-wp-dev/v1/openapi"
				nonce="test-nonce"
			/>
		);

		expect(
			screen.getByText( 'Plugin Development Mode' )
		).toBeInTheDocument();
		expect(
			screen.getByText( /wp ai-ready openapi generate/i )
		).toBeInTheDocument();
		expect(
			screen.getByText( /docs\/api\/openapi\.yaml/i )
		).toBeInTheDocument();
	} );

	it( 'renders error message and retry button when fetch fails', async () => {
		mockedApiFetch.mockRejectedValueOnce(
			new Error( 'Failed to load OpenAPI spec.' )
		);

		render(
			<ApiReferenceSection
				endpoint="https://example.com/wp-json/ai-ready-wp-dev/v1/openapi"
				nonce="test-nonce"
			/>
		);

		await waitFor( () => {
			expect(
				screen.getByText( /Failed to load OpenAPI spec/i )
			).toBeInTheDocument();
		} );

		const retryButton = screen.getByRole( 'button', {
			name: /Retry/i,
		} );
		expect( retryButton ).toBeInTheDocument();

		// Set up mock for successful retry.
		mockedApiFetch.mockResolvedValueOnce( {
			openapi: '3.1.0',
			info: { title: 'Recovered API' },
			paths: {},
		} );

		fireEvent.click( retryButton );

		await waitFor( () => {
			expect( screen.getByTestId( 'scalar-viewer' ) ).toBeInTheDocument();
			expect(
				screen.getByText( /Viewer Loaded: Recovered API/i )
			).toBeInTheDocument();
		} );
	} );

	it( 'fetches and renders OpenAPI spec successfully', async () => {
		mockedApiFetch.mockResolvedValueOnce( {
			openapi: '3.1.0',
			info: { title: 'AI-Ready WP Plugin Boilerplate REST API' },
			paths: {},
		} );

		render(
			<ApiReferenceSection
				endpoint="https://example.com/wp-json/ai-ready-wp-dev/v1/openapi"
				nonce="test-nonce"
			/>
		);

		await waitFor( () => {
			expect( screen.getByTestId( 'scalar-viewer' ) ).toBeInTheDocument();
		} );

		expect(
			screen.getByText(
				/Viewer Loaded: AI-Ready WP Plugin Boilerplate REST API/i
			)
		).toBeInTheDocument();
		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			url: 'https://example.com/wp-json/ai-ready-wp-dev/v1/openapi',
			headers: { 'X-WP-Nonce': 'test-nonce' },
		} );
	} );
} );
