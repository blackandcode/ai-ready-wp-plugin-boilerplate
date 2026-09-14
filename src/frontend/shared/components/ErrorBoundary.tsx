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
					'wp-ai-ready-plugin-boilerplate'
				);

			return (
				<Card className="wpaibp-error-boundary-card" role="alert">
					<CardHeader className="wpaibp-card-header">
						<div className="wpaibp-header-content">
							<div className="wpaibp-header-badge wpaibp-badge-error">
								<Icon icon={ caution } size={ 20 } />
							</div>
							<div>
								<h2 className="wpaibp-card-title">{ title }</h2>
								<p className="wpaibp-card-description">
									{ __(
										'An unexpected JavaScript error occurred. You can attempt to retry or reload the page.',
										'wp-ai-ready-plugin-boilerplate'
									) }
								</p>
							</div>
						</div>
					</CardHeader>
					<CardBody className="wpaibp-card-body">
						<pre className="wpaibp-error-stack">
							{ this.state.error?.message ||
								__(
									'Unknown Error',
									'wp-ai-ready-plugin-boilerplate'
								) }
						</pre>
					</CardBody>
					<CardFooter className="wpaibp-card-footer">
						<Button
							variant="secondary"
							onClick={ this.handleReset }
						>
							{ __(
								'Try Again',
								'wp-ai-ready-plugin-boilerplate'
							) }
						</Button>
						<Button variant="primary" onClick={ this.handleReload }>
							{ __(
								'Reload Page',
								'wp-ai-ready-plugin-boilerplate'
							) }
						</Button>
					</CardFooter>
				</Card>
			);
		}

		return this.props.children;
	}
}
