/**
 * Accessible Loading Skeleton Component.
 *
 * Emits data-wpaibp-app-state="loading" for deterministic Playwright readiness checks.
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
		'wp-ai-ready-plugin-boilerplate'
	),
	className = 'wpaibp-loading-skeleton',
}: LoadingSkeletonProps ) {
	return (
		<div
			className={ className }
			data-wpaibp-app-state="loading"
			role="status"
			aria-live="polite"
		>
			<Spinner />
			<p className="wpaibp-loading-text">{ message }</p>
		</div>
	);
}
