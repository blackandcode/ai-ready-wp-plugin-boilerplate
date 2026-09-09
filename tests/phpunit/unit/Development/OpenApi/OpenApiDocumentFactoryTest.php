<?php
/**
 * Test OpenAPI Document Factory.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Development\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Development\OpenApi;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Development\OpenApi\OpenApiDocumentFactory;

/**
 * Class OpenApiDocumentFactoryTest
 */
class OpenApiDocumentFactoryTest extends TestCase {

	/**
	 * Test builds valid base OpenAPI 3.1 document structure.
	 */
	public function test_builds_base_document_structure(): void {
		$factory  = new OpenApiDocumentFactory();
		$document = $factory->create( array(), array( 'namespace' => 'ai-ready-wp/v1' ) );

		$this->assertSame( '3.1.0', $document['openapi'] );
		$this->assertSame( 'AI-Ready WP Plugin Boilerplate REST API', $document['info']['title'] );
		$this->assertNotEmpty( $document['servers'] );
		$this->assertSame( '/wp-json/ai-ready-wp/v1', $document['servers'][0]['url'] );
		$this->assertArrayHasKey( 'paths', $document );
		$this->assertArrayHasKey( 'components', $document );
		$this->assertArrayHasKey( 'securitySchemes', $document['components'] );
		$this->assertArrayHasKey( 'basicAuth', $document['components']['securitySchemes'] );
		$this->assertArrayHasKey( 'schemas', $document['components'] );
		$this->assertArrayHasKey( 'ErrorResponse', $document['components']['schemas'] );
	}

	/**
	 * Test sorts paths alphabetically and methods in standard HTTP verb sequence.
	 */
	public function test_sorts_paths_and_methods_deterministically(): void {
		$factory = new OpenApiDocumentFactory();

		$routes = array(
			array(
				'route'        => '/settings',
				'route_schema' => null,
				'handlers'     => array(
					array(
						'methods'  => array( 'POST' ),
						'args'     => array(),
						'has_auth' => true,
						'openapi'  => array(
							'operationId' => 'updateSettings',
							'summary'     => 'Update settings',
							'tags'        => array( 'Settings' ),
							'responses'   => array( 200 => array( 'description' => 'Updated' ) ),
						),
					),
					array(
						'methods'  => array( 'GET' ),
						'args'     => array(),
						'has_auth' => true,
						'openapi'  => array(
							'operationId' => 'getSettings',
							'summary'     => 'Get settings',
							'tags'        => array( 'Settings' ),
							'responses'   => array( 200 => array( 'description' => 'Retrieved' ) ),
						),
					),
				),
			),
			array(
				'route'        => '/alpha',
				'route_schema' => null,
				'handlers'     => array(
					array(
						'methods'  => array( 'GET' ),
						'args'     => array(),
						'has_auth' => false,
						'openapi'  => array(
							'operationId' => 'getAlpha',
							'summary'     => 'Get alpha',
							'tags'        => array( 'Alpha' ),
							'responses'   => array( 200 => array( 'description' => 'Retrieved' ) ),
						),
					),
				),
			),
		);

		$document  = $factory->create( $routes, array( 'namespace' => 'ai-ready-wp/v1' ) );
		$path_keys = array_keys( $document['paths'] );

		// Paths must be sorted alphabetically: /alpha, /settings.
		$this->assertSame( array( '/alpha', '/settings' ), $path_keys );

		// Methods in /settings must be sorted GET, then POST.
		$methods = array_keys( $document['paths']['/settings'] );
		$this->assertSame( array( 'get', 'post' ), $methods );
	}
}
