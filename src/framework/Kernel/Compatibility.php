<?php
/**
 * Compatibility checker class.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Kernel
 */

namespace AIReady\WPPluginBoilerplate\Framework\Kernel;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Checks system requirements for minimum WordPress and PHP versions.
 */
class Compatibility {

	/**
	 * Minimum supported WordPress version.
	 */
	public const MIN_WP_VERSION = '7.1';

	/**
	 * Minimum supported PHP version.
	 */
	public const MIN_PHP_VERSION = '8.3';

	/**
	 * Checks if the system meets all requirements.
	 *
	 * @return bool True if requirements are met, false otherwise.
	 */
	public static function check(): bool {
		if ( ! self::is_php_compatible() ) {
			if ( function_exists( 'add_action' ) ) {
				add_action( 'admin_notices', array( __CLASS__, 'render_php_notice' ) );
			}
			return false;
		}

		if ( ! self::is_wp_compatible() ) {
			if ( function_exists( 'add_action' ) ) {
				add_action( 'admin_notices', array( __CLASS__, 'render_wp_notice' ) );
			}
			return false;
		}

		return true;
	}

	/**
	 * Check PHP version compatibility.
	 *
	 * @return bool
	 */
	public static function is_php_compatible(): bool {
		return version_compare( PHP_VERSION, self::MIN_PHP_VERSION, '>=' );
	}

	/**
	 * Check WordPress version compatibility.
	 *
	 * @return bool
	 */
	public static function is_wp_compatible(): bool {
		global $wp_version;
		if ( ! isset( $wp_version ) ) {
			return true;
		}
		return version_compare( $wp_version, self::MIN_WP_VERSION, '>=' );
	}

	/**
	 * Render PHP incompatibility notice.
	 */
	public static function render_php_notice(): void {
		printf(
			'<div class="notice notice-error"><p>%s</p></div>',
			esc_html(
				sprintf(
					/* translators: 1: Minimum PHP version, 2: Current PHP version */
					__( 'AI-Ready WP Plugin Boilerplate requires PHP version %1$s or higher. You are running version %2$s.', 'ai-ready-wp-plugin-boilerplate' ),
					self::MIN_PHP_VERSION,
					PHP_VERSION
				)
			)
		);
	}

	/**
	 * Render WordPress incompatibility notice.
	 */
	public static function render_wp_notice(): void {
		global $wp_version;
		printf(
			'<div class="notice notice-error"><p>%s</p></div>',
			esc_html(
				sprintf(
					/* translators: 1: Minimum WordPress version, 2: Current WordPress version */
					__( 'AI-Ready WP Plugin Boilerplate requires WordPress version %1$s or higher. You are running version %2$s.', 'ai-ready-wp-plugin-boilerplate' ),
					self::MIN_WP_VERSION,
					$wp_version ?? 'unknown'
				)
			)
		);
	}
}
