<?php
/**
 * OpenAPI Path Normalizer.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi;

use AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi\Exception\OpenApiValidationException;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Normalizes WordPress route regex patterns into OpenAPI 3.1 path templates.
 */
class OpenApiPathNormalizer {

	/**
	 * Normalize a WordPress route into an OpenAPI path template and extracted path parameters.
	 *
	 * @param string $route           WordPress route pattern (e.g. /ai-ready-wp/v1/items/(?P<id>\d+)).
	 * @param string $route_namespace Route namespace prefix to strip (e.g. ai-ready-wp/v1).
	 * @return array{path: string, parameters: array<int, array<string, mixed>>} Normalized path and path parameter descriptors.
	 * @throws OpenApiValidationException If route contains unsupported or unsafe regex constructs.
	 */
	public function normalize( string $route, string $route_namespace = '' ): array {
		$path = '/' . ltrim( $route, '/' );

		if ( '' !== $route_namespace ) {
			$prefix = '/' . trim( $route_namespace, '/' );
			if ( str_starts_with( $path, $prefix ) ) {
				$path = substr( $path, strlen( $prefix ) );
			}
		}

		$path = '/' . ltrim( $path, '/' );

		$parameters = array();

		// Replace named capture groups: (?P<name>pattern) or (?<name>pattern).
		$pattern = '/\(\?P?<([a-zA-Z0-9_]+)>([^)]+)\)/';
		$matched = preg_match_all( $pattern, $path, $matches, PREG_SET_ORDER );

		if ( false !== $matched && $matched > 0 ) {
			foreach ( $matches as $match ) {
				$full_pattern = $match[0];
				$param_name   = $match[1];
				$param_regex  = $match[2];

				$is_integer = (bool) preg_match( '/^(\\\\d|\[\\\\d\]|\[0-9\])\+?$/', $param_regex );

				$parameters[] = array(
					'name'        => $param_name,
					'in'          => 'path',
					'required'    => true,
					'description' => sprintf( 'URL path parameter: %s', $param_name ),
					'schema'      => array(
						'type' => $is_integer ? 'integer' : 'string',
					),
				);

				$path = str_replace( $full_pattern, '{' . $param_name . '}', $path );
			}
		}

		// Check for any remaining unsafe unhandled regex syntax.
		if ( preg_match( '/[()\[\]^$*+?]/', $path ) ) {
			throw new OpenApiValidationException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Cannot safely convert WordPress route pattern "%s" to OpenAPI path template. Remaining construct in "%s".', $route, $path )
			);
		}

		return array(
			'path'       => $path,
			'parameters' => $parameters,
		);
	}
}
