<?php
/**
 * OpenAPI Validation Exception.
 *
 * @package WPAIBP\Development\OpenApi\Exception
 */

namespace WPAIBP\Development\OpenApi\Exception;

use RuntimeException;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Thrown when route inspection, schema conversion, or OpenAPI metadata validation fails.
 */
class OpenApiValidationException extends RuntimeException {
}
