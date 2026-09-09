<?php
/**
 * Settings Schema and Validation.
 *
 * @package AIReady\WPPluginBoilerplate\Settings\Infrastructure
 */

namespace AIReady\WPPluginBoilerplate\Settings\Infrastructure;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Provides settings definitions, default values, and sanitization.
 */
class SettingsSchema {

	/**
	 * Option key stored in wp_options.
	 */
	public const OPTION_KEY = 'airwp_settings';

	/**
	 * Default settings structure.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_defaults(): array {
		return array(
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
		);
	}

	/**
	 * Sanitize and validate settings data before saving.
	 *
	 * @param array<string, mixed> $input Raw input data.
	 * @return array<string, mixed> Sanitized settings data.
	 */
	public static function sanitize( array $input ): array {
		$defaults = self::get_defaults();
		$output   = $defaults;

		if ( isset( $input['general'] ) && is_array( $input['general'] ) ) {
			if ( isset( $input['general']['greeting_message'] ) ) {
				$output['general']['greeting_message'] = sanitize_text_field( (string) $input['general']['greeting_message'] );
			}
			if ( isset( $input['general']['enable_feature'] ) ) {
				$output['general']['enable_feature'] = (bool) $input['general']['enable_feature'];
			}
			if ( isset( $input['general']['description'] ) ) {
				$output['general']['description'] = sanitize_textarea_field( (string) $input['general']['description'] );
			}
		}

		if ( isset( $input['advanced'] ) && is_array( $input['advanced'] ) ) {
			if ( isset( $input['advanced']['rest_debug'] ) ) {
				$output['advanced']['rest_debug'] = (bool) $input['advanced']['rest_debug'];
			}
			if ( isset( $input['advanced']['cache_ttl'] ) ) {
				$ttl                             = (int) $input['advanced']['cache_ttl'];
				$output['advanced']['cache_ttl'] = max( 0, min( 86400, $ttl ) );
			}
		}

		if ( isset( $input['data_retention'] ) && is_array( $input['data_retention'] ) ) {
			if ( isset( $input['data_retention']['uninstall_action'] ) ) {
				$allowed_actions = array( 'preserve', 'delete_settings', 'delete_all' );
				$action          = (string) $input['data_retention']['uninstall_action'];
				if ( in_array( $action, $allowed_actions, true ) ) {
					$output['data_retention']['uninstall_action'] = $action;
				}
			}
		}

		return $output;
	}
}
