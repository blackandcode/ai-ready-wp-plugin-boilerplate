<?php
/**
 * Event Dispatcher Implementation.
 *
 * @package AIReady\WPPluginBoilerplate\Event
 */

namespace AIReady\WPPluginBoilerplate\Event;

use AIReady\WPPluginBoilerplate\Settings\Domain\Event\RetentionPolicyChangedEvent;
use AIReady\WPPluginBoilerplate\Settings\Domain\Event\SettingsUpdatedEvent;

/**
 * In-memory event dispatcher that also bridges domain events to WordPress action hooks.
 */
class EventDispatcher implements EventDispatcherInterface {

	/**
	 * Map of event class to array of callables.
	 *
	 * @var array<string, array<int, callable>>
	 */
	private array $subscribers = array();

	/**
	 * Subscribe a callback listener to an event.
	 *
	 * @param string   $event_class Fully qualified event class.
	 * @param callable $listener Callback listener.
	 * @return void
	 */
	public function subscribe( string $event_class, callable $listener ): void {
		if ( ! isset( $this->subscribers[ $event_class ] ) ) {
			$this->subscribers[ $event_class ] = array();
		}
		$this->subscribers[ $event_class ][] = $listener;
	}

	/**
	 * Dispatch an event to internal subscribers and WordPress action hooks.
	 *
	 * @param object $event Domain event instance.
	 * @return void
	 */
	public function dispatch( object $event ): void {
		$event_class = get_class( $event );

		// Call internal in-memory subscribers.
		if ( isset( $this->subscribers[ $event_class ] ) ) {
			foreach ( $this->subscribers[ $event_class ] as $listener ) {
				$listener( $event );
			}
		}

		// Bridge to WordPress action hooks if WordPress environment is loaded.
		if ( function_exists( 'do_action' ) ) {
			if ( $event instanceof SettingsUpdatedEvent ) {
				/**
				 * Fires after plugin settings are updated.
				 *
				 * @param array<string, mixed> $payload Current settings payload.
				 * @param array<int, string>   $changed_keys Changed keys list.
				 */
				do_action( 'airwp_settings_updated', $event->payload, $event->changed_keys );
			} elseif ( $event instanceof RetentionPolicyChangedEvent ) {
				/**
				 * Fires when the data retention policy is modified.
				 *
				 * @param string $new_policy New policy value.
				 * @param string $previous_policy Previous policy value.
				 */
				do_action(
					'airwp_retention_policy_changed',
					$event->new_policy->value,
					$event->previous_policy->value
				);
			}

			/**
			 * Generic domain event hook.
			 *
			 * @param object $event Dispatched domain event.
			 */
			do_action( 'airwp_domain_event_dispatched', $event );
		}
	}
}
