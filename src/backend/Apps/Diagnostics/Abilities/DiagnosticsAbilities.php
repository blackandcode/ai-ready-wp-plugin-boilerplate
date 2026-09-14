<?php
/**
 * Diagnostics Abilities Registration.
 *
 * @package WPAIBP\Backend\Apps\Diagnostics\Abilities
 */

namespace WPAIBP\Backend\Apps\Diagnostics\Abilities;

use WPAIBP\Backend\Apps\Diagnostics\Application\DiagnosticsService;
use WPAIBP\Backend\Apps\Diagnostics\Infrastructure\WordPressDiagnosticsProvider;
use WPAIBP\Framework\Kernel\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers domain abilities for Diagnostics App in WordPress Abilities API.
 */
class DiagnosticsAbilities {

	/**
	 * Ability category identifier.
	 */
	public const CATEGORY = 'wpaibp';

	/**
	 * Register category and abilities.
	 *
	 * @return void
	 */
	public static function register(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		wp_register_ability(
			'wpaibp/get-diagnostics',
			array(
				'label'               => __( 'Get Diagnostics Telemetry', 'wp-ai-ready-plugin-boilerplate' ),
				'description'         => __( 'Retrieve server and runtime diagnostics telemetry.', 'wp-ai-ready-plugin-boilerplate' ),
				'category'            => self::CATEGORY,
				'permission_callback' => array( self::class, 'check_manage_options' ),
				'execute_callback'    => array( self::class, 'execute_get_diagnostics' ),
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
	 * Check capability for abilities.
	 *
	 * @return bool
	 */
	public static function check_manage_options(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Execute callback for get-diagnostics ability.
	 *
	 * @return array<string, string>
	 */
	public static function execute_get_diagnostics(): array {
		$service = self::get_diagnostics_service();
		return $service->get_diagnostics()->to_array();
	}

	/**
	 * Resolve DiagnosticsService.
	 *
	 * @return DiagnosticsService
	 */
	private static function get_diagnostics_service(): DiagnosticsService {
		$container = Plugin::instance()->get_container();
		if ( null !== $container && $container->has( DiagnosticsService::class ) ) {
			return $container->get( DiagnosticsService::class );
		}
		$provider = new WordPressDiagnosticsProvider();
		return new DiagnosticsService( $provider );
	}
}
