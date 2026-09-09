<?php
/**
 * Test CacheTtl Value Object.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\Settings\Domain
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\Settings\Domain;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Exception\InvalidCacheTtlException;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\CacheTtl;

/**
 * Class CacheTtlTest
 */
class CacheTtlTest extends TestCase {

	/**
	 * Test valid TTL creation.
	 */
	public function test_valid_ttl(): void {
		$ttl = new CacheTtl( 3600 );
		$this->assertSame( 3600, $ttl->value() );
	}

	/**
	 * Test boundary values (0 and 86400).
	 */
	public function test_boundary_values(): void {
		$min = new CacheTtl( 0 );
		$max = new CacheTtl( 86400 );

		$this->assertSame( 0, $min->value() );
		$this->assertSame( 86400, $max->value() );
	}

	/**
	 * Test negative TTL throws exception.
	 */
	public function test_negative_ttl_throws_exception(): void {
		$this->expectException( InvalidCacheTtlException::class );
		new CacheTtl( -1 );
	}

	/**
	 * Test excessive TTL throws exception.
	 */
	public function test_excessive_ttl_throws_exception(): void {
		$this->expectException( InvalidCacheTtlException::class );
		new CacheTtl( 86401 );
	}

	/**
	 * Test clamped factory method.
	 */
	public function test_from_clamped(): void {
		$under = CacheTtl::from_clamped( -50 );
		$over  = CacheTtl::from_clamped( 100000 );
		$valid = CacheTtl::from_clamped( 500 );

		$this->assertSame( 0, $under->value() );
		$this->assertSame( 86400, $over->value() );
		$this->assertSame( 500, $valid->value() );
	}

	/**
	 * Test semantic equality.
	 */
	public function test_equality(): void {
		$t1 = new CacheTtl( 60 );
		$t2 = new CacheTtl( 60 );
		$t3 = new CacheTtl( 120 );

		$this->assertTrue( $t1->equals( $t2 ) );
		$this->assertFalse( $t1->equals( $t3 ) );
	}
}
