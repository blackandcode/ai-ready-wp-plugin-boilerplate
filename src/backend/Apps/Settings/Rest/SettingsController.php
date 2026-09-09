<?php
/**
 * Settings REST Controller.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Rest
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Rest;

use Throwable;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\Command\UpdateSettingsCommand;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\SettingsApplicationService;
use AIReady\WPPluginBoilerplate\Framework\Support\WordPressErrorMapper;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Controller exposing plugin settings endpoints via SettingsApplicationService.
 */
class SettingsController extends WP_REST_Controller {

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
	protected $rest_base = 'settings';

	/**
	 * Settings application service instance.
	 *
	 * @var SettingsApplicationService
	 */
	private SettingsApplicationService $service;

	/**
	 * Constructor.
	 *
	 * @param SettingsApplicationService $service Settings application service.
	 */
	public function __construct( SettingsApplicationService $service ) {
		$this->service = $service;
	}

	/**
	 * Register routes for settings endpoints.
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
					'schema'              => array( $this, 'get_item_schema' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'schema'              => array( $this, 'get_item_schema' ),
				),
			)
		);
	}

	/**
	 * Check permissions for settings management.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error True if permitted, WP_Error otherwise.
	 */
	public function permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have sufficient permissions to access plugin settings.', 'ai-ready-wp-plugin-boilerplate' ),
				array( 'status' => 403 )
			);
		}
		return true;
	}

	/**
	 * Retrieve plugin settings.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response
	 */
	public function get_item( $request ): WP_REST_Response { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$dto = $this->service->get_settings();
		return new WP_REST_Response( $dto->to_array(), 200 );
	}

	/**
	 * Update plugin settings.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		$body = $request->get_json_params();

		try {
			$command = UpdateSettingsCommand::from_array( $body );
			$updated = $this->service->update_settings( $command );
			return new WP_REST_Response( $updated->to_array(), 200 );
		} catch ( Throwable $e ) {
			return WordPressErrorMapper::to_wp_error( $e );
		}
	}

	/**
	 * Get schema for settings.
	 *
	 * @return array<string, mixed>
	 */
	public function get_item_schema(): array {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'plugin_settings',
			'type'       => 'object',
			'properties' => array(
				'general'        => array(
					'type'       => 'object',
					'properties' => array(
						'greeting_message' => array( 'type' => 'string' ),
						'enable_feature'   => array( 'type' => 'boolean' ),
						'description'      => array( 'type' => 'string' ),
					),
				),
				'advanced'       => array(
					'type'       => 'object',
					'properties' => array(
						'rest_debug' => array( 'type' => 'boolean' ),
						'cache_ttl'  => array( 'type' => 'integer' ),
					),
				),
				'data_retention' => array(
					'type'       => 'object',
					'properties' => array(
						'uninstall_action' => array(
							'type' => 'string',
							'enum' => array( 'preserve', 'delete_settings', 'delete_all' ),
						),
					),
				),
			),
		);
	}
}
