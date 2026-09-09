<?php
/**
 * WordPress Error Mapper.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Support
 */

namespace AIReady\WPPluginBoilerplate\Framework\Support;

use Throwable;
use WP_Error;
use InvalidArgumentException;
use RuntimeException;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Maps application exceptions to standard WP_Error responses with appropriate HTTP status codes.
 */
class WordPressErrorMapper {

	/**
	 * Convert an exception into a WP_Error instance.
	 *
	 * @param Throwable $exception Exception instance.
	 * @return WP_Error
	 */
	public static function to_wp_error( Throwable $exception ): WP_Error {
		$class_name = get_class( $exception );
		$last_slash = strrchr( $class_name, '\\' );
		$short_name = false !== $last_slash ? substr( $last_slash, 1 ) : $class_name;

		if ( 'InvalidSettingException' === $short_name || str_contains( $class_name, 'Invalid' ) ) {
			return new WP_Error(
				'airwp_invalid_setting',
				$exception->getMessage(),
				array( 'status' => 400 )
			);
		}

		if ( $exception instanceof InvalidArgumentException ) {
			return new WP_Error(
				'airwp_invalid_argument',
				$exception->getMessage(),
				array( 'status' => 400 )
			);
		}

		if ( $exception instanceof RuntimeException ) {
			return new WP_Error(
				'airwp_runtime_error',
				$exception->getMessage(),
				array( 'status' => 500 )
			);
		}

		$fallback_message = esc_html__( 'An unexpected error occurred.', 'ai-ready-wp-plugin-boilerplate' );
		$message          = ! empty( $exception->getMessage() ) ? $exception->getMessage() : $fallback_message;

		return new WP_Error(
			'airwp_internal_error',
			$message,
			array( 'status' => 500 )
		);
	}
}
