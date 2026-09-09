<?php
/**
 * OpenAPI Validation Exception.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi\Exception
 */

namespace AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi\Exception;

use RuntimeException;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Thrown when route inspection, schema conversion, or OpenAPI metadata validation fails.
 */
class OpenApiValidationException extends RuntimeException {
}
