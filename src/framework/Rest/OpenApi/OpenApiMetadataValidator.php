<?php
/**
 * OpenAPI Metadata Validator.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi;

use AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi\Exception\OpenApiValidationException;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Validates endpoint OpenAPI metadata blocks for completeness, format, and global uniqueness.
 */
class OpenApiMetadataValidator {

	/**
	 * Validate an endpoint handler's OpenAPI metadata block.
	 *
	 * @param array<string, mixed>  $metadata           OpenAPI metadata block.
	 * @param string                $route              Route path for diagnostics.
	 * @param string                $method             HTTP method for diagnostics.
	 * @param array<string, string> $seen_operation_ids Reference map tracking globally registered operation IDs.
	 * @return void
	 * @throws OpenApiValidationException If any metadata invariant is violated.
	 */
	public function validate_operation(
		array $metadata,
		string $route,
		string $method,
		array &$seen_operation_ids
	): void {
		// Validate operationId.
		if ( empty( $metadata['operationId'] ) || ! is_string( $metadata['operationId'] ) ) {
			throw new OpenApiValidationException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Missing or invalid "operationId" for route "%s" [%s]. Every operation requires an operationId.', $route, $method )
			);
		}

		$operation_id = trim( $metadata['operationId'] );
		if ( ! preg_match( '/^[a-z][a-zA-Z0-9]*$/', $operation_id ) ) {
			throw new OpenApiValidationException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Invalid operationId "%s" for route "%s" [%s]. Operation IDs must be lowerCamelCase.', $operation_id, $route, $method )
			);
		}

		if ( isset( $seen_operation_ids[ $operation_id ] ) ) {
			// phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
			throw new OpenApiValidationException(
				sprintf(
					'Duplicate operationId "%s" found for route "%s" [%s]. It was already registered by "%s".',
					$operation_id,
					$route,
					$method,
					$seen_operation_ids[ $operation_id ]
				)
			);
			// phpcs:enable WordPress.Security.EscapeOutput.ExceptionNotEscaped
		}

		$seen_operation_ids[ $operation_id ] = sprintf( '%s %s', $method, $route );

		// Validate summary.
		if ( empty( $metadata['summary'] ) || ! is_string( $metadata['summary'] ) ) {
			throw new OpenApiValidationException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Missing or invalid "summary" for route "%s" [%s]. Every operation requires a summary.', $route, $method )
			);
		}

		// Validate tags.
		if ( empty( $metadata['tags'] ) || ! is_array( $metadata['tags'] ) || empty( $metadata['tags'][0] ) ) {
			throw new OpenApiValidationException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Missing or invalid "tags" for route "%s" [%s]. Every operation requires at least one domain tag.', $route, $method )
			);
		}

		// Validate responses.
		if ( empty( $metadata['responses'] ) || ! is_array( $metadata['responses'] ) ) {
			throw new OpenApiValidationException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Missing or empty "responses" for route "%s" [%s]. Every operation must document expected responses.', $route, $method )
			);
		}

		foreach ( $metadata['responses'] as $status => $response_def ) {
			if ( ! is_array( $response_def ) || empty( $response_def['description'] ) || ! is_string( $response_def['description'] ) ) {
				throw new OpenApiValidationException(
					// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
					sprintf( 'Response status "%s" for route "%s" [%s] is missing a required "description".', (string) $status, $route, $method )
				);
			}
		}
	}
}
