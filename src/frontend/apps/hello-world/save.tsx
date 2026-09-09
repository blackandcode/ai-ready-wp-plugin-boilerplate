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
		className: 'airwp-hello-world-block',
	} );

	const initialContext = JSON.stringify( {
		likes: 0,
		isOpen: false,
	} );

	return (
		<div
			{ ...blockProps }
			data-wp-interactive="airwp/hello-world"
			data-wp-context={ initialContext }
		>
			<div className="airwp-hello-world-card">
				<div className="airwp-hello-world-icon" aria-hidden="true">
					✨
				</div>
				<h3 className="airwp-hello-world-heading">{ greeting }</h3>
				<p className="airwp-hello-world-subtext">
					{ __(
						'Powered by AI-Ready WP Plugin Boilerplate.',
						'ai-ready-wp-plugin-boilerplate'
					) }
				</p>
				<div className="airwp-hello-world-interactive-controls">
					<button
						type="button"
						className="airwp-hello-world-button"
						data-wp-on--click="actions.incrementLike"
					>
						❤️{ ' ' }
						<span data-wp-text="state.likeCountText">0 likes</span>
					</button>
					<button
						type="button"
						className="airwp-hello-world-toggle"
						data-wp-on--click="actions.toggleDetails"
						data-wp-bind--aria-expanded="context.isOpen"
					>
						{ __( 'Details', 'ai-ready-wp-plugin-boilerplate' ) }
					</button>
				</div>
				<div
					className="airwp-hello-world-details"
					data-wp-bind--hidden="!context.isOpen"
				>
					<p>
						{ __(
							'Interactive components powered by the WordPress Interactivity API.',
							'ai-ready-wp-plugin-boilerplate'
						) }
					</p>
				</div>
				{ showTimestamp && (
					<span className="airwp-hello-world-badge">
						{ __(
							'Verified Plugin Component',
							'ai-ready-wp-plugin-boilerplate'
						) }
					</span>
				) }
			</div>
		</div>
	);
}
