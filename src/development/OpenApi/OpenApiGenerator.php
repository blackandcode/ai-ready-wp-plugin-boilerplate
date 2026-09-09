<?php
/**
 * OpenAPI Specification Generator Facade.
 *
 * @package AIReady\WPPluginBoilerplate\Development\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Development\OpenApi;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Orchestrates route inspection, OpenAPI 3.1 document assembly, drift verification, and YAML output.
 */
class OpenApiGenerator {

	/**
	 * Default plugin REST namespace.
	 */
	public const DEFAULT_NAMESPACE = 'ai-ready-wp/v1';

	/**
	 * Route inspector.
	 *
	 * @var WordPressRouteInspector
	 */
	private WordPressRouteInspector $route_inspector;

	/**
	 * Document factory.
	 *
	 * @var OpenApiDocumentFactory
	 */
	private OpenApiDocumentFactory $document_factory;

	/**
	 * YAML writer.
	 *
	 * @var OpenApiYamlWriter
	 */
	private OpenApiYamlWriter $yaml_writer;

	/**
	 * Constructor.
	 *
	 * @param WordPressRouteInspector|null $route_inspector  Route inspector.
	 * @param OpenApiDocumentFactory|null  $document_factory Document factory.
	 * @param OpenApiYamlWriter|null       $yaml_writer      YAML writer.
	 */
	public function __construct(
		?WordPressRouteInspector $route_inspector = null,
		?OpenApiDocumentFactory $document_factory = null,
		?OpenApiYamlWriter $yaml_writer = null
	) {
		$this->route_inspector  = $route_inspector ?? new WordPressRouteInspector();
		$this->document_factory = $document_factory ?? new OpenApiDocumentFactory();
		$this->yaml_writer      = $yaml_writer ?? new OpenApiYamlWriter();
	}

	/**
	 * Generate live OpenAPI 3.1 document as a PHP array.
	 *
	 * @param string               $route_namespace Target REST namespace.
	 * @param array<string, mixed> $config          Document configuration options.
	 * @return array<string, mixed> OpenAPI 3.1 document.
	 */
	public function generate( string $route_namespace = self::DEFAULT_NAMESPACE, array $config = array() ): array {
		$inspected = $this->route_inspector->inspect_namespace( $route_namespace );
		$config    = array_merge( array( 'namespace' => $route_namespace ), $config );

		return $this->document_factory->create( $inspected, $config );
	}

	/**
	 * Generate OpenAPI document and write deterministically to destination path.
	 *
	 * @param string               $output_path     Target file path (e.g. docs/api/openapi.yaml).
	 * @param string               $route_namespace Target REST namespace.
	 * @param array<string, mixed> $config          Configuration overrides.
	 * @return array{output_path: string, paths_count: int, operations_count: int, schemas_count: int, document: array<string, mixed>}
	 */
	public function generate_and_write(
		string $output_path,
		string $route_namespace = self::DEFAULT_NAMESPACE,
		array $config = array()
	): array {
		$document = $this->generate( $route_namespace, $config );
		$this->yaml_writer->write_to_file( $document, $output_path );

		$paths_count      = count( $document['paths'] ?? array() );
		$operations_count = 0;
		foreach ( ( $document['paths'] ?? array() ) as $methods ) {
			if ( is_array( $methods ) ) {
				$operations_count += count( $methods );
			}
		}

		$schemas_count = count( $document['components']['schemas'] ?? array() );

		return array(
			'output_path'      => $output_path,
			'paths_count'      => $paths_count,
			'operations_count' => $operations_count,
			'schemas_count'    => $schemas_count,
			'document'         => $document,
		);
	}

	/**
	 * Verify if an existing OpenAPI YAML file matches current registered route state byte-for-byte.
	 *
	 * @param string               $target_path     Existing file path to verify.
	 * @param string               $route_namespace Target REST namespace.
	 * @param array<string, mixed> $config          Configuration overrides.
	 * @return bool True if identical, false if drifted or file missing.
	 */
	public function check_drift(
		string $target_path,
		string $route_namespace = self::DEFAULT_NAMESPACE,
		array $config = array()
	): bool {
		if ( ! file_exists( $target_path ) ) {
			return false;
		}

		$document      = $this->generate( $route_namespace, $config );
		$expected_yaml = $this->yaml_writer->dump( $document );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$existing_yaml = file_get_contents( $target_path );

		if ( false === $existing_yaml ) {
			return false;
		}

		// Normalize CRLF to LF for reliable cross-platform comparison.
		$expected_normalized = str_replace( "\r\n", "\n", $expected_yaml );
		$existing_normalized = str_replace( "\r\n", "\n", $existing_yaml );

		return ( $expected_normalized === $existing_normalized );
	}

	/**
	 * Get the YAML writer instance.
	 *
	 * @return OpenApiYamlWriter
	 */
	public function get_yaml_writer(): OpenApiYamlWriter {
		return $this->yaml_writer;
	}

	/**
	 * Get the document factory instance.
	 *
	 * @return OpenApiDocumentFactory
	 */
	public function get_document_factory(): OpenApiDocumentFactory {
		return $this->document_factory;
	}

	/**
	 * Get the route inspector instance.
	 *
	 * @return WordPressRouteInspector
	 */
	public function get_route_inspector(): WordPressRouteInspector {
		return $this->route_inspector;
	}
}
