/**
 * Type definitions for Hello World block.
 *
 * @package
 */

export interface HelloWorldAttributes {
	greeting: string;
	showTimestamp: boolean;
}

export interface HelloWorldContext {
	likes: number;
	isOpen: boolean;
}

export interface HelloWorldStoreState {
	readonly likeCountText: string;
}

export interface HelloWorldStoreActions {
	incrementLike: () => void;
	toggleDetails: () => void;
}
