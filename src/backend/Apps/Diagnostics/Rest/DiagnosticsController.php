<?php
/**
 * REST Diagnostics Controller.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Rest
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Rest;

use AIReady\WPPluginBoilerplate\Backend\Apps\Diagnostics\Application\DiagnosticsService;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Controller exposing system telemetry and diagnostics over REST API.
 */
class DiagnosticsController extends WP_REST_Controller {

	/**
	 * Namespace for REST routes.
	 *
	 * @var string
	 */
	protected $namespace = 'ai-ready-wp/v1';

	/**
	 * Rest base route name.
	 *
	 * @var string
	 */
	protected $rest_base = 'diagnostics';

	/**
	 * Diagnostics application service.
	 *
	 * @var DiagnosticsService
	 */
	private DiagnosticsService $diagnostics_service;

	/**
	 * Constructor.
	 *
	 * @param DiagnosticsService $diagnostics_service Diagnostics application service.
	 */
	public function __construct( DiagnosticsService $diagnostics_service ) {
		$this->diagnostics_service = $diagnostics_service;
	}

	/**
	 * Register the diagnostics routes.
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
	 * Check permissions for reading diagnostic metrics.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if permitted, WP_Error otherwise.
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have sufficient permissions to access diagnostic telemetry.', 'ai-ready-wp-plugin-boilerplate' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Handle GET request for diagnostic metrics.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response
	 */
	public function get_item( $request ): WP_REST_Response { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$dto = $this->diagnostics_service->get_diagnostics();
		return new WP_REST_Response( $dto->to_array(), 200 );
	}

	/**
	 * Get item schema for OpenAPI / rest-discovery.
	 *
	 * @return array<string, mixed>
	 */
	public function get_item_schema(): array {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'system_diagnostics',
			'type'       => 'object',
			'properties' => array(
				'php_version'      => array(
					'description' => esc_html__( 'PHP runtime version', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'string',
				),
				'wp_version'       => array(
					'description' => esc_html__( 'WordPress core version', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'string',
				),
				'environment_type' => array(
					'description' => esc_html__( 'WordPress environment type', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'string',
				),
				'db_status'        => array(
					'description' => esc_html__( 'Database connectivity status', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'string',
				),
				'rest_status'      => array(
					'description' => esc_html__( 'REST API availability status', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'string',
				),
				'plugin_version'   => array(
					'description' => esc_html__( 'Plugin release version', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'string',
				),
			),
		);
	}
}
