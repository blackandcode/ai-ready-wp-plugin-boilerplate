<?php
/**
 * Settings Abilities Registration.
 *
 * @package AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Abilities
 */

namespace AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Abilities;

use Throwable;
use WP_Error;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\Command\UpdateSettingsCommand;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Application\SettingsApplicationService;
use AIReady\WPPluginBoilerplate\Framework\Kernel\Plugin;
use AIReady\WPPluginBoilerplate\Framework\Support\WordPressErrorMapper;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers domain abilities for Settings App in WordPress Abilities API.
 */
class SettingsAbilities {

	/**
	 * Ability category identifier.
	 */
	public const CATEGORY = 'ai-ready-wp';

	/**
	 * Register category and abilities.
	 *
	 * @return void
	 */
	public static function register(): void {
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
				'permission_callback' => array( self::class, 'check_manage_options' ),
				'execute_callback'    => array( self::class, 'execute_get_settings' ),
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
				'permission_callback' => array( self::class, 'check_manage_options' ),
				'execute_callback'    => array( self::class, 'execute_update_settings' ),
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
	}

	/**
	 * Check capability for abilities.
	 *
	 * @return bool
	 */
	public static function check_manage_options(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Execute callback for get-settings ability.
	 *
	 * @return array<string, mixed>
	 */
	public static function execute_get_settings(): array {
		$service = self::get_settings_service();
		return $service->get_settings()->to_array();
	}

	/**
	 * Execute callback for update-settings ability.
	 *
	 * @param array<string, mixed> $input Input parameters.
	 * @return array<string, mixed>|WP_Error
	 */
	public static function execute_update_settings( array $input = array() ): array|WP_Error {
		$service = self::get_settings_service();

		try {
			$command = UpdateSettingsCommand::from_array( $input );
			$updated = $service->update_settings( $command );
			return $updated->to_array();
		} catch ( Throwable $e ) {
			return WordPressErrorMapper::to_wp_error( $e );
		}
	}

	/**
	 * Resolve SettingsApplicationService.
	 *
	 * @return SettingsApplicationService
	 */
	private static function get_settings_service(): SettingsApplicationService {
		$container = Plugin::instance()->get_container();
		if ( null !== $container && $container->has( SettingsApplicationService::class ) ) {
			return $container->get( SettingsApplicationService::class );
		}

		$repo       = new \AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Infrastructure\WordPressSettingsRepository();
		$dispatcher = new \AIReady\WPPluginBoilerplate\Framework\Event\EventDispatcher();
		return new SettingsApplicationService( $repo, $dispatcher );
	}
}
