import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

interface HelloWorldAttributes {
  greeting: string;
  showTimestamp: boolean;
}

export default function save( {
  attributes,
}: {
  attributes: HelloWorldAttributes;
} ) {
  const { greeting, showTimestamp } = attributes;
  const blockProps = useBlockProps.save( {
    className: 'airwp-hello-world-block',
  } );

  return (
    <div { ...blockProps }>
      <div className="airwp-hello-world-card">
        <div className="airwp-hello-world-icon" aria-hidden="true">
          ✨
        </div>
        <h3 className="airwp-hello-world-heading">
          { greeting }
        </h3>
        <p className="airwp-hello-world-subtext">
          { __( 'Powered by AI-Ready WP Plugin Boilerplate.', 'ai-ready-wp-plugin-boilerplate' ) }
        </p>
        { showTimestamp && (
          <span className="airwp-hello-world-badge">
            { __( 'Verified Plugin Component', 'ai-ready-wp-plugin-boilerplate' ) }
          </span>
        ) }
      </div>
    </div>
  );
}
