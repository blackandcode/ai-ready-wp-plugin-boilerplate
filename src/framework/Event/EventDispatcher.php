<?php
/**
 * Event Dispatcher Implementation.
 *
 * @package AIReady\WPPluginBoilerplate\Framework\Event
 */

namespace AIReady\WPPluginBoilerplate\Framework\Event;

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
			$last_slash = strrchr( $event_class, '\\' );
			$short_name = false !== $last_slash ? substr( $last_slash, 1 ) : $event_class;

			if ( 'SettingsUpdatedEvent' === $short_name && isset( $event->payload, $event->changed_keys ) ) {
				/**
				 * Fires after plugin settings are updated.
				 *
				 * @param array<string, mixed> $payload Current settings payload.
				 * @param array<int, string>   $changed_keys Changed keys list.
				 */
				do_action( 'airwp_settings_updated', $event->payload, $event->changed_keys );
			} elseif ( 'RetentionPolicyChangedEvent' === $short_name && isset( $event->new_policy, $event->previous_policy ) ) {
				$new_val  = is_object( $event->new_policy ) && isset( $event->new_policy->value ) ? $event->new_policy->value : (string) $event->new_policy;
				$prev_val = is_object( $event->previous_policy ) && isset( $event->previous_policy->value ) ? $event->previous_policy->value : (string) $event->previous_policy;

				/**
				 * Fires when the data retention policy is modified.
				 *
				 * @param string $new_val New policy value.
				 * @param string $prev_val Previous policy value.
				 */
				do_action(
					'airwp_retention_policy_changed',
					$new_val,
					$prev_val
				);
			}

			/**
			 * Generic domain event action hook.
			 *
			 * @param object $event Dispatched domain event.
			 */
			do_action( 'airwp_domain_event_dispatched', $event );
		}
	}

	/**
	 * Get all subscribers (primarily for testing).
	 *
	 * @return array<string, array<int, callable>>
	 */
	public function get_subscribers(): array {
		return $this->subscribers;
	}

	/**
	 * Reset all subscribers (primarily for testing).
	 *
	 * @return void
	 */
	public function reset(): void {
		$this->subscribers = array();
	}
}
