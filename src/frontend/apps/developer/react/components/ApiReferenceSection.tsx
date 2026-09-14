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
			/* webpackChunkName: "admin/developer/openapi-viewer" */ './ApiReferenceViewer'
		)
);

export interface ApiReferenceSectionProps {
	endpoint?: string;
	path?: string;
	nonce?: string;
}

export function ApiReferenceSection( {
	endpoint,
	path,
	nonce,
}: ApiReferenceSectionProps ) {
	const [ spec, setSpec ] = useState< Record< string, unknown > | null >(
		null
	);
	const [ isLoading, setIsLoading ] = useState< boolean >( true );
	const [ error, setError ] = useState< string | null >( null );

	const fetchSpec = useCallback( async () => {
		if ( ! endpoint && ! path ) {
			setError(
				__(
					'OpenAPI development endpoint is not configured.',
					'wp-ai-ready-plugin-boilerplate'
				)
			);
			setIsLoading( false );
			return;
		}

		setIsLoading( true );
		setError( null );

		try {
			const fetchOptions = path
				? {
						path,
						headers: nonce ? { 'X-WP-Nonce': nonce } : {},
				  }
				: {
						url: endpoint,
						headers: nonce ? { 'X-WP-Nonce': nonce } : {},
				  };

			const data =
				await apiFetch< Record< string, unknown > >( fetchOptions );
			setSpec( data );
		} catch ( err: any ) {
			setError(
				err?.message ||
					__(
						'Failed to load OpenAPI specification from development endpoint.',
						'wp-ai-ready-plugin-boilerplate'
					)
			);
		} finally {
			setIsLoading( false );
		}
	}, [ endpoint, path, nonce ] );

	useEffect( () => {
		fetchSpec();
	}, [ fetchSpec ] );

	return (
		<div className="wpaibp-api-reference-section">
			<div className="wpaibp-dev-reference-banner">
				<div className="wpaibp-dev-banner-badge">
					{ __(
						'Plugin Development Mode',
						'wp-ai-ready-plugin-boilerplate'
					) }
				</div>
				<p className="wpaibp-dev-banner-desc">
					{ __(
						'This API reference is dynamically generated from registered WordPress REST controllers, JSON schemas, and OpenAPI metadata.',
						'wp-ai-ready-plugin-boilerplate'
					) }
				</p>
				<div className="wpaibp-dev-banner-meta">
					<span>
						<strong>
							{ __(
								'Reference File:',
								'wp-ai-ready-plugin-boilerplate'
							) }
						</strong>{ ' ' }
						<code>docs/api/openapi.yaml</code>
					</span>
					<span>
						<strong>
							{ __(
								'Regenerate:',
								'wp-ai-ready-plugin-boilerplate'
							) }
						</strong>{ ' ' }
						<code>wp ai-ready openapi generate</code>
					</span>
				</div>
			</div>

			{ isLoading && (
				<div className="wpaibp-api-reference-loading" role="status">
					<Spinner />
					<p>
						{ __(
							'Loading live OpenAPI contract…',
							'wp-ai-ready-plugin-boilerplate'
						) }
					</p>
				</div>
			) }

			{ error && ! isLoading && (
				<Notice
					status="error"
					isDismissible={ false }
					className="wpaibp-api-reference-error"
				>
					<p>{ error }</p>
					<Button variant="secondary" onClick={ fetchSpec }>
						{ __( 'Retry', 'wp-ai-ready-plugin-boilerplate' ) }
					</Button>
				</Notice>
			) }

			{ spec && ! isLoading && (
				<div className="wpaibp-scalar-wrapper">
					<Suspense
						fallback={
							<div
								className="wpaibp-api-reference-loading"
								role="status"
							>
								<Spinner />
								<p>
									{ __(
										'Rendering API documentation viewer…',
										'wp-ai-ready-plugin-boilerplate'
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
