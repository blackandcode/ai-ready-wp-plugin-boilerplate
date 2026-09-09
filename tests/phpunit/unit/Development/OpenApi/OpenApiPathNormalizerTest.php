<?php
/**
 * Test OpenAPI Path Normalizer.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Development\OpenApi
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Development\OpenApi;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Development\OpenApi\OpenApiPathNormalizer;
use AIReady\WPPluginBoilerplate\Development\OpenApi\Exception\OpenApiValidationException;

/**
 * Class OpenApiPathNormalizerTest
 */
class OpenApiPathNormalizerTest extends TestCase {

	/**
	 * Test normalizes simple route without parameters.
	 */
	public function test_normalizes_simple_route(): void {
		$normalizer = new OpenApiPathNormalizer();
		$result     = $normalizer->normalize( '/settings', 'ai-ready-wp/v1' );

		$this->assertSame( '/settings', $result['path'] );
		$this->assertEmpty( $result['parameters'] );
	}

	/**
	 * Test strips namespace prefix if present.
	 */
	public function test_strips_namespace_prefix(): void {
		$normalizer = new OpenApiPathNormalizer();
		$result     = $normalizer->normalize( '/ai-ready-wp/v1/diagnostics', 'ai-ready-wp/v1' );

		$this->assertSame( '/diagnostics', $result['path'] );
		$this->assertEmpty( $result['parameters'] );
	}

	/**
	 * Test normalizes numeric path parameter.
	 */
	public function test_normalizes_numeric_path_parameter(): void {
		$normalizer = new OpenApiPathNormalizer();
		$result     = $normalizer->normalize( '/items/(?P<id>[\d]+)', 'ai-ready-wp/v1' );

		$this->assertSame( '/items/{id}', $result['path'] );
		$this->assertCount( 1, $result['parameters'] );
		$this->assertSame( 'id', $result['parameters'][0]['name'] );
		$this->assertSame( 'path', $result['parameters'][0]['in'] );
		$this->assertTrue( $result['parameters'][0]['required'] );
		$this->assertSame( 'integer', $result['parameters'][0]['schema']['type'] );
	}

	/**
	 * Test normalizes string and slug path parameters.
	 */
	public function test_normalizes_string_slug_parameter(): void {
		$normalizer = new OpenApiPathNormalizer();
		$result     = $normalizer->normalize( '/posts/(?P<slug>[a-zA-Z0-9_-]+)', 'ai-ready-wp/v1' );

		$this->assertSame( '/posts/{slug}', $result['path'] );
		$this->assertCount( 1, $result['parameters'] );
		$this->assertSame( 'slug', $result['parameters'][0]['name'] );
		$this->assertSame( 'string', $result['parameters'][0]['schema']['type'] );
	}

	/**
	 * Test normalizes multiple path parameters in single route.
	 */
	public function test_normalizes_multiple_parameters(): void {
		$normalizer = new OpenApiPathNormalizer();
		$result     = $normalizer->normalize( '/users/(?P<user_id>[\d]+)/meta/(?P<key>[a-zA-Z0-9_]+)', 'ai-ready-wp/v1' );

		$this->assertSame( '/users/{user_id}/meta/{key}', $result['path'] );
		$this->assertCount( 2, $result['parameters'] );
		$this->assertSame( 'user_id', $result['parameters'][0]['name'] );
		$this->assertSame( 'integer', $result['parameters'][0]['schema']['type'] );
		$this->assertSame( 'key', $result['parameters'][1]['name'] );
		$this->assertSame( 'string', $result['parameters'][1]['schema']['type'] );
	}

	/**
	 * Test throws exception on unclosed parameter regex.
	 */
	public function test_throws_on_malformed_unclosed_parameter(): void {
		$normalizer = new OpenApiPathNormalizer();

		$this->expectException( OpenApiValidationException::class );
		$this->expectExceptionMessage( 'Cannot safely convert WordPress route pattern' );

		$normalizer->normalize( '/items/(?P<id>[\d+', 'ai-ready-wp/v1' );
	}
}
