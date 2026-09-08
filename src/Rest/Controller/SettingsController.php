<?php
/**
 * Settings REST Controller.
 *
 * @package AIReady\WPPluginBoilerplate\Rest\Controller
 */

namespace AIReady\WPPluginBoilerplate\Rest\Controller;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use AIReady\WPPluginBoilerplate\Settings\Infrastructure\SettingsRepository;
use AIReady\WPPluginBoilerplate\Settings\Infrastructure\SettingsSchema;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Controller exposing plugin settings endpoints.
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
	 * Settings repository instance.
	 *
	 * @var SettingsRepository
	 */
	private SettingsRepository $repository;

	/**
	 * Constructor.
	 *
	 * @param SettingsRepository $repository Settings repository.
	 */
	public function __construct( SettingsRepository $repository ) {
		$this->repository = $repository;
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
		$settings = $this->repository->get_all();
		return new WP_REST_Response( $settings, 200 );
	}

	/**
	 * Update plugin settings.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		$body = $request->get_json_params();

		if ( ! is_array( $body ) ) {
			return new WP_Error(
				'rest_invalid_json',
				__( 'Invalid JSON body provided.', 'ai-ready-wp-plugin-boilerplate' ),
				array( 'status' => 400 )
			);
		}

		$current = $this->repository->get_all();
		$merged  = array_replace_recursive( $current, $body );

		$this->repository->update( $merged );
		$updated = $this->repository->get_all();

		return new WP_REST_Response( $updated, 200 );
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
