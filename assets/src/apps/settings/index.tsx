import { createRoot } from '@wordpress/element';
import { App } from './App';

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'airwp-settings-root' );
	if ( ! container ) {
		return;
	}

	const bootstrap = window.airwpAdminBootstrap;
	const root = createRoot( container );
	root.render( <App bootstrap={ bootstrap } /> );
} );
