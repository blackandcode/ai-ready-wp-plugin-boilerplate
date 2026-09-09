<?php
/**
 * REST Diagnostics Controller.
 *
 * @package AIReady\WPPluginBoilerplate\Rest\Controller
 */

namespace AIReady\WPPluginBoilerplate\Rest\Controller;

use AIReady\WPPluginBoilerplate\Diagnostics\Application\DiagnosticsService;
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
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Check if current user has permission to read diagnostics.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have sufficient permissions to access diagnostics.', 'ai-ready-wp-plugin-boilerplate' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Retrieve current diagnostics payload.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response
	 */
	public function get_item( $request ): WP_REST_Response { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$dto = $this->diagnostics_service->get_diagnostics();

		return rest_ensure_response( $dto->to_array() );
	}

	/**
	 * Retrieve schema for diagnostics payload.
	 *
	 * @return array<string, mixed>
	 */
	public function get_public_item_schema(): array {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'diagnostics',
			'type'       => 'object',
			'properties' => array(
				'php_version'      => array( 'type' => 'string' ),
				'wp_version'       => array( 'type' => 'string' ),
				'environment_type' => array( 'type' => 'string' ),
				'db_status'        => array( 'type' => 'string' ),
				'rest_status'      => array( 'type' => 'string' ),
				'plugin_version'   => array( 'type' => 'string' ),
			),
		);
	}
}
