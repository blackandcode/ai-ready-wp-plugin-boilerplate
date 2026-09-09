<?php
/**
 * Test PluginSettings Aggregate Root.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Settings\Domain
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Settings\Domain;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Settings\Domain\Event\RetentionPolicyChangedEvent;
use AIReady\WPPluginBoilerplate\Settings\Domain\Event\SettingsUpdatedEvent;
use AIReady\WPPluginBoilerplate\Settings\Domain\Model\PluginSettings;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\CacheTtl;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\DataRetentionPolicy;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\Description;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\FeatureFlag;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\GreetingMessage;
use AIReady\WPPluginBoilerplate\Settings\Domain\ValueObject\RestDebug;

/**
 * Class PluginSettingsTest
 */
class PluginSettingsTest extends TestCase {

	/**
	 * Test default aggregate initialization.
	 */
	public function test_create_default(): void {
		$settings = PluginSettings::create_default();

		$this->assertSame( 'Hello from AI-Ready WP Plugin Boilerplate!', $settings->get_greeting_message()->value() );
		$this->assertTrue( $settings->get_enable_feature()->is_enabled() );
		$this->assertSame( 'A modern WordPress plugin powered by AI workflows.', $settings->get_description()->value() );
		$this->assertFalse( $settings->get_rest_debug()->is_enabled() );
		$this->assertSame( 3600, $settings->get_cache_ttl()->value() );
		$this->assertSame( DataRetentionPolicy::Preserve, $settings->get_data_retention_policy() );
		$this->assertEmpty( $settings->release_events() );
	}

	/**
	 * Test general update records events.
	 */
	public function test_update_general_records_event(): void {
		$settings = PluginSettings::create_default();

		$settings->update_general(
			new GreetingMessage( 'Custom Greeting' ),
			new FeatureFlag( false ),
			new Description( 'Updated description' )
		);

		$events = $settings->release_events();
		$this->assertCount( 1, $events );
		$this->assertInstanceOf( SettingsUpdatedEvent::class, $events[0] );
		$this->assertContains( 'general.greeting_message', $events[0]->changed_keys );
		$this->assertContains( 'general.enable_feature', $events[0]->changed_keys );
		$this->assertContains( 'general.description', $events[0]->changed_keys );

		// Subsequent release is empty
		$this->assertEmpty( $settings->release_events() );
	}

	/**
	 * Test updating advanced section records event.
	 */
	public function test_update_advanced_records_event(): void {
		$settings = PluginSettings::create_default();

		$settings->update_advanced(
			new RestDebug( true ),
			new CacheTtl( 7200 )
		);

		$events = $settings->release_events();
		$this->assertCount( 1, $events );
		$this->assertInstanceOf( SettingsUpdatedEvent::class, $events[0] );
		$this->assertContains( 'advanced.rest_debug', $events[0]->changed_keys );
		$this->assertContains( 'advanced.cache_ttl', $events[0]->changed_keys );
	}

	/**
	 * Test retention policy update records policy changed event.
	 */
	public function test_update_retention_policy_records_specific_event(): void {
		$settings = PluginSettings::create_default();

		$settings->update_retention_policy( DataRetentionPolicy::DeleteSettings );

		$events = $settings->release_events();
		$this->assertCount( 2, $events );
		$this->assertInstanceOf( RetentionPolicyChangedEvent::class, $events[0] );
		$this->assertSame( DataRetentionPolicy::Preserve, $events[0]->previous_policy );
		$this->assertSame( DataRetentionPolicy::DeleteSettings, $events[0]->new_policy );

		$this->assertInstanceOf( SettingsUpdatedEvent::class, $events[1] );
	}

	/**
	 * Test reconstitute does not fire events and restores data correctly.
	 */
	public function test_reconstitute(): void {
		$data = array(
			'general'        => array(
				'greeting_message' => 'Restored Message',
				'enable_feature'   => false,
				'description'      => 'Restored Description',
			),
			'advanced'       => array(
				'rest_debug' => true,
				'cache_ttl'  => 1800,
			),
			'data_retention' => array(
				'uninstall_action' => 'delete_all',
			),
		);

		$settings = PluginSettings::reconstitute( $data );

		$this->assertSame( 'Restored Message', $settings->get_greeting_message()->value() );
		$this->assertFalse( $settings->get_enable_feature()->is_enabled() );
		$this->assertTrue( $settings->get_rest_debug()->is_enabled() );
		$this->assertSame( 1800, $settings->get_cache_ttl()->value() );
		$this->assertSame( DataRetentionPolicy::DeleteAll, $settings->get_data_retention_policy() );
		$this->assertEmpty( $settings->release_events() );

		$this->assertSame( $data, $settings->to_array() );
	}
}
