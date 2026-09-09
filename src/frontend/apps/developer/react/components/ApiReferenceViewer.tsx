/**
 * Heavy OpenAPI Scalar Viewer Component.
 *
 * Code-split and lazy-loaded on demand to ensure Developer bundle remains lightweight.
 *
 * @package
 */

import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

interface ApiReferenceViewerProps {
	spec: Record< string, unknown >;
}

export default function ApiReferenceViewer( {
	spec,
}: ApiReferenceViewerProps ) {
	return (
		<ApiReferenceReact
			configuration={ {
				content: spec,
				theme: 'default',
				hideDarkModeToggle: true,
				showSidebar: false,
			} }
		/>
	);
}
