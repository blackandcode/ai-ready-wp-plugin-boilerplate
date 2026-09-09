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
		className: 'airwp-hello-world-block',
	} );

	return (
		<>
			<Inspector
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>

			<div { ...blockProps }>
				<div className="airwp-hello-world-card">
					<div className="airwp-hello-world-icon" aria-hidden="true">
						✨
					</div>
					<h3 className="airwp-hello-world-heading">
						{ greeting ||
							__(
								'Hello World!',
								'ai-ready-wp-plugin-boilerplate'
							) }
					</h3>
					<p className="airwp-hello-world-subtext">
						{ __(
							'Ready for AI-assisted WordPress block and plugin development.',
							'ai-ready-wp-plugin-boilerplate'
						) }
					</p>
					{ showTimestamp && (
						<span className="airwp-hello-world-badge">
							{ __(
								'Live Block Preview',
								'ai-ready-wp-plugin-boilerplate'
							) }
						</span>
					) }
				</div>
			</div>
		</>
	);
}
