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
		<div className="airwp-section-header">
			<div className="airwp-section-header-content">
				{ icon && <div className="airwp-header-badge">{ icon }</div> }
				<div>
					<h2 className="airwp-card-title">{ title }</h2>
					{ description && (
						<p className="airwp-card-description">
							{ description }
						</p>
					) }
				</div>
			</div>
			{ actions && (
				<div className="airwp-section-header-actions">{ actions }</div>
			) }
		</div>
	);
}
