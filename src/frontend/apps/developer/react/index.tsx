/**
 * Developer Application Standalone Entrypoint.
 *
 * @package
 */

import { createRoot } from '@wordpress/element';
import { DeveloperApp } from './App';

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'airwp-developer-root' );
	if ( ! container ) {
		return;
	}

	const bootstrap =
		window.airwpAdminBootstrap ||
		(
			window as unknown as {
				airwpSettingsBootstrap?: typeof window.airwpAdminBootstrap;
			}
		 )?.airwpSettingsBootstrap;

	const root = createRoot( container );
	root.render( <DeveloperApp bootstrap={ bootstrap } /> );
} );
