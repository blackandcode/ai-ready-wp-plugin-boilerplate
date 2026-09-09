/**
 * Inspector Controls for Hello World block.
 *
 * @package
 */

import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { HelloWorldAttributes } from '../types';

interface InspectorProps {
	attributes: HelloWorldAttributes;
	setAttributes: ( attrs: Partial< HelloWorldAttributes > ) => void;
}

export function Inspector( { attributes, setAttributes }: InspectorProps ) {
	const { greeting, showTimestamp } = attributes;

	return (
		<InspectorControls>
			<PanelBody
				title={ __(
					'Greeting Settings',
					'ai-ready-wp-plugin-boilerplate'
				) }
				initialOpen={ true }
			>
				<TextControl
					__next40pxDefaultSize={ true }
					__nextHasNoMarginBottom={ true }
					label={ __(
						'Greeting Text',
						'ai-ready-wp-plugin-boilerplate'
					) }
					value={ greeting }
					onChange={ ( value: string ) =>
						setAttributes( { greeting: value } )
					}
					help={ __(
						'Enter custom greeting text to display on the page.',
						'ai-ready-wp-plugin-boilerplate'
					) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom={ true }
					label={ __(
						'Display Timestamp',
						'ai-ready-wp-plugin-boilerplate'
					) }
					checked={ showTimestamp }
					onChange={ ( value: boolean ) =>
						setAttributes( { showTimestamp: value } )
					}
					help={ __(
						'Whether to display the generated timestamp badge.',
						'ai-ready-wp-plugin-boilerplate'
					) }
				/>
			</PanelBody>
		</InspectorControls>
	);
}
