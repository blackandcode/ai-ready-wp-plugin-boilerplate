<?php
/**
 * Plugin activation handler.
 *
 * @package AIReady\WPPluginBoilerplate\Bootstrap
 */

namespace AIReady\WPPluginBoilerplate\Bootstrap;

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
				esc_html__( 'AI-Ready WP Plugin Boilerplate cannot be activated because environment requirements are not met.', 'ai-ready-wp-plugin-boilerplate' ),
				esc_html__( 'Plugin Activation Error', 'ai-ready-wp-plugin-boilerplate' ),
				array( 'back_link' => true )
			);
		}

		// Ensure default settings exist.
		if ( false === get_option( 'airwp_settings' ) ) {
			update_option(
				'airwp_settings',
				array(
					'general'        => array(
						'greeting_message' => 'Hello from AI-Ready WP Plugin Boilerplate!',
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
