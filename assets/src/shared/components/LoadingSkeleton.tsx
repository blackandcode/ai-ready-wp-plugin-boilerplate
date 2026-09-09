/**
 * Accessible Loading Skeleton Component.
 *
 * Emits data-airwp-app-state="loading" for deterministic Playwright readiness checks.
 *
 * @package
 */

import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export interface LoadingSkeletonProps {
	message?: string;
	className?: string;
}

export function LoadingSkeleton( {
	message = __(
		'Loading plugin settings…',
		'ai-ready-wp-plugin-boilerplate'
	),
	className = 'airwp-loading-skeleton',
}: LoadingSkeletonProps ) {
	return (
		<div
			className={ className }
			data-airwp-app-state="loading"
			role="status"
			aria-live="polite"
		>
			<Spinner />
			<p className="airwp-loading-text">{ message }</p>
		</div>
	);
}
