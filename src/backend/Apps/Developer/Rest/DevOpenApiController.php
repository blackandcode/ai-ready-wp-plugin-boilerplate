<?php
/**
 * Development-Only OpenAPI REST Controller.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Developer\Rest
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Developer\Rest;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi\OpenApiGenerator;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Exposes live generated OpenAPI 3.1 contract data to developer tools and Settings viewer.
 *
 * Registered exclusively when wp_is_development_mode('plugin') is true.
 */
class DevOpenApiController extends WP_REST_Controller {

	/**
	 * Dedicated development REST namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'ai-ready-wp-dev/v1';

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'openapi';

	/**
	 * OpenAPI generator instance.
	 *
	 * @var OpenApiGenerator
	 */
	private OpenApiGenerator $generator;

	/**
	 * Constructor.
	 *
	 * @param OpenApiGenerator|null $generator Optional generator.
	 */
	public function __construct( ?OpenApiGenerator $generator = null ) {
		$this->generator = $generator ?? new OpenApiGenerator();
	}

	/**
	 * Register the development OpenAPI route.
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
					'permission_callback' => array( $this, 'permissions_check' ),
					'openapi'             => array(
						'internal' => true,
						'exclude'  => true,
					),
				),
			)
		);
	}

	/**
	 * Check permissions for developer OpenAPI discovery.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error True if permitted, WP_Error otherwise.
	 */
	public function permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have sufficient permissions to access the development OpenAPI specification.', 'ai-ready-wp-plugin-boilerplate' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Return the live generated OpenAPI 3.1 document as JSON response.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response
	 */
	public function get_item( $request ): WP_REST_Response { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$document = $this->generator->generate( OpenApiGenerator::DEFAULT_NAMESPACE );
		return new WP_REST_Response( $document, 200 );
	}
}
