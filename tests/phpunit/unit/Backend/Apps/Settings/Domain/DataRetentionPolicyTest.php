<?php
/**
 * Test DataRetentionPolicy Enum.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\Settings\Domain
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Backend\Apps\Settings\Domain;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\Exception\InvalidRetentionPolicyException;
use AIReady\WPPluginBoilerplate\Backend\Apps\Settings\Domain\ValueObject\DataRetentionPolicy;

/**
 * Class DataRetentionPolicyTest
 */
class DataRetentionPolicyTest extends TestCase {

	/**
	 * Test valid string conversion.
	 */
	public function test_from_string(): void {
		$p1 = DataRetentionPolicy::from_string( 'preserve' );
		$p2 = DataRetentionPolicy::from_string( 'delete_settings' );
		$p3 = DataRetentionPolicy::from_string( 'delete_all' );

		$this->assertSame( DataRetentionPolicy::Preserve, $p1 );
		$this->assertSame( DataRetentionPolicy::DeleteSettings, $p2 );
		$this->assertSame( DataRetentionPolicy::DeleteAll, $p3 );
	}

	/**
	 * Test invalid string throws domain exception.
	 */
	public function test_invalid_string_throws(): void {
		$this->expectException( InvalidRetentionPolicyException::class );
		DataRetentionPolicy::from_string( 'invalid_policy' );
	}

	/**
	 * Test fallback resolution.
	 */
	public function test_from_or_default(): void {
		$this->assertSame( DataRetentionPolicy::Preserve, DataRetentionPolicy::from_or_default( null ) );
		$this->assertSame( DataRetentionPolicy::Preserve, DataRetentionPolicy::from_or_default( '' ) );
		$this->assertSame( DataRetentionPolicy::Preserve, DataRetentionPolicy::from_or_default( 'unknown' ) );
		$this->assertSame( DataRetentionPolicy::DeleteAll, DataRetentionPolicy::from_or_default( 'delete_all' ) );
	}
}
