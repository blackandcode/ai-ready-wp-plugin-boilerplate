<?php
/**
 * Hello World REST Controller.
 *
 * @package AIReady\WPPluginBoilerplate\Rest\Controller
 */

namespace AIReady\WPPluginBoilerplate\Rest\Controller;

use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use AIReady\WPPluginBoilerplate\Bootstrap\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Controller exposing Hello World public endpoints.
 */
class HelloWorldController extends WP_REST_Controller {

	/**
	 * REST route namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'ai-ready-wp/v1';

	/**
	 * REST resource name.
	 *
	 * @var string
	 */
	protected $rest_base = 'hello';

	/**
	 * Register routes for Hello World endpoint.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'schema'              => array( $this, 'get_item_schema' ),
				),
			)
		);
	}

	/**
	 * Check permissions for reading Hello World endpoint.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool True if permitted.
	 */
	public function get_item_permissions_check( $request ): bool { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return true;
	}

	/**
	 * Handle GET request for Hello World.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response
	 */
	public function get_item( $request ): WP_REST_Response { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$data = array(
			'message'   => __( 'Hello from AI-Ready WP Plugin Boilerplate!', 'ai-ready-wp-plugin-boilerplate' ),
			'timestamp' => gmdate( 'c' ),
			'version'   => Plugin::VERSION,
			'status'    => 'ok',
		);

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Get item schema for OpenAPI / rest-discovery.
	 *
	 * @return array<string, mixed>
	 */
	public function get_item_schema(): array {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'hello_world',
			'type'       => 'object',
			'properties' => array(
				'message'   => array(
					'description' => esc_html__( 'Greeting message', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'string',
				),
				'timestamp' => array(
					'description' => esc_html__( 'ISO 8601 UTC timestamp', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'string',
					'format'      => 'date-time',
				),
				'version'   => array(
					'description' => esc_html__( 'Plugin semantic version', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'string',
				),
				'status'    => array(
					'description' => esc_html__( 'Health check status', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'string',
				),
			),
		);
	}
}
