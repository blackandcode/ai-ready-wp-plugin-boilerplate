/**
 * Development-Only API Reference Viewer Section.
 *
 * Fetches live generated OpenAPI 3.1 specification from the development REST endpoint
 * and renders it via the bundled Scalar API reference component.
 *
 * @package
 */

import {
	lazy,
	Suspense,
	useState,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { Button, Spinner, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

const ApiReferenceViewer = lazy(
	() =>
		import(
			/* webpackChunkName: "admin/settings/openapi-viewer" */ './ApiReferenceViewer'
		)
);

interface ApiReferenceSectionProps {
	endpoint?: string;
	nonce?: string;
}

export function ApiReferenceSection( {
	endpoint,
	nonce,
}: ApiReferenceSectionProps ) {
	const [ spec, setSpec ] = useState< Record< string, unknown > | null >(
		null
	);
	const [ isLoading, setIsLoading ] = useState< boolean >( true );
	const [ error, setError ] = useState< string | null >( null );

	const fetchSpec = useCallback( async () => {
		if ( ! endpoint ) {
			setError(
				__(
					'OpenAPI development endpoint is not configured.',
					'ai-ready-wp-plugin-boilerplate'
				)
			);
			setIsLoading( false );
			return;
		}

		setIsLoading( true );
		setError( null );

		try {
			const data = await apiFetch< Record< string, unknown > >( {
				url: endpoint,
				headers: nonce ? { 'X-WP-Nonce': nonce } : {},
			} );
			setSpec( data );
		} catch ( err: any ) {
			setError(
				err?.message ||
					__(
						'Failed to load OpenAPI specification from development endpoint.',
						'ai-ready-wp-plugin-boilerplate'
					)
			);
		} finally {
			setIsLoading( false );
		}
	}, [ endpoint, nonce ] );

	useEffect( () => {
		fetchSpec();
	}, [ fetchSpec ] );

	return (
		<div className="airwp-api-reference-section">
			<div className="airwp-dev-reference-banner">
				<div className="airwp-dev-banner-badge">
					{ __(
						'Plugin Development Mode',
						'ai-ready-wp-plugin-boilerplate'
					) }
				</div>
				<p className="airwp-dev-banner-desc">
					{ __(
						'This API reference is dynamically generated from registered WordPress REST controllers, JSON schemas, and OpenAPI metadata.',
						'ai-ready-wp-plugin-boilerplate'
					) }
				</p>
				<div className="airwp-dev-banner-meta">
					<span>
						<strong>
							{ __(
								'Reference File:',
								'ai-ready-wp-plugin-boilerplate'
							) }
						</strong>{ ' ' }
						<code>docs/api/openapi.yaml</code>
					</span>
					<span>
						<strong>
							{ __(
								'Regenerate:',
								'ai-ready-wp-plugin-boilerplate'
							) }
						</strong>{ ' ' }
						<code>wp ai-ready openapi generate</code>
					</span>
				</div>
			</div>

			{ isLoading && (
				<div className="airwp-api-reference-loading" role="status">
					<Spinner />
					<p>
						{ __(
							'Loading live OpenAPI contract…',
							'ai-ready-wp-plugin-boilerplate'
						) }
					</p>
				</div>
			) }

			{ error && ! isLoading && (
				<Notice
					status="error"
					isDismissible={ false }
					className="airwp-api-reference-error"
				>
					<p>{ error }</p>
					<Button variant="secondary" onClick={ fetchSpec }>
						{ __( 'Retry', 'ai-ready-wp-plugin-boilerplate' ) }
					</Button>
				</Notice>
			) }

			{ spec && ! isLoading && (
				<div className="airwp-scalar-wrapper">
					<Suspense
						fallback={
							<div
								className="airwp-api-reference-loading"
								role="status"
							>
								<Spinner />
								<p>
									{ __(
										'Rendering API viewer…',
										'ai-ready-wp-plugin-boilerplate'
									) }
								</p>
							</div>
						}
					>
						<ApiReferenceViewer spec={ spec } />
					</Suspense>
				</div>
			) }
		</div>
	);
}
