/**
 * Defensive React Error Boundary adhering to WordPress Design System (WPDS).
 *
 * Catches unhandled runtime exceptions in React component trees, preventing
 * the entire admin screen from crashing into a white screen of death.
 *
 * @package
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import {
	Card,
	CardHeader,
	CardBody,
	CardFooter,
	Button,
	Icon,
} from '@wordpress/components';
import { caution } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallbackTitle?: string;
	onReset?: () => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor( props: ErrorBoundaryProps ) {
		super( props );
		this.state = {
			hasError: false,
			error: null,
		};
	}

	public static getDerivedStateFromError( error: Error ): ErrorBoundaryState {
		return {
			hasError: true,
			error,
		};
	}

	public componentDidCatch( error: Error, errorInfo: ErrorInfo ): void {
		// eslint-disable-next-line no-console
		console.error(
			'ErrorBoundary caught an unhandled exception:',
			error,
			errorInfo
		);
	}

	private handleReset = (): void => {
		this.setState( { hasError: false, error: null } );
		if ( this.props.onReset ) {
			this.props.onReset();
		}
	};

	private handleReload = (): void => {
		if ( typeof window !== 'undefined' ) {
			window.location.reload();
		}
	};

	public render(): ReactNode {
		if ( this.state.hasError ) {
			const title =
				this.props.fallbackTitle ||
				__(
					'Something went wrong while rendering this section.',
					'ai-ready-wp-plugin-boilerplate'
				);

			return (
				<Card className="airwp-error-boundary-card" role="alert">
					<CardHeader className="airwp-card-header">
						<div className="airwp-header-badge airwp-badge-error">
							<Icon icon={ caution } size={ 20 } />
						</div>
						<div>
							<h2 className="airwp-card-title">{ title }</h2>
							<p className="airwp-card-description">
								{ __(
									'An unexpected JavaScript error occurred. You can attempt to retry or reload the page.',
									'ai-ready-wp-plugin-boilerplate'
								) }
							</p>
						</div>
					</CardHeader>
					<CardBody className="airwp-card-body">
						<pre className="airwp-error-stack">
							{ this.state.error?.message ||
								__(
									'Unknown Error',
									'ai-ready-wp-plugin-boilerplate'
								) }
						</pre>
					</CardBody>
					<CardFooter className="airwp-card-footer">
						<Button
							variant="secondary"
							onClick={ this.handleReset }
						>
							{ __(
								'Try Again',
								'ai-ready-wp-plugin-boilerplate'
							) }
						</Button>
						<Button variant="primary" onClick={ this.handleReload }>
							{ __(
								'Reload Page',
								'ai-ready-wp-plugin-boilerplate'
							) }
						</Button>
					</CardFooter>
				</Card>
			);
		}

		return this.props.children;
	}
}
