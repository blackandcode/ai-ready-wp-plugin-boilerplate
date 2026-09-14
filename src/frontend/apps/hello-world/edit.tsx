/**
 * Edit Component for Hello World block.
 *
 * Decomposes inspector controls into separate Inspector component.
 *
 * @package
 */

import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import type { BlockEditProps } from '@wordpress/blocks';
import { Inspector } from './edit/Inspector';
import type { HelloWorldAttributes } from './types';

export default function Edit( {
	attributes,
	setAttributes,
}: BlockEditProps< HelloWorldAttributes > ) {
	const { greeting, showTimestamp } = attributes;
	const blockProps = useBlockProps( {
		className: 'wpaibp-hello-world-block',
	} );

	return (
		<>
			<Inspector
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>

			<div { ...blockProps }>
				<div className="wpaibp-hello-world-card">
					<div className="wpaibp-hello-world-icon" aria-hidden="true">
						✨
					</div>
					<h3 className="wpaibp-hello-world-heading">
						{ greeting ||
							__(
								'Hello World!',
								'wp-ai-ready-plugin-boilerplate'
							) }
					</h3>
					<p className="wpaibp-hello-world-subtext">
						{ __(
							'Ready for AI-assisted WordPress block and plugin development.',
							'wp-ai-ready-plugin-boilerplate'
						) }
					</p>
					{ showTimestamp && (
						<span className="wpaibp-hello-world-badge">
							{ __(
								'Live Block Preview',
								'wp-ai-ready-plugin-boilerplate'
							) }
						</span>
					) }
				</div>
			</div>
		</>
	);
}
