/**
 * Interactivity API Client Store for Hello World block.
 *
 * @package
 */

import { store, getContext } from '@wordpress/interactivity';
import type { HelloWorldContext } from './types';

store( 'airwp/hello-world', {
	state: {
		get likeCountText(): string {
			const context = getContext< HelloWorldContext >();
			const count = context?.likes ?? 0;
			return `${ count } ${ count === 1 ? 'like' : 'likes' }`;
		},
	},
	actions: {
		incrementLike() {
			const context = getContext< HelloWorldContext >();
			if ( context ) {
				context.likes += 1;
			}
		},
		toggleDetails() {
			const context = getContext< HelloWorldContext >();
			if ( context ) {
				context.isOpen = ! context.isOpen;
			}
		},
	},
} );
