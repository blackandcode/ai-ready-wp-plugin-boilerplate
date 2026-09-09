<?php
/**
 * WordPress Schema to OpenAPI 3.1 Converter.
 *
 * @package AIReady\WPPluginBoilerplate\Development\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Development\OpenApi;

use AIReady\WPPluginBoilerplate\Development\OpenApi\Exception\OpenApiValidationException;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Converts WordPress JSON Schemas into OpenAPI 3.1 compliant schemas and extracts reusable components.
 */
class WordPressSchemaConverter {

	/**
	 * Accumulated schema components.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	private array $components = array();

	/**
	 * Reset accumulated components.
	 *
	 * @return void
	 */
	public function reset(): void {
		$this->components = array();
	}

	/**
	 * Get all registered schema components sorted by name.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public function get_components(): array {
		ksort( $this->components );
		return $this->components;
	}

	/**
	 * Register an explicit schema component directly.
	 *
	 * @param string               $name   PascalCase component name.
	 * @param array<string, mixed> $schema OpenAPI schema definition.
	 * @return void
	 * @throws OpenApiValidationException If collision occurs with differing definition.
	 */
	public function register_component( string $name, array $schema ): void {
		if ( isset( $this->components[ $name ] ) && $this->components[ $name ] !== $schema ) {
			throw new OpenApiValidationException(
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
				sprintf( 'Conflicting component schema definition for "%s". Component names must be unique and collision-free.', $name )
			);
		}
		$this->components[ $name ] = $schema;
	}

	/**
	 * Convert a top-level resource schema, register it as a reusable component, and return its component name.
	 *
	 * @param array<string, mixed> $schema WordPress resource schema.
	 * @return string Registered component name (e.g. PluginSettings).
	 * @throws OpenApiValidationException If title is missing or invalid.
	 */
	public function convert_root_schema( array $schema ): string {
		$title = $schema['title'] ?? null;
		if ( empty( $title ) || ! is_string( $title ) ) {
			throw new OpenApiValidationException( 'Cannot convert root schema: missing or empty "title" property required for OpenAPI component naming.' );
		}

		$component_name = $this->to_pascal_case( $title );
		$converted      = $this->convert_schema_internal( $schema, false );

		$this->register_component( $component_name, $converted );

		return $component_name;
	}

	/**
	 * Convert a WordPress schema into an OpenAPI 3.1 schema object.
	 *
	 * @param array<string, mixed> $schema                 WordPress JSON schema.
	 * @param bool                 $allow_named_extraction Whether to extract nested named objects into reusable components.
	 * @return array<string, mixed>
	 */
	public function convert_schema( array $schema, bool $allow_named_extraction = true ): array {
		return $this->convert_schema_internal( $schema, $allow_named_extraction );
	}

	/**
	 * Internal conversion logic.
	 *
	 * @param array<string, mixed> $schema                 Raw schema array.
	 * @param bool                 $allow_named_extraction Whether to extract into components.
	 * @return array<string, mixed> Converted schema or component reference.
	 */
	private function convert_schema_internal( array $schema, bool $allow_named_extraction ): array {
		// If nested object has title and extraction is enabled, register component and return $ref.
		if ( $allow_named_extraction && ! empty( $schema['title'] ) && is_string( $schema['title'] ) ) {
			$component_name = $this->to_pascal_case( $schema['title'] );
			$inner          = $this->convert_schema_internal( $schema, false );
			$this->register_component( $component_name, $inner );
			return array( '$ref' => '#/components/schemas/' . $component_name );
		}

		$converted = array();

		// Handle type.
		if ( isset( $schema['type'] ) ) {
			$converted['type'] = $schema['type'];
		}

		// Handle description.
		if ( isset( $schema['description'] ) && is_string( $schema['description'] ) ) {
			$converted['description'] = $schema['description'];
		}

		// Handle format.
		if ( isset( $schema['format'] ) && is_string( $schema['format'] ) ) {
			$converted['format'] = $schema['format'];
		}

		// Handle default.
		if ( array_key_exists( 'default', $schema ) ) {
			$converted['default'] = $schema['default'];
		}

		// Handle enum.
		if ( isset( $schema['enum'] ) && is_array( $schema['enum'] ) ) {
			$converted['enum'] = array_values( $schema['enum'] );
		}

		// Handle required properties.
		if ( isset( $schema['required'] ) && is_array( $schema['required'] ) ) {
			$converted['required'] = array_values( $schema['required'] );
		}

		// Handle constraints.
		$constraint_keys = array(
			'minimum',
			'maximum',
			'exclusiveMinimum',
			'exclusiveMaximum',
			'minLength',
			'maxLength',
			'minItems',
			'maxItems',
			'uniqueItems',
			'pattern',
		);

		foreach ( $constraint_keys as $key ) {
			if ( array_key_exists( $key, $schema ) ) {
				$converted[ $key ] = $schema[ $key ];
			}
		}

		// Handle readonly mapping.
		if ( isset( $schema['readonly'] ) && true === $schema['readonly'] ) {
			$converted['readOnly'] = true;
		} elseif ( isset( $schema['readOnly'] ) && true === $schema['readOnly'] ) {
			$converted['readOnly'] = true;
		}

		if ( isset( $schema['writeOnly'] ) && true === $schema['writeOnly'] ) {
			$converted['writeOnly'] = true;
		}

		// Handle properties.
		if ( isset( $schema['properties'] ) && is_array( $schema['properties'] ) ) {
			$converted['properties'] = array();
			foreach ( $schema['properties'] as $prop_name => $prop_schema ) {
				if ( is_array( $prop_schema ) ) {
					$converted['properties'][ $prop_name ] = $this->convert_schema_internal( $prop_schema, true );
				}
			}
		}

		// Handle items.
		if ( isset( $schema['items'] ) && is_array( $schema['items'] ) ) {
			$converted['items'] = $this->convert_schema_internal( $schema['items'], true );
		}

		// Handle additionalProperties.
		if ( array_key_exists( 'additionalProperties', $schema ) ) {
			if ( is_bool( $schema['additionalProperties'] ) ) {
				$converted['additionalProperties'] = $schema['additionalProperties'];
			} elseif ( is_array( $schema['additionalProperties'] ) ) {
				$converted['additionalProperties'] = $this->convert_schema_internal( $schema['additionalProperties'], true );
			}
		}

		// Handle composition: oneOf, anyOf, allOf.
		foreach ( array( 'oneOf', 'anyOf', 'allOf' ) as $composite_key ) {
			if ( isset( $schema[ $composite_key ] ) && is_array( $schema[ $composite_key ] ) ) {
				$converted[ $composite_key ] = array();
				foreach ( $schema[ $composite_key ] as $sub_schema ) {
					if ( is_array( $sub_schema ) ) {
						$converted[ $composite_key ][] = $this->convert_schema_internal( $sub_schema, true );
					}
				}
			}
		}

		return $converted;
	}

	/**
	 * Convert snake_case, kebab-case, or spaced string to PascalCase.
	 *
	 * @param string $input Input string.
	 * @return string PascalCase string.
	 */
	public function to_pascal_case( string $input ): string {
		$normalized = str_replace( array( '_', '-' ), ' ', trim( $input ) );
		return str_replace( ' ', '', ucwords( $normalized ) );
	}
}
