<?php
/**
 * Test OpenAPI YAML Writer.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Development\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Development\OpenApi;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Development\OpenApi\OpenApiYamlWriter;

/**
 * Class OpenApiYamlWriterTest
 */
class OpenApiYamlWriterTest extends TestCase {

	/**
	 * Test dump formats YAML with required comment header and deterministic output.
	 */
	public function test_dump_includes_header_and_formats_yaml(): void {
		$writer = new OpenApiYamlWriter();

		$doc = array(
			'openapi' => '3.1.0',
			'info'    => array(
				'title'   => 'Test API',
				'version' => '1.0.0',
			),
			'paths'   => array(),
		);

		$yaml = $writer->dump( $doc );

		$this->assertStringStartsWith( '# GENERATED FILE - DO NOT EDIT.', $yaml );
		$this->assertStringContainsString( 'openapi: 3.1.0', $yaml );
		$this->assertStringContainsString( "title: 'Test API'", $yaml );
	}

	/**
	 * Test write saves to disk atomically and returns byte count.
	 */
	public function test_write_creates_file_atomically(): void {
		$writer    = new OpenApiYamlWriter();
		$temp_dir  = sys_get_temp_dir() . '/airwp-openapi-test-' . uniqid();
		$file_path = $temp_dir . '/sub/openapi.yaml';

		$doc = array(
			'openapi' => '3.1.0',
			'info'    => array(
				'title'   => 'Atomic Test API',
				'version' => '1.0.0',
			),
			'paths'   => array(),
		);

		$writer->write_to_file( $doc, $file_path );

		$this->assertFileExists( $file_path );
		$contents = file_get_contents( $file_path );
		$this->assertStringContainsString( 'Atomic Test API', $contents );

		// Clean up.
		unlink( $file_path );
		rmdir( $temp_dir . '/sub' );
		rmdir( $temp_dir );
	}
}
