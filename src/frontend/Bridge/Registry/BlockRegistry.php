<?php
/**
 * Dynamic Block Registry.
 *
 * @package AIReady\WPPluginBoilerplate\Frontend\Registry
 */

namespace AIReady\WPPluginBoilerplate\Frontend\Registry;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Discovers and registers Gutenberg blocks dynamically from block.json metadata.
 */
class BlockRegistry {

	/**
	 * Register discovered blocks.
	 *
	 * @return void
	 */
	public static function register_blocks(): void {
		$plugin_dir = defined( 'AIRWP_PLUGIN_DIR' ) ? AIRWP_PLUGIN_DIR : dirname( __DIR__, 4 ) . '/';

		// Discover blocks under src/frontend/apps/*/block.json.
		$candidates = glob( $plugin_dir . 'src/frontend/apps/*/block.json' );

		if ( false === $candidates || empty( $candidates ) ) {
			return;
		}

		foreach ( $candidates as $meta_file ) {
			register_block_type_from_metadata( dirname( $meta_file ) );
		}
	}
}
