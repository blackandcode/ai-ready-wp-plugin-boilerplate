<?php
/**
 * OpenAPI Validation Exception.
 *
 * @package AIReady\WPPluginBoilerplate\Development\OpenApi\Exception
 */

namespace AIReady\WPPluginBoilerplate\Development\OpenApi\Exception;

use RuntimeException;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Thrown when route inspection, schema conversion, or OpenAPI metadata validation fails.
 */
class OpenApiValidationException extends RuntimeException {
}
