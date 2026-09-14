import { createRoot } from '@wordpress/element';
import { App } from './App';

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'wpaibp-settings-root' );
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
	root.render( <App bootstrap={ bootstrap } /> );
} );
