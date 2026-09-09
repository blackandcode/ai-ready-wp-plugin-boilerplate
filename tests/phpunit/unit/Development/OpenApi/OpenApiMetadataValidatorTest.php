<?php
/**
 * Test OpenAPI Metadata Validator.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Development\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Development\OpenApi;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Development\OpenApi\OpenApiMetadataValidator;
use AIReady\WPPluginBoilerplate\Development\OpenApi\Exception\OpenApiValidationException;

/**
 * Class OpenApiMetadataValidatorTest
 */
class OpenApiMetadataValidatorTest extends TestCase {

	/**
	 * Test valid metadata passes validation without throwing.
	 */
	public function test_valid_metadata_passes(): void {
		$validator = new OpenApiMetadataValidator();
		$metadata  = array(
			'operationId' => 'getPluginSettings',
			'summary'     => 'Retrieve settings',
			'description' => 'Returns current plugin settings.',
			'tags'        => array( 'Settings' ),
			'responses'   => array(
				200 => array( 'description' => 'Success' ),
			),
		);
		$seen      = array();

		$validator->validate_operation( $metadata, '/settings', 'GET', $seen );
		$this->assertArrayHasKey( 'getPluginSettings', $seen );
	}

	/**
	 * Test throws when operationId is missing.
	 */
	public function test_throws_when_operation_id_missing(): void {
		$validator = new OpenApiMetadataValidator();
		$metadata  = array(
			'summary'   => 'Retrieve settings',
			'tags'      => array( 'Settings' ),
			'responses' => array(
				200 => array( 'description' => 'Success' ),
			),
		);
		$seen      = array();

		$this->expectException( OpenApiValidationException::class );
		$this->expectExceptionMessage( 'Missing or invalid "operationId"' );

		$validator->validate_operation( $metadata, '/settings', 'GET', $seen );
	}

	/**
	 * Test throws when operationId is not lowerCamelCase.
	 */
	public function test_throws_when_operation_id_not_camel_case(): void {
		$validator = new OpenApiMetadataValidator();
		$metadata  = array(
			'operationId' => 'Get_Plugin_Settings',
			'summary'     => 'Retrieve settings',
			'tags'        => array( 'Settings' ),
			'responses'   => array(
				200 => array( 'description' => 'Success' ),
			),
		);
		$seen      = array();

		$this->expectException( OpenApiValidationException::class );
		$this->expectExceptionMessage( 'Operation IDs must be lowerCamelCase' );

		$validator->validate_operation( $metadata, '/settings', 'GET', $seen );
	}

	/**
	 * Test throws when operationId is duplicated across operations.
	 */
	public function test_throws_on_duplicate_operation_id(): void {
		$validator = new OpenApiMetadataValidator();
		$metadata  = array(
			'operationId' => 'duplicateOperation',
			'summary'     => 'First op',
			'tags'        => array( 'Settings' ),
			'responses'   => array(
				200 => array( 'description' => 'Success' ),
			),
		);
		$seen      = array();

		$validator->validate_operation( $metadata, '/first', 'GET', $seen );

		$this->expectException( OpenApiValidationException::class );
		$this->expectExceptionMessage( 'Duplicate operationId' );

		$validator->validate_operation( $metadata, '/second', 'POST', $seen );
	}

	/**
	 * Test throws when summary is missing or empty.
	 */
	public function test_throws_when_summary_is_missing(): void {
		$validator = new OpenApiMetadataValidator();
		$metadata  = array(
			'operationId' => 'validOperationId',
			'tags'        => array( 'Settings' ),
			'responses'   => array(
				200 => array( 'description' => 'Success' ),
			),
		);
		$seen      = array();

		$this->expectException( OpenApiValidationException::class );
		$this->expectExceptionMessage( 'Missing or invalid "summary"' );

		$validator->validate_operation( $metadata, '/settings', 'GET', $seen );
	}

	/**
	 * Test throws when responses are missing or invalid.
	 */
	public function test_throws_when_responses_are_empty(): void {
		$validator = new OpenApiMetadataValidator();
		$metadata  = array(
			'operationId' => 'validOperationId',
			'summary'     => 'A valid summary',
			'tags'        => array( 'Settings' ),
			'responses'   => array(),
		);
		$seen      = array();

		$this->expectException( OpenApiValidationException::class );
		$this->expectExceptionMessage( 'Missing or empty "responses"' );

		$validator->validate_operation( $metadata, '/settings', 'GET', $seen );
	}
}
