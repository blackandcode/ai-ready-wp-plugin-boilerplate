import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import type { HelloWorldAttributes } from './types';

export default function save( {
	attributes,
}: {
	attributes: HelloWorldAttributes;
} ) {
	const { greeting, showTimestamp } = attributes;
	const blockProps = useBlockProps.save( {
		className: 'wpaibp-hello-world-block',
	} );

	const initialContext = JSON.stringify( {
		likes: 0,
		isOpen: false,
	} );

	return (
		<div
			{ ...blockProps }
			data-wp-interactive="wpaibp/hello-world"
			data-wp-context={ initialContext }
		>
			<div className="wpaibp-hello-world-card">
				<div className="wpaibp-hello-world-icon" aria-hidden="true">
					✨
				</div>
				<h3 className="wpaibp-hello-world-heading">{ greeting }</h3>
				<p className="wpaibp-hello-world-subtext">
					{ __(
						'Powered by WP AI Ready Plugin Boilerplate.',
						'wp-ai-ready-plugin-boilerplate'
					) }
				</p>
				<div className="wpaibp-hello-world-interactive-controls">
					<button
						type="button"
						className="wpaibp-hello-world-button"
						data-wp-on--click="actions.incrementLike"
					>
						❤️{ ' ' }
						<span data-wp-text="state.likeCountText">0 likes</span>
					</button>
					<button
						type="button"
						className="wpaibp-hello-world-toggle"
						data-wp-on--click="actions.toggleDetails"
						data-wp-bind--aria-expanded="context.isOpen"
					>
						{ __( 'Details', 'wp-ai-ready-plugin-boilerplate' ) }
					</button>
				</div>
				<div
					className="wpaibp-hello-world-details"
					data-wp-bind--hidden="!context.isOpen"
				>
					<p>
						{ __(
							'Interactive components powered by the WordPress Interactivity API.',
							'wp-ai-ready-plugin-boilerplate'
						) }
					</p>
				</div>
				{ showTimestamp && (
					<span className="wpaibp-hello-world-badge">
						{ __(
							'Verified Plugin Component',
							'wp-ai-ready-plugin-boilerplate'
						) }
					</span>
				) }
			</div>
		</div>
	);
}
