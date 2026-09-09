<?php
/**
 * Event Dispatcher Interface contract.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Event
 */

namespace AIReady\WPPluginBoilerplate\Framework\Event;

/**
 * Interface for dispatching domain events and registering subscribers.
 */
interface EventDispatcherInterface {

	/**
	 * Dispatch an event to registered listeners and system hooks.
	 *
	 * @param object $event Domain event instance.
	 * @return void
	 */
	public function dispatch( object $event ): void;

	/**
	 * Subscribe a callback listener to a specific event class.
	 *
	 * @param string   $event_class Fully qualified event class name.
	 * @param callable $listener Callback listener receiving the event instance.
	 * @return void
	 */
	public function subscribe( string $event_class, callable $listener ): void;
}
