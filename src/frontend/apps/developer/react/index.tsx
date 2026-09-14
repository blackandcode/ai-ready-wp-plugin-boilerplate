/**
 * Developer Application Standalone Entrypoint.
 *
 * @package
 */

import { createRoot } from '@wordpress/element';
import { DeveloperApp } from './App';

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'wpaibp-developer-root' );
	if ( ! container ) {
		return;
	}

	const bootstrap =
		window.wpaibpAdminBootstrap ||
		(
			window as unknown as {
				airwpSettingsBootstrap?: typeof window.wpaibpAdminBootstrap;
			}
		 )?.airwpSettingsBootstrap;

	const root = createRoot( container );
	root.render( <DeveloperApp bootstrap={ bootstrap } /> );
} );
