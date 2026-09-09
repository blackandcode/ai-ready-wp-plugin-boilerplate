<?php
/**
 * OpenAPI 3.1 Document Factory.
 *
 * @package AIReady\WPPluginBoilerplate\Development\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Development\OpenApi;

use AIReady\WPPluginBoilerplate\Framework\Kernel\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Assembles a complete, validated, and deterministic OpenAPI 3.1 document structure from inspected WordPress REST routes.
 */
class OpenApiDocumentFactory {

	/**
	 * Canonical HTTP method order.
	 */
	public const METHOD_ORDER = array( 'get', 'post', 'put', 'patch', 'delete', 'options', 'head' );

	/**
	 * Path normalizer.
	 *
	 * @var OpenApiPathNormalizer
	 */
	private OpenApiPathNormalizer $path_normalizer;

	/**
	 * Schema converter.
	 *
	 * @var WordPressSchemaConverter
	 */
	private WordPressSchemaConverter $schema_converter;

	/**
	 * Metadata validator.
	 *
	 * @var OpenApiMetadataValidator
	 */
	private OpenApiMetadataValidator $metadata_validator;

	/**
	 * Constructor.
	 *
	 * @param OpenApiPathNormalizer|null    $path_normalizer    Path normalizer.
	 * @param WordPressSchemaConverter|null $schema_converter   Schema converter.
	 * @param OpenApiMetadataValidator|null $metadata_validator Metadata validator.
	 */
	public function __construct(
		?OpenApiPathNormalizer $path_normalizer = null,
		?WordPressSchemaConverter $schema_converter = null,
		?OpenApiMetadataValidator $metadata_validator = null
	) {
		$this->path_normalizer    = $path_normalizer ?? new OpenApiPathNormalizer();
		$this->schema_converter   = $schema_converter ?? new WordPressSchemaConverter();
		$this->metadata_validator = $metadata_validator ?? new OpenApiMetadataValidator();
	}

	/**
	 * Create complete OpenAPI 3.1 document array.
	 *
	 * @param array<int, array<string, mixed>> $inspected_routes Inspected routes from WordPressRouteInspector.
	 * @param array<string, mixed>             $config           Configuration options (title, version, namespace, description).
	 * @return array<string, mixed> Deterministic OpenAPI 3.1 document.
	 */
	public function create( array $inspected_routes, array $config = array() ): array {
		$this->schema_converter->reset();

		$namespace   = $config['namespace'] ?? 'ai-ready-wp/v1';
		$version     = $config['version'] ?? ( defined( 'AIRWP_VERSION' ) ? AIRWP_VERSION : Plugin::VERSION );
		$title       = $config['title'] ?? 'AI-Ready WP Plugin Boilerplate REST API';
		$description = $config['description'] ?? 'Authoritative OpenAPI 3.1 contract specification for AI-Ready WP Plugin Boilerplate endpoints.';

		// Register standard ErrorResponse component schema.
		$this->register_error_response_schema();

		$raw_paths          = array();
		$seen_operation_ids = array();

		// Process and group routes by normalized path.
		foreach ( $inspected_routes as $route_data ) {
			$raw_route    = $route_data['route'];
			$route_schema = $route_data['route_schema'] ?? null;
			$handlers     = $route_data['handlers'] ?? array();

			$normalized  = $this->path_normalizer->normalize( $raw_route, $namespace );
			$path_key    = $normalized['path'];
			$path_params = $normalized['parameters'];

			$root_component_name = null;
			if ( ! empty( $route_schema ) && is_array( $route_schema ) && ! empty( $route_schema['title'] ) ) {
				$root_component_name = $this->schema_converter->convert_root_schema( $route_schema );
			}

			if ( ! isset( $raw_paths[ $path_key ] ) ) {
				$raw_paths[ $path_key ] = array(
					'parameters' => $path_params,
					'operations' => array(),
				);
			}

			foreach ( $handlers as $handler ) {
				$methods             = $handler['methods'];
				$openapi_meta        = $handler['openapi'];
				$args                = $handler['args'];
				$permission_callback = $handler['permission_callback'] ?? null;

				foreach ( $methods as $method ) {
					$lower_method = strtolower( $method );

					$this->metadata_validator->validate_operation(
						$openapi_meta,
						$path_key,
						$method,
						$seen_operation_ids
					);

					$operation = $this->build_operation(
						$lower_method,
						$openapi_meta,
						$args,
						$path_params,
						$root_component_name,
						$permission_callback
					);

					$raw_paths[ $path_key ]['operations'][ $lower_method ] = $operation;
				}
			}
		}

		// Sort paths lexically for determinism.
		ksort( $raw_paths );

		$paths = array();
		foreach ( $raw_paths as $path_key => $path_data ) {
			$path_item = array();

			// Add operations in fixed order.
			foreach ( self::METHOD_ORDER as $method_key ) {
				if ( isset( $path_data['operations'][ $method_key ] ) ) {
					$path_item[ $method_key ] = $path_data['operations'][ $method_key ];
				}
			}

			$paths[ $path_key ] = $path_item;
		}

		$document = array(
			'openapi'    => '3.1.0',
			'info'       => array(
				'title'       => $title,
				'version'     => $version,
				'description' => $description,
			),
			'servers'    => array(
				array(
					'url'         => '/wp-json/' . trim( $namespace, '/' ),
					'description' => 'Relative WordPress REST API namespace root',
				),
			),
			'paths'      => $paths,
			'components' => array(
				'securitySchemes' => array(
					'basicAuth' => array(
						'type'        => 'http',
						'scheme'      => 'basic',
						'description' => 'WordPress Application Password authentication',
					),
				),
				'schemas'         => $this->schema_converter->get_components(),
			),
		);

		return $document;
	}

