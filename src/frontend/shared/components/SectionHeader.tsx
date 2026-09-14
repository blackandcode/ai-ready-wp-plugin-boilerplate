/**
 * Reusable Section Header Component.
 *
 * @package
 */

import type { ReactNode } from 'react';

interface SectionHeaderProps {
	icon?: ReactNode;
	title: string;
	description?: string;
	actions?: ReactNode;
}

export function SectionHeader( {
	icon,
	title,
	description,
	actions,
}: SectionHeaderProps ) {
	return (
		<div className="wpaibp-section-header">
			<div className="wpaibp-section-header-content">
				{ icon && <div className="wpaibp-header-badge">{ icon }</div> }
				<div>
					<h2 className="wpaibp-card-title">{ title }</h2>
					{ description && (
						<p className="wpaibp-card-description">
							{ description }
						</p>
					) }
				</div>
			</div>
			{ actions && (
				<div className="wpaibp-section-header-actions">{ actions }</div>
			) }
		</div>
	);
}
