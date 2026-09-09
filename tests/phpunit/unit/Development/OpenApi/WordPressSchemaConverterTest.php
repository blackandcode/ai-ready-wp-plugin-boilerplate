<?php
/**
 * Test WordPress Schema Converter.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Development\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Development\OpenApi;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Development\OpenApi\WordPressSchemaConverter;

/**
 * Class WordPressSchemaConverterTest
 */
class WordPressSchemaConverterTest extends TestCase {

	/**
	 * Test converts basic JSON schema and strips internal WordPress properties.
	 */
	public function test_converts_basic_schema_and_strips_internal_keys(): void {
		$converter = new WordPressSchemaConverter();

		$wp_schema = array(
			'$schema'     => 'http://json-schema.org/draft-04/schema#',
			'title'       => 'Greeting',
			'type'        => 'object',
			'required'    => array( 'message' ),
			'readonly'    => true,
			'arg_options' => array( 'sanitize_callback' => 'sanitize_text_field' ),
			'context'     => array( 'view', 'edit' ),
			'properties'  => array(
				'message' => array(
					'type'        => 'string',
					'description' => 'A greeting.',
					'context'     => array( 'view' ),
				),
			),
		);

		$converted = $converter->convert_schema( $wp_schema, false );

		$this->assertArrayNotHasKey( '$schema', $converted );
		$this->assertArrayNotHasKey( 'readonly', $converted );
		$this->assertArrayNotHasKey( 'arg_options', $converted );
		$this->assertArrayNotHasKey( 'context', $converted );
		$this->assertArrayNotHasKey( 'context', $converted['properties']['message'] );
		$this->assertSame( 'object', $converted['type'] );
		$this->assertSame( 'A greeting.', $converted['properties']['message']['description'] );
	}

	/**
	 * Test extracts titled sub-schemas into reusable components.
	 */
	public function test_extracts_titled_subschemas_into_components(): void {
		$converter = new WordPressSchemaConverter();

		$schema = array(
			'title'      => 'RootSettings',
			'type'       => 'object',
			'properties' => array(
				'general'  => array(
					'title'       => 'GeneralSettings',
					'type'        => 'object',
					'description' => 'General plugin settings.',
					'properties'  => array(
						'enabled' => array(
							'type'    => 'boolean',
							'default' => true,
						),
					),
				),
				'advanced' => array(
					'title'       => 'AdvancedSettings',
					'type'        => 'object',
					'description' => 'Advanced plugin settings.',
					'properties'  => array(
						'debug' => array(
							'type'    => 'boolean',
							'default' => false,
						),
					),
				),
			),
		);

		$root_converted = $converter->convert_schema( $schema, false );
		$components     = $converter->get_components();

		$this->assertArrayHasKey( 'GeneralSettings', $components );
		$this->assertArrayHasKey( 'AdvancedSettings', $components );
		$this->assertSame(
			'#/components/schemas/GeneralSettings',
			$root_converted['properties']['general']['$ref']
		);
		$this->assertSame(
			'#/components/schemas/AdvancedSettings',
			$root_converted['properties']['advanced']['$ref']
		);
		$this->assertArrayNotHasKey( 'title', $components['GeneralSettings'] );
	}
}
