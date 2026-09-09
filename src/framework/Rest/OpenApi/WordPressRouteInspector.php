<?php
/**
 * WordPress REST Route Inspector.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi;

use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Introspects registered WordPress REST routes, handlers, and schemas without executing callbacks.
 */
class WordPressRouteInspector {

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server|null
	 */
	private ?WP_REST_Server $server;

	/**
	 * Constructor.
	 *
	 * @param WP_REST_Server|null $server Optional REST server instance.
	 */
	public function __construct( ?WP_REST_Server $server = null ) {
		$this->server = $server;
	}

	/**
	 * Inspect registered routes for a specific namespace.
	 *
	 * @param string $route_namespace Target REST namespace (default: ai-ready-wp/v1).
	 * @return array<int, array{route: string, route_schema: array<string, mixed>|null, handlers: array<int, array<string, mixed>>}>
	 */
	public function inspect_namespace( string $route_namespace = 'ai-ready-wp/v1' ): array {
		$server = $this->get_server();
		if ( null === $server ) {
			return array();
		}

		$namespace_prefix  = '/' . trim( $route_namespace, '/' );
		$registered_routes = $server->get_routes( $route_namespace );
		$inspected         = array();

		foreach ( $registered_routes as $route_pattern => $route_config ) {
			// Enforce strict namespace isolation: never include core or other namespaces.
			if ( ! str_starts_with( $route_pattern, $namespace_prefix ) ) {
				continue;
			}

			// Extract route-level schema safely without executing endpoint handlers.
			$route_schema  = null;
			$route_options = $server->get_route_options( $route_pattern );
			$schema_target = $route_options['schema'] ?? ( $route_config['schema'] ?? null );

			if ( ! empty( $schema_target ) && is_callable( $schema_target ) ) {
				$raw_schema = call_user_func( $schema_target );
				if ( is_array( $raw_schema ) ) {
					$route_schema = $raw_schema;
				}
			}

			$handlers = array();
			foreach ( $route_config as $key => $handler_entry ) {
				if ( ! is_int( $key ) || ! is_array( $handler_entry ) ) {
					continue;
				}

				// Skip internal, excluded, or un-annotated handlers (such as core namespace index).
				if ( empty( $handler_entry['openapi'] ) || ! is_array( $handler_entry['openapi'] ) ) {
					continue;
				}

				if ( ! empty( $handler_entry['openapi']['exclude'] ) || ! empty( $handler_entry['openapi']['internal'] ) ) {
					continue;
				}

				$raw_methods = $handler_entry['methods'] ?? array();
				$methods     = $this->normalize_methods( $raw_methods );

				$args    = isset( $handler_entry['args'] ) && is_array( $handler_entry['args'] ) ? $handler_entry['args'] : array();
				$openapi = $handler_entry['openapi'];

				$handlers[] = array(
					'methods'             => $methods,
					'args'                => $args,
					'openapi'             => $openapi,
					'permission_callback' => $handler_entry['permission_callback'] ?? null,
				);
			}

			if ( ! empty( $handlers ) ) {
				$inspected[] = array(
					'route'        => $route_pattern,
					'route_schema' => $route_schema,
					'handlers'     => $handlers,
				);
			}
		}

		return $inspected;
	}

	/**
	 * Retrieve and ensure initialized REST server.
	 *
	 * @return WP_REST_Server|null
	 */
	private function get_server(): ?WP_REST_Server {
		if ( null !== $this->server ) {
			return $this->server;
		}

		if ( function_exists( 'rest_get_server' ) ) {
			return rest_get_server();
		}

		if ( function_exists( 'did_action' ) && function_exists( 'do_action' ) && ! did_action( 'rest_api_init' ) ) {
			do_action( 'rest_api_init' );
		}

		if ( class_exists( 'WP_REST_Server' ) ) {
			$this->server = new WP_REST_Server();
			return $this->server;
		}

		return null;
	}

	/**
	 * Normalize method descriptor to array of uppercase HTTP methods.
	 *
	 * @param mixed $methods Raw method configuration.
	 * @return array<int, string> List of uppercase HTTP methods.
	 */
	public function normalize_methods( mixed $methods ): array {
		if ( is_string( $methods ) ) {
			$parts = explode( ',', $methods );
			return array_values(
				array_filter(
					array_map(
						static function ( $m ) {
							return strtoupper( trim( $m ) );
						},
						$parts
					)
				)
			);
		}

		if ( is_array( $methods ) ) {
			$list = array();
			foreach ( $methods as $key => $item ) {
				if ( is_string( $key ) && true === $item ) {
					$trimmed = strtoupper( trim( $key ) );
					if ( '' !== $trimmed ) {
						$list[] = $trimmed;
					}
				} elseif ( is_string( $item ) ) {
					foreach ( explode( ',', $item ) as $part ) {
						$trimmed = strtoupper( trim( $part ) );
						if ( '' !== $trimmed ) {
							$list[] = $trimmed;
						}
					}
				}
			}
			return array_values( array_unique( $list ) );
		}

		return array();
	}
}
