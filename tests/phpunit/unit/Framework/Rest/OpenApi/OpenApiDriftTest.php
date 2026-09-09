<?php
/**
 * Test OpenAPI Drift Detection.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Framework\Rest\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Framework\Rest\OpenApi;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi\OpenApiGenerator;
use AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi\OpenApiDocumentFactory;
use AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi\OpenApiYamlWriter;
use AIReady\WPPluginBoilerplate\Framework\Rest\OpenApi\WordPressRouteInspector;

/**
 * Class OpenApiDriftTest
 */
class OpenApiDriftTest extends TestCase {

	/**
	 * Test check_drift returns true when file matches generated output.
	 */
	public function test_check_drift_returns_true_when_in_sync(): void {
		$sample_doc = array(
			'openapi' => '3.1.0',
			'info'    => array(
				'title'   => 'Drift Test API',
				'version' => '1.0.0',
			),
			'paths'   => array(),
		);

		$mock_inspector = $this->createMock( WordPressRouteInspector::class );
		$mock_inspector->method( 'inspect_namespace' )->willReturn( array() );

		$mock_factory = $this->createMock( OpenApiDocumentFactory::class );
		$mock_factory->method( 'create' )->willReturn( $sample_doc );

		$yaml_writer = new OpenApiYamlWriter();
		$generator   = new OpenApiGenerator( $mock_inspector, $mock_factory, $yaml_writer );

		$temp_file = tempnam( sys_get_temp_dir(), 'airwp_drift_' );
		$yaml_writer->write_to_file( $sample_doc, $temp_file );

		$this->assertTrue( $generator->check_drift( $temp_file, 'ai-ready-wp/v1' ) );

		unlink( $temp_file );
	}

	/**
	 * Test check_drift returns false when file has drifted.
	 */
	public function test_check_drift_returns_false_when_drifted(): void {
		$sample_doc = array(
			'openapi' => '3.1.0',
			'info'    => array(
				'title'   => 'Drift Test API',
				'version' => '1.0.0',
			),
			'paths'   => array(),
		);

		$mock_inspector = $this->createMock( WordPressRouteInspector::class );
		$mock_inspector->method( 'inspect_namespace' )->willReturn( array() );

		$mock_factory = $this->createMock( OpenApiDocumentFactory::class );
		$mock_factory->method( 'create' )->willReturn( $sample_doc );

		$yaml_writer = new OpenApiYamlWriter();
		$generator   = new OpenApiGenerator( $mock_inspector, $mock_factory, $yaml_writer );

		$temp_file = tempnam( sys_get_temp_dir(), 'airwp_drift_' );
		file_put_contents( $temp_file, "# Drifted file\nopenapi: 3.0.0\n" );

		$this->assertFalse( $generator->check_drift( $temp_file, 'ai-ready-wp/v1' ) );

		unlink( $temp_file );
	}

	/**
	 * Test check_drift returns false when target file does not exist.
	 */
	public function test_check_drift_returns_false_when_file_missing(): void {
		$generator = new OpenApiGenerator();
		$this->assertFalse( $generator->check_drift( '/non/existent/path/spec.yaml', 'ai-ready-wp/v1' ) );
	}
}
