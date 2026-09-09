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
					'openapi'             => array(
						'operationId' => 'getPluginSettings',
						'summary'     => 'Get plugin settings',
						'description' => 'Returns current plugin settings merged with default schema values.',
						'tags'        => array( 'Settings' ),
						'responses'   => array(
							200 => array(
								'description' => 'Current plugin settings.',
							),
							403 => array(
								'description' => 'Insufficient permissions.',
							),
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
					'openapi'             => array(
						'operationId' => 'updatePluginSettings',
						'summary'     => 'Update plugin settings',
						'description' => 'Updates partial or full plugin settings payload.',
						'tags'        => array( 'Settings' ),
						'responses'   => array(
							200 => array(
								'description' => 'Updated plugin settings.',
							),
							400 => array(
								'description' => 'Invalid settings parameters.',
							),
							403 => array(
								'description' => 'Insufficient permissions.',
							),
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
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
					'title'       => 'general_settings',
					'description' => esc_html__( 'General plugin configuration settings.', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'object',
					'properties'  => array(
						'greeting_message' => array(
							'description' => esc_html__( 'Greeting message displayed across plugin interfaces.', 'ai-ready-wp-plugin-boilerplate' ),
							'type'        => 'string',
							'default'     => 'Hello from AI-Ready WP Plugin Boilerplate!',
							'minLength'   => 1,
							'maxLength'   => 255,
						),
						'enable_feature'   => array(
							'description' => esc_html__( 'Toggle enabling or disabling primary plugin functionality.', 'ai-ready-wp-plugin-boilerplate' ),
							'type'        => 'boolean',
							'default'     => true,
						),
						'description'      => array(
							'description' => esc_html__( 'Detailed description text for the plugin instance.', 'ai-ready-wp-plugin-boilerplate' ),
							'type'        => 'string',
							'default'     => 'A modern WordPress plugin powered by AI workflows.',
							'maxLength'   => 1000,
						),
					),
				),
				'advanced'       => array(
					'title'       => 'advanced_settings',
					'description' => esc_html__( 'Advanced developer and performance settings.', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'object',
					'properties'  => array(
						'rest_debug' => array(
							'description' => esc_html__( 'Enable verbose REST API debugging headers and telemetry.', 'ai-ready-wp-plugin-boilerplate' ),
							'type'        => 'boolean',
							'default'     => false,
						),
						'cache_ttl'  => array(
							'description' => esc_html__( 'Cache time-to-live duration in seconds.', 'ai-ready-wp-plugin-boilerplate' ),
							'type'        => 'integer',
							'default'     => 3600,
							'minimum'     => 0,
							'maximum'     => 86400,
						),
					),
				),
				'data_retention' => array(
					'title'       => 'data_retention_settings',
					'description' => esc_html__( 'Data retention and cleanup policies upon uninstallation.', 'ai-ready-wp-plugin-boilerplate' ),
					'type'        => 'object',
					'properties'  => array(
						'uninstall_action' => array(
							'description' => esc_html__( 'Strategy for handling stored plugin data when uninstalling.', 'ai-ready-wp-plugin-boilerplate' ),
							'type'        => 'string',
							'enum'        => array( 'preserve', 'delete_settings', 'delete_all' ),
							'default'     => 'preserve',
						),
					),
				),
			),
		);
	}
}
