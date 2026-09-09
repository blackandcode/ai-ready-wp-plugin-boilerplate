<?php
/**
 * OpenAPI YAML Writer.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi;

use RuntimeException;
use Symfony\Component\Yaml\Yaml;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Deterministically serializes OpenAPI document arrays to YAML format with atomic filesystem writes.
 */
class OpenApiYamlWriter {

	/**
	 * Canonical generated file header.
	 */
	public const HEADER = "# GENERATED FILE - DO NOT EDIT.\n# Source: registered WordPress REST routes, schemas, and OpenAPI metadata.\n# Regenerate: wp ai-ready openapi generate\n\n";

	/**
	 * Convert OpenAPI document array into deterministic YAML string.
	 *
	 * @param array<string, mixed> $data Document array.
	 * @return string Serialized YAML string with header.
	 * @throws RuntimeException If symfony/yaml is not installed.
	 */
	public function dump( array $data ): string {
		if ( ! class_exists( Yaml::class ) ) {
			throw new RuntimeException(
				'YAML serialization requires "symfony/yaml". Please run "composer install" to install development dependencies before generating OpenAPI documentation.'
			);
		}

		$flags = Yaml::DUMP_MULTI_LINE_LITERAL_BLOCK | Yaml::DUMP_EMPTY_ARRAY_AS_SEQUENCE | Yaml::DUMP_OBJECT_AS_MAP;
		$yaml  = Yaml::dump( $data, 10, 2, $flags );

		return self::HEADER . $yaml;
	}

	/**
	 * Write OpenAPI document array to disk atomically.
	 *
	 * @param array<string, mixed> $data        OpenAPI document array.
	 * @param string               $target_path Destination file path.
	 * @return void
	 * @throws RuntimeException If directory creation or file writing fails.
	 */
	public function write_to_file( array $data, string $target_path ): void {
		$yaml_content = $this->dump( $data );
		$dir          = dirname( $target_path );

		if ( ! is_dir( $dir ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
			if ( ! mkdir( $dir, 0755, true ) && ! is_dir( $dir ) ) {
				throw new RuntimeException(
					// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
					sprintf( 'Failed to create directory "%s" for OpenAPI specification.', $dir )
				);
			}
		}

		$temp_path = $target_path . '.' . uniqid( 'tmp_', true );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$written = file_put_contents( $temp_path, $yaml_content );

		if ( false === $written ) {
			throw new RuntimeException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Failed to write temporary OpenAPI specification file at "%s".', $temp_path )
			);
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename
		if ( ! rename( $temp_path, $target_path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			unlink( $temp_path );
			throw new RuntimeException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Failed to rename temporary OpenAPI file to final destination "%s".', $target_path )
			);
		}
	}
}
