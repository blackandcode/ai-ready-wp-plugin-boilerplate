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
 * Service provider for registering Gutenberg blocks and block patterns.
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
		add_action( 'init', array( $this, 'register_patterns' ) );
	}

	/**
	 * Register plugin blocks from block.json metadata using dynamic directory discovery.
	 *
	 * @return void
	 */
	public function register_blocks(): void {
		$plugin_dir  = defined( 'AIRWP_PLUGIN_DIR' ) ? AIRWP_PLUGIN_DIR : dirname( __DIR__, 2 ) . '/';
		$blocks_dir  = $plugin_dir . 'blocks';
		$block_files = glob( $blocks_dir . '/*/block.json' );

		if ( false !== $block_files && ! empty( $block_files ) ) {
			foreach ( $block_files as $meta_file ) {
				register_block_type_from_metadata( dirname( $meta_file ) );
			}
		}
	}

	/**
	 * Register block patterns and categories via dynamic file discovery.
	 *
	 * @return void
	 */
	public function register_patterns(): void {
		if ( ! function_exists( 'register_block_pattern_category' ) || ! function_exists( 'register_block_pattern' ) ) {
			return;
		}

		register_block_pattern_category(
			'ai-ready-wp',
			array( 'label' => __( 'AI-Ready WP', 'ai-ready-wp-plugin-boilerplate' ) )
		);

		$plugin_dir    = defined( 'AIRWP_PLUGIN_DIR' ) ? AIRWP_PLUGIN_DIR : dirname( __DIR__, 2 ) . '/';
		$patterns_dir  = $plugin_dir . 'patterns';
		$pattern_files = glob( $patterns_dir . '/*.php' );

		if ( false === $pattern_files || empty( $pattern_files ) ) {
			return;
		}

		foreach ( $pattern_files as $file ) {
			$headers = function_exists( 'get_file_data' )
				? get_file_data(
					$file,
					array(
						'title'       => 'Title',
						'slug'        => 'Slug',
						'categories'  => 'Categories',
						'description' => 'Description',
					)
				)
				: $this->parse_pattern_headers( $file );

			if ( empty( $headers['title'] ) || empty( $headers['slug'] ) ) {
				continue;
			}

			$categories = array_filter(
				array_map( 'trim', explode( ',', (string) $headers['categories'] ) )
			);

			ob_start();
			include $file;
			$content = (string) ob_get_clean();

			register_block_pattern(
				$headers['slug'],
				array(
					'title'       => $headers['title'],
					'categories'  => ! empty( $categories ) ? $categories : array( 'ai-ready-wp' ),
					'description' => (string) ( $headers['description'] ?? '' ),
					'content'     => $content,
				)
			);
		}
	}

	/**
	 * Fallback parser for pattern file headers when get_file_data is unavailable.
	 *
	 * @param string $file Pattern file path.
	 * @return array<string, string> Parsed headers.
	 */
	private function parse_pattern_headers( string $file ): array {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local file read for pattern header parsing.
		$file_content = (string) file_get_contents( $file, false, null, 0, 8192 );
		$headers      = array(
			'title'       => '',
			'slug'        => '',
			'categories'  => '',
			'description' => '',
		);

		$field_map = array(
			'title'       => 'Title',
			'slug'        => 'Slug',
			'categories'  => 'Categories',
			'description' => 'Description',
		);

		foreach ( $field_map as $key => $header ) {
			if ( preg_match( '/^[ \t\/*#@]*' . preg_quote( $header, '/' ) . ':(.*)$/mi', $file_content, $matches ) ) {
				$headers[ $key ] = trim( $matches[1] );
			}
		}

		return $headers;
	}
}
