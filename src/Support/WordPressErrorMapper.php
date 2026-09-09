<?php
/**
 * WordPress Error Mapper.
 *
 * @package AIReady\WPPluginBoilerplate\Support
 */

namespace AIReady\WPPluginBoilerplate\Support;

use Throwable;
use WP_Error;
use InvalidArgumentException;
use RuntimeException;
use AIReady\WPPluginBoilerplate\Settings\Domain\Exception\InvalidSettingException;

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
		if ( $exception instanceof InvalidSettingException ) {
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

		return new WP_Error(
			'airwp_internal_server_error',
			$exception->getMessage(),
			array( 'status' => 500 )
		);
	}
}