	/**
	 * Build an OpenAPI operation descriptor.
	 *
	 * @param string                           $method              HTTP method (lowercase).
	 * @param array<string, mixed>             $openapi_meta        Operation metadata.
	 * @param array<string, mixed>             $args                Endpoint arguments.
	 * @param array<int, array<string, mixed>> $path_params         Path parameters extracted from route regex.
	 * @param string|null                      $root_component_name Name of resource schema component if available.
	 * @param mixed                            $permission_callback Permission callback.
	 * @return array<string, mixed> OpenAPI operation object.
	 */
	private function build_operation(
		string $method,
		array $openapi_meta,
		array $args,
		array $path_params,
		?string $root_component_name,
		mixed $permission_callback
	): array {
		$operation = array(
			'operationId' => $openapi_meta['operationId'],
			'summary'     => $openapi_meta['summary'],
		);

		if ( ! empty( $openapi_meta['description'] ) && is_string( $openapi_meta['description'] ) ) {
			$operation['description'] = $openapi_meta['description'];
		}

		$operation['tags'] = array_values( $openapi_meta['tags'] );

		if ( ! empty( $openapi_meta['deprecated'] ) ) {
			$operation['deprecated'] = true;
		}

		// Security: infer or apply metadata override.
		if ( array_key_exists( 'security', $openapi_meta ) ) {
			$operation['security'] = $openapi_meta['security'];
		} else {
			$is_public = ( '__return_true' === $permission_callback )
				|| ( is_array( $permission_callback ) && isset( $permission_callback[1] ) && 'get_item_permissions_check' === $permission_callback[1] && str_contains( get_class( $permission_callback[0] ), 'HelloWorld' ) );

			if ( $is_public ) {
				$operation['security'] = array();
			} else {
				$operation['security'] = array(
					array( 'basicAuth' => array() ),
				);
			}
		}

		// Query and path parameters.
		$parameters     = array();
		$path_param_map = array();

		foreach ( $path_params as $p ) {
			$parameters[]                 = $p;
			$path_param_map[ $p['name'] ] = true;
		}

		if ( in_array( $method, array( 'get', 'delete', 'head' ), true ) ) {
			foreach ( $args as $arg_name => $arg_def ) {
				if ( isset( $path_param_map[ $arg_name ] ) || ! is_array( $arg_def ) ) {
					continue;
				}

				$param = array(
					'name'        => (string) $arg_name,
					'in'          => 'query',
					'required'    => ! empty( $arg_def['required'] ),
					'description' => $arg_def['description'] ?? sprintf( 'Query parameter: %s', $arg_name ),
					'schema'      => $this->schema_converter->convert_schema( $arg_def, false ),
				);

				$parameters[] = $param;
			}
		}

		if ( ! empty( $parameters ) ) {
			$operation['parameters'] = $parameters;
		}

		// Request body for JSON write endpoints.
		if ( in_array( $method, array( 'post', 'put', 'patch' ), true ) ) {
			if ( isset( $openapi_meta['requestBody'] ) && is_array( $openapi_meta['requestBody'] ) ) {
				$operation['requestBody'] = $openapi_meta['requestBody'];
			} elseif ( null !== $root_component_name ) {
				$operation['requestBody'] = array(
					'required' => true,
					'content'  => array(
						'application/json' => array(
							'schema' => array(
								'$ref' => '#/components/schemas/' . $root_component_name,
							),
						),
					),
				);
			}
		}

		// Responses.
		$responses = array();
		foreach ( $openapi_meta['responses'] as $status_code => $resp_meta ) {
			$status_key = (string) $status_code;
			$resp_entry = array(
				'description' => $resp_meta['description'] ?? '',
			);

			if ( in_array( $status_key, array( '200', '201' ), true ) && null !== $root_component_name ) {
				$resp_entry['content'] = array(
					'application/json' => array(
						'schema' => array(
							'$ref' => '#/components/schemas/' . $root_component_name,
						),
					),
				);
			} elseif ( in_array( $status_key, array( '400', '401', '403', '404', '500' ), true ) ) {
				$resp_entry['content'] = array(
					'application/json' => array(
						'schema' => array(
							'$ref' => '#/components/schemas/ErrorResponse',
						),
					),
				);
			}

			$responses[ $status_key ] = $resp_entry;
		}

		// Stable sort response status codes.
		ksort( $responses );
		$operation['responses'] = $responses;

		return $operation;
	}

	/**
	 * Register the standard WordPress REST error response schema component.
	 *
	 * @return void
	 */
	private function register_error_response_schema(): void {
		$this->schema_converter->register_component(
			'ErrorResponse',
			array(
				'type'       => 'object',
				'required'   => array( 'code', 'message', 'data' ),
				'properties' => array(
					'code'    => array(
						'type'        => 'string',
						'description' => 'WordPress REST error code string.',
						'example'     => 'rest_forbidden',
					),
					'message' => array(
						'type'        => 'string',
						'description' => 'Human-readable error explanation message.',
						'example'     => 'You do not have sufficient permissions to access plugin settings.',
					),
					'data'    => array(
						'type'        => 'object',
						'description' => 'Additional error metadata including HTTP status.',
						'properties'  => array(
							'status' => array(
								'type'        => 'integer',
								'description' => 'HTTP response status code.',
								'example'     => 403,
							),
						),
					),
				),
			)
		);
	}
}
