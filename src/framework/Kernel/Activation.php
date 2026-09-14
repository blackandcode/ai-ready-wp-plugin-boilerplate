<?php
/**
 * Plugin activation handler.
 *
 * @package WPAIBP\Framework\Kernel
 */

namespace WPAIBP\Framework\Kernel;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles plugin activation routines.
 */
class Activation {

	/**
	 * Run activation logic.
	 */
	public static function activate(): void {
		if ( ! Compatibility::check() ) {
			wp_die(
				esc_html__( 'WP AI Ready Plugin Boilerplate cannot be activated because environment requirements are not met.', 'wp-ai-ready-plugin-boilerplate' ),
				esc_html__( 'Plugin Activation Error', 'wp-ai-ready-plugin-boilerplate' ),
				array( 'back_link' => true )
			);
		}

		// Ensure default settings exist.
		if ( false === get_option( 'wpaibp_settings' ) ) {
			update_option(
				'wpaibp_settings',
				array(
					'general'        => array(
						'greeting_message' => 'Hello from WP AI Ready Plugin Boilerplate!',
						'enable_feature'   => true,
						'description'      => 'A modern WordPress plugin powered by AI workflows.',
					),
					'advanced'       => array(
						'rest_debug' => false,
						'cache_ttl'  => 3600,
					),
					'data_retention' => array(
						'uninstall_action' => 'preserve',
					),
				)
			);
		}

		flush_rewrite_rules();
	}
}
