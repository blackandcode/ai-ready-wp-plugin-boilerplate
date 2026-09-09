<?php
/**
 * Test EventDispatcher.
 *
 * @package AIReady\WPPluginBoilerplate\Tests\Unit\Event
 */

namespace AIReady\WPPluginBoilerplate\Tests\Unit\Event;

use PHPUnit\Framework\TestCase;
use AIReady\WPPluginBoilerplate\Event\EventDispatcher;
use AIReady\WPPluginBoilerplate\Settings\Domain\Event\SettingsUpdatedEvent;

/**
 * Class EventDispatcherTest
 */
class EventDispatcherTest extends TestCase {

	/**
	 * Test subscriber receives dispatched event.
	 */
	public function test_subscribers_receive_event(): void {
		$dispatcher = new EventDispatcher();
		$received   = array();

		$dispatcher->subscribe(
			SettingsUpdatedEvent::class,
			static function ( SettingsUpdatedEvent $event ) use ( &$received ) {
				$received[] = $event;
			}
		);

		$event = new SettingsUpdatedEvent( array( 'general.greeting_message' ), array() );
		$dispatcher->dispatch( $event );

		$this->assertCount( 1, $received );
		$this->assertSame( $event, $received[0] );
	}
}
