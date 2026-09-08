<?php
/**
 * Block Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Block
 */

namespace AIReady\WPPluginBoilerplate\Block;

use AIReady\WPPluginBoilerplate\Bootstrap\Container;
use AIReady\WPPluginBoilerplate\Bootstrap\ServiceProvider;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Service provider for registering Gutenberg blocks.
 */
class BlockServiceProvider implements ServiceProvider {

	/**
	 * Register services in DI container.
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// No container bindings required for basic block registration.
	}

	/**
	 * Boot block services.
	 *
	 * @return void
	 */
	public function boot(): void {
		add_action( 'init', array( $this, 'register_blocks' ) );
	}

	/**
	 * Register plugin blocks from block.json metadata.
	 *
	 * @return void
	 */
	public function register_blocks(): void {
		$plugin_dir = defined( 'AIRWP_PLUGIN_DIR' ) ? AIRWP_PLUGIN_DIR : dirname( __DIR__, 2 ) . '/';
		$block_dir  = $plugin_dir . 'blocks/hello-world';

		if ( file_exists( $block_dir . '/block.json' ) ) {
			register_block_type_from_metadata( $block_dir );
		}
	}
}
