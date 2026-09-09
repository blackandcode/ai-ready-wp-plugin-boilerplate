<?php
/**
 * WordPress Abilities API Service Provider.
 *
 * @package AIReady\WPPluginBoilerplate\Abilities
 */

namespace AIReady\WPPluginBoilerplate\Abilities;

use Throwable;
use WP_Error;
use AIReady\WPPluginBoilerplate\Bootstrap\Container;
use AIReady\WPPluginBoilerplate\Bootstrap\Plugin;
use AIReady\WPPluginBoilerplate\Bootstrap\ServiceProvider;
use AIReady\WPPluginBoilerplate\Diagnostics\Application\DiagnosticsService;
use AIReady\WPPluginBoilerplate\Settings\Application\Command\UpdateSettingsCommand;
use AIReady\WPPluginBoilerplate\Settings\Application\SettingsApplicationService;
use AIReady\WPPluginBoilerplate\Support\WordPressErrorMapper;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Service provider registering plugin abilities for autonomous AI agents via the WordPress Abilities API.
 */
class AbilitiesServiceProvider implements ServiceProvider {

	/**
	 * Ability category identifier.
	 */
	public const CATEGORY = 'ai-ready-wp';

	/**
	 * Register services in container.
	 *
	 * @param Container $container Container instance.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Abilities use services registered in container.
	}

	/**
	 * Boot abilities API hooks.
	 *
	 * @return void
	 */
	public function boot(): void {
		// Hook into core Abilities API initialization actions.
		add_action( 'wp_abilities_api_categories_init', array( $this, 'register_categories' ) );
		add_action( 'wp_abilities_api_init', array( $this, 'register_abilities' ) );
	}

	/**
	 * Register categories if Abilities API is available.
	 *
	 * @return void
	 */
	public function register_categories(): void {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		wp_register_ability_category(
			self::CATEGORY,
			array(
				'label'       => __( 'AI-Ready WP Plugin', 'ai-ready-wp-plugin-boilerplate' ),
				'description' => __( 'Domain capabilities for inspecting and modifying plugin settings and telemetry.', 'ai-ready-wp-plugin-boilerplate' ),
			)
		);
	}

	/**
	 * Register plugin abilities.
	 *
	 * @return void
	 */
	public function register_abilities(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		// 1. Get Settings Ability
		wp_register_ability(
			'ai-ready-wp/get-settings',
			array(
				'label'               => __( 'Get Plugin Settings', 'ai-ready-wp-plugin-boilerplate' ),
				'description'         => __( 'Retrieve all current settings sections for the AI-Ready WP plugin.', 'ai-ready-wp-plugin-boilerplate' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'check_manage_options' ),
				'execute_callback'    => array( $this, 'execute_get_settings' ),
				'input_schema'        => array(),
				'output_schema'       => array(
					'type' => 'object',
				),
				'meta'                => array(
					'show_in_rest' => true,
					'annotations'  => array(
						'readonly'   => true,
						'idempotent' => true,
					),
				),
			)
		);

		// 2. Update Settings Ability
		wp_register_ability(
			'ai-ready-wp/update-settings',
			array(
				'label'               => __( 'Update Plugin Settings', 'ai-ready-wp-plugin-boilerplate' ),
				'description'         => __( 'Update one or more settings fields for the AI-Ready WP plugin.', 'ai-ready-wp-plugin-boilerplate' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'check_manage_options' ),
				'execute_callback'    => array( $this, 'execute_update_settings' ),
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'greeting_message' => array( 'type' => 'string' ),
						'enable_feature'   => array( 'type' => 'boolean' ),
						'description'      => array( 'type' => 'string' ),
						'rest_debug'       => array( 'type' => 'boolean' ),
						'cache_ttl'        => array( 'type' => 'integer' ),
						'uninstall_action' => array( 'type' => 'string' ),
					),
				),
				'output_schema'       => array(
					'type' => 'object',
				),
				'meta'                => array(
					'show_in_rest' => true,
					'annotations'  => array(
						'readonly'   => false,
						'idempotent' => true,
					),
				),
			)
		);

		// 3. Diagnostics Ability
		wp_register_ability(
			'ai-ready-wp/get-diagnostics',
			array(
				'label'               => __( 'Get Diagnostics Telemetry', 'ai-ready-wp-plugin-boilerplate' ),
				'description'         => __( 'Retrieve server and runtime diagnostics telemetry.', 'ai-ready-wp-plugin-boilerplate' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( $this, 'check_manage_options' ),
				'execute_callback'    => array( $this, 'execute_get_diagnostics' ),
				'input_schema'        => array(),
				'output_schema'       => array(
					'type' => 'object',
				),
				'meta'                => array(
					'show_in_rest' => true,
					'annotations'  => array(
						'readonly'   => true,
						'idempotent' => true,
					),
				),
			)
		);
	}

	/**
	 * Permission check.
	 *
	 * @return bool
	 */
	public function check_manage_options(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Execute callback for get-settings ability.
	 *
	 * @return array<string, mixed>
	 */
	public function execute_get_settings(): array {
		$service = $this->get_settings_service();
		return $service->get_settings()->to_array();
	}

	/**
	 * Execute callback for update-settings ability.
	 *
	 * @param array<string, mixed> $input Input parameters.
	 * @return array<string, mixed>|WP_Error
	 */
	public function execute_update_settings( array $input = array() ) {
		$service = $this->get_settings_service();

		try {
			$command = UpdateSettingsCommand::from_array( $input );
			$updated = $service->update_settings( $command );
			return $updated->to_array();
		} catch ( Throwable $e ) {
			return WordPressErrorMapper::to_wp_error( $e );
		}
	}

	/**
	 * Execute callback for get-diagnostics ability.
	 *
	 * @return array<string, string>
	 */
	public function execute_get_diagnostics(): array {
		$service = $this->get_diagnostics_service();
		return $service->get_diagnostics()->to_array();
	}

	/**
	 * Resolve SettingsApplicationService.
	 *
	 * @return SettingsApplicationService
	 */
	private function get_settings_service(): SettingsApplicationService {
		$container = Plugin::instance()->get_container();
		if ( null !== $container && $container->has( SettingsApplicationService::class ) ) {
			return $container->get( SettingsApplicationService::class );
		}
		$repo       = new \AIReady\WPPluginBoilerplate\Settings\Infrastructure\WordPressSettingsRepository();
		$dispatcher = new \AIReady\WPPluginBoilerplate\Event\EventDispatcher();
		return new SettingsApplicationService( $repo, $dispatcher );
	}

	/**
	 * Resolve DiagnosticsService.
	 *
	 * @return DiagnosticsService
	 */
	private function get_diagnostics_service(): DiagnosticsService {
		$container = Plugin::instance()->get_container();
		if ( null !== $container && $container->has( DiagnosticsService::class ) ) {
			return $container->get( DiagnosticsService::class );
		}
		$provider = new \AIReady\WPPluginBoilerplate\Diagnostics\Infrastructure\WordPressDiagnosticsProvider();
		return new DiagnosticsService( $provider );
	}
}
