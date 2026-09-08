import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { BlockEditProps } from '@wordpress/blocks';

interface HelloWorldAttributes {
  greeting: string;
  showTimestamp: boolean;
}

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
      <InspectorControls>
        <PanelBody title={ __( 'Greeting Settings', 'ai-ready-wp-plugin-boilerplate' ) } initialOpen={ true }>
          <TextControl
            label={ __( 'Greeting Text', 'ai-ready-wp-plugin-boilerplate' ) }
            value={ greeting }
            onChange={ ( value: string ) => setAttributes( { greeting: value } ) }
            help={ __( 'Enter custom greeting text to display on the page.', 'ai-ready-wp-plugin-boilerplate' ) }
          />
          <ToggleControl
            label={ __( 'Display Timestamp', 'ai-ready-wp-plugin-boilerplate' ) }
            checked={ showTimestamp }
            onChange={ ( value: boolean ) => setAttributes( { showTimestamp: value } ) }
            help={ __( 'Whether to display the generated timestamp badge.', 'ai-ready-wp-plugin-boilerplate' ) }
          />
        </PanelBody>
      </InspectorControls>

      <div { ...blockProps }>
        <div className="airwp-hello-world-card">
          <div className="airwp-hello-world-icon" aria-hidden="true">
            ✨
          </div>
          <h3 className="airwp-hello-world-heading">
            { greeting || __( 'Hello World!', 'ai-ready-wp-plugin-boilerplate' ) }
          </h3>
          <p className="airwp-hello-world-subtext">
            { __( 'Ready for AI-assisted WordPress block and plugin development.', 'ai-ready-wp-plugin-boilerplate' ) }
          </p>
          { showTimestamp && (
            <span className="airwp-hello-world-badge">
              { __( 'Live Block Preview', 'ai-ready-wp-plugin-boilerplate' ) }
            </span>
          ) }
        </div>
      </div>
    </>
  );
}
