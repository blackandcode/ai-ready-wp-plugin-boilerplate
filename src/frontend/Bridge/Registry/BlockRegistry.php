<?php
/**
 * Modern WordPress Block Registry Adapter.
 *
 * @package AIReady\WPPluginBoilerplate\Frontend\Registry
 */

namespace AIReady\WPPluginBoilerplate\Frontend\Registry;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers Gutenberg blocks from compiled metadata collection via native WordPress API.
 * Eliminates custom glob() filesystem scanning and source tree traversal.
 */
final class BlockRegistry {

	/**
	 * Path to compiled blocks directory.
	 *
	 * @var string
	 */
	private string $blocks_path;

	/**
	 * Path to compiled blocks manifest PHP file.
	 *
	 * @var string
	 */
	private string $manifest_path;

	/**
	 * Constructor.
	 *
	 * @param string|null $blocks_path   Optional custom blocks directory path.
	 * @param string|null $manifest_path Optional custom manifest file path.
	 */
	public function __construct( ?string $blocks_path = null, ?string $manifest_path = null ) {
		$plugin_dir          = defined( 'AIRWP_PLUGIN_DIR' ) ? AIRWP_PLUGIN_DIR : dirname( __DIR__, 4 ) . '/';
		$this->blocks_path   = $blocks_path ?? $plugin_dir . 'build/blocks';
		$this->manifest_path = $manifest_path ?? $plugin_dir . 'build/blocks-manifest.php';
	}

	/**
	 * Register blocks using native WordPress metadata collection API.
	 *
	 * @return void
	 */
	public function register(): void {
		if ( file_exists( $this->manifest_path ) && function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
			wp_register_block_types_from_metadata_collection(
				$this->blocks_path,
				$this->manifest_path
			);
		}
	}

	/**
	 * Static hook adapter for WordPress init action.
	 *
	 * @return void
	 */
	public static function register_blocks(): void {
		$registry = new self();
		$registry->register();
	}
}
