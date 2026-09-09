/**
 * Accessible Notice Banner adhering to WordPress Design System (WPDS).
 *
 * @package
 */

import { Notice } from '@wordpress/components';
import type { ReactNode } from 'react';
import type { NoticeStatus } from '../hooks/useNotice';

export interface NoticeBannerProps {
	status: NoticeStatus;
	children: ReactNode;
	onDismiss?: () => void;
	isDismissible?: boolean;
	className?: string;
}

export function NoticeBanner( {
	status,
	children,
	onDismiss,
	isDismissible = true,
	className = 'airwp-notice-banner',
}: NoticeBannerProps ) {
	return (
		<div
			className={ className }
			role={ status === 'error' ? 'alert' : 'status' }
		>
			<Notice
				status={ status }
				onDismiss={ onDismiss }
				isDismissible={ isDismissible && Boolean( onDismiss ) }
			>
				{ children }
			</Notice>
		</div>
	);
}
