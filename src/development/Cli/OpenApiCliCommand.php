<?php
/**
 * OpenAPI WP-CLI Command Adapter.
 *
 * @package AIReady\WPPluginBoilerplate\Development\Cli
 */

namespace AIReady\WPPluginBoilerplate\Development\Cli;

use Throwable;
use WP_CLI;
use AIReady\WPPluginBoilerplate\Development\OpenApi\OpenApiGenerator;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Generate and verify OpenAPI 3.1 specification for plugin REST routes.
 */
class OpenApiCliCommand {

	/**
	 * OpenAPI generator instance.
	 *
	 * @var OpenApiGenerator
	 */
	private OpenApiGenerator $generator;

	/**
	 * Constructor.
	 *
	 * @param OpenApiGenerator|null $generator Optional generator instance.
	 */
	public function __construct( ?OpenApiGenerator $generator = null ) {
		$this->generator = $generator ?? new OpenApiGenerator();
	}

	/**
	 * Resolve canonical default output path for OpenAPI specification.
	 *
	 * @return string Absolute file path to docs/api/openapi.yaml.
	 */
	private function get_default_output_path(): string {
		if ( defined( 'AIRWP_PLUGIN_DIR' ) ) {
			return AIRWP_PLUGIN_DIR . 'docs/api/openapi.yaml';
		}

		return dirname( __DIR__, 3 ) . '/docs/api/openapi.yaml';
	}

	/**
	 * Generate OpenAPI 3.1 specification from registered REST routes.
	 *
	 * ## OPTIONS
	 *
	 * [--output=<path>]
	 * : Destination file path (defaults to docs/api/openapi.yaml).
	 *
	 * [--namespace=<namespace>]
	 * : REST namespace to inspect (defaults to ai-ready-wp/v1).
	 *
	 * ## EXAMPLES
	 *
	 *     wp ai-ready openapi generate
	 *     wp ai-ready openapi generate --output=custom-spec.yaml
	 *
	 * @subcommand generate
	 *
	 * @param array<int, string>   $args       Positional arguments.
	 * @param array<string, mixed> $assoc_args Associative arguments.
	 * @return void
	 */
	public function generate( array $args, array $assoc_args ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$output_path     = isset( $assoc_args['output'] ) ? (string) $assoc_args['output'] : $this->get_default_output_path();
		$route_namespace = isset( $assoc_args['namespace'] ) ? (string) $assoc_args['namespace'] : OpenApiGenerator::DEFAULT_NAMESPACE;

		try {
			$result = $this->generator->generate_and_write( $output_path, $route_namespace );

			WP_CLI::success(
				sprintf(
					'OpenAPI 3.1 specification generated successfully: %s (%d paths, %d operations, %d schemas).',
					$result['output_path'],
					$result['paths_count'],
					$result['operations_count'],
					$result['schemas_count']
				)
			);
		} catch ( Throwable $e ) {
			WP_CLI::error( 'Failed to generate OpenAPI specification: ' . $e->getMessage() );
		}
	}

	/**
	 * Verify that existing OpenAPI specification matches registered REST routes without drift.
	 *
	 * ## OPTIONS
	 *
	 * [--output=<path>]
	 * : Destination file path to check (defaults to docs/api/openapi.yaml).
	 *
	 * [--namespace=<namespace>]
	 * : REST namespace to inspect (defaults to ai-ready-wp/v1).
	 *
	 * ## EXAMPLES
	 *
	 *     wp ai-ready openapi check
	 *
	 * @subcommand check
	 *
	 * @param array<int, string>   $args       Positional arguments.
	 * @param array<string, mixed> $assoc_args Associative arguments.
	 * @return void
	 */
	public function check( array $args, array $assoc_args ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$output_path     = isset( $assoc_args['output'] ) ? (string) $assoc_args['output'] : $this->get_default_output_path();
		$route_namespace = isset( $assoc_args['namespace'] ) ? (string) $assoc_args['namespace'] : OpenApiGenerator::DEFAULT_NAMESPACE;

		try {
			if ( ! file_exists( $output_path ) ) {
				WP_CLI::error(
					sprintf( 'OpenAPI reference file does not exist at "%s". Run "wp ai-ready openapi generate" to create it.', $output_path )
				);
				return;
			}

			$is_current = $this->generator->check_drift( $output_path, $route_namespace );

			if ( $is_current ) {
				WP_CLI::success(
					sprintf( 'OpenAPI specification at "%s" is up to date with registered routes.', $output_path )
				);
			} else {
				WP_CLI::error(
					sprintf( 'OpenAPI specification at "%s" is stale or has drifted from registered routes. Run "wp ai-ready openapi generate" to synchronize it.', $output_path )
				);
			}
		} catch ( Throwable $e ) {
			WP_CLI::error( 'Failed to verify OpenAPI specification: ' . $e->getMessage() );
		}
	}
}
